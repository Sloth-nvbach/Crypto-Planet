const walletService = require('../services/walletService')
const asyncHandler = require('../utils/asyncHandler')

/**
 * Số dư từng loại tài sản + tổng giá trị quy đổi VND của user hiện tại.
 */
exports.getWallets = asyncHandler(async (req, res) => {
  const data = await walletService.getWalletSummary(req.user._id)
  res.json({ success: true, data })
})

/**
 * Lịch sử biến động số dư (sổ cái) — ?currencySymbol=&page=&limit=
 */
exports.getHistories = asyncHandler(async (req, res) => {
  const data = await walletService.listHistories(req.user._id, req.query)
  res.json({ success: true, data })
})
