const test = require('brittle')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')
const createTestnet = require('hyperdht/testnet')
const { PassThrough } = require('stream')
const rrp = require('resolve-reject-promise')

const proxy = require('.')

test('request with pathname', async (t) => {
  t.plan(2)

  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy())
  const { bootstrap } = testnet

  const dhtServer = new HyperDHT({ bootstrap })
  t.teardown(() => dhtServer.destroy())

  const server = dhtServer.createServer()
  t.teardown(() => server.close())

  const pr = rrp()
  server.on('connection', (conn) => {
    conn.on('error', (err) => {
      if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
      console.warn('DHT error:', err)
    })
    conn.on('data', (data) => pr.resolve(data.toString()))
  })
  await server.listen()
  t.teardown(() => server.close())
  const dhtPublicKey = idEnc.normalize(dhtServer.defaultKeyPair.publicKey)

  const dhtClient = new HyperDHT({ bootstrap })
  t.teardown(() => dhtClient.destroy())

  const stream = new PassThrough()
  proxy(stream, async (key) => {
    t.is(key, dhtPublicKey, 'correct dht public key')
    return dhtClient.connect(idEnc.decode(key))
  })

  const req = [
    `POST /${dhtPublicKey} HTTP/1.1`,
    `Host: localhost:8080`,
    `Content-Length: 0`,
    '\r\n'
  ].join('\r\n')
  stream.write(req)

  const res = await pr.promise
  t.is(res, req, 'received correct request')

  await dhtClient.destroy()
  await server.close()
  await dhtServer.destroy()
  await testnet.destroy()
})

test('request with header', async (t) => {
  t.plan(2)

  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy())
  const { bootstrap } = testnet

  const dhtServer = new HyperDHT({ bootstrap })
  t.teardown(() => dhtServer.destroy())

  const server = dhtServer.createServer()
  t.teardown(() => server.close())

  const pr = rrp()
  server.on('connection', (conn) => {
    conn.on('error', (err) => {
      if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
      console.warn('DHT error:', err)
    })
    conn.on('data', (data) => pr.resolve(data.toString()))
  })
  await server.listen()
  t.teardown(() => server.close())
  const dhtPublicKey = idEnc.normalize(dhtServer.defaultKeyPair.publicKey)

  const dhtClient = new HyperDHT({ bootstrap })
  t.teardown(() => dhtClient.destroy())

  const stream = new PassThrough()
  proxy(stream, async (key) => {
    t.is(key, dhtPublicKey, 'correct dht public key')
    return dhtClient.connect(idEnc.decode(key))
  })

  const req = [
    `POST / HTTP/1.1`,
    `Host: localhost:8080`,
    `Content-Length: 0`,
    `dht-public-key: ${dhtPublicKey}`,
    '\r\n'
  ].join('\r\n')
  stream.write(req)

  const res = await pr.promise
  t.is(res, req, 'received correct request')

  await dhtClient.destroy()
  await server.close()
  await dhtServer.destroy()
  await testnet.destroy()
})
