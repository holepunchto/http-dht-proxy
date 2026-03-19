const DHT_PUBLIC_KEY = process.argv[2] || ''
const PROXY = process.argv[3] || 'localhost:8080'

fetch(`http://${DHT_PUBLIC_KEY}.${PROXY}`, {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello world!' })
})
  .then((res) => {
    console.log(`Status: ${res.status}`)
    return res.text()
  })
  .then((res) => console.log('Response:', res))
