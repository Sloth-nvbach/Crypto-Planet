const Cryptocurrency = require('../../models/Cryptocurrency')
const marketService = require('../../services/marketService')
const auditService = require('../../services/auditService')
const ApiError = require('../../utils/ApiError')
const asyncHandler = require('../../utils/asyncHandler')
const { normalizeSymbol } = require('../../utils/string')

/**
 * Danh sách ĐẦY ĐỦ tài sản cho admin (kể cả đang ẩn).
 */
exports.list = asyncHandler(async (_req, res) => {
  const items = await marketService.listAllCryptocurrencies()
  res.json({ success: true, data: { items } })
})

/**
 * Thêm tài sản mới — trùng symbol nhận 409.
 */
exports.create = asyncHandler(async (req, res) => {
  const { name, symbol, currentPriceVND, changePercent = 0, description = '', isActive = true } = req.body
  let coin
  try {
    coin = await Cryptocurrency.create({ name, symbol, currentPriceVND, changePercent, description, isActive })
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('SYMBOL_EXISTS', 'Mã tài sản đã tồn tại trong hệ thống')
    }
    throw err
  }
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'create_cryptocurrency',
    targetType: 'cryptocurrency',
    targetId: coin._id,
    details: `Thêm tài sản ${coin.symbol}`,
  })
  res.status(201).json({ success: true, data: { cryptocurrency: coin }, message: 'Đã thêm tài sản mới' })
})

/**
 * Cập nhật tài sản (tên, giá, biến động, mô tả, ẩn/hiện).
 * KHÔNG cho sửa symbol — Wallets/Transactions tham chiếu symbol bằng chuỗi.
 */
exports.update = asyncHandler(async (req, res) => {
  const coin = await Cryptocurrency.findOne({ symbol: normalizeSymbol(req.params.symbol) })
  if (!coin) throw ApiError.notFound('CRYPTO_NOT_FOUND', 'Không tìm thấy tài sản')

  if (req.body.symbol && normalizeSymbol(req.body.symbol) !== coin.symbol) {
    throw ApiError.badRequest('SYMBOL_IMMUTABLE', 'Không thể thay đổi mã tài sản (ví và giao dịch đang tham chiếu mã này)')
  }

  const { name, currentPriceVND, changePercent, description, isActive } = req.body
  if (name !== undefined) coin.name = name
  if (currentPriceVND !== undefined) coin.currentPriceVND = currentPriceVND
  if (changePercent !== undefined) coin.changePercent = changePercent
  if (description !== undefined) coin.description = description
  if (isActive !== undefined) coin.isActive = isActive
  await coin.save()

  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'update_cryptocurrency',
    targetType: 'cryptocurrency',
    targetId: coin._id,
    details:
      isActive !== undefined
        ? `Cập nhật ${coin.symbol} → ${coin.isActive ? 'hiển thị' : 'ẩn'}`
        : `Cập nhật ${coin.symbol}`,
  })
  res.json({ success: true, data: { cryptocurrency: coin }, message: 'Đã cập nhật tài sản' })
})
