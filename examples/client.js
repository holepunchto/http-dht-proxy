const http = require('http')
const { HttpProxyAgent } = require('http-proxy-agent')

const requestUrl = 'http://f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o.example.com'
const proxyUrl = 'http://localhost:8080'

const req = http.request(requestUrl, {
  agent: new HttpProxyAgent(proxyUrl),
  method: 'POST'
}, (res) => {
  res.pipe(process.stdout)
})
req.write(JSON.stringify({ message: 'Hello from client!' }))
req.end()
