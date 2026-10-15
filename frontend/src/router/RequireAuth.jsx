import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/common/Spinner'

/**
 * Route guard — chặn truy cập trang khi chưa đăng nhập / không đúng vai trò.
 * Lưu ý: guard này chỉ phục vụ trải nghiệm UI; quyền thật sự luôn do backend quyết định.
 */
export default function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Đang tải thông tin tài khoản..." />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}
