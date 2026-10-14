import { getToken, getUser } from '@/auth.js'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const NOTIF_CHANNEL_ID = 'cit-alerts-v1'

async function setupNativeNotifications() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.requestPermissions()
    await LocalNotifications.createChannel({
      id: NOTIF_CHANNEL_ID,
      name: 'CIT Scheduler alerts',
      importance: 4,
      sound: 'notification.mp3',
      vibration: true,
    })
  } catch (err) {
    console.warn('Notification channel setup failed:', err)
  }
}
setupNativeNotifications()

let es = null
let esToken = null
const listeners = new Set()

let pendingSound = false
let pendingPayload = {}

function playNotificationSound(payload = {}) {
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2147483647),
        title: payload.title || 'CIT Scheduler',
        body: payload.message || 'You have a new notification.',
        channelId: NOTIF_CHANNEL_ID,
        sound: 'notification.mp3',
      }],
   }).catch((err) => console.warn('Local notification failed:', err))
  }
  if (Capacitor.isNativePlatform()) return
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.6
    audio.play().catch((err) => {
      console.warn('Notification sound blocked:', err.name)
      if (err.name === 'NotAllowedError') { pendingSound = true; pendingPayload = payload }
    })
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  const retryAfterClick = () => {
    if (pendingSound) {
      pendingSound = false
      if (!Capacitor.isNativePlatform()) playNotificationSound(pendingPayload)
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
      const me = String(getUser()?.id || getUser()?._id || '')
      const isOwnAction = payload.actorId && me && String(payload.actorId) === me
      if (!isOwnAction) playNotificationSound(payload)
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

