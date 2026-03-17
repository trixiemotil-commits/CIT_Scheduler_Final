import { reactive } from 'vue'

/**
 * Shared schedule entries — singleton reactive object so both
 * ScheduleView and NewScheduleWeekView read/write the same state.
 * Key format: `${year}|${section}|${timeIn} - ${timeOut}|${day}`
 */
export const entries = reactive({
})

export const years    = ['1st Year', '2nd Year', '3rd Year', '4th Year']
export const sections = ['Section 1', 'Section 2', 'Section 3', 'Section 4']
export const days     = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const timeSlots = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM',
]

export const timeOptions = [
  '7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM',
  '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM',
  '4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM',
]

export const teacherOptions = [
  'Prof. Jhon', 'Prof. Balong', 'Prof. Aira', 'Prof. Gab',
  'Prof. Daniella', 'Prof. Jolo', 'Prof. Aj',
]

export const subjectOptions = [
  'Data Structures', 'Networking', 'Operating Systems', 'Database Management',
  'Web Development', 'Software Engineering', 'Algorithms', 'Computer Architecture',
  'Discrete Mathematics', 'Programming 1', 'Programming 2',
]

export const roomOptions = [
  'Cl.1', 'Cl.2', 'Cl.3', 'Cl.4',
  'Room 401', 'Room 402', 'Room 403', 'Room 404',
  'Room 405', 'Room 406', 'Room 407', 'Room 408',
]

export function colorForRoom(room) {
  if (!room) return null
  return room.startsWith('Cl.') ? 'color-green' : 'color-yellow'
}

/** Convert "7:00 AM" or "1:30 PM" → total minutes since midnight */
export function parseTime(t) {
  if (!t) return 0
  const parts = t.trim().split(' ')
  const period = parts[1]
  let [h, m] = parts[0].split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + m
}

/** How many 1-hour rows this entry should span based on start offset and duration */
export function getRowspan(entry) {
  if (!entry || !entry.timeIn || !entry.timeOut) return 1
  const start = parseTime(entry.timeIn)
  const end = parseTime(entry.timeOut)
  const duration = Math.max(1, end - start)
  const startOffset = start % 60
  return Math.max(1, Math.ceil((startOffset + duration) / 60))
}
