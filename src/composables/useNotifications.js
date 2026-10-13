import { getToken } from '@/auth.js'

let es = null
let esToken = null
const listeners = new Set()

let pendingSound = false

function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.6
    audio.play().catch((err) => {
      console.warn('Notification sound blocked:', err.name)
      if (err.name === 'NotAllowedError') pendingSound = true
    })
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  const retryAfterClick = () => {
    if (pendingSound) {
      pendingSound = false
      playNotificationSound()
    }
  }
  window.addEventListener('click', retryAfterClick)
  window.addEventListener('keydown', retryAfterClick)
  window.addEventListener('touchstart', retryAfterClick)
}

function ensureEventSource() {
  const token = getToken()
  if (es && esToken === token) return es
  if (es) {
    try { es.close() } catch (_) {}
    es = null
    esToken = null
  }
  if (!token) return null
  esToken = token
  const base = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : (import.meta.env.VITE_API_BASE_URL || '/api')
  try {
    es = new EventSource(`${base}/notifications/stream?token=${encodeURIComponent(token)}`)
  } catch (e) {
    es = null
    return null
  }

  es.addEventListener('notification', (ev) => {
    try {
      const payload = JSON.parse(ev.data || '{}')
      playNotificationSound()
      for (const cb of listeners) {
        try { cb(payload) } catch (_) {}
      }
    } catch (e) {
      // ignore
    }
  })

  es.addEventListener('error', () => {
    // if connection fails, close and allow retry on next ensureEventSource call
    try { es.close() } catch (_) {}
    es = null
    setTimeout(() => { if (getToken()) ensureEventSource() }, 3000)
  })

  return es
}

export function addNotificationListener(cb) {
  listeners.add(cb)
  ensureEventSource()
}

export function startNotifications() {
  ensureEventSource()
}

export function removeNotificationListener(cb) {
  listeners.delete(cb)
}

export function closeNotifications() {
  if (es) {
    try { es.close() } catch (_) {}
    es = null
  }
  listeners.clear()
}
export default { addNotificationListener, removeNotificationListener, closeNotifications, startNotifications }

