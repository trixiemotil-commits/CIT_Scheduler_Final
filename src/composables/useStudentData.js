import { computed, ref } from 'vue'
import { getToken } from '@/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const sessions = ref([])
const isLoadingSessions = ref(false)
const sessionsError = ref('')

let hasLoadedSessions = false
let inFlightLoad = null

function initialsFor(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] || '?').toUpperCase()
}

function colorForName(name) {
  const palette = ['#e63946', '#3a86ff', '#2d6a4f', '#f4a261', '#9b5de5', '#00a896', '#577590']
  const text = String(name || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }
  return palette[Math.abs(hash) % palette.length]
}

function mapStatusFromApi(status) {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'APPROVED') return 'Approved'
  if (normalized === 'RESCHED') return 'Reschedule'
  if (normalized === 'COMPLETED') return 'Completed'
  if (normalized === 'CANCELLED') return 'Cancelled'
  return 'Pending'
}

function mapStatusToApi(status) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'approved') return 'APPROVED'
  if (normalized === 'reschedule') return 'RESCHED'
  if (normalized === 'completed') return 'COMPLETED'
  if (normalized === 'cancelled') return 'CANCELLED'
  return 'PENDING'
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  if (!token) {
    throw new Error('Session expired. Please log in again.')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  })

  let body = {}
  try {
    body = await response.json()
  } catch (_error) {
    body = {}
  }

  if (!response.ok) {
    throw new Error(body.message || 'Request failed.')
  }

  return body
}

function normalizeDateOnly(isoLike) {
  if (!isoLike) return ''
  const raw = String(isoLike)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function mapRequestToSession(requestDoc, teacherLookup, availabilityLookup) {
  const availabilityMeta = availabilityLookup.get(String(requestDoc.availabilityId || '')) || null
  const fallbackMeta = teacherLookup.get(requestDoc.employeeId) || null
  const teacherMeta = availabilityMeta || fallbackMeta || null

  const teacher = teacherMeta?.name || requestDoc.employeeId || 'Teacher'
  const teacherColor = colorForName(teacher)
  const consultationSlots = Array.isArray(teacherMeta?.consultationSlots) ? teacherMeta.consultationSlots : []
  const matchedSlot = consultationSlots.find((slot) => String(slot.id) === String(requestDoc.availabilityId))
  const subjectList = Array.isArray(teacherMeta?.subjects) ? teacherMeta.subjects.filter(Boolean) : []

  const parsedReason = String(requestDoc.purpose || '')
    .split('\n')
    .find((line) => line.toLowerCase().startsWith('reason:'))
  const parsedDescription = String(requestDoc.purpose || '')
    .split('\n')
    .find((line) => line.toLowerCase().startsWith('description:'))

  return {
    id: requestDoc.id,
    employeeId: requestDoc.employeeId || '',
    ticketNumber: requestDoc.ticketNumber || null,
    subject: requestDoc.subject || 'Consultation',
    teacher,
    teacherInitials: initialsFor(teacher),
    teacherColor,
    status: mapStatusFromApi(requestDoc.status),
    date: normalizeDateOnly(requestDoc.consultationDate || requestDoc.requestDate),
    timeStart: matchedSlot?.startTime || '',
    timeEnd: matchedSlot?.endTime || '',
    time: matchedSlot?.startTime || '--:--',
    duration: '60 min',
    notes: requestDoc.purpose || '',
    consultationNotes: requestDoc.consultationNotes || '',
    reason: parsedReason ? parsedReason.replace(/^reason:\s*/i, '') : null,
    description: parsedDescription ? parsedDescription.replace(/^description:\s*/i, '') : '',
    reviewed: false,
    subjectList: subjectList.length ? subjectList : [requestDoc.subject || 'Consultation'],
    consultationSlots,
    availabilityId: requestDoc.availabilityId,
    queuePosition: Number.isFinite(Number(requestDoc.queuePosition)) ? Number(requestDoc.queuePosition) : null,
    queueTotal: Number.isFinite(Number(requestDoc.queueTotal)) ? Number(requestDoc.queueTotal) : null,
    isNextInQueue: Boolean(requestDoc.isNextInQueue),
  }
}

async function loadSessions(force = false) {
  if (hasLoadedSessions && !force) {
    return sessions.value
  }

  if (inFlightLoad) {
    return inFlightLoad
  }

  inFlightLoad = (async () => {
    isLoadingSessions.value = true
    sessionsError.value = ''

    try {
      const [requestsPayload, teachersPayload] = await Promise.all([
        apiRequest('/consultations/requests'),
        apiRequest('/consultations/teachers').catch(() => ({ teachers: [] })),
      ])

      const teachers = Array.isArray(teachersPayload.teachers) ? teachersPayload.teachers : []
      const teacherLookup = new Map()
      const availabilityLookup = new Map()

      teachers
        .filter((t) => t && t.name)
        .forEach((t) => {
          const meta = {
            name: t.name,
            subjects: Array.isArray(t.subjects) ? t.subjects : [],
            consultationSlots: Array.isArray(t.consultationSlots) ? t.consultationSlots : [],
          }

          if (t.employeeId) {
            teacherLookup.set(t.employeeId, meta)
          }
          teacherLookup.set(t.name, meta)

          meta.consultationSlots.forEach((slot) => {
            if (slot?.id) {
              availabilityLookup.set(String(slot.id), meta)
            }
          })
        })

      const requests = Array.isArray(requestsPayload.requests) ? requestsPayload.requests : []
      sessions.value = requests.map((r) => mapRequestToSession(r, teacherLookup, availabilityLookup))
      hasLoadedSessions = true
      return sessions.value
    } catch (error) {
      sessions.value = []
      sessionsError.value = error.message || 'Failed to load consultation sessions.'
      return sessions.value
    } finally {
      isLoadingSessions.value = false
      inFlightLoad = null
    }
  })()

  return inFlightLoad
}

const stats = computed(() => ({
  approved: sessions.value.filter((s) => s.status === 'Approved').length,
  reschedule: sessions.value.filter((s) => s.status === 'Reschedule').length,
  rejected: sessions.value.filter((s) => s.status === 'Reschedule').length,
  pending: sessions.value.filter((s) => s.status === 'Pending').length,
  completed: sessions.value.filter((s) => s.status === 'Completed').length,
  cancelled: sessions.value.filter((s) => s.status === 'Cancelled').length,
}))

function addSession(teacher, topic, date, time, notes) {
  const localId = `local-${Date.now()}`
  const created = {
    id: localId,
    subject: topic,
    teacher: teacher.name,
    teacherInitials: teacher.initials,
    teacherColor: teacher.color,
    status: 'Pending',
    date,
    time,
    duration: '60 min',
    notes,
    reason: null,
    reviewed: false,
  }
  sessions.value.unshift(created)
  return created
}

async function cancelSession(id) {
  await apiRequest(`/consultations/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'CANCELLED' }),
  })

  const idx = sessions.value.findIndex((s) => s.id === id)
  if (idx !== -1) {
    sessions.value[idx] = { ...sessions.value[idx], status: 'Cancelled' }
  }
}

async function updateSession(id, changes, options = {}) {
  const requireBackend = Boolean(options.requireBackend)
  const shouldUpdateRequestDetails =
    Object.prototype.hasOwnProperty.call(changes || {}, 'subject') ||
    Object.prototype.hasOwnProperty.call(changes || {}, 'availabilityId') ||
    Object.prototype.hasOwnProperty.call(changes || {}, 'notes')

  if (shouldUpdateRequestDetails) {
    try {
      await apiRequest(`/consultations/requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          topic: changes.subject,
          availabilityId: changes.availabilityId,
          notes: changes.notes || '',
        }),
      })
    } catch (error) {
      if (requireBackend) {
        throw error
      }
    }
  }

  if (changes && Object.prototype.hasOwnProperty.call(changes, 'status')) {
    const apiStatus = mapStatusToApi(changes.status)
    try {
      await apiRequest(`/consultations/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: apiStatus }),
      })
    } catch (error) {
      if (requireBackend) {
        throw error
      }
    }
  }

  const idx = sessions.value.findIndex((s) => s.id === id)
  if (idx !== -1) {
    sessions.value[idx] = { ...sessions.value[idx], ...changes }
  }
}

export function useStudentData() {
  if (!hasLoadedSessions && !inFlightLoad) {
    loadSessions().catch(() => {})
  }

  return {
    sessions,
    stats,
    isLoadingSessions,
    sessionsError,
    loadSessions,
    addSession,
    cancelSession,
    updateSession,
  }
}
