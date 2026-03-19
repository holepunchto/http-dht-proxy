#!/usr/bin/env node

const net = require('net')
const process = require('process')
const proxy = require('http-forward-host')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')

const PORT = process.argv[2] || 8080
const BOOTSTRAP = process.argv[3]

const dht = new HyperDHT({
  ...(BOOTSTRAP && { bootstrap: JSON.parse(BOOTSTRAP) })
})
const server = net.createServer((sock) => {
  sock.on('error', (err) => console.error('Socket error:', err))
  proxy(sock, (host) => {
    const key = host.split('.')[0]
    return dht.connect(idEnc.decode(key))
  })
})
server.listen(+PORT, () => console.log(`HTTP-to-DHT proxy on ${server.address().port}`))
