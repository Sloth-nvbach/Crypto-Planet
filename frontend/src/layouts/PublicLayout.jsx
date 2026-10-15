import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Layout công khai: header + nội dung (Outlet) + footer.
 * Cả trang người dùng lẫn trang quản trị đều nằm trong khung này theo cấu trúc route lồng nhau.
 */
export default function PublicLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="shell">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            🪐 Crypto Planet
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              Trang chủ
            </NavLink>
            <NavLink to="/market">Thị trường</NavLink>
            {user && <NavLink to="/wallet">Tài sản</NavLink>}
            {user && <NavLink to="/trade">Giao dịch</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Quản trị</NavLink>}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/profile" className="user-chip">
                  👤 {user.name}
                </Link>
                <button type="button" className="btn btn-sm btn-ghost" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-sm btn-ghost" to="/login">
                  Đăng nhập
                </Link>
                <Link className="btn btn-sm btn-primary" to="/register">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            🪐 <strong>Crypto Planet</strong> — dự án học tập MERN Stack. Đây là sàn giao dịch{' '}
            <strong>MÔ PHỎNG</strong>, mọi số dư và giao dịch đều không phải tiền thật.
          </p>
        </div>
      </footer>
    </div>
  )
}
