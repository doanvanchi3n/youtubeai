import { useCallback, useEffect, useMemo, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import robotIcon from '../../assets/icons/robot-excited-outline.svg'
import { adminService } from '../../services/adminService'
import styles from './AIManagement.module.css'

const MODEL_TYPES = [
  { key: 'sentiment', label: 'Mô Hình Sentiment' },
  { key: 'emotion', label: 'Mô Hình Emotion' },
  { key: 'topic', label: 'Mô Hình Topic' },
]

const statusBadge = (status, styles) => {
  switch (status) {
    case 'completed':
      return styles.statusBadgeSuccess
    case 'failed':
      return styles.statusBadgeDanger
    default:
      return styles.statusBadgePending
  }
}

export default function AIManagement() {
  const [models, setModels] = useState([])
  const [training, setTraining] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [trainingPagination, setTrainingPagination] = useState({ page: 0, size: 8 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalState, setModalState] = useState({ open: false, modelType: 'sentiment' })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [activating, setActivating] = useState(null)

  const groupedModels = useMemo(() => {
    const result = { sentiment: [], emotion: [], topic: [] }
    models.forEach((model) => {
      const key = model.modelType?.toLowerCase() || 'sentiment'
      if (!result[key]) {
        result[key] = []
      }
      result[key].push(model)
    })
    return result
  }, [models])

  const fetchModels = useCallback(async () => {
    const data = await adminService.getAiModels()
    setModels(data || [])
  }, [])

  const fetchTrainingHistory = useCallback(async () => {
    const data = await adminService.getTrainingHistory({
      page: trainingPagination.page,
      size: trainingPagination.size,
    })
    setTraining(data || { content: [], totalPages: 0, totalElements: 0 })
  }, [trainingPagination.page, trainingPagination.size])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchModels(), fetchTrainingHistory()])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchModels, fetchTrainingHistory])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handlePageChange = (direction) => {
    setTrainingPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1
      if (nextPage < 0 || nextPage >= training.totalPages) {
        return prev
      }
      return { ...prev, page: nextPage }
    })
  }

  useEffect(() => {
    fetchTrainingHistory().catch(() => {})
  }, [fetchTrainingHistory])

  const openUploadModal = (modelType) => {
    setModalState({ open: true, modelType, error: null })
  }

  const closeModal = () => {
    setModalState({ open: false, modelType: 'sentiment', error: null })
    setFormSubmitting(false)
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      modelType: modalState.modelType,
      version: formData.get('version') || '',
      filePath: formData.get('filePath') || '',
      accuracy: formData.get('accuracy') ? Number(formData.get('accuracy')) : undefined,
    }
    if (!payload.filePath.trim()) {
      setModalState((prev) => ({ ...prev, error: 'Vui lòng nhập đường dẫn mô hình' }))
      return
    }
    setFormSubmitting(true)
    try {
      await adminService.uploadAiModel(payload)
      await fetchModels()
      closeModal()
    } catch (err) {
      setModalState((prev) => ({ ...prev, error: err.message }))
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleActivate = async (id) => {
    setActivating(id)
    try {
      await adminService.activateAiModel(id)
      await fetchModels()
    } catch (err) {
      setError(err.message)
    } finally {
      setActivating(null)
    }
  }

  return (
    <div className={styles.screen}>
      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button type="button" onClick={fetchAll}>Thử lại</button>
        </div>
      )}

      <div className={styles.modelHeader}>
        <h2>Mô Hình AI</h2>
        <div className={styles.modelHeaderActions}>
          {MODEL_TYPES.map(({ key, label }) => (
            <button key={key} className={styles.uploadBtn} onClick={() => openUploadModal(key)}>
              Upload {label.replace('Mô Hình ', '')}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.twoColumn}>
        {MODEL_TYPES.slice(0, 2).map(({ key, label }) => (
          <Panel variant="light" key={key}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>{label}</span>
            </div>
            <div className={styles.modelList}>
              {loading ? (
                <div className={styles.loadingState}>Đang tải...</div>
              ) : groupedModels[key].length === 0 ? (
                <div className={styles.emptyState}>Chưa có mô hình nào</div>
              ) : (
                groupedModels[key].map((model) => (
                  <div key={model.id} className={styles.modelItem}>
                    <div className={styles.modelInfo}>
                      <div className={styles.modelIcon}>
                        <img src={robotIcon} alt="" />
                      </div>
                      <div className={styles.modelDetails}>
                        <span className={styles.modelName}>
                          {model.version || 'Unknown Version'}
                        </span>
                        <span className={styles.modelMeta}>
                          Accuracy: {model.accuracy ? `${(model.accuracy * 100).toFixed(2)}%` : 'N/A'}
                        </span>
                        <span className={styles.modelMeta}>
                          Đăng tải: {new Date(model.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className={styles.modelActions}>
                      {model.isActive ? (
                        <span className={styles.activeBadge}>Đang dùng</span>
                      ) : (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleActivate(model.id)}
                          disabled={activating === model.id}
                        >
                          {activating === model.id ? 'Đang kích hoạt' : 'Kích hoạt'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        ))}
      </div>

      {groupedModels.topic.length > 0 && (
        <Panel variant="light">
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Mô Hình Topic</span>
          </div>
          <div className={styles.modelList}>
            {groupedModels.topic.map((model) => (
              <div key={model.id} className={styles.modelItem}>
                <div className={styles.modelInfo}>
                  <div className={styles.modelIcon}>
                    <img src={robotIcon} alt="" />
                  </div>
                  <div className={styles.modelDetails}>
                    <span className={styles.modelName}>{model.version}</span>
                    <span className={styles.modelMeta}>
                      Accuracy: {model.accuracy ? `${(model.accuracy * 100).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className={styles.modelActions}>
                  {model.isActive ? (
                    <span className={styles.activeBadge}>Đang dùng</span>
                  ) : (
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleActivate(model.id)}
                      disabled={activating === model.id}
                    >
                      {activating === model.id ? 'Đang kích hoạt' : 'Kích hoạt'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel variant="light">
        <div className={styles.trainingHeader}>
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Lịch Sử Training</span>
          </div>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Model Type</th>
                <th>Dataset Size</th>
                <th>Accuracy</th>
                <th>Loss</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className={styles.loadingCell}>Đang tải...</td>
                </tr>
              ) : training.content?.length ? (
                training.content.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.modelType}</td>
                    <td>{item.datasetSize?.toLocaleString()} samples</td>
                    <td>{item.accuracy ? `${(item.accuracy * 100).toFixed(2)}%` : 'N/A'}</td>
                    <td>{item.loss?.toFixed(3)}</td>
                    <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={statusBadge(item.status, styles)}>
                        {item.status === 'completed'
                          ? 'Hoàn thành'
                          : item.status === 'failed'
                          ? 'Thất bại'
                          : 'Đang chạy'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.loadingCell}>Chưa có lịch sử training</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={trainingPagination.page === 0}
            onClick={() => handlePageChange('prev')}
          >
            Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {training.totalPages ? trainingPagination.page + 1 : 0} / {training.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={trainingPagination.page + 1 >= training.totalPages}
            onClick={() => handlePageChange('next')}
          >
            Sau
          </button>
        </div>
      </Panel>

      {modalState.open && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Upload mô hình {modalState.modelType}</h3>
            <form className={styles.modalForm} onSubmit={handleUpload}>
              <label>
                Version
                <input name="version" placeholder="v1.0.0" />
              </label>
              <label>
                File Path
                <input name="filePath" placeholder="/models/sentiment-v1.bin" />
              </label>
              <label>
                Accuracy (0-1)
                <input name="accuracy" type="number" step="0.0001" min="0" max="1" />
              </label>
              {modalState.error && <p className={styles.modalError}>{modalState.error}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.actionBtn} onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className={styles.saveBtn} disabled={formSubmitting}>
                  {formSubmitting ? 'Đang upload...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

