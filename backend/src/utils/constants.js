/**
 * Enum dùng chung toàn hệ thống (giá trị enum tiếng Anh, nhãn tiếng Việt hiển thị phía frontend).
 */
const ROLES = ['user', 'admin']
const USER_STATUS = ['active', 'locked']

const TX_TYPES = ['trade', 'deposit', 'withdrawal', 'adjustment']
const TX_STATUS = ['pending', 'completed', 'failed', 'cancelled']
const TX_SIDES = ['buy', 'sell']

const TICKET_STATUS = ['open', 'answered', 'closed']
const NOTIFICATION_TYPES = ['announcement', 'system', 'maintenance']

const AUDIT_ACTIONS = [
  'lock_user',
  'unlock_user',
  'adjust_balance',
  'approve_deposit',
  'reject_deposit',
  'approve_withdrawal',
  'reject_withdrawal',
  'create_cryptocurrency',
  'update_cryptocurrency',
  'create_notification',
  'update_notification',
  'delete_notification',
  'manage_faq',
  'respond_ticket',
]

/**
 * Phí giao dịch tính theo % giá trị lệnh (đã chốt 0.5%).
 * Đọc từ .env để có thể đổi mà không cần sửa code.
 */
const TRADE_FEE_PERCENT = Number.parseFloat(process.env.TRADE_FEE_PERCENT ?? '0.5') || 0

module.exports = {
  ROLES,
  USER_STATUS,
  TX_TYPES,
  TX_STATUS,
  TX_SIDES,
  TICKET_STATUS,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
  TRADE_FEE_PERCENT,
}
