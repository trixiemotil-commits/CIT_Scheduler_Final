import { onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue'
import { onMounted, onUnmounted } from 'vue'

export const STUDENT_DATA_CHANGED_EVENT = 'cit:student-data-changed'

export function notifyStudentDataChanged(source = 'unknown') {
  window.dispatchEvent(new CustomEvent(STUDENT_DATA_CHANGED_EVENT, {
    detail: { source, changedAt: Date.now() },
  }))
}

export function useAutoRefresh(refreshHandler, options = {}) {
  const intervalMs = Number(options.intervalMs || 15000)
  let intervalId = null
  let inFlight = null
  let isActiveView = false

  async function refresh() {
    if (inFlight) return inFlight

    inFlight = Promise.resolve()
      .then(() => refreshHandler())
      .finally(() => {
        inFlight = null
      })

    return inFlight
  }

  function refreshWhenVisible() {
    if (isActiveView && document.visibilityState === 'visible') refresh().catch(() => {})
  }

  function handleVisibilityChange() {
    refreshWhenVisible()
  }

  function handleDataChanged() {
    refreshWhenVisible()
  }

  onIonViewDidEnter(() => {
    isActiveView = true
    refresh().catch(() => {})
  })

  onIonViewDidLeave(() => {
    isActiveView = false
  })

  onMounted(() => {
    window.addEventListener('focus', refreshWhenVisible)
    window.addEventListener(STUDENT_DATA_CHANGED_EVENT, handleDataChanged)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    intervalId = window.setInterval(refreshWhenVisible, intervalMs)
  })

  onUnmounted(() => {
    window.removeEventListener('focus', refreshWhenVisible)
    window.removeEventListener(STUDENT_DATA_CHANGED_EVENT, handleDataChanged)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (intervalId) window.clearInterval(intervalId)
  })

  return { refresh }
}
