const API_BASE_URL = 'http://localhost:8080/api'

export const buildQueryString = (params = {}) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (!entries.length) {
    return ''
  }
  const searchParams = new URLSearchParams()
  entries.forEach(([key, value]) => searchParams.append(key, value))
  return `?${searchParams.toString()}`
}

export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Vui lòng đăng nhập lại để tiếp tục')
  }

  const isFormData = options.body instanceof FormData
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  }

  if (!isFormData && options.body && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  } else if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    body: options.body,
    headers
  })

  let data = null
  if (response.status !== 204) {
    const text = await response.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch (error) {
        data = null
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    const message = data?.message || data?.error || `Lỗi ${response.status}: Không thể hoàn thành yêu cầu`
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      data
    })
    throw new Error(message)
  }

  return data
}

export const apiClient = {
  authFetch,
  buildQueryString,
}

export { API_BASE_URL }

