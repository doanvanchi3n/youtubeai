import { useCallback, useEffect, useMemo, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import searchIcon from '../../assets/icons/search.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import { adminService } from '../../services/adminService'
import styles from './SupportTools.module.css'

const STATUS_MAP = {
  open: { label: 'Mở', className: 'statusOpen' },
  pending: { label: 'Đang xử lý', className: 'statusPending' },
  closed: { label: 'Đã đóng', className: 'statusClosed' },
}

export default function SupportTools() {
  const [search, setSearch] = useState('')
  const [tickets, setTickets] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [ticketPagination, setTicketPagination] = useState({ page: 0, size: 6 })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [responding, setResponding] = useState(false)
  const [ticketFilter, setTicketFilter] = useState('open')
  const [logs, setLogs] = useState({ content: [], totalPages: 0 })
  const [logPagination, setLogPagination] = useState({ page: 0, size: 12 })
  const [logFilter, setLogFilter] = useState({ level: '', source: 'backend' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    const data = await adminService.getSupportTickets({
      page: ticketPagination.page,
      size: ticketPagination.size,
      search,
      status: ticketFilter !== 'all' ? ticketFilter : undefined,
    })
    setTickets(data || { content: [], totalPages: 0, totalElements: 0 })
  }, [ticketPagination.page, ticketPagination.size, search, ticketFilter])

  const fetchLogs = useCallback(async () => {
    const data = await adminService.getSystemLogs({
      page: logPagination.page,
      size: logPagination.size,
      level: logFilter.level || undefined,
      source: logFilter.source || undefined,
    })
    setLogs(data || { content: [], totalPages: 0 })
  }, [logPagination.page, logPagination.size, logFilter.level, logFilter.source])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchTickets(), fetchLogs()])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchTickets, fetchLogs])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    fetchTickets().catch(() => {})
  }, [fetchTickets])

  useEffect(() => {
    fetchLogs().catch(() => {})
  }, [fetchLogs])

  const handleTicketPageChange = (direction) => {
    setTicketPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1
      if (nextPage < 0 || nextPage >= tickets.totalPages) {
        return prev
      }
      return { ...prev, page: nextPage }
    })
  }

  const handleLogPageChange = (direction) => {
    setLogPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1
      if (nextPage < 0 || nextPage >= logs.totalPages) {
        return prev
      }
      return { ...prev, page: nextPage }
    })
  }

  const openTicket = (ticket) => {
    setSelectedTicket(ticket)
    setResponseMessage('')
  }

  const closeTicket = () => {
    setSelectedTicket(null)
    setResponseMessage('')
  }

  const handleRespond = async (event) => {
    event.preventDefault()
    if (!selectedTicket || !responseMessage.trim()) return
    setResponding(true)
    try {
      await adminService.respondToTicket(selectedTicket.id, { message: responseMessage.trim() })
      closeTicket()
      fetchTickets()
    } catch (err) {
      setError(err.message)
    } finally {
      setResponding(false)
    }
  }

  const ticketStatusInfo = (status) => STATUS_MAP[status] || { label: status, className: 'statusOpen' }

  const logTabs = [
    { key: '', label: 'Tất cả' },
    { key: 'ERROR', label: 'Error' },
    { key: 'WARN', label: 'Warn' },
    { key: 'INFO', label: 'Info' },
  ]

  const logSources = [
    { key: '', label: 'Tất cả' },
    { key: 'backend', label: 'Backend' },
    { key: 'aiModule', label: 'AI Module' },
    { key: 'youtube', label: 'YouTube API' },
  ]

  return (
    <div className={styles.screen}>
      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button type="button" onClick={fetchAll}>Thử lại</button>
        </div>
      )}

      <Panel variant="light" className={styles.searchPanel}>
        <form className={styles.searchInput} onSubmit={(e) => { e.preventDefault(); fetchTickets() }}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input
            placeholder="Tìm kiếm tickets theo tiêu đề..."
            className={styles.searchField}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>Tìm</button>
        </form>
      </Panel>

      <div className={styles.twoColumn}>
        <Panel variant="light">
        <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>Support Tickets</span>
            </div>
            <div className={styles.filterGroup}>
              {['all', 'open', 'pending', 'closed'].map((status) => (
                <button
                  key={status}
                  className={`${styles.filterBtn} ${ticketFilter === status ? styles.filterBtnActive : ''}`}
                  onClick={() => setTicketFilter(status)}
                >
                  {status === 'all' ? 'Tất cả' : STATUS_MAP[status]?.label || status}
                </button>
              ))}
            </div>
          </div>
  
          <div className={styles.ticketList}>
            {loading ? (
              <div className={styles.loadingState}>Đang tải tickets...</div>
            ) : tickets.content.length === 0 ? (
              <div className={styles.emptyState}>Không có ticket nào</div>
            ) : (
              tickets.content.map((ticket) => {
                const statusInfo = ticketStatusInfo(ticket.status)
                return (
                  <div key={ticket.id} className={styles.ticketItem}>
                    <div className={styles.ticketHeader}>
                      <div className={styles.ticketInfo}>
                        <span className={styles.ticketId}>#{ticket.id}</span>
                        <span className={styles.ticketTitle}>{ticket.title}</span>
                      </div>
                      <span className={`${styles.ticketStatus} ${styles[statusInfo.className]}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className={styles.ticketMeta}>
                      <span>{ticket.userName}</span>
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className={styles.ticketActions}>
                      <button className={styles.actionBtn} onClick={() => openTicket(ticket)}>
                        Xem
                      </button>
                      <button className={styles.actionBtn}>Phản hồi</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
  
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={ticketPagination.page === 0}
              onClick={() => handleTicketPageChange('prev')}
            >
              Trước
            </button>
            <span className={styles.pageInfo}>
              Trang {tickets.totalPages ? ticketPagination.page + 1 : 0} / {tickets.totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={ticketPagination.page + 1 >= tickets.totalPages}
              onClick={() => handleTicketPageChange('next')}
            >
              Sau
            </button>
          </div>
        </Panel>
  
        <Panel variant="light">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>System Logs</span>
            </div>
            <div className={styles.logFilters}>
              <div className={styles.logTabs}>
                {logTabs.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.logTab} ${logFilter.level === key ? styles.logTabActive : ''}`}
                    onClick={() => setLogFilter((prev) => ({ ...prev, level: key }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <select
                className={styles.logSourceSelect}
                value={logFilter.source}
                onChange={(e) => setLogFilter((prev) => ({ ...prev, source: e.target.value }))}
              >
                {logSources.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.logContainer}>
            {loading ? (
              <div className={styles.loadingState}>Đang tải logs...</div>
            ) : logs.content.length === 0 ? (
              <div className={styles.emptyState}>Không có log nào</div>
            ) : (
              logs.content.map((log) => (
                <div key={log.id} className={styles.logItem}>
                  <span className={`${styles.logLevel} ${styles[`log${log.level}`]}`}>
                    {log.level}
                  </span>
                  <span className={styles.logMessage}>{log.message}</span>
                  <span className={styles.logTime}>
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={logPagination.page === 0}
              onClick={() => handleLogPageChange('prev')}
            >
              Trước
            </button>
            <span className={styles.pageInfo}>
              Trang {logs.totalPages ? logPagination.page + 1 : 0} / {logs.totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={logPagination.page + 1 >= logs.totalPages}
              onClick={() => handleLogPageChange('next')}
            >
              Sau
            </button>
          </div>
        </Panel>
      </div>

      {selectedTicket && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Ticket #{selectedTicket.id}</h3>
            <p className={styles.modalTitle}>{selectedTicket.title}</p>
            <p className={styles.modalDescription}>{selectedTicket.description}</p>
            <form className={styles.modalForm} onSubmit={handleRespond}>
              <textarea
                className={styles.modalTextarea}
                placeholder="Nhập phản hồi..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.actionBtn} onClick={closeTicket}>
                  Đóng
                </button>
                <button type="submit" className={styles.saveBtn} disabled={responding}>
                  {responding ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

