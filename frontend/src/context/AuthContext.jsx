import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const persistUser = useCallback((userData) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }, [])
  
  const refreshUser = useCallback(async () => {
    const userData = await authService.getCurrentUser()
    persistUser(userData)
    return userData
  }, [persistUser])
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        // Verify token với backend
        verifyToken()
      } catch (error) {
        console.error('Error parsing user data:', error)
        logout()
      }
    } else {
      setLoading(false)
    }
  }, [])
  
  const verifyToken = async () => {
    try {
      await refreshUser()
    } catch (error) {
      // Token invalid, logout
      logout()
    } finally {
      setLoading(false)
    }
  }
  
  const login = async (email, password) => {
    const response = await authService.login(email, password)
    persistUser(response.user)
    localStorage.setItem('token', response.token)
    return response
  }
  
  const register = async (userData) => {
    const response = await authService.register(userData)
    persistUser(response.user)
    localStorage.setItem('token', response.token)
    return response
  }
  
  const googleLogin = async (token) => {
    const response = await authService.googleAuth(token)
    persistUser(response.user)
    localStorage.setItem('token', response.token)
    return response
  }
  
  const logout = () => {
    persistUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    navigate('/login')
  }
  
  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, loading, refreshUser, updateUser: persistUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

