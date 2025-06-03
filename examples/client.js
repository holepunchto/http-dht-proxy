const proxyUrl = 'http://localhost:8080'
const publicKey = 'f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o'

fetch(proxyUrl, {
  headers: { 'x-forwarded-for': publicKey },
  method: 'POST',
  body: JSON.stringify({ message: 'Hello from client!' })
}).then(res => res.text())
  .then(res => console.log('Response:', res))
