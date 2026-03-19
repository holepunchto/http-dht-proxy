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
  proxy(sock, (host) => {
    try {
      const key = host.split('.')[0]
      return dht.connect(idEnc.decode(key))
    } catch (err) {
      const body = JSON.stringify({ error: err.message })
      sock.end(
        `HTTP/1.1 400 Error\r\n` +
          `Content-Type: application/json\r\n` +
          `Content-Length: ${Buffer.byteLength(body)}\r\n` +
          `Connection: close\r\n` +
          `\r\n` +
          body
      )
      return null
    }
  })
})

server.listen(+PORT, () => console.log(`HTTP-to-DHT proxy on ${server.address().port}`))
