const API_BASE_URL = 'http://localhost:8080/api'

export const authService = {
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password
      })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Đăng ký thất bại' }))
      throw new Error(error.message || 'Đăng ký thất bại')
    }
    
    return await response.json()
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Đăng nhập thất bại' }))
      throw new Error(error.message || 'Email hoặc mật khẩu không đúng')
    }
    
    return await response.json()
  },

  async googleAuth(token) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Đăng nhập Google thất bại' }))
      throw new Error(error.message || 'Đăng nhập Google thất bại')
    }
    
    return await response.json()
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No token found')
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to get current user')
    }
    
    return await response.json()
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      }
    })
    
    return response.ok
  }
}

