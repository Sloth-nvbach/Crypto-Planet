const User = require('../../models/User')
const Cryptocurrency = require('../../models/Cryptocurrency')
const Transaction = require('../../models/Transaction')
const walletService = require('../../services/walletService')
const auditService = require('../../services/auditService')
const ApiError = require('../../utils/ApiError')
const asyncHandler = require('../../utils/asyncHandler')
const { escapeRegex, normalizeSymbol } = require('../../utils/string')
const { parsePagination, buildPageResult } = require('../../utils/pagination')
const { roundVND, roundQuantity } = require('../../utils/round')
const { TX_TYPES, TX_STATUS, USER_STATUS } = require('../../utils/constants')

/**
 * Danh sách người dùng — tìm kiếm theo tên/email, lọc trạng thái, phân trang.
 */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const filter = {}
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i')
    filter.$or = [{ name: rx }, { email: rx }]
  }
  if (req.query.status && USER_STATUS.includes(req.query.status)) filter.status = req.query.status
  const [total, items] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  res.json({ success: true, data: buildPageResult(items.map((u) => u.toPublic()), total, { page, limit }) })
})

/**
 * Chi tiết 1 người dùng: thông tin + ví + tổng hợp hoạt động.
 */
exports.detail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Không tìm thấy người dùng')
  const [wallets, tradeCount, depositCount, withdrawalCount] = await Promise.all([
    walletService.getWalletSummary(user._id),
    Transaction.countDocuments({ userId: user._id, type: 'trade' }),
    Transaction.countDocuments({ userId: user._id, type: 'deposit' }),
    Transaction.countDocuments({ userId: user._id, type: 'withdrawal' }),
  ])
  res.json({
    success: true,
    data: { user: user.toPublic(), wallets, summary: { tradeCount, depositCount, withdrawalCount } },
  })
})

/**
 * Khóa / mở khóa tài khoản — bắt buộc lý do, ghi audit log.
 * Tài khoản bị khóa bị chặn NGAY ở middleware auth (403) dù token vẫn còn hạn.
 */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Không tìm thấy người dùng')
  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('CANNOT_LOCK_SELF', 'Bạn không thể khóa/mở khóa chính tài khoản của mình')
  }
  user.status = status
  await user.save()
  await auditService.writeAudit({
    actorId: req.user._id,
    action: status === 'locked' ? 'lock_user' : 'unlock_user',
    targetType: 'user',
    targetId: user._id,
    reason,
  })
  res.json({
    success: true,
    data: { user: user.toPublic() },
    message: status === 'locked' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
  })
})

/**
 * ĐIỀU CHỈNH SỐ DƯ (phục vụ kiểm thử) — quy tắc nghiêm ngặt:
 * - reason BẮT BUỘC (kiểm tra ở route validator).
 * - Luôn tạo Transaction(adjustment) + BalanceHistory + AuditLog → minh bạch, đối soát được.
 * - Không cho phép số dư âm (đi qua debitWallet có điều kiện $gte).
 */
exports.adjustBalance = asyncHandler(async (req, res) => {
  const { currencySymbol, changeAmount, reason } = req.body
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Không tìm thấy người dùng')

  const sym = normalizeSymbol(currencySymbol)
  let price = 1
  if (sym !== walletService.VND) {
    const coin = await Cryptocurrency.findOne({ symbol: sym })
    if (!coin) throw ApiError.badRequest('CRYPTO_NOT_FOUND', `Tài sản ${sym} không tồn tại trong hệ thống`)
    price = coin.currentPriceVND
  }
  const amount = sym === walletService.VND ? roundVND(changeAmount) : roundQuantity(changeAmount)

  const tx = await Transaction.create({
    userId: user._id,
    type: 'adjustment',
    currencySymbol: sym,
    quantity: Math.abs(amount),
    price,
    totalValueVND: roundVND(Math.abs(amount) * price),
    feeVND: 0,
    status: 'pending',
    note: reason,
  })

  try {
    await walletService.adjustWallet(user._id, sym, amount, {
      transactionId: tx._id,
      reason: `Điều chỉnh bởi quản trị viên: ${reason}`,
    })
    tx.status = 'completed'
    await tx.save({ validateBeforeSave: false })
  } catch (err) {
    tx.status = 'failed'
    await tx.save({ validateBeforeSave: false }).catch(() => {})
    throw err // ví dụ: INSUFFICIENT_BALANCE khi điều chỉnh vượt số dư
  }

  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'adjust_balance',
    targetType: 'user',
    targetId: user._id,
    reason,
    details: `${sym} ${amount > 0 ? '+' : ''}${amount}`,
  })

  const wallets = await walletService.getWalletSummary(user._id)
  res.json({ success: true, data: { transaction: tx, wallets }, message: 'Đã điều chỉnh số dư' })
})

/**
 * Toàn bộ giao dịch của 1 người dùng (mọi loại: trade/deposit/withdrawal/adjustment).
 */
exports.userTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const filter = { userId: req.params.id }
  if (req.query.type && TX_TYPES.includes(req.query.type)) filter.type = req.query.type
  if (req.query.status && TX_STATUS.includes(req.query.status)) filter.status = req.query.status
  const [total, items] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  res.json({ success: true, data: buildPageResult(items, total, { page, limit }) })
})

/**
 * Sổ cái biến động số dư của 1 người dùng.
 */
exports.userHistories = asyncHandler(async (req, res) => {
  const data = await walletService.listHistories(req.params.id, req.query)
  res.json({ success: true, data })
})
