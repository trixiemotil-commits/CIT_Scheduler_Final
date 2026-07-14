import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import router from './router'

const app = createApp(App)
app.use(router)

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

try {
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
