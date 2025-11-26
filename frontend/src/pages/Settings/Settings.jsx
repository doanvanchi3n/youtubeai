import { useCallback, useEffect, useRef, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import Toast from '../../components/Toast/Toast.jsx'
import styles from './Settings.module.css'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

const passwordInitialState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

export default function Settings() {
  const { updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ username: '', email: '' })
  const [passwordForm, setPasswordForm] = useState(passwordInitialState)
  const [preferences, setPreferences] = useState({ darkMode: true, language: 'vi' })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [status, setStatus] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const statusTimerRef = useRef(null)

  const showStatus = useCallback((type, message) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current)
    }
    setStatus({ type, message })
    statusTimerRef.current = setTimeout(() => setStatus(null), 4000)
  }, [])

  const syncProfile = useCallback((data) => {
    setProfile(data)
    setForm({
      username: data.username || '',
      email: data.email || ''
    })
    setPreferences({
      darkMode: data.darkMode ?? true,
      language: data.language || 'vi'
    })
    setAvatarPreview(data.avatarUrl || '')
    if (updateUser) {
      updateUser({
        id: data.id,
        username: data.username,
        email: data.email,
        avatarUrl: data.avatarUrl,
        role: data.role
      })
    }
  }, [updateUser])

  useEffect(() => {
    let isMounted = true
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile()
        if (isMounted) {
          syncProfile(data)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        if (isMounted) {
          const errorMessage = error.message || 'Không thể tải thông tin tài khoản'
          showStatus('error', errorMessage)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchProfile()
    return () => {
      isMounted = false
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [reloadKey, showStatus, syncProfile])

  const handleRetry = () => {
    setLoading(true)
    setStatus(null)
    setReloadKey((prev) => prev + 1)
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async () => {
    setSavingProfile(true)
    try {
      const updated = await userService.updateProfile(form)
      syncProfile(updated)
      showStatus('success', 'Đã lưu thông tin tài khoản')
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showStatus('error', 'Mật khẩu xác nhận không khớp')
      return
    }
    setSavingPassword(true)
    try {
      await userService.updatePassword(passwordForm)
      setPasswordForm(passwordInitialState)
      showStatus('success', 'Đã cập nhật mật khẩu')
    } catch (error) {
      showStatus('error', error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const updatePreference = async (patch) => {
    const previous = preferences
    const optimistic = { ...preferences, ...patch }
    setPreferences(optimistic)
    setSavingPreferences(true)
    try {
      const updated = await userService.updatePreferences(optimistic)
      syncProfile(updated)
      showStatus('success', 'Đã cập nhật cài đặt hiển thị')
    } catch (error) {
      setPreferences(previous)
      showStatus('error', error.message)
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showStatus('error', 'Vui lòng chọn file ảnh hợp lệ')
      return
    }
    
    const previousPreview = avatarPreview
    const tempUrl = URL.createObjectURL(file)
    setAvatarPreview(tempUrl)
    setAvatarUploading(true)
    
    try {
      const updated = await userService.updateAvatar(file)
      // Revoke temp URL và set URL từ server
      URL.revokeObjectURL(tempUrl)
      
      // Đảm bảo avatarUrl từ server được sử dụng
      const avatarUrl = updated.avatarUrl || ''
      setAvatarPreview(avatarUrl)
      syncProfile(updated)
      showStatus('success', 'Đã cập nhật ảnh đại diện')
    } catch (error) {
      // Nếu lỗi, revert về preview cũ
      URL.revokeObjectURL(tempUrl)
      setAvatarPreview(previousPreview)
      showStatus('error', error.message)
    } finally {
      setAvatarUploading(false)
      // Reset input để có thể chọn lại cùng file
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.loading}>
        <p>Không thể tải thông tin tài khoản.</p>
        <button type="button" className={styles.retryBtn} onClick={handleRetry}>
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {status && (
        <Toast
          message={status.message}
          type={status.type}
          onClose={() => setStatus(null)}
          duration={4000}
        />
      )}

      <Panel variant="light" className={styles.panel}>
        <h2 className={styles.sectionTitle}>Quản lý tài khoản</h2>
        <div className={styles.accountSection}>
          <div className={styles.avatarWrapper}>
            <div
              className={styles.avatar}
              style={
                avatarPreview
                  ? {
                      backgroundImage: `url(${avatarPreview.startsWith('http') ? avatarPreview : `http://localhost:8080${avatarPreview}`})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }
                  : undefined
              }
            />
            <label className={styles.editAvatarBtn}>
              {avatarUploading
                ? 'Đang cập nhật...'
                : avatarPreview
                  ? 'Đổi ảnh'
                  : 'Thêm avatar'}
              <input
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
          </div>
          <div className={styles.accountInfo}>
            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Tên người dùng</label>
              <input
                type="text"
                name="username"
                className={styles.infoInput}
                value={form.username}
                onChange={handleProfileChange}
                placeholder="Nhập tên người dùng"
              />
            </div>
            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Email</label>
              <input
                type="email"
                name="email"
                className={styles.infoInput}
                value={form.email}
                onChange={handleProfileChange}
                placeholder="Nhập email"
              />
            </div>

            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleProfileSubmit}
              disabled={savingProfile}
            >
              {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>

            <div className={styles.passwordSection}>
              <h3 className={styles.subTitle}>Đổi mật khẩu</h3>
              <div className={styles.passwordGrid}>
                <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className={styles.infoInput}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Mật khẩu mới</label>
              <input
                type="password"
                    name="newPassword"
                className={styles.infoInput}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
                <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={styles.infoInput}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handlePasswordSubmit}
                disabled={savingPassword}
              >
                {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel variant="light" className={styles.panel}>
        <h2 className={styles.sectionTitle}>Cài đặt</h2>
        <div className={styles.card}>
          <div>
          <span className={styles.label}>Sáng và tối</span>
            <p className={styles.cardHint}>Áp dụng ngay cho toàn bộ giao diện</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.darkMode}
              onChange={(e) => updatePreference({ darkMode: e.target.checked })}
              disabled={savingPreferences}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </Panel>

      <Panel variant="light" className={styles.panel}>
        <div className={styles.card}>
          <div>
          <span className={styles.label}>Tiếng Anh và Tiếng Việt</span>
            <p className={styles.cardHint}>Tắt: Tiếng Việt, Bật: Tiếng Anh</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.language === 'en'}
              onChange={(e) => updatePreference({ language: e.target.checked ? 'en' : 'vi' })}
              disabled={savingPreferences}
            />
            <span className={styles.slider} />
          </label>
        </div>
        {savingPreferences && (
          <p className={styles.toggleHint}>Đang lưu cài đặt hiển thị...</p>
        )}
      </Panel>
    </div>
  )
}
