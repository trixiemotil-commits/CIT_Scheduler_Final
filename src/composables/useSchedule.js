import { reactive, ref } from 'vue'

/**
 * Shared schedule entries — singleton reactive object so both
 * ScheduleView and NewScheduleWeekView read/write the same state.
 * Key format: `${year}|${section}|${timeIn} - ${timeOut}|${day}`
 */
export const entries = reactive({
})

export const years    = ['1st Year', '2nd Year', '3rd Year', '4th Year']
export const sections = ['South 1', 'South 2', 'South 3', 'South 4', 'South 5', 'South 6', 'South 7']
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

export const teacherOptions = ref([])

export const subjectOptions = [
  'ITE 300 | Object Oriented Programming',
  'ITE 367 | Managing IT Resources',
  'ITE 383 | Elective 4: Network Security',
  'GEN 008 | Living in the IT Era',
  'ITE 048 | Discrete Structures',
  'ITE 186 | Computer Programming 2',
  'ITE 399 | Human Computer Interaction 1',
  'ITE 308 | Web Systems and Technologies',
  'ITE 380 | Human Computer Interaction 2',
  'ITE 393 | Application Development and Emerging Technologies',
  'ITE 400 | Systems Integration and Architecture',
  'BAM 286 | Applied Analytics',
  'ITE 235 | Elective 2: Game Development',
  'ITE 240 | DIGITAL ARTS 3D Animation',
  'ITE 293 | Systems Administration and Maintenance',
  'ITE 309 | Capstone Project and Research 1',
  'ITE 370 | Information Assurance and Security 2',
  'ITE 382 | IT Elective 3: Intelligent Systems',
  'ITE 384 | Computer Forensics',
  'ITE 385 | Ethical Hacking',
  'ITE 386 | Cloud Computing',
  'ITE 392 | Script Writing and Story Board Design',
  'ITE 401 | Platform Technologies',
  'ITE 311 | IT Practicum',
]

export const roomOptions = [
  '201', '202', '204', '205', '208', '209',
  '301', '302', '303', '304', '305', '306', '307', '308', '309',
  '401', '402', '403', '404', '405',
  '406 (Comlab 1)', '407 (Comlab 2)', '408 (Comlab 3)', '409 (Comlab 4)',
]

export function colorForRoom(room) {
  if (!room) return null
  return /(\b406\b|\b407\b|\b408\b|\b409\b|comlab|\bcl\b)/i.test(room)
    ? 'color-green'
    : 'color-yellow'
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
