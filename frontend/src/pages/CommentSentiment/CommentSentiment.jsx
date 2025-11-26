import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import Panel from '../../components/Panel/Panel.jsx'
import FilterTabs from '../../components/FilterTabs/FilterTabs.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import likeIcon from '../../assets/icons/bx-like.svg'
import { getCommentsBySentiment, getCommentsByEmotion, getSentimentStats, getTopVideos } from '../../services/commentService'
import { dashboardService } from '../../services/dashboardService'
import styles from './CommentSentiment.module.css'

const sentimentFilters = ['Tích cực', 'Tiêu cực', 'Trung lập']
const sentimentMap = {
  'Tích cực': 'positive',
  'Tiêu cực': 'negative',
  'Trung lập': 'neutral'
}

const emotionFilters = [
  { value: 'happy', label: '😊 Vui vẻ' },
  { value: 'sad', label: '😞 Buồn chán' },
  { value: 'angry', label: '😡 Công kích' },
  { value: 'suggestion', label: '💬 Góp ý' },
  { value: 'love', label: '❤️ Yêu thích' },
]

// Pastel colors matching app theme
const COLORS = {
  happy: '#2ECFB9',      // Teal (matching Dashboard theme)
  sad: '#9AA0B5',         // Gray-blue (matching neutral)
  angry: '#FF6D6D',       // Soft red
  suggestion: '#4D7CFE',  // Blue (matching Dashboard)
  love: '#FFAD5B'         // Orange (matching Dashboard)
}

// Map emotion values to colors
const getEmotionColor = (emotionValue) => {
  const colorMap = {
    'happy': COLORS.happy,
    'sad': COLORS.sad,
    'angry': COLORS.angry,
    'suggestion': COLORS.suggestion,
    'love': COLORS.love
  }
  return colorMap[emotionValue] || '#98a3b1'
}

export default function CommentSentiment() {
  const [activeSentiment, setActiveSentiment] = useState(sentimentFilters[0])
  const [activeEmotion, setActiveEmotion] = useState(emotionFilters[0].value)
  const [comments, setComments] = useState([])
  const [emotionComments, setEmotionComments] = useState([])
  const [stats, setStats] = useState(null)
  
  // Separate loading states
  const [loadingSentiment, setLoadingSentiment] = useState(false)
  const [loadingEmotion, setLoadingEmotion] = useState(false)
  const [loadingTopVideos, setLoadingTopVideos] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // Separate error states
  const [errorSentiment, setErrorSentiment] = useState(null)
  const [errorEmotion, setErrorEmotion] = useState(null)
  const [errorChannel, setErrorChannel] = useState(null)
  
  const [channelId, setChannelId] = useState(null)
  const [topVideos, setTopVideos] = useState([])
  
  // Pagination states
  const [sentimentPage, setSentimentPage] = useState(0)
  const [emotionPage, setEmotionPage] = useState(0)
  const [sentimentTotalPages, setSentimentTotalPages] = useState(0)
  const [emotionTotalPages, setEmotionTotalPages] = useState(0)

  useEffect(() => {
    setSentimentPage(0) // Reset to first page when filter changes
    loadSentimentComments(0)
  }, [activeSentiment, channelId])

  useEffect(() => {
    setEmotionPage(0) // Reset to first page when filter changes
    loadEmotionComments(0)
  }, [activeEmotion, channelId])

  useEffect(() => {
    loadChannelId()
  }, [])

  useEffect(() => {
    if (channelId) {
      loadStats()
      loadTopVideos()
    }
  }, [channelId])

  const loadSentimentComments = async (page = sentimentPage) => {
    if (!channelId) return
    setLoadingSentiment(true)
    setErrorSentiment(null)
    try {
      const response = await getCommentsBySentiment(
        channelId,
        sentimentMap[activeSentiment],
        page,
        20
      )
      setComments(response.content || [])
      setSentimentTotalPages(response.totalPages || 0)
      setSentimentPage(page)
    } catch (err) {
      console.error('Error loading comments:', err)
      setErrorSentiment(err.message)
      setComments([])
    } finally {
      setLoadingSentiment(false)
    }
  }

  const loadEmotionComments = async (page = emotionPage) => {
    if (!channelId) return
    setLoadingEmotion(true)
    setErrorEmotion(null)
    try {
      const response = await getCommentsByEmotion(channelId, activeEmotion, page, 20)
      setEmotionComments(response.content || [])
      setEmotionTotalPages(response.totalPages || 0)
      setEmotionPage(page)
    } catch (err) {
      console.error('Error loading emotion comments:', err)
      setErrorEmotion(err.message)
      setEmotionComments([])
    } finally {
      setLoadingEmotion(false)
    }
  }

  const loadChannelId = async () => {
    try {
      // Get channelId from user's first channel (same as Dashboard)
      const metrics = await dashboardService.getMetrics()
      if (metrics?.youtubeChannelId) {
        setChannelId(metrics.youtubeChannelId)
        setErrorChannel(null)
      } else {
        setErrorChannel('Bạn chưa kết nối kênh YouTube nào. Vui lòng đồng bộ kênh trước.')
      }
    } catch (err) {
      console.error('Error loading channel:', err)
      setErrorChannel(err.message || 'Không thể tải thông tin kênh')
    }
  }

  const loadStats = async () => {
    if (!channelId) return
    setLoadingStats(true)
    try {
      const response = await getSentimentStats(channelId)
      setStats(response)
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadTopVideos = async () => {
    if (!channelId) return
    setLoadingTopVideos(true)
    try {
      const response = await getTopVideos(channelId, 3)
      setTopVideos(response || [])
    } catch (err) {
      console.error('Error loading top videos:', err)
    } finally {
      setLoadingTopVideos(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Không xác định'
    const now = new Date()
    const commentDate = new Date(dateString)
    const diffMs = now - commentDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    return `${diffDays} ngày trước`
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Prepare chart data
  const chartData = stats?.emotion 
    ? Object.entries(stats.emotion)
        .map(([key, value]) => {
          const emotionFilter = emotionFilters.find(e => e.value === key)
          return {
            name: emotionFilter ? emotionFilter.label : key,
            value: value || 0
          }
        })
        .filter(item => item.value > 0)
    : []

  const renderComment = (comment, idx) => (
    <div key={comment.id || idx} className={styles.row}>
      <div className={styles.avatar}>
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} />
        ) : (
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#89abe3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
            {(comment.authorName || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.author}>{comment.authorName || 'Người dùng'}</span>
          <span>{formatTime(comment.publishedAt)}</span>
          <span className={styles.divider} />
          <span className={styles.titleVideo}>{comment.video?.title || 'Video'}</span>
        </div>
        <div className={styles.text}>{comment.content || 'Nội dung'}</div>
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <span>Đang tải...</span>
    </div>
  )

  const renderError = (error, onRetry) => (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <div className={styles.errorMessage}>{error}</div>
      {onRetry && (
        <button onClick={onRetry} className={styles.retryButton}>
          Thử lại
        </button>
      )}
    </div>
  )

  const renderEmpty = (message = 'Không có bình luận nào') => (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyIcon}>💬</div>
      <div className={styles.emptyMessage}>{message}</div>
    </div>
  )

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null
    
    return (
      <div className={styles.pagination}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className={styles.paginationButton}
        >
          Trước
        </button>
        <span className={styles.paginationInfo}>
          Trang {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className={styles.paginationButton}
        >
          Sau
        </button>
      </div>
    )
  }

  // Show channel error if no channel
  if (errorChannel && !channelId) {
    return (
      <div className={styles.screen}>
        <Panel variant="light" className={styles.section}>
          {renderError(errorChannel)}
        </Panel>
      </div>
    )
  }

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
        {loadingSentiment ? (
          renderLoading()
        ) : errorSentiment ? (
          renderError(errorSentiment, () => loadSentimentComments(sentimentPage))
        ) : comments.length === 0 ? (
          renderEmpty('Không có bình luận nào')
        ) : (
          <>
        <div className={styles.list}>
              {comments.map(renderComment)}
            </div>
            {renderPagination(sentimentPage, sentimentTotalPages, (page) => loadSentimentComments(page))}
          </>
        )}
      </Panel>

      <Panel variant="light" className={styles.section}>
        <div className={styles.title}>
          <img src={chevronIcon} alt="" />
          <span>Thống kê từng loại cảm xúc</span>
        </div>
        <FilterTabs
          items={emotionFilters.map(e => ({ label: e.label, value: e.value }))}
          active={activeEmotion}
          onChange={setActiveEmotion}
          className={styles.tabsWide}
        />
        {loadingEmotion ? (
          renderLoading()
        ) : errorEmotion ? (
          renderError(errorEmotion, () => loadEmotionComments(emotionPage))
        ) : emotionComments.length === 0 ? (
          renderEmpty('Không có bình luận nào')
        ) : (
          <>
        <div className={styles.list}>
              {emotionComments.map(renderComment)}
            </div>
            {renderPagination(emotionPage, emotionTotalPages, (page) => loadEmotionComments(page))}
          </>
        )}
      </Panel>

      <div className={styles.bottom}>
        <Panel variant="light">
          <div className={styles.title}>
            <img src={chevronIcon} alt="" />
            <span>Top 3 video nhiều like nhất</span>
          </div>
          {loadingTopVideos ? (
            renderLoading()
          ) : topVideos.length === 0 ? (
            renderEmpty('Chưa có dữ liệu video')
          ) : (
          <div className={styles.topList}>
              {topVideos.map((video, idx) => (
                <div key={video.id || idx} className={styles.topComment}>
                  <div className={styles.topThumb}>
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#89abe3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                        ▶
                      </div>
                    )}
                  </div>
                  <div className={styles.topInfo}>
                    <div className={styles.topTitle} title={video.title}>
                      {video.title || 'Video Title'}
                  </div>
                  <div className={styles.topMeta}>
                    <img src={likeIcon} alt="" />
                      <span>{formatNumber(video.likeCount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </Panel>

        <Panel variant="light">
          <div className={styles.title}>
            <img src={chevronIcon} alt="" />
            <span>Biểu đồ cảm xúc</span>
          </div>
          {loadingStats ? (
            renderLoading()
          ) : chartData.length === 0 ? (
            renderEmpty('Chưa có dữ liệu để hiển thị')
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => {
                    // Extract emotion value from name (e.g., "😊 Vui vẻ" -> "happy")
                    const emotionValue = emotionFilters.find(e => e.label === entry.name)?.value || 'happy'
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getEmotionColor(emotionValue)}
                      />
                    )
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} bình luận`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={60}
                  formatter={(value) => {
                    // Remove emoji for cleaner legend
                    return value.replace(/[😊😞😡💬❤️]/g, '').trim()
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  )
}

