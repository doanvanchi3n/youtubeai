import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const handleAnalyze = async (event) => {
    event.preventDefault()
    if (!searchValue.trim()) {
      return
    }
    try {
      setError(null)
      const result = await dashboardService.analyzeUrl(searchValue.trim())
      const resolvedChannelId =
        result?.channelId ||
        result?.youtubeChannelId ||
        result?.channel?.channelId ||
        result?.channel?.id ||
        result?.id

      if (!resolvedChannelId) {
        throw new Error('Không xác định được channelId từ kết quả phân tích')
      }

      await loadDashboard(resolvedChannelId)
      setSearchValue('')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể phân tích URL. Vui lòng thử lại.')
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
          <button type="submit" className={styles.searchButton} disabled={loading || refreshing}>
            Phân tích
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
        {(error || loading || refreshing) && (
          <div className={styles.statusRow}>
            {error && <span className={styles.errorText}>{error}</span>}
            {(loading || refreshing) && (
              <span className={styles.statusText}>
                {loading ? 'Đang tải dashboard...' : 'Đang làm mới dữ liệu...'}
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

  const maxValue = Math.max(
    ...data.map((point) => Math.max(point.views ?? 0, point.likes ?? 0, point.comments ?? 0)),
    1
  )

  const buildPolyline = (key) => {
    if (data.length === 1) {
      const value = (data[0][key] ?? 0) / maxValue
      const y = 100 - value * 100
      return `0,${y} 100,${y}`
    }

    return data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * 100
        const normalized = (point[key] ?? 0) / maxValue
        const y = 100 - normalized * 100
        return `${x},${Math.max(0, Math.min(100, y))}`
      })
      .join(' ')
  }

  return (
    <div className={styles.lineChart}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={buildPolyline('views')} stroke="#2ECFB9" />
        <polyline points={buildPolyline('likes')} stroke="#4D7CFE" />
        <polyline points={buildPolyline('comments')} stroke="#FFAD5B" />
      </svg>
      <div className={styles.legend}>
        <span>
          <i style={{ backgroundColor: '#2ECFB9' }} />
          Views
        </span>
        <span>
          <i style={{ backgroundColor: '#4D7CFE' }} />
          Likes
        </span>
        <span>
          <i style={{ backgroundColor: '#FFAD5B' }} />
          Comments
        </span>
      </div>
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
