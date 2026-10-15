import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Layout quản trị — tách biệt hoàn toàn giao diện người dùng:
 * sidebar tối bên trái + vùng nội dung riêng.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">🪐 Crypto Planet</div>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            📊 Tổng quan
          </NavLink>
          <NavLink to="/admin/users">👥 Người dùng</NavLink>
          <NavLink to="/admin/cryptos">🪙 Tiền điện tử</NavLink>
          <NavLink to="/admin/transactions">📋 Giao dịch</NavLink>
          <NavLink to="/admin/cash">💰 Nạp / Rút</NavLink>
          <NavLink to="/admin/tickets">🎧 Hỗ trợ</NavLink>
          <NavLink to="/admin/content">📢 Nội dung</NavLink>
          <div className="admin-divider" />
          <Link to="/">← Về trang người dùng</Link>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar-title">Trang quản trị hệ thống</span>
          <div className="header-actions">
            <span className="user-chip">👤 {user?.name}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
