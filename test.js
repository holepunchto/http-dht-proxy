const { isBare } = require('which-runtime')
const test = require('brittle')
const fetch = isBare ? require('bare-fetch') : global.fetch
const proxy = require('http-forward-host')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')
const createTestnet = require('hyperdht/testnet')
const net = require('net')
const rrp = require('resolve-reject-promise')

test('basic', async (t) => {
  const { proxy, server } = await setup(t)

  const url = `http://${server.dhtPublicKey}.localhost:${proxy.port}`
  const body = JSON.stringify({ message: 'Hello world!' })
  const res = await fetch(url, { method: 'POST', body })

  const req = await server.req.promise
  t.is(req.method, 'POST', 'correct method')
  t.is(req.pathname, '/', 'correct pathname')
  t.is(req.headers.host, `${server.dhtPublicKey}.localhost:${proxy.port}`, 'correct host header')
  t.is(req.body, body, 'correct body')

  const text = await res.text()
  t.is(text, 'OK', 'correct response')
})

async function setup(t) {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy(), { order: 5000 })
  const { bootstrap } = testnet

  const proxy = await setupProxy(t, { bootstrap })
  const server = await setupServer(t, { bootstrap })

  return { proxy, server }
}

async function setupProxy(t, { bootstrap }) {
  const dht = new HyperDHT({ bootstrap })

  const server = net.createServer((sock) => {
    proxy(sock, async (host) => {
      const key = host.split('.')[0]
      return dht.connect(idEnc.decode(key))
    })
  })

  async function close() {
    server.close()
    await dht.destroy()
  }
  t.teardown(close, { order: 4000 })

  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port

  return { port }
}

async function setupServer(t, { bootstrap }) {
  const dht = new HyperDHT({ bootstrap })
  const server = dht.createServer()

  const req = rrp()
  server.on('connection', (conn) => {
    let buffer = ''
    conn.on('data', (data) => {
      buffer += data.toString()
      const parsed = parseHttpBuffer(buffer)
      if (parsed) {
        req.resolve(parsed)
        conn.write(
          'HTTP/1.1 200 OK\r\n' +
            'Content-Type: text/plain\r\n' +
            'Content-Length: 2\r\n' +
            '\r\n' +
            'OK'
        )
      }
    })
    conn.on('error', (err) => {
      if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
      console.warn('DHT error:', err)
    })
  })

  async function close() {
    await server.close()
    await dht.destroy()
  }
  t.teardown(close, { order: 4000 })

  await server.listen()
  const dhtPublicKey = idEnc.normalize(dht.defaultKeyPair.publicKey)

  return { dhtPublicKey, req }
}

function parseHttpBuffer(buffer) {
  const headerEnd = buffer.indexOf('\r\n\r\n')
  if (headerEnd === -1) return null

  const headersPart = buffer.slice(0, headerEnd)
  const bodyPart = buffer.slice(headerEnd + 4)

  const headersLines = headersPart.split('\r\n')
  const [method, pathname, scheme] = headersLines[0].split(' ')
  const headers = {}
  for (let i = 1; i < headersLines.length; i++) {
    const [key, value] = headersLines[i].split(': ')
    if (key && value) headers[key.toLowerCase()] = value
  }

  const contentLength = +(headers['content-length'] || 0)
  const body = bodyPart.slice(0, contentLength)

  return { method, pathname, scheme, headers, body }
}
