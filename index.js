const net = require('net')
const DHT = require('hyperdht')
const proxy = require('./http-forward-host')

const PORT = process.argv[2] || 8080

const dht = new DHT()
net.createServer((sock) => {
  proxy(sock, (proxyTo) => dht.connect(Buffer.from(proxyTo, 'hex')))
}).listen(PORT, () => console.log(`HTTP-to-DHT proxy on ${PORT}`))
