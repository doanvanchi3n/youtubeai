import { useCallback, useEffect, useMemo, useState } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import searchIcon from '../../assets/icons/search.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import { adminService } from '../../services/adminService'
import styles from './UserManagement.module.css'

const statusLabel = (user) => {
  if (user.isLocked) return 'Locked'
  return 'Active'
}

const statusClass = (user, styles) => (user.isLocked ? styles.statusBadgeDanger : styles.statusBadge)

export default function UserManagement() {
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 0, size: 10 })
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalState, setModalState] = useState({ type: null, open: false })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getUsers({
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
    fetchUsers()
  }, [fetchUsers])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setPagination((prev) => ({ ...prev, page: 0 }))
    fetchUsers()
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

  const openModal = (type, user, extras = {}) => {
    setSelectedUser(user)
    setModalState({ type, open: true, ...extras })
  }

  const closeModal = () => {
    setSelectedUser(null)
    setModalState({ type: null, open: false })
  }

  const refreshAfterAction = async (action, payload) => {
    if (!selectedUser) return
    try {
      switch (action) {
        case 'lock':
          await adminService.lockUser(selectedUser.id)
          break
        case 'unlock':
          await adminService.unlockUser(selectedUser.id)
          break
        case 'delete':
          await adminService.deleteUser(selectedUser.id)
          break
        case 'updateRole':
          await adminService.updateUserRole(selectedUser.id, payload)
          break
        case 'updateProfile':
          await adminService.updateUser(selectedUser.id, payload)
          break
        default:
          break
      }
      closeModal()
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const modalContent = useMemo(() => {
    if (!modalState.open || !selectedUser) return null
    switch (modalState.type) {
      case 'view':
        return (
          <div className={styles.modalContent}>
            <h3>Thông tin người dùng</h3>
            <div className={styles.modalBody}>
              <div>
                <label>Username</label>
                <p>{selectedUser.username}</p>
              </div>
              <div>
                <label>Email</label>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <label>Role</label>
                <p>{selectedUser.role}</p>
              </div>
              <div>
                <label>Trạng thái</label>
                <p>{selectedUser.isLocked ? 'Đã khóa' : 'Hoạt động'}</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.actionBtn}>Đóng</button>
            </div>
          </div>
        )
      case 'edit':
        return (
          <div className={styles.modalContent}>
            <h3>Chỉnh sửa thông tin</h3>
            <form
              className={styles.modalForm}
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const payload = {
                  username: formData.get('username') || selectedUser.username,
                  email: formData.get('email') || selectedUser.email,
                }
                refreshAfterAction('updateProfile', payload)
              }}
            >
              <label>
                Username
                <input name="username" defaultValue={selectedUser.username} />
              </label>
              <label>
                Email
                <input name="email" defaultValue={selectedUser.email} />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.actionBtn}>Hủy</button>
                <button type="submit" className={styles.saveBtn}>Lưu</button>
              </div>
            </form>
          </div>
        )
      case 'role':
        return (
          <div className={styles.modalContent}>
            <h3>Cập nhật quyền hạn</h3>
            <form
              className={styles.modalForm}
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const payload = formData.get('role') || selectedUser.role
                refreshAfterAction('updateRole', payload)
              }}
            >
              <label>
                Role
                <select name="role" defaultValue={selectedUser.role}>
                  <option value="USER">USER</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.actionBtn}>Hủy</button>
                <button type="submit" className={styles.saveBtn}>Cập nhật</button>
              </div>
            </form>
          </div>
        )
      case 'confirm':
        return (
          <div className={styles.modalContent}>
            <h3>Xác nhận thao tác</h3>
            <p>Bạn có chắc chắn muốn {modalState.actionLabel} người dùng này không?</p>
            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.actionBtn}>Hủy</button>
              <button
                className={styles.actionBtnDanger}
                onClick={() => refreshAfterAction(modalState.action)}
              >
                Đồng ý
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }, [modalState, selectedUser])

  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.searchPanel}>
        <form className={styles.searchInput} onSubmit={handleSearchSubmit}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input 
            placeholder="Tìm kiếm người dùng (email, username)..." 
            className={styles.searchField}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Danh Sách Người Dùng</span>
        </div>
        
        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button type="button" onClick={fetchUsers}>Thử lại</button>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Ngày Tạo</th>
                <th>Số Kênh</th>
                <th>Trạng Thái</th>
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
                  <td colSpan="8" className={styles.loadingCell}>Không có dữ liệu</td>
                </tr>
              ) : (
                data.content.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}></div>
                        <span>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={styles.roleBadge}>{user.role}</span>
                    </td>
                    <td>{user.createdAt?.slice(0, 10)}</td>
                    <td>{user.channelCount}</td>
                    <td>
                      <span className={statusClass(user, styles)}>{statusLabel(user)}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => openModal('view', user)}>Xem</button>
                        <button className={styles.actionBtn} onClick={() => openModal('edit', user)}>Sửa</button>
                        <button className={styles.actionBtn} onClick={() => openModal('role', user)}>Role</button>
                        <button
                          className={styles.actionBtnDanger}
                          onClick={() =>
                            openModal('confirm', user, {
                              action: user.isLocked ? 'unlock' : 'lock',
                              actionLabel: user.isLocked ? 'mở khóa' : 'khóa',
                            })
                          }
                        >
                          {user.isLocked ? 'Mở khóa' : 'Khóa'}
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

