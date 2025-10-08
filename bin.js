#!/usr/bin/env node

const net = require('net')
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const proxy = require('.')

const PORT = process.argv[2] || 8080

const dht = new DHT()
net
  .createServer((sock) => {
    proxy(sock, (host) => {
      const id = host.split('.')[0]
      return dht.connect(idEnc.decode(id))
    })
  })
  .listen(PORT, () => console.log(`HTTP-to-DHT proxy on ${PORT}`))
