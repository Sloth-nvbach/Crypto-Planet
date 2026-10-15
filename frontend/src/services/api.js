import axios from 'axios'

// API_URL mặc định trỏ về backend local — có thể ghi đè bằng file .env (VITE_API_URL)
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL, timeout: 20000 })

// Gắn JWT vào mọi request nếu đã đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Bóc tách response → mọi service nhận thẳng { success, data, message }
// và xử lý 401 tập trung (trừ trường hợp đăng nhập sai mật khẩu)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    const isLoginRequest = (error.config?.url || '').includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('cp_token')
      localStorage.removeItem('cp_user')
      if (!['/login', '/register'].includes(window.location.pathname)) {
        window.location.assign('/login')
      }
    }
    return Promise.reject({ status, message, data: error.response?.data })
  }
)

export default api
