const jwt = require('jsonwebtoken')

// Map of userId -> Set of response objects
const clients = new Map()

function attachSSE(req, res) {
  // allow token via query for EventSource clients
  let user = null
  try {
    const token = req.query && req.query.token ? String(req.query.token) : null
    if (!token && req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // normal header (unlikely for EventSource but supported)
      user = jwt.verify(req.headers.authorization.replace('Bearer ', '').trim(), process.env.JWT_SECRET)
    } else if (token) {
      user = jwt.verify(token, process.env.JWT_SECRET)
    }
  } catch (err) {
    res.status(401).json({ message: 'Invalid or missing token for notifications stream.' })
    return
  }

  const userId = String(user.id)

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('\n')

  let set = clients.get(userId)
  if (!set) {
    set = new Set()
    clients.set(userId, set)
  }
  set.add(res)

  req.on('close', () => {
    const s = clients.get(userId)
    if (s) {
      s.delete(res)
      if (!s.size) clients.delete(userId)
    }
  })
}

function sendNotificationToRecipient(recipientId, payload) {
  try {
    const key = String(recipientId)
    const set = clients.get(key)
    if (!set || !set.size) return
    const text = JSON.stringify(payload)
    for (const res of set) {
      try {
        res.write(`event: notification\n`)
        res.write(`data: ${text}\n\n`)
      } catch (e) {
        // ignore individual client errors
      }
    }
  } catch (err) {
    // swallow
  }
}

module.exports = { attachSSE, sendNotificationToRecipient }
