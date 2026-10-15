const authService = require('../services/authService')
const asyncHandler = require('../utils/asyncHandler')

/**
 * Đăng ký tài khoản — thành công trả luôn token (tự động đăng nhập).
 */
exports.register = asyncHandler(async (req, res) => {
  const { token, user } = await authService.register(req.body)
  res.status(201).json({ success: true, data: { token, user }, message: 'Đăng ký tài khoản thành công' })
})

exports.login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body)
  res.json({ success: true, data: { token, user }, message: 'Đăng nhập thành công' })
})

/**
 * Thông tin tài khoản hiện tại (middleware auth đã gắn req.user).
 */
exports.getMe = (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublic() } })
}

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user, req.body)
  res.json({ success: true, data: { user }, message: 'Cập nhật thông tin thành công' })
})

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user, req.body)
  res.json({ success: true, data: { user }, message: 'Đổi mật khẩu thành công' })
})

/**
 * Đăng xuất — MVP không duy trì blacklist token phía server;
 * client xóa token khỏi localStorage là đủ (đã ghi rõ trong thiết kế).
 */
exports.logout = (_req, res) => {
  res.json({ success: true, message: 'Đã đăng xuất. Hãy xóa token trên client.' })
}
