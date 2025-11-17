import Panel from '../../components/Panel/Panel.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import robotIcon from '../../assets/icons/robot-excited-outline.svg'
import styles from './AIManagement.module.css'

export default function AIManagement() {
  return (
    <div className={styles.screen}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.tabActive}`}>Mô Hình AI</button>
        <button className={styles.tab}>Training</button>
        <button className={styles.tab}>Từ Khóa Nhạy Cảm</button>
      </div>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Mô Hình Sentiment</span>
          </div>
          <div className={styles.modelList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.modelItem}>
                <div className={styles.modelInfo}>
                  <div className={styles.modelIcon}>
                    <img src={robotIcon} alt="" />
                  </div>
                  <div className={styles.modelDetails}>
                    <span className={styles.modelName}>Sentiment Model v{i + 1}.0</span>
                    <span className={styles.modelMeta}>Accuracy: 92.{i}%</span>
                  </div>
                </div>
                <div className={styles.modelActions}>
                  {i === 0 && (
                    <span className={styles.activeBadge}>Đang Dùng</span>
                  )}
                  <button className={styles.actionBtn}>Upload</button>
                  <button className={styles.actionBtn}>Test</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Mô Hình Emotion</span>
          </div>
          <div className={styles.modelList}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={styles.modelItem}>
                <div className={styles.modelInfo}>
                  <div className={styles.modelIcon}>
                    <img src={robotIcon} alt="" />
                  </div>
                  <div className={styles.modelDetails}>
                    <span className={styles.modelName}>Emotion Model v{i + 1}.0</span>
                    <span className={styles.modelMeta}>Accuracy: 88.{i}%</span>
                  </div>
                </div>
                <div className={styles.modelActions}>
                  {i === 0 && (
                    <span className={styles.activeBadge}>Đang Dùng</span>
                  )}
                  <button className={styles.actionBtn}>Upload</button>
                  <button className={styles.actionBtn}>Test</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Lịch Sử Training</span>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Model Type</th>
                <th>Dataset Size</th>
                <th>Accuracy</th>
                <th>Loss</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td>#{3000 + i}</td>
                  <td>Sentiment</td>
                  <td>10,000 samples</td>
                  <td>92.{i}%</td>
                  <td>0.0{i}</td>
                  <td>2024-01-15 10:30</td>
                  <td>
                    <span className={styles.statusBadge}>Hoàn Thành</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

