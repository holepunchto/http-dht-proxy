const http = require('http')
const net = require('net')
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const PORT = process.argv[2] || 8081
const HOST = process.argv[3] || '127.0.0.1'
const SEED = process.argv[4]

// start local http server
http.createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    console.log("New request", req.headers, body)
    res.end(
      'Hello from server!' +
      '\n\nRequest headers: ' + JSON.stringify(req.headers, null, 2) +
      '\nRequest body: ' + body
    )
  })
}).listen(PORT, () => console.log(`Local http server on ${PORT}`))

// start public DHT server
const dht = new DHT()
const server = dht.createServer((conn) => {
  const local = net.connect(PORT, HOST)
  conn.on('error', err => {
    if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
    console.warn('DHT error:', err)
  })
  conn.pipe(local).pipe(conn)
})

const keyPair = DHT.keyPair(SEED)
server.listen(keyPair)
console.log('DHT public key', idEnc.normalize(keyPair.publicKey))
