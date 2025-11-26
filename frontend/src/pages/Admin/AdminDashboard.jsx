import { useCallback, useEffect, useMemo, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import shieldIcon from '../../assets/icons/shield-account-outline.svg'
import listvideoIcon from '../../assets/icons/listvideo.svg'
import previewIcon from '../../assets/icons/preview-open.svg'
import commentIcon from '../../assets/icons/comment-multiple-outline.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import { adminService } from '../../services/adminService'
import styles from './AdminDashboard.module.css'

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '--'
  }
  return value.toLocaleString('vi-VN')
}

const serverDefinitions = [
  { key: 'backend', label: 'Backend Server', fallbackMeta: 'localhost:8080' },
  { key: 'aiModule', label: 'AI Module', fallbackMeta: 'localhost:5000' },
  { key: 'database', label: 'Database', fallbackMeta: 'MySQL' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [serverStatus, setServerStatus] = useState({})
  const [apiRequests, setApiRequests] = useState([])
  const [activities, setActivities] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const metrics = useMemo(() => ([
    {
      label: 'Tổng Người Dùng',
      value: stats?.totalUsers,
      icon: shieldIcon,
    },
    {
      label: 'Kênh Đã Phân Tích',
      value: stats?.totalChannels,
      icon: listvideoIcon,
    },
    {
      label: 'API Requests Hôm Nay',
      value: stats?.apiRequestsToday,
      icon: previewIcon,
    },
    {
      label: 'Tổng Bình Luận',
      value: stats?.totalComments,
      icon: commentIcon,
    },
  ]), [stats])

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const [
        dashboardStats,
        status,
        apiStats,
        activityItems,
        recentLogs,
      ] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getServerStatus(),
        adminService.getApiRequestStats({ days: 14 }),
        adminService.getRecentActivities({ limit: 8 }),
        adminService.getRecentLogs({ limit: 5 }),
      ])
      setStats(dashboardStats)
      setServerStatus(status || {})
      setApiRequests(apiStats || [])
      setActivities(activityItems || [])
      setLogs(recentLogs || [])
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu dashboard')
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const statusLabel = (status) => {
    if (!status) return 'Đang kiểm tra'
    switch (status) {
      case 'online':
      case 'connected':
        return 'Online'
      case 'offline':
      case 'disconnected':
        return 'Offline'
      default:
        return status
    }
  }

  const statusClass = (status) => {
    if (!status) return styles.statusUnknown
    if (status === 'online' || status === 'connected') {
      return styles.statusOnline
    }
    if (status === 'offline' || status === 'disconnected') {
      return styles.statusOffline
    }
    return styles.statusUnknown
  }

  const chartMax = useMemo(() => {
    if (!apiRequests.length) return 0
    return Math.max(...apiRequests.map((item) => item.totalRequests || 0), 1)
  }, [apiRequests])

  const formatDateLabel = (value) => {
    const date = new Date(value)
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`
  }

  const formatRelativeTime = (value) => {
    if (!value) return 'Không rõ thời gian'
    const date = new Date(value)
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  return (
    <div className={styles.screen}>
      <div className={styles.dashboardHeader}>
        <div>
          <h2 className={styles.dashboardTitle}>Tổng Quan Hệ Thống</h2>
          {lastUpdated && (
            <p className={styles.dashboardSubtitle}>
              Cập nhật lần cuối {lastUpdated.toLocaleTimeString('vi-VN')}
            </p>
          )}
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => fetchDashboard({ silent: Boolean(stats) })}
          disabled={loading || refreshing}
        >
          {refreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
        </button>
      </div>

      {error && (
        <div className={styles.inlineError}>
          <span>{error}</span>
          <button type="button" onClick={() => fetchDashboard()}>
            Thử lại
          </button>
        </div>
      )}

      <div className={styles.metricsRow}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.statCard}>
            <img src={metric.icon} alt="" className={styles.statIcon} />
            <strong className={styles.statValue}>
              {loading && !stats ? '...' : formatNumber(metric.value)}
            </strong>
            <span className={styles.statLabel}>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Trạng Thái Server</span>
          </div>
          <div className={styles.serverStatus}>
            {serverDefinitions.map(({ key, label, fallbackMeta }) => {
              const info = serverStatus?.[key] || {}
              return (
                <div key={key} className={styles.serverItem}>
                  <div className={styles.serverInfo}>
                    <span className={styles.serverName}>{label}</span>
                    <span className={styles.serverUrl}>{info.url || info.type || fallbackMeta}</span>
                  </div>
                  <div className={`${styles.statusBadge} ${statusClass(info.status)}`}>
                    <span className={styles.statusDot}></span>
                    {statusLabel(info.status)}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>API Requests Theo Ngày</span>
          </div>
          {apiRequests.length ? (
            <div className={styles.barChart}>
              {apiRequests.map((item) => (
                <div key={item.date} className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${((item.totalRequests || 0) / chartMax) * 100}%`,
                    }}
                  >
                    <span className={styles.barValue}>{item.totalRequests}</span>
                  </div>
                  <span className={styles.barLabel}>{formatDateLabel(item.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.chartPlaceholder}>
              <span className={styles.placeholderText}>Chưa có dữ liệu thống kê</span>
            </div>
          )}
        </Panel>
      </div>

      <div className={styles.twoColumn}>
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Tăng Trưởng Người Dùng</span>
          </div>
          <div className={styles.chartPlaceholder}>
            <span className={styles.placeholderText}>Đang chờ dữ liệu phân tích</span>
          </div>
        </Panel>

        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Log Lỗi Gần Đây</span>
          </div>
          <div className={styles.errorLogs}>
            {logs.length === 0 ? (
              <div className={styles.stateMessage}>
                Chưa ghi nhận lỗi nào trong thời gian gần đây.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={styles.errorItem}>
                  <div className={styles.errorInfo}>
                    <span className={styles.errorType}>{log.level}</span>
                    <span className={styles.errorMessage}>{log.message}</span>
                  </div>
                  <span className={styles.errorTime}>{formatRelativeTime(log.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Hoạt Động Gần Đây</span>
        </div>
        <div className={styles.activityList}>
          {activities.length === 0 ? (
            <div className={styles.stateMessage}>
              Chưa có hoạt động nào được ghi nhận.
            </div>
          ) : (
            activities.map((activity) => (
              <div key={`${activity.userId}-${activity.channelId}-${activity.timestamp}`} className={styles.activityItem}>
                <div className={styles.activityIcon}></div>
                <div className={styles.activityContent}>
                  <div className={styles.activityText}>
                    <strong>{activity.username}</strong> {activity.action}{' '}
                    <strong>{activity.channelName}</strong>
                  </div>
                  <span className={styles.activityTime}>{formatRelativeTime(activity.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}

