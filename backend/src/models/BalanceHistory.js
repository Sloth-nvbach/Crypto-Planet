const mongoose = require('mongoose')

/**
 * BalanceHistories — SỔ CÁI đối soát từng ví.
 * Mỗi khi availableBalance của một ví thay đổi (mua, bán, nạp, rút, điều chỉnh,
 * hoàn tiền lỗi...) đều ghi 1 dòng, bảo đảm:
 *   balanceBefore + changeAmount = balanceAfter
 * và dòng mới nhất khớp với availableBalance hiện tại của ví.
 * Mọi dòng đều gắn với 1 Transaction (transactionId bắt buộc) để truy vết nguồn.
 */
const balanceHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    changeAmount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: [300, 'Lý do tối đa 300 ký tự'] },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // sổ cái không sửa sau khi ghi
)

balanceHistorySchema.index({ userId: 1, createdAt: -1 })
balanceHistorySchema.index({ walletId: 1, createdAt: -1 })
balanceHistorySchema.index({ transactionId: 1 })

module.exports = mongoose.model('BalanceHistory', balanceHistorySchema)
