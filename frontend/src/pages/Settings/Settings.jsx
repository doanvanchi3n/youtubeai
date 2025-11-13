import { useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import styles from './Settings.module.css'

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState(true)

  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.panel}>
        <h2 className={styles.sectionTitle}>Quản lý tài khoản</h2>
        <div className={styles.accountSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar} />
            <button type="button" className={styles.editAvatarBtn}>
              Đổi ảnh
            </button>
          </div>
          <div className={styles.accountInfo}>
            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Tên người dùng</label>
              <input
                type="text"
                className={styles.infoInput}
                defaultValue="Chien"
                placeholder="Nhập tên người dùng"
              />
            </div>
            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Email</label>
              <input
                type="email"
                className={styles.infoInput}
                defaultValue="chien@example.com"
                placeholder="Nhập email"
              />
            </div>
            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Mật khẩu</label>
              <input
                type="password"
                className={styles.infoInput}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <button type="button" className={styles.saveBtn}>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Panel>

      <Panel variant="light" className={styles.panel}>
        <h2 className={styles.sectionTitle}>Cài đặt</h2>
        <div className={styles.card}>
          <span className={styles.label}>Sáng và tối</span>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </Panel>

      <Panel variant="light" className={styles.panel}>
        <div className={styles.card}>
          <span className={styles.label}>Tiếng Anh và Tiếng Việt</span>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={language}
              onChange={(e) => setLanguage(e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </Panel>
    </div>
  )
}
