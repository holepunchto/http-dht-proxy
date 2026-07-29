const http = require('http')
const { Duplex } = require('stream')

function createHttpHandler (conn, requestHandler) {
  // Create a duplex stream that wraps the DHT connection
  const httpSocket = new Duplex({
    write (chunk, encoding, callback) {
      // Write response data back to DHT connection
      conn.write(chunk, encoding, callback)
    },
    read () {
      // Reading is handled by pushing data from conn
    }
  })

  // Forward data from DHT connection to HTTP socket
  conn.on('data', (chunk) => {
    httpSocket.push(chunk)
  })

  conn.on('end', () => {
    httpSocket.push(null)
  })

  // Create HTTP request/response objects
  const req = new http.IncomingMessage(httpSocket)
  const res = new http.ServerResponse(req)

  // Properly assign the socket to the response
  res.assignSocket(httpSocket)

  // Override the response's write methods to ensure data flows correctly
  const originalWrite = res.write.bind(res)
  const originalEnd = res.end.bind(res)

  res.write = function (chunk, encoding, callback) {
    const result = originalWrite(chunk, encoding, callback)
    return result
  }

  res.end = function (chunk, encoding, callback) {
    const result = originalEnd(chunk, encoding, callback)
    // Close the DHT connection after response is sent
    setImmediate(() => {
      conn.end()
    })
    return result
  }

  // Handle cleanup
  conn.on('close', () => {
    if (!httpSocket.destroyed) {
      httpSocket.destroy()
    }
  })

  conn.on('error', (err) => {
    if (!httpSocket.destroyed) {
      httpSocket.destroy(err)
    }
  })

  // Call the user's request handler
  requestHandler(req, res)
}

module.exports = { createHttpHandler }
