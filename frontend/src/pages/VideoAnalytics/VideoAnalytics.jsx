import { useCallback, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Panel from '../../components/Panel/Panel.jsx'
import bellIcon from '../../assets/icons/notifications.svg'
import videoIcon from '../../assets/icons/listvideo.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import { dashboardService } from '../../services/dashboardService'
import { videoAnalyticsService } from '../../services/videoAnalyticsService'
import styles from './VideoAnalytics.module.css'

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

export default function VideoAnalytics() {
  const [activeTab, setActiveTab] = useState('View')
  const tabs = ['View', 'Like', 'Comment']
  const [channelInfo, setChannelInfo] = useState(null)
  const [viewGrowthData, setViewGrowthData] = useState([])
  const [interactionData, setInteractionData] = useState([])
  const [optimalPostingTime, setOptimalPostingTime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      // Chỉ gọi API cần thiết - tái sử dụng trends từ Dashboard
      const [metrics, trends, optimalTime] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getTrends(),
        videoAnalyticsService.getOptimalPostingTime()
      ])

      setChannelInfo({
        name: metrics?.channelName,
        avatarUrl: metrics?.avatarUrl,
        subscriberCount: metrics?.subscriberCount,
        videoCount: metrics?.totalVideos
      })

      // Tính toán view growth từ trends (views tăng thêm mỗi ngày)
      if (trends?.points) {
        const viewGrowthPoints = trends.points.map((point, index) => {
          const prevPoint = index > 0 ? trends.points[index - 1] : null
          const viewGrowth = prevPoint 
            ? Math.max(0, (point.views || 0) - (prevPoint.views || 0))
            : (point.views || 0)
          const growthRate = prevPoint && prevPoint.views > 0
            ? ((viewGrowth / prevPoint.views) * 100)
            : (viewGrowth > 0 ? 100 : 0)
          
          return {
            date: point.date,
            viewGrowth,
            growthRate: Math.round(growthRate * 100) / 100
          }
        })
        setViewGrowthData(viewGrowthPoints)
      }

      // Lấy interaction data từ trends (ban đầu là view)
      if (trends?.points) {
        const interactionPoints = trends.points.map(point => ({
          date: point.date,
          value: point.views || 0
        }))
        setInteractionData(interactionPoints)
      }

      setOptimalPostingTime(optimalTime)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể tải dữ liệu phân tích video')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTabChange = useCallback(async (tab) => {
    setActiveTab(tab)
    // Tải lại trends để lấy dữ liệu mới nhất
    try {
      const trends = await dashboardService.getTrends()
      if (trends?.points) {
        const type = tab.toLowerCase()
        const interactionPoints = trends.points.map(point => {
          let value = 0
          if (type === 'view') {
            value = point.views || 0
          } else if (type === 'like') {
            value = point.likes || 0
          } else if (type === 'comment') {
            value = point.comments || 0
          }
          return {
            date: point.date,
            value
          }
        })
        setInteractionData(interactionPoints)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Không thể tải dữ liệu tương tác')
    }
  }, [])

  return (
    <div className={styles.screen}>
      {channelInfo && (
        <Panel variant="light" className={styles.channel}>
          <div
            className={styles.avatar}
            style={
              channelInfo.avatarUrl
                ? {
                    backgroundImage: `url(${channelInfo.avatarUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }
                : undefined
            }
          />
          <div className={styles.info}>
            <div className={styles.name}>{channelInfo.name || 'Chưa có tên kênh'}</div>
            <div className={styles.meta}>
              <span>
                <img src={bellIcon} alt="" />
                {formatCompactNumber(channelInfo.subscriberCount)} Subscribers
              </span>
              <span>
                <img src={videoIcon} alt="" />
                {formatCompactNumber(channelInfo.videoCount)} Video
              </span>
            </div>
          </div>
        </Panel>
      )}

      {error && (
        <Panel variant="light" className={styles.errorPanel}>
          <div className={styles.errorText}>{error}</div>
        </Panel>
      )}

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Phân tích tốc độ tăng view (biểu đồ đường)</span>
        </div>
        {loading ? (
          <div className={styles.placeholder}>Đang tải dữ liệu...</div>
        ) : viewGrowthData.length > 0 ? (
          <ViewGrowthChart data={viewGrowthData} />
        ) : (
          <div className={styles.placeholder}>Chưa có dữ liệu</div>
        )}
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Biểu đồ tương tác theo thời gian (biểu đồ đường)</span>
        </div>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {loading ? (
          <div className={styles.placeholder}>Đang tải dữ liệu...</div>
        ) : interactionData.length > 0 ? (
          <InteractionChart data={interactionData} type={activeTab} />
        ) : (
          <div className={styles.placeholder}>Chưa có dữ liệu</div>
        )}
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Gợi ý thời điểm tăng hiệu quả</span>
        </div>
        {loading ? (
          <div className={styles.placeholder}>Đang tải dữ liệu...</div>
        ) : optimalPostingTime ? (
          <OptimalPostingTimeCard data={optimalPostingTime} />
        ) : (
          <div className={styles.placeholder}>Chưa có dữ liệu</div>
        )}
      </Panel>
    </div>
  )
}

function ViewGrowthChart({ data }) {
  const chartData = data.map((point) => ({
    name: point.date || '',
    viewGrowth: point.viewGrowth ?? 0,
    growthRate: point.growthRate ?? 0
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipTitle}>{payload[0].payload.name}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name === 'viewGrowth' ? 'Tăng view: ' : 'Tỷ lệ tăng: '}
              {entry.name === 'viewGrowth'
                ? formatCompactNumber(entry.value)
                : `${entry.value.toFixed(2)}%`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.chartContainer}>
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
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
          <Line
            type="monotone"
            dataKey="viewGrowth"
            stroke="#2ECFB9"
            strokeWidth={3}
            dot={{ fill: '#2ECFB9', r: 4 }}
            activeDot={{ r: 6 }}
            name="Tăng view"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function InteractionChart({ data, type }) {
  const chartData = data.map((point) => ({
    name: point.date || '',
    value: point.value ?? 0
  }))

  const colors = {
    View: '#2ECFB9',
    Like: '#4D7CFE',
    Comment: '#FFAD5B'
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipTitle}>{payload[0].payload.name}</p>
          <p style={{ color: payload[0].color }}>
            {type}: {formatCompactNumber(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.chartContainer}>
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
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors[type] || '#2ECFB9'}
            strokeWidth={3}
            dot={{ fill: colors[type] || '#2ECFB9', r: 4 }}
            activeDot={{ r: 6 }}
            name={type}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function OptimalPostingTimeCard({ data }) {
  if (!data || (!data.optimalHours?.length && !data.optimalDays?.length)) {
    return <div className={styles.placeholder}>Chưa có dữ liệu để phân tích</div>
  }

  return (
    <div className={styles.optimalTimeCard}>
      {data.optimalHours?.length > 0 && (
        <div className={styles.optimalSection}>
          <h4 className={styles.optimalTitle}>Giờ tốt nhất:</h4>
          <div className={styles.optimalList}>
            {data.optimalHours.map((hour) => (
              <span key={hour} className={styles.optimalTag}>
                {hour}:00
              </span>
            ))}
          </div>
        </div>
      )}
      {data.optimalDays?.length > 0 && (
        <div className={styles.optimalSection}>
          <h4 className={styles.optimalTitle}>Ngày tốt nhất:</h4>
          <div className={styles.optimalList}>
            {data.optimalDays.map((day) => (
              <span key={day} className={styles.optimalTag}>
                {day}
              </span>
            ))}
          </div>
        </div>
      )}
      {data.recommendations?.length > 0 && (
        <div className={styles.recommendationsSection}>
          <h4 className={styles.optimalTitle}>Gợi ý cụ thể:</h4>
          <ul className={styles.recommendationsList}>
            {data.recommendations.map((rec, index) => (
              <li key={index} className={styles.recommendationItem}>
                <strong>{rec.time}</strong>
                <span>{rec.reason}</span>
                <span className={styles.engagementBadge}>
                  Dự kiến: {Math.round(rec.expectedEngagement * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
