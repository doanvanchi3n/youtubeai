import Panel from '../../components/Panel/Panel.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import styles from './SystemSettings.module.css'

export default function SystemSettings() {
  return (
    <div className={styles.screen}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.tabActive}`}>API Settings</button>
        <button className={styles.tab}>Logs & Bảo Mật</button>
        <button className={styles.tab}>Backup & Restore</button>
      </div>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Quản Lý API Keys</span>
        </div>
        
        <div className={styles.settingsList}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>YouTube API Key</span>
              <span className={styles.settingValue}>AIzaSy********************</span>
            </div>
            <div className={styles.settingActions}>
              <button className={styles.actionBtn}>Cập Nhật</button>
              <button className={styles.actionBtn}>Test</button>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>OpenAI API Key</span>
              <span className={styles.settingValue}>sk-********************</span>
            </div>
            <div className={styles.settingActions}>
              <button className={styles.actionBtn}>Cập Nhật</button>
              <button className={styles.actionBtn}>Test</button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Rate Limiting</span>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Số request tối đa mỗi user / ngày
            <input 
              type="number" 
              className={styles.input} 
              defaultValue="1000"
              placeholder="1000"
            />
          </label>
          <label className={styles.label}>
            Số request tối đa mỗi user / giờ
            <input 
              type="number" 
              className={styles.input} 
              defaultValue="100"
              placeholder="100"
            />
          </label>
        </div>
        <button className={styles.saveBtn}>Lưu Cấu Hình</button>
      </Panel>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Log Settings</span>
          </div>
          <div className={styles.toggleList}>
            <div className={styles.toggleItem}>
              <span>Ghi log request API</span>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
            <div className={styles.toggleItem}>
              <span>Cảnh báo request bất thường</span>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
            <div className={styles.toggleItem}>
              <span>Ghi log AI processing</span>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Backup & Restore</span>
          </div>
          <div className={styles.backupActions}>
            <button className={styles.backupBtn}>Tạo Backup</button>
            <button className={styles.backupBtn}>Restore từ File</button>
            <div className={styles.backupList}>
              <div className={styles.backupItem}>
                <span>backup_2024-01-15.sql</span>
                <span className={styles.backupSize}>2.5 MB</span>
              </div>
              <div className={styles.backupItem}>
                <span>backup_2024-01-14.sql</span>
                <span className={styles.backupSize}>2.4 MB</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

