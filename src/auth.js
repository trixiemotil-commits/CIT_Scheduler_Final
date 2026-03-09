// Simple hardcoded auth store using localStorage

export const ADMIN_ACCOUNT = {
  email: 'admin@gmail.com',
  password: 'Admin@1234',
  name: 'Admin Portal',
  role: 'admin',
  avatar: null
}

export const TEACHER_ACCOUNT = {
  email: 'teacher@gmail.com',
  password: 'Teacher@1234',
  name: 'Teachers Portal',
  role: 'teacher',
  avatar: 'https://i.pravatar.cc/100?img=47'
}

export const STUDENT_ACCOUNT = {
  email: 'student@gmail.com',
  password: 'Student@1234',
  name: 'Student Portal',
  role: 'student',
  avatar: null
}

// Returns 'admin' | 'teacher' | null
export function login(email, password) {
  if (email === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password) {
    localStorage.setItem('cit_user', JSON.stringify({ email, name: ADMIN_ACCOUNT.name, role: 'admin' }))
    return 'admin'
  }
  if (email === TEACHER_ACCOUNT.email && password === TEACHER_ACCOUNT.password) {
    localStorage.setItem('cit_user', JSON.stringify({ email, name: TEACHER_ACCOUNT.name, role: 'teacher', avatar: TEACHER_ACCOUNT.avatar }))
    return 'teacher'
  }
  if (email === STUDENT_ACCOUNT.email && password === STUDENT_ACCOUNT.password) {
    localStorage.setItem('cit_user', JSON.stringify({ email, name: STUDENT_ACCOUNT.name, role: 'student', avatar: null }))
    return 'student'
  }
  return null
}

export function logout() {
  localStorage.removeItem('cit_user')
}

export function getUser() {
  const raw = localStorage.getItem('cit_user')
  return raw ? JSON.parse(raw) : null
}

export function isLoggedIn() {
  return !!getUser()
}
