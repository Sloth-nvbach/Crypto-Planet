const mongoose = require('mongoose')

/**
 * WithdrawalRequests — yêu cầu rút tiền VND mô phỏng.
 * Vòng đời: pending → approved (trừ ví VND tại thời điểm duyệt, có kiểm tra đủ tiền)
 * hoặc rejected / cancelled (số dư KHÔNG đổi).
 * 'cancelled' = người dùng tự hủy khi yêu cầu còn đang chờ.
 */
const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountVND: {
      type: Number,
      required: [true, 'Số tiền rút là bắt buộc'],
      min: [1, 'Số tiền rút phải lớn hơn 0'],
      set: (v) => Math.round(Number(v) || 0),
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true, maxlength: [300, 'Ghi chú tối đa 300 ký tự'], default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
  },
  { timestamps: true }
)

withdrawalRequestSchema.index({ status: 1, createdAt: -1 })
withdrawalRequestSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema)
