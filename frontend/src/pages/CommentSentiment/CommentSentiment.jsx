import { useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import FilterTabs from '../../components/FilterTabs/FilterTabs.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import likeIcon from '../../assets/icons/bx-like.svg'
import styles from './CommentSentiment.module.css'

const sentimentFilters = ['Tích cực', 'Tiêu cực', 'Trung lập']
const emotionFilters = [
  { value: 'Vui vẻ', label: '😊 vui vẻ' },
  { value: 'Buồn chán', label: '😞 buồn chán' },
  { value: 'Công kích', label: '😡 công kích' },
  { value: 'Góp ý', label: '💬 góp ý' },
  { value: 'Yêu thích', label: '❤️ yêu thích' },
]

const commentRows = Array.from({ length: 5 })

export default function CommentSentiment() {
  const [activeSentiment, setActiveSentiment] = useState(sentimentFilters[0])
  const [activeEmotion, setActiveEmotion] = useState(emotionFilters[0].value)

  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.section}>
        <div className={styles.title}>
          <img src={chevronIcon} alt="" />
          <span>Lọc bình luận theo cảm xúc</span>
        </div>
        <FilterTabs
          items={sentimentFilters}
          active={activeSentiment}
          onChange={setActiveSentiment}
          className={styles.tabs}
        />
        <div className={styles.list}>
          {commentRows.map((_, idx) => (
            <div key={`sentiment-${idx}`} className={styles.row}>
              <div className={styles.avatar} />
              <div className={styles.content}>
                <div className={styles.meta}>
                  <span className={styles.author}>tên người bình luận</span>
                  <span>thời gian</span>
                  <span className={styles.divider} />
                  <span className={styles.titleVideo}>Title video</span>
                </div>
                <div className={styles.text}>Nội Dung</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel variant="light" className={styles.section}>
        <div className={styles.title}>
          <img src={chevronIcon} alt="" />
          <span>Thống kê từng loại cảm xúc</span>
        </div>
        <FilterTabs
          items={emotionFilters}
          active={activeEmotion}
          onChange={setActiveEmotion}
          className={styles.tabsWide}
        />
        <div className={styles.list}>
          {commentRows.map((_, idx) => (
            <div key={`emotion-${idx}`} className={styles.row}>
              <div className={styles.avatar} />
              <div className={styles.content}>
                <div className={styles.meta}>
                  <span className={styles.author}>tên người bình luận</span>
                  <span>thời gian</span>
                  <span className={styles.divider} />
                  <span className={styles.titleVideo}>Title video</span>
                </div>
                <div className={styles.text}>Nội Dung</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className={styles.bottom}>
        <Panel variant="light">
          <div className={styles.title}>
            <img src={chevronIcon} alt="" />
            <span>Top 3 bình luận nhiều like nhất</span>
          </div>
          <div className={styles.topList}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`top-${idx}`} className={styles.topComment}>
                <div className={styles.topThumb} />
                <div className={styles.topInfo}>
                  <div className={styles.topTitle}>
                    [Video Title One - short title...]
                  </div>
                  <div className={styles.topMeta}>
                    <img src={likeIcon} alt="" />
                    <span>12K</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.title}>
            <img src={chevronIcon} alt="" />
            <span>Biểu đồ cảm xúc (biểu đồ tròn)</span>
          </div>
          <div className={styles.chartPlaceholder} />
        </Panel>
      </div>
    </div>
  )
}

