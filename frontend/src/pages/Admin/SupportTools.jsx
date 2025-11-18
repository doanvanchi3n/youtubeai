import Panel from '../../components/Panel/Panel.jsx'
import searchIcon from '../../assets/icons/search.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import styles from './SupportTools.module.css'

export default function SupportTools() {
  return (
    <div className={styles.screen}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.tabActive}`}>Tickets</button>
        <button className={styles.tab}>Logs</button>
      </div>

      <Panel variant="light" className={styles.searchPanel}>
        <div className={styles.searchInput}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input 
            placeholder="Tìm kiếm tickets, logs..." 
            className={styles.searchField} 
          />
        </div>
      </Panel>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Support Tickets</span>
          </div>
          
          <div className={styles.ticketList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.ticketItem}>
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketInfo}>
                    <span className={styles.ticketId}>#T{4000 + i}</span>
                    <span className={styles.ticketTitle}>Vấn đề về phân tích kênh</span>
                  </div>
                  <span className={`${styles.ticketStatus} ${styles.statusOpen}`}>
                    Mở
                  </span>
                </div>
                <div className={styles.ticketMeta}>
                  <span>User{i + 1}</span>
                  <span>•</span>
                  <span>2 giờ trước</span>
                </div>
                <div className={styles.ticketActions}>
                  <button className={styles.actionBtn}>Xem</button>
                  <button className={styles.actionBtn}>Phản Hồi</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>System Logs</span>
          </div>
          
          <div className={styles.logTabs}>
            <button className={`${styles.logTab} ${styles.logTabActive}`}>Backend</button>
            <button className={styles.logTab}>AI Module</button>
            <button className={styles.logTab}>YouTube API</button>
          </div>

          <div className={styles.logContainer}>
            <div className={styles.logItem}>
              <span className={styles.logLevel}>ERROR</span>
              <span className={styles.logMessage}>Failed to fetch YouTube data: Rate limit exceeded</span>
              <span className={styles.logTime}>14:30:25</span>
            </div>
            <div className={styles.logItem}>
              <span className={styles.logLevel}>INFO</span>
              <span className={styles.logMessage}>User login successful</span>
              <span className={styles.logTime}>14:28:10</span>
            </div>
            <div className={styles.logItem}>
              <span className={styles.logLevel}>WARN</span>
              <span className={styles.logMessage}>AI model response time &gt; 5s</span>
              <span className={styles.logTime}>14:25:45</span>
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.logItem}>
                <span className={styles.logLevel}>INFO</span>
                <span className={styles.logMessage}>Processing request #{5000 + i}</span>
                <span className={styles.logTime}>14:{String(20 + i).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

