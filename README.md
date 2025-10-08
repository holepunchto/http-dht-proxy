# Http DHT Proxy
Relay http request to dht peer

## Installation

Install globally to use the `http-dht-proxy` command:

```
npm install -g http-dht-proxy
```

## Usage

Run a http-dht-proxy:

```
http-dht-proxy 8080
```

## Example
Start proxy server: `node bin.js`
```
HTTP-to-DHT proxy on 8080
```

Start sample server: `node example/server.js`
```
Local http server on 8081
DHT public key f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o
```

Send a request: `node example/client.js <dht-public-key>`
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
