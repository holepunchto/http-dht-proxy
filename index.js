#!/usr/bin/env node

const net = require('net')
const proxy = require('http-forward-host')
const idEnc = require('hypercore-id-encoding')
const HyperDHT = require('hyperdht')
const ReadyResource = require('ready-resource')

class HttpDhtProxy extends ReadyResource {
  constructor(port, opts = {}) {
    super()

    this.port = port

    this.dht = new HyperDHT({
      ...(opts.bootstrap && { bootstrap: opts.bootstrap })
    })

    this.server = net.createServer()

    this.stats = {
      connections: 0,
      connectionErrorsInvalidHost: 0,
      connectionErrorsDht: 0
    }
  }

  async _open() {
    this.server.on('connection', (sock) => {
      proxy(sock, async (host) => {
        let dhtPublicKey
        try {
          dhtPublicKey = idEnc.decode(host.split('.')[0])
        } catch (error) {
          this.stats.connectionErrorsInvalidHost++
          this.emit('connection-error-invalid-host', { host, error })
          const body = JSON.stringify({ error: error.message })
          sock.end(
            `HTTP/1.1 400 Bad Request\r\n` +
              `Content-Type: application/json\r\n` +
              `Content-Length: ${Buffer.byteLength(body)}\r\n` +
              `Connection: close\r\n` +
              `\r\n` +
              body
          )
          return null
        }

        try {
          const socket = this.dht.connect(dhtPublicKey)
          await new Promise((resolve, reject) => {
            socket.on('open', resolve)
            socket.on('error', reject)
          })
          this.stats.connections++
          return socket
        } catch (error) {
          this.stats.connectionErrorsDht++
          this.emit('connection-error-dht', { host, dhtPublicKey, error })
          const body = JSON.stringify({ error: error.message })
          sock.end(
            `HTTP/1.1 502 Bad Gateway\r\n` +
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

    await new Promise((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(this.port, () => {
        this.emit('listening', { port: this.server.address().port })
        this.port = this.server.address().port
        resolve()
      })
    })
  }

  async _close() {
    await new Promise((resolve) => {
      this.server.close((error) => {
        if (error) {
          this.emit('server-error-close', { error })
        }
        resolve()
      })
    })
    await this.dht.destroy()
  }

  registerMetrics(promClient) {
    const proxy = this

    new promClient.Gauge({
      name: 'http_dht_proxy_connections_total',
      help: 'Number of proxied connections',
      collect() {
        this.set(proxy.stats.connections)
      }
    })

    new promClient.Gauge({
      name: 'http_dht_proxy_connection_errors_invalid_host_total',
      help: 'Number of connection errors due to invalid host',
      collect() {
        this.set(proxy.stats.connectionErrorsInvalidHost)
      }
    })

    new promClient.Gauge({
      name: 'http_dht_proxy_connection_errors_dht_total',
      help: 'Number of connection errors due to DHT issues',
      collect() {
        this.set(proxy.stats.connectionErrorsDht)
      }
    })
  }
}

module.exports = HttpDhtProxy
