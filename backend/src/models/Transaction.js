const mongoose = require('mongoose')
const { TX_TYPES, TX_STATUS, TX_SIDES } = require('../utils/constants')

/**
 * Transactions — bản ghi nghiệp vụ cho MỌI thay đổi số dư:
 *   trade (mua/bán), deposit (nạp được duyệt), withdrawal (rút được duyệt),
 *   adjustment (điều chỉnh bởi admin).
 *
 * - price là giá ĐƯỢC KHÓA tại thời điểm thực hiện — backend tự đọc, không nhận từ client.
 * - idempotencyKey + unique sparse index theo user → chặn gửi lại cùng request
 *   làm trừ tiền / cộng tài sản nhiều lần.
 * - status 'pending' chỉ tồn tại trong tích tắc khi giao dịch đang chạy;
 *   'failed' dùng cho giao dịch lỗi giữa chừng (sau khi đã hoàn tiền).
 */
const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TX_TYPES, required: true },
    side: { type: String, enum: TX_SIDES }, // 'buy' | 'sell' — chỉ áp dụng type='trade'
    currencySymbol: { type: String, required: true, uppercase: true, trim: true },
    quantity: { type: Number, required: true, min: [0, 'Số lượng không hợp lệ'] },
    price: { type: Number, required: true, min: [0, 'Giá không hợp lệ'] },
    totalValueVND: { type: Number, required: true, min: [0, 'Giá trị không hợp lệ'] },
    feeVND: { type: Number, default: 0, min: [0, 'Phí không hợp lệ'] },
    status: { type: String, enum: TX_STATUS, default: 'pending' },
    idempotencyKey: { type: String, trim: true, maxlength: 64 },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // DepositRequest/WithdrawalRequest liên quan
    note: { type: String, trim: true, maxlength: [500, 'Ghi chú tối đa 500 ký tự'], default: '' },
  },
  { timestamps: true }
)

// 1 user + 1 key = 1 giao dịch duy nhất.
// Dùng PARTIAL INDEX (không dùng sparse): chỉ những giao dịch CÓ idempotencyKey
// mới vào index → bản ghi không có key không bị ràng buộc uniqueness.
// (Sparse index phức hợp vẫn đánh index mọi bản ghi vì userId luôn tồn tại → lỗi trùng null.)
transactionSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
)
transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ status: 1 })
transactionSchema.index({ type: 1 })
transactionSchema.index({ currencySymbol: 1 })

module.exports = mongoose.model('Transaction', transactionSchema)
