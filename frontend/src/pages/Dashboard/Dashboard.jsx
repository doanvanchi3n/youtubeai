import Panel from '../../components/Panel/Panel.jsx'
import likeIco from '../../assets/icons/bx-like.svg'
import commentIco from '../../assets/icons/comment-multiple-outline.svg'
import viewIco from '../../assets/icons/preview-open.svg'
import videoIco from '../../assets/icons/listvideo.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import searchIcon from '../../assets/icons/search.svg'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.searchPanel}>
        <div className={styles.searchInput}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input placeholder="Enter URL" className={styles.searchField} />
        </div>
      </Panel>

      <div className={styles.metricsRow}>
        <div className={styles.statCard}>
          <img src={likeIco} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>1,000,000</strong>
          <span className={styles.statLabel}>Total Likes</span>
        </div>
        <div className={styles.statCard}>
          <img src={commentIco} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>1,000,000</strong>
          <span className={styles.statLabel}>Total Comments</span>
        </div>
        <div className={styles.statCard}>
          <img src={videoIco} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>1,000,000</strong>
          <span className={styles.statLabel}>Videos</span>
        </div>
        <div className={styles.statCard}>
          <img src={viewIco} alt="" className={styles.statIcon} />
          <strong className={styles.statValue}>1,000,000</strong>
          <span className={styles.statLabel}>Views</span>
        </div>
      </div>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Views, Likes & Comments Over Time (biểu đồ đường)</span>
        </div>
        <div className={styles.chartPlaceholder} />
      </Panel>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Top 5 Most Engaging Videos</span>
          </div>
          <div className={styles.videoList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.videoItem}>
                <div className={styles.videoThumb} />
                <div className={styles.videoInfo}>
                  <div className={styles.videoTitle}>[Video Title One - short title...]</div>
                  <div className={styles.videoMeta}>
                    <span><img src={likeIco} alt="" /> 12K</span>
                    <span><img src={viewIco} alt="" /> 1.2K</span>
                    <span><img src={commentIco} alt="" /> 180</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Sentiment Analysis of Comments (biểu đồ tròn)</span>
          </div>
          <div className={styles.chartPlaceholder} style={{ minHeight: 280 }} />
        </Panel>
      </div>
    </div>
  )
}
