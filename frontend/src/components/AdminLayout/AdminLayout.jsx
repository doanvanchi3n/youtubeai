import { NavLink, Outlet } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import homeIcon from '../../assets/icons/home.svg'
import shieldIcon from '../../assets/icons/shield-account-outline.svg'
import listvideoIcon from '../../assets/icons/listvideo.svg'
import robotIcon from '../../assets/icons/robot-excited-outline.svg'
import settingIcon from '../../assets/icons/setting.svg'
import logoutIcon from '../../assets/icons/logout.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import notificationIcon from '../../assets/icons/notifications.svg'
import styles from './AdminLayout.module.css'

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: homeIcon },
  { to: '/admin/users', label: 'Quản Lý Người Dùng', icon: shieldIcon },
  { to: '/admin/data', label: 'Quản Lý Dữ Liệu', icon: listvideoIcon },
  { to: '/admin/ai', label: 'Quản Lý AI', icon: robotIcon },
  { to: '/admin/settings', label: 'Cấu Hình', icon: settingIcon },
  { to: '/admin/support', label: 'Hỗ Trợ', icon: notificationIcon },
]

function SidebarLink({ to, label, icon }) {
  const linkClass = ({ isActive }) =>
    [
      styles.link,
      isActive ? styles.linkActive : '',
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <NavLink to={to} className={linkClass}>
      <img src={icon} alt="" className={styles.icon} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const today = useMemo(() => {
    const formatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return formatted.toLowerCase()
  }, [])

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandContainer}>
          <div className={styles.brand}>
            <span className={styles.brandYT}>YT</span>
            <span className={styles.brandInsight}>INSIGHT</span>
            <span className={styles.brandAdmin}>ADMIN</span>
          </div>
          <div className={styles.brandLine}>
            <div className={styles.brandLineWhite} />
            <div className={styles.brandLineTeal} />
          </div>
        </div>
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <SidebarLink key={link.to} {...link} />
          ))}
        </nav>
        <button
          type="button"
          className={styles.logout}
          onClick={logout}
        >
          <img src={logoutIcon} alt="" className={styles.icon} />
          <span>Logout</span>
        </button>
      </aside>
      <main className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topbarHeading}>
            <span className={styles.welcome}>Admin Panel</span>
            <img src={chevronIcon} alt="" className={styles.topbarChevron} />
            <span className={styles.date}>{today}</span>
          </div>
          <div className={styles.topbarActions}>
            <button type="button" className={styles.actionButton}>
              <img src={notificationIcon} alt="" className={styles.actionIcon} />
            </button>
            <div
              className={styles.avatar}
              style={
                user?.avatarUrl
                  ? {
                      backgroundImage: `url(${user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }
                  : undefined
              }
            />
          </div>
        </header>
        <div className={styles.page}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

