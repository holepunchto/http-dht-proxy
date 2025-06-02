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
DHT public key 2f622c5607d5744f8ba8b307d1b7aa4666b9ae045e815495d36ba9750f2bde73
```

Send a request: `node examples/client.js`
```
Response: Hello from backend!
{
  "host": "localhost:8080",
  "connection": "keep-alive",
  "x-forwarded-for": "2f622c5607d5744f8ba8b307d1b7aa4666b9ae045e815495d36ba9750f2bde73",
  "accept": "*/*",
  "accept-language": "*",
  "sec-fetch-mode": "cors",
  "user-agent": "node",
  "accept-encoding": "gzip, deflate"
}
```
