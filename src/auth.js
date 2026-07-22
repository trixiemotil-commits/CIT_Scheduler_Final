const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function saveSession({ token, user }) {
  localStorage.setItem('cit_token', token)
  localStorage.setItem('cit_user', JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem('cit_token')
  localStorage.removeItem('cit_user')
}

function getRoles(user) {
  return Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role].filter(Boolean)
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
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

export async function login(email, password, recaptchaToken = null) {
  const body = { email, password }
  if (recaptchaToken) body.recaptchaToken = recaptchaToken

  const payload = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  })

  saveSession(payload)
  return payload
}

export async function selectRole(role) {
  const payload = await request('/auth/select-role', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ role })
  })
  saveSession(payload)
  return payload.user
}

export async function register(signUpPayload) {
  const payload = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(signUpPayload)
  })

  if (payload.token && payload.user) {
    saveSession(payload)
  }
  return payload.user.role
}

export async function requestPasswordReset(email) {
  return request('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}

export async function resetPassword({ email, otp, newPassword }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword })
  })
}

export function logout() {
  clearSession()
}

export function getUser() {
  const raw = localStorage.getItem('cit_user')
  return raw ? JSON.parse(raw) : null
}

export function saveMergedUser(freshUser) {
  const currentUser = getUser()
  const roles = getRoles(freshUser)
  const currentRole = String(currentUser?.role || '').toLowerCase()
  const roleExists = roles.map(role => String(role).toLowerCase()).includes(currentRole)
  const mergedUser = {
    ...freshUser,
    role: roleExists ? currentRole : freshUser.role,
    roles,
  }

  localStorage.setItem('cit_user', JSON.stringify(mergedUser))
  return mergedUser
}

export function setActiveRole(role) {
  const user = getUser()
  const requestedRole = String(role || '').toLowerCase()
  const roles = getRoles(user)
  const canUseRole = roles.map(item => String(item).toLowerCase()).includes(requestedRole)

  if (!user || !requestedRole || !canUseRole) return user

  const updatedUser = { ...user, role: requestedRole, roles }
  localStorage.setItem('cit_user', JSON.stringify(updatedUser))
  return updatedUser
}

export function getToken() {
  return localStorage.getItem('cit_token')
}

export function isLoggedIn() {
  return !!getToken() && !!getUser()
}
