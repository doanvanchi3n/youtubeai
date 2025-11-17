import Panel from '../../components/Panel/Panel.jsx'
import shieldIcon from '../../assets/icons/shield-account-outline.svg'
import listvideoIcon from '../../assets/icons/listvideo.svg'
import previewIcon from '../../assets/icons/preview-open.svg'
import commentIcon from '../../assets/icons/comment-multiple-outline.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  return (
    <div className={styles.screen}>
      <div className={styles.metricsRow}>
        <div className={styles.statCard}>
          <img src={shieldIcon} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>1,234</strong>
          <span className={styles.statLabel}>Tổng Người Dùng</span>
        </div>
        <div className={styles.statCard}>
          <img src={listvideoIcon} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>5,678</strong>
          <span className={styles.statLabel}>Kênh Đã Phân Tích</span>
        </div>
        <div className={styles.statCard}>
          <img src={previewIcon} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>12,345</strong>
          <span className={styles.statLabel}>API Requests Hôm Nay</span>
        </div>
        <div className={styles.statCard}>
          <img src={commentIcon} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>98.5%</strong>
          <span className={styles.statLabel}>Uptime Server</span>
        </div>
      </div>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Trạng Thái Server</span>
          </div>
          <div className={styles.serverStatus}>
            <div className={styles.serverItem}>
              <div className={styles.serverInfo}>
                <span className={styles.serverName}>Backend Server</span>
                <span className={styles.serverUrl}>localhost:8080</span>
              </div>
              <div className={`${styles.statusBadge} ${styles.statusOnline}`}>
                <span className={styles.statusDot}></span>
                Online
              </div>
            </div>
            <div className={styles.serverItem}>
              <div className={styles.serverInfo}>
                <span className={styles.serverName}>AI Module</span>
                <span className={styles.serverUrl}>localhost:5000</span>
              </div>
              <div className={`${styles.statusBadge} ${styles.statusOnline}`}>
                <span className={styles.statusDot}></span>
                Online
              </div>
            </div>
            <div className={styles.serverItem}>
              <div className={styles.serverInfo}>
                <span className={styles.serverName}>Database</span>
                <span className={styles.serverUrl}>MySQL</span>
              </div>
              <div className={`${styles.statusBadge} ${styles.statusOnline}`}>
                <span className={styles.statusDot}></span>
                Connected
              </div>
            </div>
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>API Requests Theo Ngày</span>
          </div>
          <div className={styles.chartPlaceholder} />
        </Panel>
      </div>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Tăng Trưởng Người Dùng</span>
          </div>
          <div className={styles.chartPlaceholder} />
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Log Lỗi Gần Đây</span>
          </div>
          <div className={styles.errorLogs}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.errorItem}>
                <div className={styles.errorInfo}>
                  <span className={styles.errorType}>ERROR</span>
                  <span className={styles.errorMessage}>Failed to fetch YouTube data</span>
                </div>
                <span className={styles.errorTime}>2 giờ trước</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Hoạt Động Gần Đây</span>
        </div>
        <div className={styles.activityList}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.activityItem}>
              <div className={styles.activityIcon}></div>
              <div className={styles.activityContent}>
                <div className={styles.activityText}>
                  <strong>User123</strong> đã phân tích kênh <strong>Channel Name</strong>
                </div>
                <span className={styles.activityTime}>5 phút trước</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

