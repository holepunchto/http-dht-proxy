const http = require('http')
const net = require('net')
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const PORT = process.argv[2] || 8081
const HOST = '127.0.0.1'
const NAME = 'hello-server'

// start local http server
http.createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
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
const serverKeyPair = DHT.keyPair(Buffer.alloc(32).fill(NAME))
server.listen(serverKeyPair)
console.log('DHT public key', idEnc.normalize(serverKeyPair.publicKey))
// Output: f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o
