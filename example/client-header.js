const DHT_PUBLIC_KEY = process.argv[2]
const proxyUrl = 'http:/localhost:8080'

fetch(proxyUrl, {
  headers: { 'dht-public-key': DHT_PUBLIC_KEY },
  method: 'POST',
  body: JSON.stringify({ message: 'Request with header' })
})
  .then((res) => res.text())
  .then((res) => console.log('Response:', res))
