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
DHT public key f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o
```

Send a request: `node examples/client.js <dht-public-key>`
```
Response: Hello from server!

Request headers: {
  "host": "localhost:8080",
  "connection": "keep-alive",
  "x-forwarded-for": "f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o",
  "content-type": "text/plain;charset=UTF-8",
  "accept": "*/*",
  "accept-language": "*",
  "sec-fetch-mode": "cors",
  "user-agent": "node",
  "accept-encoding": "gzip, deflate",
  "content-length": "32"
}
Request body: {"message":"Hello from client!"}
```
