import { supabase } from './supabaseClient'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

async function getAccessToken() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message || 'Failed to read session')
  return session?.access_token ?? null
}

function parseResponseBody(text) {
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Not authenticated. Please sign in again.')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = parseResponseBody(await response.text())

  if (!response.ok || payload.success === false) {
    throw new Error(
      payload.message ||
      payload.error ||
      `Request failed (${response.status})`
    )
  }

  return payload.data
}

export const complaintsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/api/v1/complaints${qs ? `?${qs}` : ''}`)
  },
  get: (id) => apiRequest(`/api/v1/complaints/${id}`),
  track: (number) => apiRequest(`/api/v1/complaints/track/${encodeURIComponent(number)}`),
  create: (data) => apiRequest('/api/v1/complaints', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/v1/complaints/${id}`, { method: 'PATCH', body: data }),
  addReply: (id, message) =>
    apiRequest(`/api/v1/complaints/${id}/replies`, { method: 'POST', body: { message } }),
  notifications: () => apiRequest('/api/v1/complaints/notifications'),
}
