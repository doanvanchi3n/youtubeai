import { useMemo, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import arrowRight from '../../assets/icons/arrow-right.svg'
import robotIcon from '../../assets/icons/robot-excited-outline.svg'
import pictureIcon from '../../assets/icons/picture-one.svg'
import styles from './AISuggestion.module.css'
import { aiService } from '../../services/aiService'

const parseKeywords = (value) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 25)

export default function AISuggestion() {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [submittedText, setSubmittedText] = useState('')

  const keywords = useMemo(() => parseKeywords(inputValue), [inputValue])

  const handleGenerate = async () => {
    if (!inputValue.trim()) {
      setError('Vui lòng nhập từ khóa hoặc mô tả trước khi gửi.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        keywords,
        description: inputValue.trim(),
        useChannelContext: true,
        fetchYouTubeContext: false,
        locale: 'vi-VN'
      }
      const data = await aiService.generateSuggestions(payload)
      setResult(data)
      setSubmittedText(inputValue.trim())
    } catch (err) {
      setError(err.message || 'Không thể tạo gợi ý. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleGenerate()
    }
  }

  const renderList = (items, fallback) => {
    if (!items?.length) {
      return <p className={styles.placeholder}>{fallback}</p>
    }
    return (
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ol>
    )
  }

  return (
    <div className={styles.container}>
      <Panel className={styles.wrapper}>
        {result ? (
          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span>Đầu vào gần nhất:</span>
              <p>{submittedText}</p>
            </div>
            <div className={styles.section}>
              <h3>10 tiêu đề gợi ý</h3>
              {renderList(result.titles, 'Chưa có dữ liệu tiêu đề')}
            </div>
            <div className={styles.section}>
              <h3>Mô tả 300 – 600 ký tự</h3>
              {result.description ? (
                <p className={styles.description}>{result.description}</p>
              ) : (
                <p className={styles.placeholder}>Chưa có mô tả, vui lòng thử lại.</p>
              )}
            </div>
            <div className={styles.section}>
              <h3>20 tags / hashtags</h3>
              {result.hashtags?.length ? (
                <div className={styles.tags}>
                  {result.hashtags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : (
                <p className={styles.placeholder}>Chưa có tags phù hợp.</p>
              )}
            </div>
            <div className={styles.section}>
              <h3>Chủ đề & trend gợi ý</h3>
              {renderList(result.topics, 'Chưa có chủ đề nổi bật.')}
              <div className={styles.trendRow}>
                <div>
                  <strong>Google Trends</strong>
                  {renderList(result.trends?.google, 'Không có dữ liệu Google Trends.')}
                </div>
                <div>
                  <strong>YouTube Trends</strong>
                  {renderList(result.trends?.youtube, 'Không có dữ liệu YouTube Trends.')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Nhập từ khóa hoặc mô tả ở bên dưới để AI gợi ý nội dung ngay tại đây.</p>
          </div>
        )}
        {loading && <div className={styles.loader}>Đang tạo gợi ý...</div>}
        {error && <div className={styles.error}>{error}</div>}
      </Panel>
      <div className={styles.form}>
        <div className={styles.inputWrapper}>
          <div className={styles.iconGroup}>
            <img src={pictureIcon} alt="" className={styles.inputIcon} />
            <img src={robotIcon} alt="" className={`${styles.inputIcon} ${styles.robotIcon}`} />
          </div>
          <input
            className={styles.input}
            placeholder="Nhập từ khóa (cách nhau bằng dấu phẩy) hoặc mô tả video"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className={styles.arrowButton} onClick={handleGenerate} disabled={loading}>
            <img src={arrowRight} alt="Generate" className={styles.arrowIcon} />
          </button>
        </div>
      </div>
    </div>
  )
}

