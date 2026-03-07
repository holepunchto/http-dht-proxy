const DHT_PUBLIC_KEY = process.argv[2] || ''
const PROXY = process.argv[3] || 'localhost:8080'

fetch(`http://${PROXY}/${DHT_PUBLIC_KEY}`, {
  method: 'POST',
  body: JSON.stringify({ message: 'Request with pathname' })
})
  .then((res) => res.text())
  .then((res) => console.log('Response:', res))
