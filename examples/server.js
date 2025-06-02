const http = require('http')
const net = require('net')
const DHT = require('hyperdht')

// start local http server
http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' })
  res.end('Hello from backend!\n' + JSON.stringify(req.headers, null, 2))
}).listen(8081, () => console.log('Local http server on 8081'))

// start public DHT server
const dht = new DHT()
const server = dht.createServer((conn) => {
  const local = net.connect(8081, '127.0.0.1')
  conn.on('error', err => {
    if (err.code === 'ECONNRESET') return
    console.warn('DHT error:', err)
  })
  conn.pipe(local).pipe(conn)
})
const serverName = 'hello-server' // replace with your own
const serverKeyPair = DHT.keyPair(Buffer.alloc(32).fill(serverName))
server.listen(serverKeyPair)
console.log('DHT public key', serverKeyPair.publicKey.toString('hex'))
// Output: 2f622c5607d5744f8ba8b307d1b7aa4666b9ae045e815495d36ba9750f2bde73
