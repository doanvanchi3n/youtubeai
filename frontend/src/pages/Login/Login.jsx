export default function Login() {
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: '#e9fbf6', color: '#1db59c', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
            <img src="/src/assets/icons/preview-open.svg" alt="" style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ margin: 0 }}>Chào Mừng Trở Lại</h2>
          <div className="muted" style={{ marginBottom: 6 }}>Đăng nhập để tiếp tục</div>
        </div>
        <label className="muted">Email</label>
        <input className="input" placeholder="ten@email.com" />
        <label className="muted">Mật khẩu</label>
        <input className="input" placeholder="Nhập mật khẩu" type="password" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input id="remember" type="checkbox" />
          <label htmlFor="remember" className="muted">Ghi nhớ đăng nhập</label>
        </div>
        <button className="btn">Đăng Nhập</button>
        <div style={{ height: 1, background: '#eef2f4', margin: '6px 0' }} />
        <button className="input" style={{ display: 'grid', gridAutoFlow: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff' }}>
          <img src="/src/assets/icons/search.svg" alt="" style={{ width: 18, height: 18 }} />
          Đăng nhập với Google
        </button>
        <div className="muted" style={{ textAlign: 'center' }}>
          Chưa có tài khoản? <a href="#" style={{ color: '#1db59c' }}>Đăng ký ngay</a>
        </div>
      </div>
    </div>
  )
}


