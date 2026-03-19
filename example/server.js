const http = require('http')
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const SEED = process.argv[2]

// start local http server
const httpServer = http.createServer((req, res) => {
  let body = ''
  req.on('data', (d) => {
    body += d
  })
  req.on('end', () => {
    console.log('New request', req.headers, body)
    res.end('ok')
  })
})

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
console.log('DHT public key', idEnc.normalize(keyPair.publicKey))
