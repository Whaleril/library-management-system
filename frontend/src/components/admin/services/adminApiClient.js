const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

function buildQuery(query = {}) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const result = params.toString()
  return result ? `?${result}` : ''
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  let result = null
  try {
    result = await response.json()
  } catch {
    result = { code: response.status, message: '响应解析失败', data: null }
  }

  if (!response.ok || result.code !== 200) {
    const message = result?.message || `请求失败(${response.status})`
    const error = new Error(message)
    error.code = result?.code || response.status
    error.data = result?.data || null
    throw error
  }

  return result.data
}

export function adminGet(path, query) {
  return request(`${path}${buildQuery(query)}`)
}

export function adminPost(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  })
}

export function adminPut(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body || {}),
  })
}

export function adminDelete(path) {
  return request(path, { method: 'DELETE' })
}
