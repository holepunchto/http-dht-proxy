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

### Basic auth server

Run `node example/basic-auth.js`

```
Served at https://<dht-key>.hyperproxy.org
```

Go to `https://<dht-key>.hyperproxy.org`, fill the auth form with user `alice` and pass `secret`

### Base server

Start proxy server: `node bin.js`

```
HTTP-to-DHT proxy on 8080
```

Start sample server: `node example/server.js`

```
Local http server on 8081
DHT public key abcdef123456
```

Send sample request: `node example/client.js http://<dht-public-key>.localhost:8080`, e.g.

```
node example/client.js abcdef123456
```

Server will receive request, e.g.

```
New request {
  host: 'abcdef123456.localhost:8080',
} {"message":"Hello world!"}
```
