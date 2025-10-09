#!/usr/bin/env node

const net = require('net')
const HyperDHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const proxy = require('.')

const PORT = process.argv[2] || 8080

const dht = new HyperDHT()
const server = net.createServer((sock) => {
  proxy(sock, (key) => dht.connect(idEnc.decode(key)))
})
server.listen(PORT, () => console.log(`HTTP-to-DHT proxy on ${server.address().port}`))
