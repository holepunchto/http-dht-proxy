const dhtPublicKey = 'f7tnaio84i4r9n7escd7dp7ke3umumorm4yijfqupqwzkd3m533o'
const proxyUrl = 'http://localhost:8080'

fetch(proxyUrl, {
  headers: { 'dht-public-key': dhtPublicKey },
  method: 'POST',
  body: JSON.stringify({ message: 'Hello from client!' })
}).then(res => res.text())
  .then(res => console.log('Response:', res))
