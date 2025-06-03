const requestUrl = 'http://f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o.example.com'
const proxyUrl = 'http://localhost:8080'

fetch(proxyUrl, {
  headers: { 'x-forwarded-for': requestUrl },
  method: 'POST',
  body: JSON.stringify({ message: 'Hello from client!' })
}).then(res => res.text())
  .then(res => console.log('Response:', res))
