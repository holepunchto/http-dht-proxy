![CI](https://github.com/holepunchto/http-dht-proxy/actions/workflows/ci.yml/badge.svg)

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

Send request:

- with pathname: `node example/client.js <dht-public-key>`
- with header: `node example/client-header.js <dht-public-key>`

Server will receive request

```
New request {
  host: 'localhost:8080',
  connection: 'keep-alive',
  'content-type': 'text/plain;charset=UTF-8',
  accept: '*/*',
  'accept-language': '*',
  'sec-fetch-mode': 'cors',
  'user-agent': 'node',
  'accept-encoding': 'gzip, deflate',
  'content-length': '35'
} {"message":"Request with pathname"}

New request {
  host: 'localhost:8080',
  connection: 'keep-alive',
  'dht-public-key': 'x4awsm6otrfirjt5g8a5e4sz4nrw354bq4fjqo979fnajzcd6tey',
  'content-type': 'text/plain;charset=UTF-8',
  accept: '*/*',
  'accept-language': '*',
  'sec-fetch-mode': 'cors',
  'user-agent': 'node',
  'accept-encoding': 'gzip, deflate',
  'content-length': '33'
} {"message":"Request with header"}
```
