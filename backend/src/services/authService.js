const jwt = require('jsonwebtoken')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')

/**
 * Đăng ký / đăng nhập / hồ sơ — bcryptjs + JWT.
 * Lưu ý bảo mật:
 * - Không bao giờ tiết lộ trường nào sai khi đăng nhập (một thông báo chung).
 * - Tài khoản bị khóa vẫn đăng nhập bị chặn ngay (403).
 * - JWT payload chỉ chứa userId + role; role thật luôn đọc lại từ DB ở middleware auth.
 */
function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

async function register({ name, email, password }) {
  const existing = await User.findOne({ email })
  if (existing) {
    throw ApiError.conflict('EMAIL_EXISTS', 'Email đã tồn tại trong hệ thống')
  }
  const user = await User.create({ name, email, password })
  return { token: signToken(user), user: user.toPublic() }
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw ApiError.unauthorized('LOGIN_FAILED', 'Email hoặc mật khẩu không đúng')
  }
  const ok = await user.comparePassword(password)
  if (!ok) {
    throw ApiError.unauthorized('LOGIN_FAILED', 'Email hoặc mật khẩu không đúng')
  }
  if (user.status === 'locked') {
    throw ApiError.forbidden('ACCOUNT_LOCKED', 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
  }
  return { token: signToken(user), user: user.toPublic() }
}

async function updateProfile(user, { name }) {
  const updated = await User.findByIdAndUpdate(user._id, { name }, { new: true, runValidators: true })
  return updated.toPublic()
}

async function changePassword(user, { currentPassword, newPassword }) {
  const found = await User.findById(user._id).select('+password')
  const ok = await found.comparePassword(currentPassword)
  if (!ok) {
    throw ApiError.badRequest('WRONG_PASSWORD', 'Mật khẩu hiện tại không đúng')
  }
  found.password = newPassword // pre-save hook của model tự hash
  await found.save()
  return found.toPublic()
}

module.exports = { register, login, updateProfile, changePassword }
