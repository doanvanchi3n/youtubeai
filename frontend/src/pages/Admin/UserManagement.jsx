import Panel from '../../components/Panel/Panel.jsx'
import searchIcon from '../../assets/icons/search.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import styles from './UserManagement.module.css'

export default function UserManagement() {
  return (
    <div className={styles.screen}>
      <Panel variant="light" className={styles.searchPanel}>
        <div className={styles.searchInput}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input 
            placeholder="Tìm kiếm người dùng (email, username)..." 
            className={styles.searchField} 
          />
        </div>
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Danh Sách Người Dùng</span>
        </div>
        
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
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td>#{1000 + i}</td>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}></div>
                      <span>User{i + 1}</span>
                    </div>
                  </td>
                  <td>user{i + 1}@example.com</td>
                  <td>
                    <span className={styles.roleBadge}>USER</span>
                  </td>
                  <td>2024-01-15</td>
                  <td>{Math.floor(Math.random() * 5)}</td>
                  <td>
                    <span className={styles.statusBadge}>Active</span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn}>Xem</button>
                      <button className={styles.actionBtn}>Sửa</button>
                      <button className={styles.actionBtnDanger}>Khóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button className={styles.pageBtn}>Trước</button>
          <span className={styles.pageInfo}>Trang 1 / 10</span>
          <button className={styles.pageBtn}>Sau</button>
        </div>
      </Panel>
    </div>
  )
}

