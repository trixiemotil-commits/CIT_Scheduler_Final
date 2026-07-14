const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function saveSession({ token, user }) {
  localStorage.setItem('cit_token', token)
  localStorage.setItem('cit_user', JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem('cit_token')
  localStorage.removeItem('cit_user')
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
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
  return payload.user.role
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

export function getToken() {
  return localStorage.getItem('cit_token')
}

export function isLoggedIn() {
  return !!getToken() && !!getUser()
}
