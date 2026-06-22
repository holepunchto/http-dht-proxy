const http = require('http')
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const SEED = process.argv[2]

// start local http server
const httpServer = http.createServer((req, res) => {
  const auth = req.headers.authorization
  if (!auth || !isValidAuth(auth)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="files"')
    res.statusCode = 401
    res.end()
    return
  }

  let body = ''
  req.on('data', (d) => {
    body += d
  })
  req.on('end', () => {
    console.log('New request', req.headers, body)
    res.end('ok')
  })
})

function isValidAuth(header) {
  const [user, pass] = Buffer.from(header.replace('Basic ', ''), 'base64').toString().split(':')
  return user === 'alice' && pass === 'secret'
}

// start public DHT server
const dht = new DHT()
const server = dht.createServer((conn) => {
  conn.on('error', (err) => {
    if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
    console.warn('DHT error:', err)
  })
  httpServer.emit('connection', conn)
})

const keyPair = DHT.keyPair(SEED && Buffer.alloc(32).fill(SEED))
server.listen(keyPair)

const k = idEnc.normalize(keyPair.publicKey)
console.log('DHT public key', k)
console.log(`Served at https://${k}.hyperproxy.org/`)
