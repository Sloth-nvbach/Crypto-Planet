const marketService = require('../services/marketService')
const asyncHandler = require('../utils/asyncHandler')

/**
 * Danh sách tiền điện tử đang hỗ trợ — CÔNG KHAI.
 * Query: ?q=tìm kiếm&sort=price|change|name&order=asc|desc&page=&limit=
 */
exports.list = asyncHandler(async (req, res) => {
  const data = await marketService.listCryptocurrencies(req.query)
  res.json({ success: true, data })
})

/**
 * Chi tiết 1 tài sản theo mã (BTC, ETH...) — CÔNG KHAI.
 */
exports.detail = asyncHandler(async (req, res) => {
  const { coin, feePercent } = await marketService.getCryptocurrency(req.params.symbol)
  res.json({ success: true, data: { cryptocurrency: coin, feePercent } })
})
