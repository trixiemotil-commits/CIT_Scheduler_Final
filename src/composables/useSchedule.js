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

const requiredSubjects = [
  ['1st Year', '1st Semester', 'ITE 366 | Introduction to Computing (Including IT Fundamentals)'],
  ['1st Year', '1st Semester', 'ITE 260 | Computer Programming 1 (LEC & LAB)'],
  ['1st Year', '1st Semester', 'GEN 002 | Understanding the Self'],
  ['1st Year', '1st Semester', 'MAT 152 | Mathematics in the Modern World'],
  ['1st Year', '1st Semester', 'GEN 001 | Purposive Communication'],
  ['1st Year', '1st Semester', 'GEN 006 | Ethics'],
  ['1st Year', '1st Semester', 'PED 030 | Movement Enhancement / Movement Competency'],
  ['1st Year', '1st Semester', 'NST 021 | National Service Training Program 1'],
  ['1st Year', '2nd Semester', 'ITE 186 | Computer Programming 2'],
  ['1st Year', '2nd Semester', 'ITE 399 | Human Computer Interaction 1 (LEC & LAB)'],
  ['1st Year', '2nd Semester', 'ITE 048 | Discrete Structures'],
  ['1st Year', '2nd Semester', 'GEN 008 | Living in the IT Era'],
  ['1st Year', '2nd Semester', 'ART 002 | Art Appreciation'],
  ['1st Year', '2nd Semester', 'GEN 005 | The Contemporary World'],
  ['1st Year', '2nd Semester', 'PED 031 | Fitness Exercise / Exercise-based Fitness Activity'],
  ['1st Year', '2nd Semester', 'NST 022 | National Service Training Program 2'],
  ['2nd Year', '1st Semester', 'ITE 298 | Information Management (Including Fundamentals)'],
  ['2nd Year', '1st Semester', 'ITE 300 | Object-Oriented Programming'],
  ['2nd Year', '1st Semester', 'ITE 292 | Networking 1'],
  ['2nd Year', '1st Semester', 'ITE 031 | Data Structures and Algorithms'],
  ['2nd Year', '1st Semester', 'ITE 083 | IT Project Management'],
  ['2nd Year', '1st Semester', 'HIS 007 | Life and Works of Rizal'],
  ['2nd Year', '1st Semester', 'PED 032 | Physical Activities Towards Health & Fitness 1'],
  ['2nd Year', '1st Semester', 'SSP 005 | Student Success Program 1'],
  ['2nd Year', '1st Semester', 'GEN 003 | Science, Technology, and Society'],
  ['2nd Year', '2nd Semester', 'ITE 393 | Applications Development and Emerging Technologies'],
  ['2nd Year', '2nd Semester', 'ITE 400 | Systems Integration and Architecture'],
  ['2nd Year', '2nd Semester', 'ITE 308 | Web Systems and Technologies'],
  ['2nd Year', '2nd Semester', 'ITE 380 | Human Computer Interaction 2'],
  ['2nd Year', '2nd Semester', 'GEN 004 | Readings in Philippine History'],
  ['2nd Year', '2nd Semester', 'GEN 009 | The Entrepreneurial Mind'],
  ['2nd Year', '2nd Semester', "GEN 013 | People and the Earth's Ecosystems"],
  ['2nd Year', '2nd Semester', 'PED 033 | Physical Activities Towards Health & Fitness 2'],
  ['2nd Year', '2nd Semester', 'SSP 006 | Student Success Program 2'],
  ['3rd Year', '1st Semester', 'ITE 359 | Networking 2 (LEC & LAB)'],
  ['3rd Year', '1st Semester', 'ITE 302 | Information Assurance and Security 1 (LEC & LAB)'],
  ['3rd Year', '1st Semester', 'ITE 353 | Data Scalability & Analytics'],
  ['3rd Year', '1st Semester', 'ITE 307 | Quantitative Methods (LEC & LAB)'],
  ['3rd Year', '1st Semester', 'ITE 314 | Advanced Database Systems'],
  ['3rd Year', '1st Semester', 'SSP 007 | Student Success Program 3'],
  ['3rd Year', '2nd Semester', 'ITE 309 | Capstone Project and Research 1'],
  ['3rd Year', '2nd Semester', 'ITE 293 | Systems Administration and Maintenance (LEC & LAB)'],
  ['3rd Year', '2nd Semester', 'ITE 370 | Information Assurance and Security 2 (LEC & LAB)'],
  ['3rd Year', '2nd Semester', 'ITE 401 | Platform Technologies (LEC & LAB)'],
  ['3rd Year', '2nd Semester', 'SSP 008 | Student Success Program 4'],
  ['4th Year', '1st Semester', 'ITE 310 | Capstone Project and Research 2'],
  ['4th Year', '1st Semester', 'ITE 381 | IT Business Solutions'],
  ['4th Year', '1st Semester', 'ITE 367 | Managing IT Resources (Including Social & Professional Issues)'],
  ['4th Year', '2nd Semester', 'ITE 311 | IT Practicum'],
].map(([year, semester, label]) => ({ year, semester, label }))

const electiveSubjects = [
  ['BAM 285 | Business Analysis for IT', 'Business Informatics'],
  ['BAM 286 | Applied Analytics in Business for IT', 'Business Informatics'],
  ['ITE 382 | Intelligent Systems', 'Business Informatics'],
  ['ITE 387 | Advanced Programming', 'Systems Development'],
  ['ITE 235 | Game Development', 'Systems Development'],
  ['ITE 386 | Cloud Programming', 'Systems Development'],
  ['ITE 383 | Network Security', 'Computer Security'],
  ['ITE 384 | Computer Forensics', 'Computer Security'],
  ['ITE 385 | Ethical Hacking', 'Computer Security'],
  ['ITE 391 | Freehand and Digital Drawing', 'Digital Arts'],
  ['ITE 239 | Script Writing and Storyboard Design', 'Digital Arts'],
  ['ITE 240 | 3D Animation', 'Digital Arts'],
  ['ITE 388 | Clean-up and In-between', 'Digital Arts'],
].map(([label, major]) => ({ year: 'Elective', semester: 'Elective', label, major }))

export const subjectCatalog = [...requiredSubjects, ...electiveSubjects]
export const subjectOptions = ['Lunch Break', ...subjectCatalog.map(subject => subject.label)]

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

export function colorForRoomType(roomType, room = '') {
  if (roomType === 'Comlab/Laboratory') return 'color-green'
  if (roomType === 'Lecture') return 'color-yellow'
  return colorForRoom(room)
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
