const mongoose = require('mongoose')

/**
 * Wallets — ví tài sản của người dùng.
 * - Mỗi user có nhiều ví: 1 ví VND + 1 ví cho mỗi loại crypto từng nắm giữ.
 * - Unique index {userId, currencySymbol} bảo đảm 1 user chỉ có 1 ví mỗi loại tài sản.
 * - availableBalance không được âm — an toàn thật sự đến từ update nguyên tử
 *   có điều kiện $gte trong walletService (không phải check tách riêng).
 */
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currencySymbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: [0, 'Số dư không được âm'],
    },
  },
  { timestamps: true }
)

walletSchema.index({ userId: 1, currencySymbol: 1 }, { unique: true })

module.exports = mongoose.model('Wallet', walletSchema)
