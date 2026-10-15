const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10

/**
 * Users — tài khoản người dùng và quản trị viên.
 * Bảo mật:
 * - password CHỈ lưu hash bcryptjs, schema đặt select:false nên mặc định
 *   mọi truy vấn (và mọi response JSON) sẽ KHÔNG chứa mật khẩu (dù đã hash).
 * - unique index trên email → đăng ký trùng email nhận lỗi 11000 → 409.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên hiển thị là bắt buộc'],
      trim: true,
      minlength: [2, 'Tên hiển thị phải từ 2 ký tự'],
      maxlength: [50, 'Tên hiển thị tối đa 50 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải từ 6 ký tự'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'locked'],
      default: 'active',
    },
  },
  { timestamps: true }
)

// Tự động hash mật khẩu khi tạo mới hoặc đổi mật khẩu qua .save()
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
  next()
})

// So sánh mật khẩu thô với hash (đăng nhập, đổi mật khẩu)
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// Object an toàn để trả về client — không bao giờ chứa mật khẩu
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

module.exports = mongoose.model('User', userSchema)
