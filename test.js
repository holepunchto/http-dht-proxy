const test = require('brittle')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')
const createTestnet = require('hyperdht/testnet')
const net = require('net')
const rrp = require('resolve-reject-promise')

const proxy = require('.')

test('request with pathname', async (t) => {
  const { testnet, proxy, server } = await setup(t)

  const url = `http://localhost:${proxy.port}/${server.dhtPublicKey}`
  fetch(url, { method: 'POST' }).catch(noop)
  const res = await server.response.promise

  t.ok(res.startsWith(`POST /${server.dhtPublicKey}`), 'correct pathname')
  t.ok(res.includes(`host: localhost:${proxy.port}`), 'correct host header')

  await server.close()
  await proxy.close()
  await testnet.destroy()
})

test('request with header', async (t) => {
  const { testnet, proxy, server } = await setup(t)

  const url = `http://localhost:${proxy.port}`
  const headers = { 'dht-public-key': server.dhtPublicKey }
  fetch(url, { method: 'POST', headers }).catch(noop)
  const res = await server.response.promise

  t.is(res.startsWith('POST /'), true, 'correct pathname')
  t.ok(res.includes(`dht-public-key: ${server.dhtPublicKey}`), 'correct dht-public-key header')

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

  const response = rrp()
  server.on('connection', (conn) => {
    conn.on('error', (err) => {
      if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
      console.warn('DHT error:', err)
    })
    conn.on('data', (data) => response.resolve(data.toString()))
  })
  await server.listen()

  const dhtPublicKey = idEnc.normalize(dht.defaultKeyPair.publicKey)

  async function close() {
    await server.close()
    await dht.destroy()
  }

  return { dhtPublicKey, response, close }
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

function noop() {}
