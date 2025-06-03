const proxyUrl = 'http://localhost:8080'
const dhtPublicKey = '2f622c5607d5744f8ba8b307d1b7aa4666b9ae045e815495d36ba9750f2bde73'

fetch(proxyUrl, {
  method: 'POST',
  headers: { 'x-forwarded-for': dhtPublicKey },
  body: JSON.stringify({ message: 'Hello from client!' })
}).then(res => res.text())
  .then(res => console.log('Response:', res))
