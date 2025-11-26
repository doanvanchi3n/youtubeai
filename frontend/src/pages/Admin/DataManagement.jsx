import { useCallback, useEffect, useMemo, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import searchIcon from '../../assets/icons/search.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import listvideoIcon from '../../assets/icons/listvideo.svg'
import { adminService } from '../../services/adminService'
import styles from './DataManagement.module.css'

const analysisTypeLabel = (type) => {
  if (type === 'video') return 'Video'
  return 'Kênh'
}

const statusLabel = (status) => {
  switch (status) {
    case 'success':
      return 'Thành công'
    case 'failed':
      return 'Thất bại'
    default:
      return 'Đang chờ'
  }
}

const statusClass = (status, styles) => {
  if (status === 'success') return styles.statusBadgeSuccess
  if (status === 'failed') return styles.statusBadgeDanger
  return styles.statusBadgePending
}

const formatDateTime = (value) => {
  if (!value) return 'Chưa đồng bộ'
  const date = new Date(value)
  return date.toLocaleString('vi-VN')
}

export default function DataManagement() {
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 0, size: 10 })
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalState, setModalState] = useState({ open: false })
  const [rowAction, setRowAction] = useState({ id: null, action: null })

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getAnalysisHistory({
        page: pagination.page,
        size: pagination.size,
        search,
      })
      setData(response)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.size, search])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setPagination((prev) => ({ ...prev, page: 0 }))
    fetchHistory()
  }

  const handlePageChange = (direction) => {
    setPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1
      if (nextPage < 0 || nextPage >= data.totalPages) {
        return prev
      }
      return { ...prev, page: nextPage }
    })
  }

  const openModal = (record) => {
    setSelectedRecord(record)
    setModalState({ open: true })
  }

  const closeModal = () => {
    setSelectedRecord(null)
    setModalState({ open: false })
  }

  const handleRefresh = async (record) => {
    setRowAction({ id: record.id, action: 'refresh' })
    try {
      await adminService.refreshChannelData(record.id)
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setRowAction({ id: null, action: null })
    }
  }

  const handleDelete = async (record) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa lịch sử phân tích của ${record.channelName}?`)) {
      return
    }
    setRowAction({ id: record.id, action: 'delete' })
    try {
      await adminService.deleteChannel(record.id)
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setRowAction({ id: null, action: null })
    }
  }

  const modalContent = useMemo(() => {
    if (!modalState.open || !selectedRecord) return null
    return (
      <div className={styles.modalContent}>
        <h3>Chi tiết phân tích</h3>
        <div className={styles.modalBody}>
          <div>
            <label>Kênh</label>
            <p>{selectedRecord.channelName}</p>
          </div>
          <div>
            <label>User</label>
            <p>{selectedRecord.username} ({selectedRecord.userEmail || 'N/A'})</p>
          </div>
          <div>
            <label>Video đã lấy</label>
            <p>{selectedRecord.videoCount?.toLocaleString()} video</p>
          </div>
          <div>
            <label>Bình luận đã lấy</label>
            <p>{selectedRecord.commentCount?.toLocaleString()} bình luận</p>
          </div>
          <div>
            <label>Lần đồng bộ cuối</label>
            <p>{formatDateTime(selectedRecord.syncedAt)}</p>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button onClick={closeModal} className={styles.actionBtn}>Đóng</button>
        </div>
      </div>
    )
  }, [modalState, selectedRecord])

  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.searchPanel}>
        <form className={styles.searchInput} onSubmit={handleSearchSubmit}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input 
            placeholder="Tìm kiếm kênh, video, user..." 
            className={styles.searchField}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Lịch Sử Phân Tích YouTube</span>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button type="button" onClick={fetchHistory}>Thử lại</button>
          </div>
        )}
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Kênh/Video</th>
                <th>Loại</th>
                <th>Trạng Thái</th>
                <th>Dữ Liệu Đã Lấy</th>
                <th>Thời Gian</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className={styles.loadingCell}>Đang tải...</td>
                </tr>
              ) : data.content.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.loadingCell}>Chưa có lịch sử phân tích</td>
                </tr>
              ) : (
                data.content.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}></div>
                        <span>{item.username}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.channelInfo}>
                        <img src={listvideoIcon} alt="" className={styles.channelIcon} />
                        <span>{item.channelName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.typeBadge}>{analysisTypeLabel(item.analysisType)}</span>
                    </td>
                    <td>
                      <span className={statusClass(item.status, styles)}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dataInfo}>
                        <span>{item.videoCount?.toLocaleString()} videos</span>
                        <span>{item.commentCount?.toLocaleString()} comments</span>
                      </div>
                    </td>
                    <td>{formatDateTime(item.syncedAt || item.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => openModal(item)}>Xem</button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleRefresh(item)}
                          disabled={rowAction.id === item.id && rowAction.action === 'refresh'}
                        >
                          {rowAction.id === item.id && rowAction.action === 'refresh' ? 'Đang đồng bộ' : 'Refresh'}
                        </button>
                        <button
                          className={styles.actionBtnDanger}
                          onClick={() => handleDelete(item)}
                          disabled={rowAction.id === item.id && rowAction.action === 'delete'}
                        >
                          {rowAction.id === item.id && rowAction.action === 'delete' ? 'Đang xóa' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.page === 0}
            onClick={() => handlePageChange('prev')}
          >
            Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {data.totalPages ? pagination.page + 1 : 0} / {data.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.page + 1 >= data.totalPages}
            onClick={() => handlePageChange('next')}
          >
            Sau
          </button>
        </div>
      </Panel>

      {modalState.open && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>{modalContent}</div>
        </div>
      )}
    </div>
  )
}

