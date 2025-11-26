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

const metricCards = [
  { key: 'totalLikes', label: 'Total Likes', icon: likeIco },
  { key: 'totalComments', label: 'Total Comments', icon: commentIco },
  { key: 'totalVideos', label: 'Videos', icon: videoIco },
  { key: 'totalViews', label: 'Views', icon: viewIco }
]

const formatCompactNumber = (value) => {
  if (value === null || value === undefined) {
    return '0'
  }
  try {
    const formatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
    return formatter.format(value)
  } catch {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return `${value}`
  }
}

export default function Dashboard() {
  const [searchValue, setSearchValue] = useState('')
  const [channelInfo, setChannelInfo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [topVideos, setTopVideos] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisJob, setAnalysisJob] = useState(null)
  const jobPollRef = useRef(null)

  const loadDashboard = useCallback(
    async (channelId, { silent = false } = {}) => {
      setError(null)
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      try {
        const [metricsData, trends, videos, sentimentData] = await Promise.all([
          dashboardService.getMetrics(channelId),
          dashboardService.getTrends(channelId),
          dashboardService.getTopVideos(channelId, 5),
          dashboardService.getSentiment(channelId)
        ])

        setMetrics(metricsData)
        setChannelInfo({
          name: metricsData?.channelName,
          avatarUrl: metricsData?.avatarUrl,
          channelId: metricsData?.youtubeChannelId,
          lastSyncedAt: metricsData?.lastSyncedAt,
          subscriberCount: metricsData?.subscriberCount
        })
        setTrendData(trends?.points ?? [])
        setTopVideos(videos ?? [])
        setSentiment(sentimentData)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Không thể tải dữ liệu dashboard')
      } finally {
        if (silent) {
          setRefreshing(false)
        } else {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    loadDashboard().catch(() => {})
  }, [loadDashboard])

  const stopJobPolling = useCallback(() => {
    if (jobPollRef.current) {
      clearInterval(jobPollRef.current)
      jobPollRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopJobPolling()
    }
  }, [stopJobPolling])

  const pollJobStatus = useCallback(
    async (jobId) => {
      if (!jobId) return
      try {
        const job = await dashboardService.getAnalyzeJob(jobId)
        setAnalysisJob(job)
        if (job.status === 'SUCCESS') {
          stopJobPolling()
          setAnalyzing(false)
          setError(null)
          await loadDashboard(job.channelId)
          setAnalysisJob(null)
        } else if (job.status === 'FAILED') {
          stopJobPolling()
          setAnalyzing(false)
          setError(job.error || 'Phân tích thất bại. Vui lòng thử lại.')
        }
      } catch (err) {
        console.error(err)
        stopJobPolling()
        setAnalyzing(false)
        setError(err.message || 'Không thể lấy trạng thái phân tích')
      }
    },
    [loadDashboard, stopJobPolling]
  )

  const handleAnalyze = async (event) => {
    event.preventDefault()
    if (!searchValue.trim() || analyzing) {
      return
    }
    try {
      setError(null)
      setAnalyzing(true)
      const job = await dashboardService.analyzeUrl(searchValue.trim())
      setAnalysisJob(job)
      setSearchValue('')
      await pollJobStatus(job.jobId)
      if (!jobPollRef.current) {
        jobPollRef.current = setInterval(() => pollJobStatus(job.jobId), 3000)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể phân tích URL. Vui lòng thử lại.')
      setAnalyzing(false)
    }
  }

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
    return {
      positive: Math.round((sentimentBreakdown.positive / total) * 100),
      negative: Math.round((sentimentBreakdown.negative / total) * 100),
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
        {metricCards.map((metric) => (
          <div key={metric.key} className={styles.statCard}>
            <img src={metric.icon} alt="" className={styles.statIcon} />
            <strong className={styles.statValue}>
              {metrics ? formatCompactNumber(metrics[metric.key]) : '--'}
            </strong>
            <span className={styles.statLabel}>{metric.label}</span>
          </div>
        ))}
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

function TrendChart({ data, isLoading }) {
  if (isLoading) {
    return <div className={styles.chartPlaceholder}>Đang tải biểu đồ...</div>
  }

  if (!data?.length) {
    return <div className={styles.chartPlaceholder}>Chưa có dữ liệu xu hướng</div>
  }

  // Format data for Recharts - use date or index as label
  const chartData = data.map((point, index) => ({
    name: point.date || `#${index + 1}`,
    views: point.views ?? 0,
    likes: point.likes ?? 0,
    comments: point.comments ?? 0
  }))

  // Custom tooltip formatter
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

function TopVideoList({ videos, isLoading }) {
  if (isLoading) {
    return <div className={styles.videoPlaceholder}>Đang tải danh sách video...</div>
  }

  if (!videos?.length) {
    return <div className={styles.videoPlaceholder}>Chưa có dữ liệu video</div>
  }

  return (
    <div className={styles.videoList}>
      {videos.map((video) => (
        <div key={video.videoId || video.id} className={styles.videoItem}>
          <div className={styles.videoThumb}>
            {video.thumbnailUrl ? (
              <img src={video.thumbnailUrl} alt={video.title} />
            ) : (
              <span>No thumbnail</span>
            )}
          </div>
          <div className={styles.videoInfo}>
            <div className={styles.videoTitle}>{video.title}</div>
            <div className={styles.videoMeta}>
              <span>
                <img src={likeIco} alt="" /> {formatCompactNumber(video.likeCount)}
              </span>
              <span>
                <img src={viewIco} alt="" /> {formatCompactNumber(video.viewCount)}
              </span>
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

function SentimentCard({ sentiment, breakdown, isLoading }) {
  if (isLoading) {
    return <div className={styles.chartPlaceholder} style={{ minHeight: 280 }}>Đang tải phân tích cảm xúc...</div>
  }

  if (!sentiment) {
    return <div className={styles.chartPlaceholder} style={{ minHeight: 280 }}>Chưa có dữ liệu cảm xúc</div>
  }

  const positiveAngle = breakdown.positive * 3.6
  const negativeAngle = breakdown.negative * 3.6
  const neutralAngle = 360 - positiveAngle - negativeAngle

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
