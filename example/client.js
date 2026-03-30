const URL = process.argv[2] || 'http://dht-key.localhost:8080'

fetch(URL, {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello world!' })
})
  .then((res) => {
    console.log(`Status: ${res.status}`)
    return res.text()
  })
  .then((res) => console.log('Response:', res))
