const test = require('brittle')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')
const createTestnet = require('hyperdht/testnet')
const net = require('net')
const rrp = require('resolve-reject-promise')
const proxy = require('.')

test('request with subdomain', async (t) => {
  const { testnet, proxy, server } = await setup(t)

  const url = `http://${server.dhtPublicKey}.localhost:${proxy.port}`
  const body = JSON.stringify({ message: 'Request with subdomain' })
  const res = await fetch(url, { method: 'POST', body })

  const req = await server.req.promise
  t.is(req.method, 'POST', 'correct method')
  t.is(req.pathname, '/', 'correct pathname')
  t.is(req.headers.host, `${server.dhtPublicKey}.localhost:${proxy.port}`, 'correct host header')
  t.is(req.body, body, 'correct body')

  const text = await res.text()
  t.is(text, 'OK', 'correct response')

  await server.close()
  await proxy.close()
  await testnet.destroy()
})

test('request with header', async (t) => {
  const { testnet, proxy, server } = await setup(t)

  const url = `http://localhost:${proxy.port}`
  const headers = { 'dht-public-key': server.dhtPublicKey }
  const body = JSON.stringify({ message: 'Request with header' })
  const res = await fetch(url, { method: 'POST', headers, body })

  const req = await server.req.promise
  t.is(req.method, 'POST', 'correct method')
  t.is(req.pathname, '/', 'correct pathname')
  t.is(req.headers.host, `localhost:${proxy.port}`, 'correct host header')
  t.is(req.headers['dht-public-key'], server.dhtPublicKey, 'correct dht-public-key header')
  t.is(req.body, body, 'correct body')

  const text = await res.text()
  t.is(text, 'OK', 'correct response')

  await server.close()
  await proxy.close()
  await testnet.destroy()
})

async function setup(t) {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy())
  const { bootstrap } = testnet

  const proxy = await setupProxy(t, { bootstrap })
  const server = await setupServer(t, { bootstrap })

  return { testnet, proxy, server }
}

async function setupServer(t, { bootstrap }) {
  const dht = new HyperDHT({ bootstrap })
  t.teardown(() => dht.destroy())

  const server = dht.createServer()
  t.teardown(() => server.close())

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
  await server.listen()

  const dhtPublicKey = idEnc.normalize(dht.defaultKeyPair.publicKey)

  async function close() {
    await server.close()
    await dht.destroy()
  }

  return { dhtPublicKey, req, close }
}

async function setupProxy(t, { bootstrap }) {
  const dht = new HyperDHT({ bootstrap })
  t.teardown(() => dht.destroy())

  const server = net.createServer((sock) => {
    proxy(sock, async (key) => dht.connect(idEnc.decode(key)))
  })
  await new Promise((resolve) => server.listen(0, resolve))
  t.teardown(() => server.close())

  const port = server.address().port

  async function close() {
    server.close()
    await dht.destroy()
  }

  return { port, close }
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
