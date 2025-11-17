import Panel from '../../components/Panel/Panel.jsx'
import searchIcon from '../../assets/icons/search.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import listvideoIcon from '../../assets/icons/listvideo.svg'
import styles from './DataManagement.module.css'

export default function DataManagement() {
  return (
    <div className={styles.screen}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.tabActive}`}>Lịch Sử Phân Tích</button>
        <button className={styles.tab}>Quản Lý Kênh</button>
        <button className={styles.tab}>Quản Lý Video</button>
      </div>

      <Panel variant="light" className={styles.searchPanel}>
        <div className={styles.searchInput}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input 
            placeholder="Tìm kiếm kênh, video, user..." 
            className={styles.searchField} 
          />
        </div>
      </Panel>

      <Panel variant="light">
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Lịch Sử Phân Tích YouTube</span>
        </div>
        
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
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td>#{2000 + i}</td>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}></div>
                      <span>User{i + 1}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.channelInfo}>
                      <img src={listvideoIcon} alt="" className={styles.channelIcon} />
                      <span>Channel Name {i + 1}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.typeBadge}>Kênh</span>
                  </td>
                  <td>
                    <span className={styles.statusBadge}>Thành Công</span>
                  </td>
                  <td>
                    <div className={styles.dataInfo}>
                      <span>12 videos</span>
                      <span>1,234 comments</span>
                    </div>
                  </td>
                  <td>2024-01-15 14:30</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn}>Xem</button>
                      <button className={styles.actionBtn}>Refresh</button>
                      <button className={styles.actionBtnDanger}>Xóa</button>
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

