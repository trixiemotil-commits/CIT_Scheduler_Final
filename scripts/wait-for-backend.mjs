const healthUrl = 'http://127.0.0.1:5000/api/health'
const timeoutAt = Date.now() + 60_000

while (Date.now() < timeoutAt) {
  try {
    const response = await fetch(healthUrl)
    if (response.ok) {
      console.log('Backend is ready; starting Vite.')
      process.exit(0)
    }
  } catch (_) {
    // The backend is still connecting to MongoDB or completing startup work.
  }

  await new Promise(resolve => setTimeout(resolve, 250))
}

console.error(`Backend did not become ready at ${healthUrl} within 60 seconds.`)
process.exit(1)
