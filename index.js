const net = require('net')
const DHT = require('hyperdht')
const proxy = require('http-forward-host')
const idEnc = require('hypercore-id-encoding')

const PORT = process.argv[2] || 8080

const dht = new DHT()
net.createServer((sock) => {
  proxy(sock, (host) => {
    try {
      const id = host.split('.')[0]
      const seed = Buffer.alloc(32).fill(id)
      const keyPair = DHT.keyPair(seed)
      return dht.connect(idEnc.decode(keyPair.publicKey))
    } catch (err) {
      console.error('Proxy error:', err)
      sock.destroy()
    }
  })
}).listen(PORT, () => console.log(`HTTP-to-DHT proxy on ${PORT}`))
