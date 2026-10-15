const mongoose = require('mongoose')

/**
 * DepositRequests — yêu cầu nạp tiền VND mô phỏng.
 * Vòng đời: pending → approved (Admin duyệt → cộng ví VND) hoặc rejected (số dư KHÔNG đổi).
 * Việc duyệt dùng update nguyên tử {status: 'pending'} → chặn duyệt 2 lần.
 */
const depositRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountVND: {
      type: Number,
      required: [true, 'Số tiền nạp là bắt buộc'],
      min: [1, 'Số tiền nạp phải lớn hơn 0'],
      set: (v) => Math.round(Number(v) || 0),
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true, maxlength: [300, 'Ghi chú tối đa 300 ký tự'], default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
  },
  { timestamps: true }
)

depositRequestSchema.index({ status: 1, createdAt: -1 })
depositRequestSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('DepositRequest', depositRequestSchema)
