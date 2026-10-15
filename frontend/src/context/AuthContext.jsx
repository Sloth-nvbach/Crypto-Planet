import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/authApi'

/**
 * AuthContext — quản lý phiên đăng nhập toàn app.
 * - Khi mở trang: nếu có token → GET /auth/me để lấy thông tin mới nhất
 *   (phát hiện được tài khoản vừa bị khóa giữa phiên).
 * - 401 từ bất kỳ API nào → axios interceptor tự xóa token và chuyển /login.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cp_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('cp_token')
        localStorage.removeItem('cp_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const setSession = useCallback((token, newUser) => {
    localStorage.setItem('cp_token', token)
    localStorage.setItem('cp_user', JSON.stringify(newUser))
    setUser(newUser)
  }, [])

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials)
      setSession(res.data.token, res.data.user)
      return res.data.user
    },
    [setSession]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('cp_token')
    localStorage.removeItem('cp_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
