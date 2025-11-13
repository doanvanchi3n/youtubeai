import Panel from '../../components/Panel/Panel.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import styles from './CommunityInsights.module.css'

const videoTopics = [
  'Valorant',
  'Liên minh huyền thoại',
  'Vlog du lịch',
  'nhạc lofi chill',
]

const keywords = [
  'làm nhiều về fornite đi anh',
  'Video hay lắm, hay anh làm về các video liên quan đến vlog đi ạ',
  'làm thể loại kinh dị đi ạ',
  'làm thể loại hành động đi ạ',
]

const suggestions = ['Game fortnite', 'Vlog', 'Game kinh dị', 'Hành động']

export default function CommunityInsights() {
  return (
    <div className={styles.screen}>
      <div className={styles.topSection}>
        <div className={styles.column}>
          <Panel variant="light" className={styles.panel}>
            <div className={styles.title}>
              Tổng comment:
            </div>
            <div className={styles.stat}>100,000 comments</div>
          </Panel>

          <Panel variant="light" className={styles.panel}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>Danh sách các chủ đề video</span>
            </div>
            <div className={styles.list}>
              {videoTopics.map((topic) => (
                <div key={topic} className={styles.pill}>
                  {topic}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className={styles.column}>
          <Panel variant="light" className={styles.panel}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>Thống kê từng loại cảm xúc ( biểu đồ tròn của tích cực tiêu cực, trung lập)</span>
            </div>
            <div className={styles.placeholder} />
          </Panel>
        </div>
      </div>

      <div className={styles.middleSection}>
        <Panel variant="light" className={styles.panel}>
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Danh sách từ khoá được nhắc tới nhiều trong bình luận</span>
          </div>
          <div className={styles.list}>
            {keywords.map((keyword, idx) => (
              <div key={idx} className={styles.pill}>
                {keyword}
              </div>
            ))}
          </div>
        </Panel>

        <Panel variant="light" className={styles.panel}>
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Gợi ý chủ đề</span>
          </div>
          <div className={styles.list}>
            {suggestions.map((topic) => (
              <div key={topic} className={styles.pill}>
                {topic}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel variant="light" className={styles.fullWidthPanel}>
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Biểu đồ so sánh tương tác của các chủ đề (biểu đồ cột)</span>
        </div>
        <div className={styles.placeholder} />
      </Panel>
    </div>
  )
}
