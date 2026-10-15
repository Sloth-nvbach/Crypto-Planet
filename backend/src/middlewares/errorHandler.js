const ApiError = require('../utils/ApiError')

/**
 * Xử lý lỗi TẬP TRUNG cho toàn bộ API — mọi controller chỉ cần throw/ném lỗi,
 * không cần try/catch lặp lại (đã có asyncHandler).
 *
 * Response lỗi luôn theo format:
 *   { "success": false, "message": "<tiếng Việt>", "code": "MÃ_LỖI" }
 *
 * Nguyên tắc an toàn:
 * - Lỗi hệ thống (5xx) chỉ log ra console server, KHÔNG trả stack trace cho client.
 * - Ở production, message lỗi 5xx được thay bằng câu chung.
 */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500
  let code = err.code || 'INTERNAL_ERROR'
  let message = err.message || 'Lỗi hệ thống, vui lòng thử lại sau'
  const isProduction = process.env.NODE_ENV === 'production'

  // Chuyển các lỗi thư viện thành ApiError tương ứng
  if (err.name === 'ValidationError') {
    // Lỗi validator của Mongoose (runValidators)
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = Object.values(err.errors)[0]?.message || 'Dữ liệu không hợp lệ'
  } else if (err.code === 11000) {
    // Trùng unique index (email, symbol, idempotencyKey...)
    statusCode = 409
    code = 'DUPLICATE_KEY'
    message = 'Dữ liệu đã tồn tại (trùng khóa duy nhất)'
  } else if (err.name === 'CastError') {
    statusCode = 404
    code = 'NOT_FOUND'
    message = 'Không tìm thấy bản ghi (ID không hợp lệ)'
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'TOKEN_INVALID'
    message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
  }

  if (statusCode >= 500) {
    console.error('❌ [Lỗi hệ thống]', err)
    if (isProduction) message = 'Lỗi hệ thống, vui lòng thử lại sau'
  }

  res.status(statusCode).json({ success: false, code, message })
}
