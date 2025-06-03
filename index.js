const net = require('net')
const DHT = require('hyperdht')
const proxy = require('http-forward-host')
const idEnc = require('hypercore-id-encoding')

const PORT = process.argv[2] || 8080

const dht = new DHT()
net.createServer((sock) => {
  proxy(sock, (proxyTo) => dht.connect(idEnc.decode(proxyTo)))
}).listen(PORT, () => console.log(`HTTP-to-DHT proxy on ${PORT}`))
