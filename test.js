const { isBare } = require('which-runtime')
const test = require('brittle')
const fetch = isBare ? require('bare-fetch') : global.fetch
const http = require('http')
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

  const req = await server.req
  t.is(req.method, 'POST', 'correct method')
  t.is(req.pathname, '/', 'correct pathname')
  t.is(req.headers.host, `${server.dhtPublicKey}.localhost:${proxy.port}`, 'correct host header')
  t.is(req.body, body, 'correct body')

  const text = await res.text()
  t.is(text, 'ok', 'correct response')
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

  t.teardown(
    async () => {
      server.close()
      await dht.destroy()
    },
    { order: 4000 }
  )

  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port

  return { port }
}

async function setupServer(t, { bootstrap }) {
  const reqPromise = rrp()
  const httpServer = http.createServer((req, res) => {
    let body = ''
    req.on('data', (d) => {
      body += d
    })
    req.on('end', () => {
      reqPromise.resolve({ method: req.method, pathname: req.url, headers: req.headers, body })
      res.end('ok')
    })
  })

  const dht = new HyperDHT({ bootstrap })
  const dhtServer = dht.createServer((conn) => {
    conn.on('error', (err) => {
      if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
      console.warn('DHT error:', err)
    })
    httpServer.emit('connection', conn)
  })

  t.teardown(
    async () => {
      httpServer.close()
      await dht.destroy()
    },
    { order: 4000 }
  )

  await dhtServer.listen()
  const dhtPublicKey = idEnc.normalize(dht.defaultKeyPair.publicKey)

  return { dhtPublicKey, req: reqPromise.promise }
}
