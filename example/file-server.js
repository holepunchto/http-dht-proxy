#!/usr/bin/env node

const http = require('http')
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')
const fs = require('fs')
const path = require('path')

const SEED = process.argv[2]
const ROOT = process.argv[3] || '.'

// start local http server
const httpServer = http.createServer(async (req, res) => {
  const filename = path.join(ROOT, path.resolve(req.url.split('?')[0]))
  let found = false

  try {
    const st = await fs.promises.stat(filename)
    found = true
    res.setHeader('Content-Length', st.size)
    const stream = fs.createReadStream(filename)

    stream.on('close', () => res.destroy())
    stream.on('error', noop)

    res.on('close', () => stream.destroy())
    res.on('error', noop)

    stream.pipe(res)
  } catch (err) {
    if (!found) {
      res.statusCode = 404
      res.end()
      return
    }
    res.statusCode = 500
    res.end(err.message)
  }
})

// start public DHT server
const dht = new DHT()
const server = dht.createServer((conn) => {
  console.log('got conn')
  conn.on('error', (err) => {
    if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
    console.warn('DHT error:', err)
  })
  httpServer.emit('connection', conn)
})

const keyPair = DHT.keyPair(SEED && Buffer.alloc(32).fill(SEED))
server.listen(keyPair)

const k = idEnc.normalize(keyPair.publicKey)

console.log('DHT public key', k)
console.log(`Served at https://${k}.hyperproxy.org/`)

function noop() {}
