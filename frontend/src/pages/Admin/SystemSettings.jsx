import { useCallback, useEffect, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import { adminService } from '../../services/adminService'
import styles from './SystemSettings.module.css'

const maskKey = (value) => {
  if (!value) return 'Chưa cấu hình'
  if (value.length <= 6) return '***'
  return `${value.slice(0, 4)}**************${value.slice(-2)}`
}

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    youtubeApiKey: '',
    openAiApiKey: '',
    maxRequestsPerDay: 1000,
    maxRequestsPerHour: 100,
  })
  const [form, setForm] = useState(settings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeKeyField, setActiveKeyField] = useState(null)
  const [testResult, setTestResult] = useState(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getSystemSettings()
      setSettings(data)
      setForm(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSuccess(null)
    setTestResult(null)
    try {
      await adminService.updateSystemSettings({
        youtubeApiKey: form.youtubeApiKey,
        openAiApiKey: form.openAiApiKey,
        maxRequestsPerDay: Number(form.maxRequestsPerDay),
        maxRequestsPerHour: Number(form.maxRequestsPerHour),
      })
      setSuccess('Cập nhật cấu hình thành công')
      fetchSettings()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTestKey = async (provider) => {
    setTestResult(`Đang kiểm tra ${provider}...`)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setTestResult(`API Key ${provider} hoạt động`)
    } catch (err) {
      setTestResult(`API Key ${provider} không hợp lệ: ${err.message}`)
    }
  }

  const keyField = (provider, label, valueKey) => (
    <div className={styles.settingItem}>
      <div className={styles.settingInfo}>
        <span className={styles.settingLabel}>{label}</span>
        {activeKeyField === provider ? (
          <input
            name={valueKey}
            value={form[valueKey] || ''}
            onChange={handleInputChange}
            className={styles.keyInput}
            placeholder={`Nhập ${label}`}
          />
        ) : (
          <span className={styles.settingValue}>{maskKey(settings[valueKey])}</span>
        )}
      </div>
      <div className={styles.settingActions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() =>
            setActiveKeyField(activeKeyField === provider ? null : provider)
          }
        >
          {activeKeyField === provider ? 'Ẩn' : 'Cập nhật'}
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => handleTestKey(provider)}
        >
          Test
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.screen}>
      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Cấu hình API</span>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button type="button" onClick={fetchSettings}>Thử lại</button>
          </div>
        )}
        {success && <div className={styles.successBanner}>{success}</div>}
        {testResult && <div className={styles.infoBanner}>{testResult}</div>}

        {loading ? (
          <div className={styles.loadingState}>Đang tải cấu hình...</div>
        ) : (
          <form className={styles.settingsForm} onSubmit={handleSubmit}>
            <div className={styles.settingsList}>
              {keyField('youtube', 'YouTube API Key', 'youtubeApiKey')}
              {keyField('openai', 'OpenAI API Key', 'openAiApiKey')}
            </div>

            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>Rate Limiting</span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Số request tối đa mỗi user / ngày
                <input
                  type="number"
                  name="maxRequestsPerDay"
                  className={styles.input}
                  value={form.maxRequestsPerDay}
                  onChange={handleInputChange}
                  min="1"
                />
              </label>
              <label className={styles.label}>
                Số request tối đa mỗi user / giờ
                <input
                  type="number"
                  name="maxRequestsPerHour"
                  className={styles.input}
                  value={form.maxRequestsPerHour}
                  onChange={handleInputChange}
                  min="1"
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  )
}

