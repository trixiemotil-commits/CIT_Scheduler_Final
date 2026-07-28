import { createApp } from 'vue'
import { Capacitor } from '@capacitor/core'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import RoleSwitchButton from './components/RoleSwitchButton.vue'
import PublishedTermScheduleLink from './components/PublishedTermScheduleLink.vue'

/* Ionic's required base styles. Custom project styles load afterwards so the
   existing admin, teacher, and student branding remains in control. */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

import './theme/variables.css'
import './assets/main.css'
import router from './router'

const app = createApp(App)
app.use(IonicVue)
app.use(router)
app.component('RoleSwitchButton', RoleSwitchButton)
app.component('PublishedTermScheduleLink', PublishedTermScheduleLink)

// Global error handlers to surface runtime errors to the page for debugging
window.addEventListener('error', (ev) => {
  try {
    const msg = (ev && ev.message) ? ev.message : String(ev.error || ev)
    console.error('Global error captured:', msg, ev.error)
    const el = document.createElement('pre')
    el.style.whiteSpace = 'pre-wrap'
    el.style.background = '#fee'
    el.style.color = '#900'
    el.style.padding = '12px'
    el.style.border = '1px solid #900'
    el.style.position = 'fixed'
    el.style.left = '12px'
    el.style.top = '12px'
    el.style.zIndex = 99999
    el.textContent = `Runtime error: ${msg}`
    document.body.appendChild(el)
  } catch (e) { /* ignore */ }
})
window.addEventListener('unhandledrejection', (ev) => {
  try {
    console.error('Unhandled promise rejection:', ev.reason)
    const el = document.createElement('pre')
    el.style.whiteSpace = 'pre-wrap'
    el.style.background = '#fee'
    el.style.color = '#900'
    el.style.padding = '12px'
    el.style.border = '1px solid #900'
    el.style.position = 'fixed'
    el.style.left = '12px'
    el.style.top = '12px'
    el.style.zIndex = 99999
    el.textContent = `Unhandled rejection: ${String(ev.reason?.message || ev.reason)}`
    document.body.appendChild(el)
  } catch (e) { /* ignore */ }
})

async function clearNativeWebCache() {
  if (!Capacitor.isNativePlatform()) return

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.()
    await Promise.all((registrations || []).map((registration) => registration.unregister()))
  } catch (_error) {
    // Service workers may not be available in every Android WebView.
  }

  try {
    const cacheNames = await window.caches?.keys?.()
    await Promise.all((cacheNames || []).map((cacheName) => window.caches.delete(cacheName)))
  } catch (_error) {
    // Cache Storage may not be available in every Android WebView.
  }
}

router.isReady().then(async () => {
  try {
    await clearNativeWebCache()
    app.mount('#app')
  } catch (err) {
    console.error('Mount failed:', err)
    const el = document.createElement('pre')
    el.style.whiteSpace = 'pre-wrap'
    el.style.background = '#fee'
    el.style.color = '#900'
    el.style.padding = '12px'
    el.style.border = '1px solid #900'
    el.style.position = 'fixed'
    el.style.left = '12px'
    el.style.top = '12px'
    el.style.zIndex = 99999
    el.textContent = `Mount failed: ${String(err.message || err)}`
    document.body.appendChild(el)
  }
})
