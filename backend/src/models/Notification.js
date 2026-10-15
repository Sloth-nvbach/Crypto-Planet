const mongoose = require('mongoose')

/**
 * Notifications — thông báo hệ thống do quản trị viên đăng.
 * isPublished=false → ẩn khỏi danh sách người dùng (bản nháp).
 */
const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: [150, 'Tiêu đề tối đa 150 ký tự'],
    },
    content: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
      trim: true,
      maxlength: [2000, 'Nội dung tối đa 2000 ký tự'],
    },
    type: { type: String, enum: ['announcement', 'system', 'maintenance'], default: 'announcement' },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

notificationSchema.index({ isPublished: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
