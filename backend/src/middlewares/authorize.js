const ApiError = require('../utils/ApiError')

/**
 * Phân quyền theo vai trò — dùng sau middleware auth.
 *
 * Cách dùng:
 *   router.get('/stats', auth, authorize('admin'), controller.stats)
 *   router.get('/x', auth, authorize('user', 'admin'), controller.x)
 *
 * Quyền thật sự luôn nằm ở backend — frontend chỉ ẩn/hiện cho đẹp UI.
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('UNAUTHORIZED', 'Vui lòng đăng nhập để tiếp tục'))
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này'))
  }
  next()
}

// Phím tắt cho các route quản trị
const requireAdmin = authorize('admin')

module.exports = { authorize, requireAdmin }
