const tradingService = require('../services/tradingService')
const asyncHandler = require('../utils/asyncHandler')

/**
 * Tạo lệnh mua/bán (lệnh thị trường).
 * Body: { symbol, side: 'buy'|'sell', quantity, idempotencyKey }
 * Lưu ý: KHÔNG có trường giá — backend tự đọc giá hiện tại từ DB.
 */
exports.createTrade = asyncHandler(async (req, res) => {
  const result = await tradingService.executeTrade(req.user, req.body)
  const sideText = req.body.side === 'buy' ? 'Mua' : 'Bán'
  res.status(result.replayed ? 200 : 201).json({
    success: true,
    data: result,
    message: result.replayed
      ? 'Yêu cầu đã được xử lý trước đó — trả về kết quả lần thực hiện đầu tiên'
      : `${sideText} ${req.body.symbol.toUpperCase()} thành công`,
  })
})

/**
 * Lịch sử giao dịch của user hiện tại + bộ lọc + phân trang.
 */
exports.listTrades = asyncHandler(async (req, res) => {
  const data = await tradingService.listTrades(req.user._id, req.query)
  res.json({ success: true, data })
})

/**
 * Chi tiết 1 giao dịch (chỉ chủ sở hữu xem được).
 */
exports.getTrade = asyncHandler(async (req, res) => {
  const trade = await tradingService.getTradeById(req.user._id, req.params.id)
  res.json({ success: true, data: { trade } })
})
