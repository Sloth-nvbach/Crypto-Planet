/**
 * Định dạng & bảng nhãn tiếng Việt dùng chung toàn app.
 * Nguyên tắc: dữ liệu API là enum tiếng Anh, UI luôn hiển thị tiếng Việt.
 */
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function formatVND(value) {
  const n = Number(value)
  return Number.isFinite(n) ? vndFormatter.format(n) : '—'
}

export function formatNumber(value, maxFractionDigits = 8) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: maxFractionDigits }).format(n)
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', { hour12: false })
}

export const txTypeLabels = {
  trade: 'Giao dịch',
  deposit: 'Nạp tiền',
  withdrawal: 'Rút tiền',
  adjustment: 'Điều chỉnh',
}

export const txStatusLabels = {
  pending: 'Chờ xử lý',
  completed: 'Thành công',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
}

export const sideLabels = {
  buy: 'Mua',
  sell: 'Bán',
}

export const requestStatusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  cancelled: 'Đã hủy',
}

export const ticketStatusLabels = {
  open: 'Đang mở',
  answered: 'Đã phản hồi',
  closed: 'Đã đóng',
}

export const userStatusLabels = {
  active: 'Hoạt động',
  locked: 'Bị khóa',
}

export const roleLabels = {
  user: 'Người dùng',
  admin: 'Quản trị viên',
}

export const notificationTypeLabels = {
  announcement: 'Thông báo',
  system: 'Hệ thống',
  maintenance: 'Bảo trì',
}
