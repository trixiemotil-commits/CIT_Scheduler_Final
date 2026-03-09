// Shared reactive store for student sessions (persisted to localStorage)
import { ref, computed } from 'vue'

const STORAGE_KEY = 'cit_student_sessions'

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    { id: 1, subject: 'Math Consultation',  teacher: 'Ms. Lisa Johnson', teacherInitials: 'J', teacherColor: '#e63946', status: 'Approved',  date: '2026-06-12', time: '10:00', duration: '60 min', notes: '', reason: null,    reviewed: false },
    { id: 2, subject: 'Science Review',     teacher: 'Mr. Robert Davis', teacherInitials: 'D', teacherColor: '#3a86ff', status: 'Pending',   date: '2026-06-15', time: '14:00', duration: '90 min', notes: '', reason: null,    reviewed: false },
    { id: 3, subject: 'English Literature', teacher: 'Ms. Sarah Park',   teacherInitials: 'P', teacherColor: '#9b5de5', status: 'Rejected',  date: '2026-06-10', time: '15:00', duration: '60 min', notes: '', reason: 'Teacher unavailable on this date. Please reschedule.', reviewed: false },
    { id: 4, subject: 'History Session',    teacher: 'Mr. Tom Wilson',   teacherInitials: 'W', teacherColor: '#1b4332', status: 'Completed', date: '2026-06-05', time: '13:00', duration: '60 min', notes: '', reason: null,    reviewed: false },
  ]
}

function saveSessions(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

const sessions = ref(loadSessions())
let nextId = sessions.value.reduce((max, s) => Math.max(max, s.id), 0) + 1

const stats = computed(() => ({
  approved:  sessions.value.filter(s => s.status === 'Approved').length,
  rejected:  sessions.value.filter(s => s.status === 'Rejected').length,
  pending:   sessions.value.filter(s => s.status === 'Pending').length,
  completed: sessions.value.filter(s => s.status === 'Completed').length,
}))

function addSession(teacher, topic, date, time, notes) {
  const s = {
    id: nextId++,
    subject: topic,
    teacher: teacher.name,
    teacherInitials: teacher.initials,
    teacherColor: teacher.color,
    status: 'Pending',
    date, time,
    duration: '60 min',
    notes,
    reason: null,
    reviewed: false,
  }
  sessions.value.unshift(s)
  saveSessions(sessions.value)
  return s
}

function cancelSession(id) {
  sessions.value = sessions.value.filter(s => s.id !== id)
  saveSessions(sessions.value)
}

function updateSession(id, changes) {
  const idx = sessions.value.findIndex(s => s.id === id)
  if (idx !== -1) {
    sessions.value[idx] = { ...sessions.value[idx], ...changes }
    saveSessions(sessions.value)
  }
}

export function useStudentData() {
  return { sessions, stats, addSession, cancelSession, updateSession }
}
