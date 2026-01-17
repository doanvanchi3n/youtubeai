/**
 * Dashboard Component - Trang chủ hiển thị tổng quan metrics và analytics của YouTube channel
 * 
 * CHỨC NĂNG CHÍNH:
 * 1. Phân tích kênh YouTube: User nhập URL → Tạo analyze job → Poll status → Hiển thị kết quả
 * 2. Hiển thị metrics: Total Views, Likes, Comments, Videos với so sánh trend
 * 3. Biểu đồ xu hướng: Line chart hiển thị Views, Likes, Comments theo thời gian
 * 4. Top videos: Danh sách 5 video có engagement cao nhất
 * 5. Sentiment analysis: Phân tích cảm xúc comments (positive/negative/neutral)
 * 
 * LUỒNG HOẠT ĐỘNG:
 * - Component mount → loadDashboard() → Gọi API lấy metrics, trends, videos, sentiment
 * - User nhập URL → handleAnalyze() → Tạo analyze job → Poll job status → Reload dashboard khi hoàn thành
 * - Auto refresh: Có thể thêm tính năng auto refresh định kỳ
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Panel from '../../components/Panel/Panel.jsx'
import likeIco from '../../assets/icons/bx-like.svg'
import commentIco from '../../assets/icons/comment-multiple-outline.svg'
import viewIco from '../../assets/icons/preview-open.svg'
import videoIco from '../../assets/icons/listvideo.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import searchIcon from '../../assets/icons/search.svg'
import styles from './Dashboard.module.css'
import { dashboardService } from '../../services/dashboardService'

/**
 * Cấu hình các metric cards hiển thị trên dashboard
 * Mỗi card có:
 * - key: Tên field trong metrics object
 * - comparisonKey: Tên field chứa comparison data (trend, change, changePercentage)
 * - label: Nhãn hiển thị
 * - icon: Icon SVG
 */
const metricCards = [
  { key: 'totalLikes', comparisonKey: 'likesComparison', label: 'Total Likes', icon: likeIco },
  { key: 'totalComments', comparisonKey: 'commentsComparison', label: 'Total Comments', icon: commentIco },
  { key: 'totalVideos', comparisonKey: 'videosComparison', label: 'Videos', icon: videoIco },
  { key: 'totalViews', comparisonKey: 'viewsComparison', label: 'Views', icon: viewIco }
]

/**
 * Format số lớn thành dạng compact (1K, 1M, etc.)
 * 
 * VÍ DỤ:
 * - 1234 → "1.2K"
 * - 1234567 → "1.2M"
 * - 123 → "123"
 * 
 * THAM SỐ: value - Số cần format
 * TRẢ VỀ: String đã được format
 */
const formatCompactNumber = (value) => {
  if (value === null || value === undefined) {
    return '0'
  }
  try {
    // Sử dụng Intl.NumberFormat để format (hỗ trợ nhiều locale)
    const formatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
    return formatter.format(value)
  } catch {
    // Fallback nếu Intl.NumberFormat không hỗ trợ
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return `${value}`
  }
}

/**
 * Dashboard Component - Component chính
 * 
 * STATE MANAGEMENT:
 * - searchValue: URL kênh YouTube user nhập vào
 * - channelInfo: Thông tin kênh (name, avatar, channelId, subscribers, lastSyncedAt)
 * - metrics: Metrics tổng quan (totalViews, totalLikes, totalComments, totalVideos, comparisons)
 * - trendData: Dữ liệu xu hướng theo thời gian (views, likes, comments theo ngày)
 * - topVideos: Danh sách top 5 videos có engagement cao nhất
 * - sentiment: Dữ liệu phân tích sentiment (positiveRatio, negativeRatio, neutralRatio, totalComments)
 * - loading: Trạng thái đang tải lần đầu
 * - refreshing: Trạng thái đang refresh (silent reload)
 * - error: Thông báo lỗi
 * - analyzing: Trạng thái đang phân tích URL
 * - analysisJob: Job phân tích hiện tại (status, progress, error)
 * - jobPollRef: Reference đến interval polling job status
 */
export default function Dashboard() {
  // State quản lý input search
  const [searchValue, setSearchValue] = useState('')
  
  // State quản lý dữ liệu dashboard
  const [channelInfo, setChannelInfo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [topVideos, setTopVideos] = useState([])
  const [sentiment, setSentiment] = useState(null)
  
  // State quản lý UI loading/error
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // State quản lý analyze job
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisJob, setAnalysisJob] = useState(null)
  const jobPollRef = useRef(null) // Reference để clear interval khi unmount

  /**
   * Load dashboard data từ backend
   * 
   * LUỒNG XỬ LÝ:
   * 1. Set loading/refreshing state
   * 2. Gọi 4 API endpoints song song (Promise.all):
   *    - getMetrics(): Lấy metrics tổng quan
   *    - getTrends(): Lấy dữ liệu xu hướng theo thời gian
   *    - getTopVideos(): Lấy top 5 videos
   *    - getSentiment(): Lấy phân tích sentiment
   * 3. Update state với dữ liệu nhận được
   * 4. Handle errors và update loading state
   * 
   * THAM SỐ:
   * - channelId: ID kênh YouTube (optional, nếu null sẽ lấy kênh mặc định của user)
   * - options.silent: Nếu true → dùng refreshing state thay vì loading (cho refresh không làm mất UI)
   * 
   * LƯU Ý: Sử dụng useCallback để tránh re-create function mỗi lần render
   */
  const loadDashboard = useCallback(
    async (channelId, { silent = false } = {}) => {
      setError(null)
      
      // Set loading state (silent mode dùng refreshing để không làm mất UI)
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      try {
        // Gọi 4 API endpoints song song để tối ưu performance
        const [metricsData, trends, videos, sentimentData] = await Promise.all([
          dashboardService.getMetrics(channelId),
          dashboardService.getTrends(channelId),
          dashboardService.getTopVideos(channelId, 5),
          dashboardService.getSentiment(channelId)
        ])

        // Update metrics state
        setMetrics(metricsData)
        
        // Extract và format channel info từ metrics
        setChannelInfo({
          name: metricsData?.channelName,
          avatarUrl: metricsData?.avatarUrl,
          channelId: metricsData?.youtubeChannelId,
          lastSyncedAt: metricsData?.lastSyncedAt,
          subscriberCount: metricsData?.subscriberCount
        })
        
        // Update các state khác
        setTrendData(trends?.points ?? []) // points là array các data points theo thời gian
        setTopVideos(videos ?? [])
        setSentiment(sentimentData)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Không thể tải dữ liệu dashboard')
      } finally {
        // Reset loading state
        if (silent) {
          setRefreshing(false)
        } else {
          setLoading(false)
        }
      }
    },
    [] // Empty deps: function không phụ thuộc vào props/state nào
  )

  /**
   * Effect: Load dashboard khi component mount lần đầu
   * Gọi loadDashboard() với channelId = null (lấy kênh mặc định của user)
   */
  useEffect(() => {
    loadDashboard().catch(() => {}) // Ignore errors, đã handle trong loadDashboard
  }, [loadDashboard])

  /**
   * Stop polling job status
   * Clear interval nếu đang chạy
   */
  const stopJobPolling = useCallback(() => {
    if (jobPollRef.current) {
      clearInterval(jobPollRef.current)
      jobPollRef.current = null
    }
  }, [])

  /**
   * Effect: Cleanup khi component unmount
   * Clear interval polling để tránh memory leak
   */
  useEffect(() => {
    return () => {
      stopJobPolling()
    }
  }, [stopJobPolling])

  /**
   * Poll job status để check xem analyze job đã hoàn thành chưa
   * 
   * LUỒNG XỬ LÝ:
   * 1. Gọi API getAnalyzeJob(jobId) để lấy status mới nhất
   * 2. Update analysisJob state
   * 3. Nếu status = SUCCESS:
   *    - Stop polling
   *    - Reload dashboard với channelId mới
   *    - Reset analyzing state
   * 4. Nếu status = FAILED:
   *    - Stop polling
   *    - Show error message
   *    - Reset analyzing state
   * 
   * THAM SỐ: jobId - ID của analyze job
   * 
   * LƯU Ý: Function này được gọi định kỳ bởi setInterval trong handleAnalyze
   */
  const pollJobStatus = useCallback(
    async (jobId) => {
      if (!jobId) return
      
      try {
        // Lấy job status mới nhất từ backend
        const job = await dashboardService.getAnalyzeJob(jobId)
        setAnalysisJob(job)
        
        // Job đã hoàn thành thành công
        if (job.status === 'SUCCESS') {
          stopJobPolling() // Dừng polling
          setAnalyzing(false)
          setError(null)
          
          // Reload dashboard với channelId mới để hiển thị dữ liệu vừa phân tích
          await loadDashboard(job.channelId)
          setAnalysisJob(null) // Clear job state
        } 
        // Job thất bại
        else if (job.status === 'FAILED') {
          stopJobPolling()
          setAnalyzing(false)
          setError(job.error || 'Phân tích thất bại. Vui lòng thử lại.')
        }
        // Job đang chạy (PENDING, RUNNING) → Tiếp tục polling
      } catch (err) {
        console.error(err)
        stopJobPolling()
        setAnalyzing(false)
        setError(err.message || 'Không thể lấy trạng thái phân tích')
      }
    },
    [loadDashboard, stopJobPolling]
  )

  /**
   * Handle analyze URL kênh YouTube
   * 
   * LUỒNG XỬ LÝ:
   * 1. Validate input (không rỗng, không đang analyze)
   * 2. Gọi API analyzeUrl() → Tạo analyze job → Nhận jobId
   * 3. Poll job status mỗi 3 giây để check khi nào hoàn thành
   * 4. Khi job hoàn thành → loadDashboard() tự động được gọi trong pollJobStatus
   * 
   * THAM SỐ: event - Form submit event
   * 
   * LƯU Ý:
   * - Job được xử lý async bởi backend (AnalyzeJobWorker)
   * - Frontend chỉ cần poll status, không cần chờ job hoàn thành
   * - Interval polling sẽ tự động clear khi job hoàn thành hoặc component unmount
   */
  const handleAnalyze = async (event) => {
    event.preventDefault()
    
    // Validate: Không rỗng và không đang analyze
    if (!searchValue.trim() || analyzing) {
      return
    }
    
    try {
      setError(null)
      setAnalyzing(true)
      
      // Gọi API tạo analyze job
      // Backend sẽ tạo job với status PENDING và trả về jobId
      const job = await dashboardService.analyzeUrl(searchValue.trim())
      setAnalysisJob(job)
      setSearchValue('') // Clear input
      
      // Poll ngay lập tức để check status
      await pollJobStatus(job.jobId)
      
      // Nếu chưa có interval đang chạy → Tạo interval poll mỗi 3 giây
      if (!jobPollRef.current) {
        jobPollRef.current = setInterval(() => pollJobStatus(job.jobId), 3000)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể phân tích URL. Vui lòng thử lại.')
      setAnalyzing(false)
    }
  }

  /**
   * Tính toán sentiment breakdown từ sentiment data
   * Extract positiveRatio, negativeRatio, neutralRatio
   * 
   * LƯU Ý: Sử dụng useMemo để tránh tính toán lại mỗi lần render
   */
  const sentimentBreakdown = useMemo(() => {
    if (!sentiment) {
      return {
        positive: 0,
        negative: 0,
        neutral: 0
      }
    }
    return {
      positive: sentiment.positiveRatio ?? 0,
      negative: sentiment.negativeRatio ?? 0,
      neutral: sentiment.neutralRatio ?? 0
    }
  }, [sentiment])

  /**
   * Tính toán phần trăm sentiment để hiển thị trên chart
   * 
   * LUỒNG:
   * 1. Tính tổng (positive + negative + neutral)
   * 2. Tính phần trăm cho mỗi loại
   * 3. Đảm bảo tổng = 100% (neutral được tính = 100 - positive - negative)
   * 
   * LƯU Ý: Sử dụng useMemo để tránh tính toán lại mỗi lần render
   */
  const sentimentPercentages = useMemo(() => {
    const total =
      (sentimentBreakdown.positive ?? 0) +
      (sentimentBreakdown.negative ?? 0) +
      (sentimentBreakdown.neutral ?? 0)
    
    if (total === 0) {
      return {
        positive: 0,
        negative: 0,
        neutral: 0
      }
    }
    
    // Tính phần trăm, đảm bảo tổng = 100%
    return {
      positive: Math.round((sentimentBreakdown.positive / total) * 100),
      negative: Math.round((sentimentBreakdown.negative / total) * 100),
      // Neutral = phần còn lại để đảm bảo tổng = 100%
      neutral: Math.max(0, 100 - Math.round((sentimentBreakdown.positive / total) * 100) - Math.round((sentimentBreakdown.negative / total) * 100))
    }
  }, [sentimentBreakdown])

  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.searchPanel}>
        <form className={styles.searchForm} onSubmit={handleAnalyze}>
          <div className={styles.searchInput}>
            <img src={searchIcon} alt="" className={styles.searchIcon} />
            <input
              placeholder="Dán URL kênh hoặc video YouTube để phân tích"
              className={styles.searchField}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className={styles.searchButton}
            disabled={loading || refreshing || analyzing}
          >
            {analyzing ? 'Đang phân tích...' : 'Phân tích'}
          </button>
        </form>
        {channelInfo && (
          <div className={styles.channelSummary}>
            <div className={styles.channelMeta}>
              <div className={styles.channelBadge}>
                <div className={styles.channelAvatar}>
                  {channelInfo.avatarUrl ? (
                    <img src={channelInfo.avatarUrl} alt={channelInfo.name} />
                  ) : (
                    <span>{channelInfo.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className={styles.channelName}>{channelInfo.name}</div>
                  <div className={styles.channelId}>{channelInfo.channelId}</div>
                </div>
              </div>
              {channelInfo.subscriberCount !== undefined && (
                <div className={styles.channelSubscribers}>
                  {formatCompactNumber(channelInfo.subscriberCount)} subscribers
                </div>
              )}
            </div>
            {channelInfo.lastSyncedAt && (
              <div className={styles.syncInfo}>Last sync: {new Date(channelInfo.lastSyncedAt).toLocaleString()}</div>
            )}
          </div>
        )}
        {(error || loading || refreshing || analysisJob) && (
          <div className={styles.statusRow}>
            {error && <span className={styles.errorText}>{error}</span>}
            {(loading || refreshing) && (
              <span className={styles.statusText}>
                {loading ? 'Đang tải dashboard...' : 'Đang làm mới dữ liệu...'}
              </span>
            )}
            {analysisJob && !error && (
              <span className={styles.statusText}>
                {analysisJob.status === 'SUCCESS'
                  ? 'Hoàn tất đồng bộ'
                  : analysisJob.status === 'FAILED'
                    ? 'Phân tích thất bại'
                    : 'Đang phân tích dữ liệu...'}
                {analysisJob.progress != null ? ` (${analysisJob.progress}%)` : ''}
              </span>
            )}
          </div>
        )}
      </Panel>

      <div className={styles.metricsRow}>
        {metricCards.map((metric) => {
          const comparison = metrics?.[metric.comparisonKey]
          return (
            <div key={metric.key} className={styles.statCard}>
              <img src={metric.icon} alt="" className={styles.statIcon} />
              <strong className={styles.statValue}>
                {metrics ? formatCompactNumber(metrics[metric.key]) : '--'}
              </strong>
              <span className={styles.statLabel}>{metric.label}</span>
              
              {/* Hiển thị so sánh với snapshot trước */}
              {comparison && comparison.previousValue !== null && (
                <div className={styles.comparison}>
                  {comparison.trend === 'up' && (
                    <span className={styles.trendUp}>
                      ↑ +{formatCompactNumber(Math.abs(comparison.change))}
                      {' '}
                      ({comparison.changePercentage > 0 ? '+' : ''}
                      {comparison.changePercentage.toFixed(1)}%)
                    </span>
                  )}
                  {comparison.trend === 'down' && (
                    <span className={styles.trendDown}>
                      ↓ {formatCompactNumber(comparison.change)}
                      {' '}
                      ({comparison.changePercentage.toFixed(1)}%)
                    </span>
                  )}
                  {comparison.trend === 'stable' && (
                    <span className={styles.trendStable}>
                      → Không đổi
                    </span>
                  )}
                  {comparison.daysSinceLastSync !== null && comparison.daysSinceLastSync > 0 && (
                    <span className={styles.syncInfo}>
                      So với {comparison.daysSinceLastSync} ngày trước
                    </span>
                  )}
                </div>
              )}
              {comparison && comparison.previousValue === null && (
                <div className={styles.comparison}>
                  <span className={styles.trendStable}>Lần đầu phân tích</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Panel variant="light">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Views, Likes & Comments Over Time</span>
          </div>
          <div className={styles.sectionMeta}>
            {trendData?.length > 0
              ? `${trendData[0].date} → ${trendData[trendData.length - 1].date}`
              : 'Chưa có dữ liệu'}
          </div>
        </div>
        <TrendChart data={trendData} isLoading={loading && !trendData?.length} />
      </Panel>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Top 5 Most Engaging Videos</span>
          </div>
          <TopVideoList videos={topVideos} isLoading={loading && !topVideos.length} />
        </Panel>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Sentiment Analysis of Comments</span>
          </div>
          <SentimentCard
            sentiment={sentiment}
            breakdown={sentimentPercentages}
            isLoading={loading && !sentiment}
          />
        </Panel>
      </div>
    </div>
  )
}

/**
 * TrendChart Component - Hiển thị biểu đồ line chart xu hướng Views, Likes, Comments theo thời gian
 * 
 * CÔNG NGHỆ: Recharts library (LineChart, Line, XAxis, YAxis, Tooltip, Legend)
 * 
 * THAM SỐ:
 * - data: Array các data points [{date, views, likes, comments}, ...]
 * - isLoading: Trạng thái đang tải
 * 
 * HIỂN THỊ:
 * - 3 lines: Views (xanh lá), Likes (xanh dương), Comments (cam)
 * - X-axis: Date hoặc index
 * - Y-axis: Số lượng (format compact: 1K, 1M)
 * - Tooltip: Hiển thị chi tiết khi hover
 */
function TrendChart({ data, isLoading }) {
  // Loading state
  if (isLoading) {
    return <div className={styles.chartPlaceholder}>Đang tải biểu đồ...</div>
  }

  // Empty state
  if (!data?.length) {
    return <div className={styles.chartPlaceholder}>Chưa có dữ liệu xu hướng</div>
  }

  /**
   * Format data cho Recharts
   * Transform từ format backend (date, views, likes, comments) 
   * sang format Recharts (name, views, likes, comments)
   */
  const chartData = data.map((point, index) => ({
    name: point.date || `#${index + 1}`, // X-axis label: date hoặc index
    views: point.views ?? 0,
    likes: point.likes ?? 0,
    comments: point.comments ?? 0
  }))

  /**
   * Custom Tooltip Component
   * Hiển thị thông tin chi tiết khi hover vào data point
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#1f2c35' }}>
            {payload[0].payload.name}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              fontSize: '14px'
            }}>
              {entry.name}: {formatCompactNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.lineChartContainer}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8ecef" />
          <XAxis 
            dataKey="name" 
            stroke="#98a3b1"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6f7c8b' }}
          />
          <YAxis 
            stroke="#98a3b1"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6f7c8b' }}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => value}
          />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="#2ECFB9" 
            strokeWidth={3}
            dot={{ fill: '#2ECFB9', r: 4 }}
            activeDot={{ r: 6 }}
            name="Views"
          />
          <Line 
            type="monotone" 
            dataKey="likes" 
            stroke="#4D7CFE" 
            strokeWidth={3}
            dot={{ fill: '#4D7CFE', r: 4 }}
            activeDot={{ r: 6 }}
            name="Likes"
          />
          <Line 
            type="monotone" 
            dataKey="comments" 
            stroke="#FFAD5B" 
            strokeWidth={3}
            dot={{ fill: '#FFAD5B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Comments"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * TopVideoList Component - Hiển thị danh sách top 5 videos có engagement cao nhất
 * 
 * THAM SỐ:
 * - videos: Array các video objects [{videoId, title, thumbnailUrl, likeCount, viewCount, commentCount}, ...]
 * - isLoading: Trạng thái đang tải
 * 
 * HIỂN THỊ:
 * - Thumbnail video
 * - Title video
 * - Metrics: Likes, Views, Comments (format compact)
 */
function TopVideoList({ videos, isLoading }) {
  // Loading state
  if (isLoading) {
    return <div className={styles.videoPlaceholder}>Đang tải danh sách video...</div>
  }

  // Empty state
  if (!videos?.length) {
    return <div className={styles.videoPlaceholder}>Chưa có dữ liệu video</div>
  }

  return (
    <div className={styles.videoList}>
      {videos.map((video) => (
        <div key={video.videoId || video.id} className={styles.videoItem}>
          {/* Thumbnail */}
          <div className={styles.videoThumb}>
            {video.thumbnailUrl ? (
              <img src={video.thumbnailUrl} alt={video.title} />
            ) : (
              <span>No thumbnail</span>
            )}
          </div>
          
          {/* Video info */}
          <div className={styles.videoInfo}>
            <div className={styles.videoTitle}>{video.title}</div>
            <div className={styles.videoMeta}>
              {/* Likes */}
              <span>
                <img src={likeIco} alt="" /> {formatCompactNumber(video.likeCount)}
              </span>
              {/* Views */}
              <span>
                <img src={viewIco} alt="" /> {formatCompactNumber(video.viewCount)}
              </span>
              {/* Comments */}
              <span>
                <img src={commentIco} alt="" /> {formatCompactNumber(video.commentCount)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * SentimentCard Component - Hiển thị phân tích sentiment dưới dạng donut chart
 * 
 * THAM SỐ:
 * - sentiment: Sentiment data object (totalComments, positiveRatio, negativeRatio, neutralRatio)
 * - breakdown: Phần trăm sentiment đã được tính toán {positive, negative, neutral}
 * - isLoading: Trạng thái đang tải
 * 
 * HIỂN THỊ:
 * - Donut chart với conic-gradient (CSS)
 * - Legend: Positive (xanh lá), Negative (đỏ), Neutral (xám)
 * - Tổng số comments ở giữa chart
 * 
 * CÔNG NGHỆ: CSS conic-gradient để tạo donut chart (không dùng library)
 */
function SentimentCard({ sentiment, breakdown, isLoading }) {
  // Loading state
  if (isLoading) {
    return <div className={styles.chartPlaceholder} style={{ minHeight: 280 }}>Đang tải phân tích cảm xúc...</div>
  }

  // Empty state
  if (!sentiment) {
    return <div className={styles.chartPlaceholder} style={{ minHeight: 280 }}>Chưa có dữ liệu cảm xúc</div>
  }

  /**
   * Tính góc cho mỗi phần trong donut chart
   * 1% = 3.6 độ (360 độ / 100%)
   */
  const positiveAngle = breakdown.positive * 3.6
  const negativeAngle = breakdown.negative * 3.6
  const neutralAngle = 360 - positiveAngle - negativeAngle

  /**
   * Tạo conic-gradient CSS cho donut chart
   * - Positive: 0deg → positiveAngle (xanh lá #2ECFB9)
   * - Negative: positiveAngle → positiveAngle + negativeAngle (đỏ #FF6D6D)
   * - Neutral: positiveAngle + negativeAngle → 360deg (xám #9AA0B5)
   */
  const conicGradient = `conic-gradient(
    #2ECFB9 0deg ${positiveAngle}deg,
    #FF6D6D ${positiveAngle}deg ${positiveAngle + negativeAngle}deg,
    #9AA0B5 ${positiveAngle + negativeAngle}deg 360deg
  )`

  return (
    <div className={styles.sentimentCard}>
      <div className={styles.sentimentChart}>
        <div className={styles.sentimentRing} style={{ background: conicGradient }}>
          <div className={styles.sentimentRingInner}>
            <strong>{formatCompactNumber(sentiment.totalComments)}</strong>
            <span>comments</span>
          </div>
        </div>
      </div>
      <div className={styles.sentimentLegend}>
        <div>
          <i style={{ backgroundColor: '#2ECFB9' }} />
          <span>Tích cực</span>
          <strong>{Math.round(breakdown.positive)}%</strong>
        </div>
        <div>
          <i style={{ backgroundColor: '#FF6D6D' }} />
          <span>Tiêu cực</span>
          <strong>{Math.round(breakdown.negative)}%</strong>
        </div>
        <div>
          <i style={{ backgroundColor: '#9AA0B5' }} />
          <span>Trung lập</span>
          <strong>{Math.round(breakdown.neutral)}%</strong>
        </div>
      </div>
    </div>
  )
}
