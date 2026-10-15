/**
 * ApiError — class lỗi chuẩn của hệ thống.
 * Mọi lỗi nghiệp vụ đều ném ApiError(statusCode, code, message tiếng Việt)
 * và được errorHandler tập trung chuyển thành response JSON thống nhất.
 */
class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode || 500
    this.code = code || 'INTERNAL_ERROR'
  }
}

// Các phím tắt thường dùng cho code gọn hơn
ApiError.badRequest = (code, message) => new ApiError(400, code, message)
ApiError.unauthorized = (code, message) => new ApiError(401, code, message)
ApiError.forbidden = (code, message) => new ApiError(403, code, message)
ApiError.notFound = (code, message) => new ApiError(404, code, message)
ApiError.conflict = (code, message) => new ApiError(409, code, message)

module.exports = ApiError
