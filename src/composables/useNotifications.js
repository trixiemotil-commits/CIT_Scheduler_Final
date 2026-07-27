import { getToken } from '@/auth.js'

let es = null
const listeners = new Set()

function ensureEventSource() {
  if (es) return es
  const token = getToken()
  if (!token) return null
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  try {
    es = new EventSource(`${base}/notifications/stream?token=${encodeURIComponent(token)}`)
  } catch (e) {
    es = null
    return null
  }

  es.addEventListener('notification', (ev) => {
    try {
      const payload = JSON.parse(ev.data || '{}')
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
  })

  return es
}

export function addNotificationListener(cb) {
  listeners.add(cb)
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

export default { addNotificationListener, removeNotificationListener, closeNotifications }
