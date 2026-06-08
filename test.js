const { isBare } = require('which-runtime')
const test = require('brittle')
const fetch = isBare ? require('bare-fetch') : global.fetch
const promClient = require('bare-prom-client')
const { spawn } = require('child_process')
const http = require('http')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')
const createTestnet = require('hyperdht/testnet')
const NewlineDecoder = require('newline-decoder')
const path = require('path')
const process = require('process')
const rrp = require('resolve-reject-promise')

const HttpDhtProxy = require('.')

const EXECUTABLE = path.join(__dirname, isBare ? 'bin-bare.js' : 'bin.js')

test('basic', async (t) => {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy(), { order: 5000 })
  const { bootstrap } = testnet

  const proxy = await setupProxy(t, { bootstrap })
  const server = await setupServer(t, { bootstrap })

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

test('invalid dht key', async (t) => {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy(), { order: 5000 })
  const { bootstrap } = testnet

  const proxy = await setupProxy(t, { bootstrap })

  const url = `http://not-a-valid-key.localhost:${proxy.port}`

  const res = await fetch(url, { method: 'GET' })
  t.is(res.status, 400, 'returns 400 for invalid key')
  const body = await res.json()
  t.is(body.error, 'Invalid Hypercore key', 'response contains error message')
})

test('unavailable upstream', async (t) => {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy(), { order: 5000 })
  const { bootstrap } = testnet

  const proxy = await setupProxy(t, { bootstrap })

  const dht = new HyperDHT({ bootstrap })
  t.teardown(() => dht.destroy(), { order: 4000 })

  const unreachableKey = idEnc.normalize(dht.defaultKeyPair.publicKey)
  const url = `http://${unreachableKey}.localhost:${proxy.port}`

  const res = await fetch(url, { method: 'GET' })
  t.is(res.status, 502, 'returns 502 for unavailable upstream')
  const body = await res.json()
  t.is(body.error, 'PEER_NOT_FOUND: Peer not found', 'response contains error message')
})

test('metrics', async (t) => {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy(), { order: 5000 })
  const { bootstrap } = testnet

  {
    const proxy = await setupProxy(t, { bootstrap })
    const server = await setupServer(t, { bootstrap })

    promClient.register.clear()
    proxy.registerMetrics(promClient)
    t.teardown(() => promClient.register.clear())

    const url = `http://${server.dhtPublicKey}.localhost:${proxy.port}`
    const body = JSON.stringify({ message: 'Hello world!' })
    const res = await fetch(url, { method: 'POST', body })
    const req = await server.req

    const metrics = await promClient.register.metrics()
    t.ok(metrics.includes('http_dht_proxy_connections_total 1'), 'connections metric is registered')
  }

  {
    const proxy = await setupProxy(t, { port: 22, bootstrap })

    promClient.register.clear()
    proxy.registerMetrics(promClient)
    t.teardown(() => promClient.register.clear())

    const metrics = await promClient.register.metrics()
    t.ok(
      metrics.includes('http_dht_proxy_server_errors_total 1'),
      'server errors metric is registered'
    )
  }

  {
    const proxy = await setupProxy(t, { bootstrap })

    promClient.register.clear()
    proxy.registerMetrics(promClient)
    t.teardown(() => promClient.register.clear())

    await fetch(`http://not-a-valid-key.localhost:${proxy.port}`)

    const metrics = await promClient.register.metrics()
    t.ok(
      metrics.includes('http_dht_proxy_connection_errors_invalid_host_total 1'),
      'connection errors for invalid host metric is registered'
    )
  }

  {
    const proxy = await setupProxy(t, { bootstrap })

    promClient.register.clear()
    proxy.registerMetrics(promClient)
    t.teardown(() => promClient.register.clear())

    const dht = new HyperDHT({ bootstrap })
    t.teardown(() => dht.destroy(), { order: 4000 })
    const unreachableKey = idEnc.normalize(dht.defaultKeyPair.publicKey)
    const url = `http://${unreachableKey}.localhost:${proxy.port}`
    await fetch(url, { method: 'GET' })

    const metrics = await promClient.register.metrics()
    t.ok(
      metrics.includes('http_dht_proxy_connection_errors_dht_total 1'),
      'connection errors for DHT issues metric is registered'
    )
  }
})

test('bin', async (t) => {
  const testnet = await createTestnet()
  t.teardown(() => testnet.destroy(), { order: 5000 })
  const { bootstrap } = testnet

  const server = await setupServer(t, { bootstrap })

  const tProxy = t.test('Proxy')
  tProxy.plan(1)

  const proc = spawn(process.execPath, [
    EXECUTABLE,
    '-p',
    '0',
    '--bootstrap',
    JSON.stringify(bootstrap)
  ])
  t.teardown(() => proc.kill('SIGKILL'), { order: 4000 })
  process.on('exit', () => {
    proc.kill('SIGKILL')
  })
  proc.stderr.on('data', (d) => {
    console.error(d.toString())
    t.fail('There should be no stderr')
  })

  let port = ''
  const stdoutDec = new NewlineDecoder('utf-8')
  proc.stdout.on('data', (d) => {
    for (const line of stdoutDec.push(d)) {
      if (line.includes('HTTP-to-DHT proxy on')) {
        tProxy.pass('Proxy started')
        port = line.split('HTTP-to-DHT proxy on ')[1].split('"')[0]
      }
    }
  })
  await tProxy

  const url = `http://${server.dhtPublicKey}.localhost:${port}`
  const body = JSON.stringify({ message: 'Hello world!' })
  const res = await fetch(url, { method: 'POST', body })

  const req = await server.req
  t.is(req.method, 'POST', 'correct method')
  t.is(req.pathname, '/', 'correct pathname')
  t.is(req.headers.host, `${server.dhtPublicKey}.localhost:${port}`, 'correct host header')
  t.is(req.body, body, 'correct body')

  const text = await res.text()
  t.is(text, 'ok', 'correct response')
})

async function setupProxy(t, { port = 0, bootstrap }) {
  const proxy = new HttpDhtProxy(port, { bootstrap })
  t.teardown(() => proxy.close(), { order: 3000 })
  await proxy.ready()
  return proxy
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
      await dht.destroy()
      httpServer.close()
    },
    { order: 4000 }
  )

  await dhtServer.listen()
  const dhtPublicKey = idEnc.normalize(dht.defaultKeyPair.publicKey)

  return { dhtPublicKey, req: reqPromise.promise }
}
