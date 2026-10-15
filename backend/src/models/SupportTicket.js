const mongoose = require('mongoose')

/**
 * SupportTickets — yêu cầu hỗ trợ của người dùng.
 * Trạng thái: open (Đang mở) → answered (Đã phản hồi) → closed (Đã đóng).
 * MVP: mỗi ticket có 1 phản hồi của admin (adminResponse).
 */
const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      minlength: [5, 'Tiêu đề phải từ 5 ký tự'],
      maxlength: [100, 'Tiêu đề tối đa 100 ký tự'],
    },
    message: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
      trim: true,
      minlength: [10, 'Nội dung phải từ 10 ký tự'],
      maxlength: [2000, 'Nội dung tối đa 2000 ký tự'],
    },
    status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
    adminResponse: { type: String, trim: true, maxlength: [2000, 'Phản hồi tối đa 2000 ký tự'], default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
)

supportTicketSchema.index({ userId: 1, createdAt: -1 })
supportTicketSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('SupportTicket', supportTicketSchema)
