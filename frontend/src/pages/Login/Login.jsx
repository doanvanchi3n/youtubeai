import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import shieldIcon from '../../assets/icons/shield-account-outline.svg'
import googleIcon from '../../assets/icons/google.png'
import styles from './Login.module.css'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { login, register, googleLogin } = useAuth()
  const navigate = useNavigate()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateLogin = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email không được để trống'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegister = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Tên người dùng không được để trống'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email không được để trống'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    if (isLogin) {
      if (!validateLogin()) return
    } else {
      if (!validateRegister()) return
    }
    
    setLoading(true)
    try {
      let response
      if (isLogin) {
        response = await login(formData.email, formData.password)
      } else {
        response = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      }
      
      // Remember me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      
      // Redirect based on role
      if (response.user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Có lỗi xảy ra' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setErrors({})
    
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      
      if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
        setErrors({ submit: 'Google Client ID chưa được cấu hình. Vui lòng liên hệ admin.' })
        setLoading(false)
        return
      }
      
      // Load Google Identity Services
      if (!window.google) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://accounts.google.com/gsi/client'
          script.async = true
          script.defer = true
          script.onload = () => {
            // Wait a bit for Google to be ready
            setTimeout(resolve, 100)
          }
          script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
          document.head.appendChild(script)
        })
      }
      
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      
      // Try to show One Tap, fallback to button if needed
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Show button as fallback
          const buttonDiv = document.getElementById('google-signin-button')
          if (buttonDiv) {
            window.google.accounts.id.renderButton(buttonDiv, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: isLogin ? 'signin_with' : 'signup_with',
            })
          }
        }
      })
    } catch (error) {
      console.error('Google Auth Error:', error)
      setErrors({ submit: 'Không thể tải Google Sign-In. Vui lòng kiểm tra kết nối mạng và thử lại.' })
      setLoading(false)
    }
  }

  const handleGoogleCallback = async (response) => {
    if (!response || !response.credential) {
      setErrors({ submit: 'Không nhận được token từ Google. Vui lòng thử lại.' })
      setLoading(false)
      return
    }
    
    try {
      const result = await googleLogin(response.credential)
      
      if (result && result.user) {
        if (result.user.role === 'ADMIN') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        throw new Error('Không nhận được thông tin user từ server')
      }
    } catch (error) {
      console.error('Google Callback Error:', error)
      setErrors({ submit: error.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.' })
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <img src={shieldIcon} alt="" className={styles.icon} />
          </div>
          <h2 className={styles.title}>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
          <div className={styles.subtitle}>
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}
          </div>
        </div>

        {errors.submit && (
          <div className={styles.errorMessage}>{errors.submit}</div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label className={styles.label}>Tên người dùng</label>
              <input
                name="username"
                className={styles.input}
                placeholder="Nhập tên người dùng"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
              />
              {errors.username && <span className={styles.errorText}>{errors.username}</span>}
            </>
          )}
          
          <label className={styles.label}>Email</label>
          <input
            name="email"
            className={styles.input}
            placeholder="ten@email.com"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          
          <label className={styles.label}>Mật khẩu</label>
          <input
            name="password"
            className={styles.input}
            placeholder="Nhập mật khẩu"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
          />
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          
          {!isLogin && (
            <>
              <label className={styles.label}>Xác nhận mật khẩu</label>
              <input
                name="confirmPassword"
                className={styles.input}
                placeholder="Nhập lại mật khẩu"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
            </>
          )}
          
          {isLogin && (
            <div className={styles.checkboxContainer}>
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className={styles.checkboxLabel}>
                Ghi nhớ đăng nhập
              </label>
            </div>
          )}
          
          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>
        </form>
        
        <div className={styles.divider} />
        
        <div id="google-signin-button" style={{ width: '100%', marginBottom: '12px' }}></div>
        
        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <img src={googleIcon} alt="Google" className={styles.googleIcon} />
          {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập với Google' : 'Đăng ký với Google')}
        </button>
        
        <div className={styles.footer}>
          {isLogin ? (
            <>
              Chưa có tài khoản?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setIsLogin(false)
                  setErrors({})
                  setFormData({ username: '', email: '', password: '', confirmPassword: '' })
                }}
                className={styles.link}
              >
                Đăng ký ngay
              </a>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setIsLogin(true)
                  setErrors({})
                  setFormData({ username: '', email: '', password: '', confirmPassword: '' })
                }}
                className={styles.link}
              >
                Đăng nhập ngay
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
