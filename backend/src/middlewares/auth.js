const jwt = require('jsonwebtoken')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const User = require('../models/User')

/**
 * Middleware xác thực JWT — bảo vệ mọi API riêng tư.
 *
 * Vấn đề quan trọng:
 * - Không chỉ verify chữ ký token, mà còn tải user từ DB để kiểm tra:
 *   1) tài khoản còn tồn tại, 2) KHÔNG bị khóa (status 'locked' → 403 ngay lập tức).
 * - req.user là nguồn duy nhất của userId/role ở mọi controller —
 *   KHÔNG BAO GIỜ tin userId/role do client gửi lên.
 */
module.exports = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('MISSING_TOKEN', 'Vui lòng đăng nhập để tiếp tục')
  }
  const token = header.slice(7).trim()
  if (!token) {
    throw ApiError.unauthorized('MISSING_TOKEN', 'Vui lòng đăng nhập để tiếp tục')
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    const expired = err && err.name === 'TokenExpiredError'
    throw ApiError.unauthorized(
      'TOKEN_INVALID',
      expired ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Phiên đăng nhập không hợp lệ.'
    )
  }

  const user = await User.findById(payload.userId)
  if (!user) {
    throw ApiError.unauthorized('USER_NOT_FOUND', 'Tài khoản không còn tồn tại')
  }
  if (user.status === 'locked') {
    throw ApiError.forbidden('ACCOUNT_LOCKED', 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
  }

  req.user = user // gắn user đã xác thực vào request
  next()
})
