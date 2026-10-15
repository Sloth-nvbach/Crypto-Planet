const cashService = require('../services/cashService')
const asyncHandler = require('../utils/asyncHandler')

// ==================== Nạp tiền mô phỏng ====================

exports.createDeposit = asyncHandler(async (req, res) => {
  const request = await cashService.createDeposit(req.user, req.body.amountVND)
  res.status(201).json({
    success: true,
    data: { request },
    message: 'Đã gửi yêu cầu nạp tiền. Vui lòng chờ quản trị viên phê duyệt.',
  })
})

exports.listMyDeposits = asyncHandler(async (req, res) => {
  const data = await cashService.listMyDeposits(req.user._id, req.query)
  res.json({ success: true, data })
})

// ==================== Rút tiền mô phỏng ====================

exports.createWithdrawal = asyncHandler(async (req, res) => {
  const request = await cashService.createWithdrawal(req.user, req.body.amountVND)
  res.status(201).json({
    success: true,
    data: { request },
    message: 'Đã gửi yêu cầu rút tiền. Vui lòng chờ quản trị viên phê duyệt.',
  })
})

exports.listMyWithdrawals = asyncHandler(async (req, res) => {
  const data = await cashService.listMyWithdrawals(req.user._id, req.query)
  res.json({ success: true, data })
})

/**
 * Hủy yêu cầu rút đang chờ duyệt (tùy chọn — chỉ đổi trạng thái, không đụng số dư).
 */
exports.cancelMyWithdrawal = asyncHandler(async (req, res) => {
  const request = await cashService.cancelMyWithdrawal(req.user, req.params.id)
  res.json({ success: true, data: { request }, message: 'Đã hủy yêu cầu rút tiền' })
})
