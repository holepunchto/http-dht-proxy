# Http-DHT-Proxy
Relay http request to dht peer

# Example
Start proxy server: `node index.js`
```
HTTP-to-DHT proxy on 8080
```

Start sample server: `node examples/server.js`
```
Local http server on 8081
DHT public key 8pinxxgqs41n4aididenw5apqp1urfmzdztr8jt4abrkdn435ewo
```

Send a request: `node examples/client.js`
```
Hello from server!

Request headers: {
  "host": "hello-server.example.com",
  "proxy-connection": "close",
  "connection": "close",
  "transfer-encoding": "chunked"
}
Request body: {"message":"Hello from client!"}
```
