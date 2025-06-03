const DHT = require('hyperdht')
const { createHttpHandler } = require('../http-dht-adapter')

// Start public DHT server
const dht = new DHT()
const server = dht.createServer((conn) => {
  conn.on('error', err => {
    if (err.code === 'ECONNRESET') return
    console.warn('DHT error:', err)
  })
  createHttpHandler(conn, (req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('Hello from DHT backend!\n' + JSON.stringify(req.headers, null, 2))
  })
})
const serverName = 'hello-server' // replace with your own
const serverKeyPair = DHT.keyPair(Buffer.alloc(32).fill(serverName))
server.listen(serverKeyPair)
console.log('DHT public key', serverKeyPair.publicKey.toString('hex'))
// Output: 2f622c5607d5744f8ba8b307d1b7aa4666b9ae045e815495d36ba9750f2bde73
