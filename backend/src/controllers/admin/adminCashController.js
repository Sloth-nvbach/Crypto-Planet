const cashService = require('../../services/cashService')
const asyncHandler = require('../../utils/asyncHandler')

// ==================== Quản lý yêu cầu NẠP ====================

exports.listDeposits = asyncHandler(async (req, res) => {
  const data = await cashService.listDepositsForAdmin(req.query)
  res.json({ success: true, data })
})

exports.approveDeposit = asyncHandler(async (req, res) => {
  const request = await cashService.approveDeposit(req.user, req.params.id)
  res.json({ success: true, data: { request }, message: 'Đã duyệt yêu cầu nạp và cộng số dư' })
})

exports.rejectDeposit = asyncHandler(async (req, res) => {
  const request = await cashService.rejectDeposit(req.user, req.params.id, req.body.adminNote)
  res.json({ success: true, data: { request }, message: 'Đã từ chối yêu cầu nạp' })
})

// ==================== Quản lý yêu cầu RÚT ====================

exports.listWithdrawals = asyncHandler(async (req, res) => {
  const data = await cashService.listWithdrawalsForAdmin(req.query)
  res.json({ success: true, data })
})

exports.approveWithdrawal = asyncHandler(async (req, res) => {
  const request = await cashService.approveWithdrawal(req.user, req.params.id)
  res.json({ success: true, data: { request }, message: 'Đã duyệt yêu cầu rút và trừ số dư' })
})

exports.rejectWithdrawal = asyncHandler(async (req, res) => {
  const request = await cashService.rejectWithdrawal(req.user, req.params.id, req.body.adminNote)
  res.json({ success: true, data: { request }, message: 'Đã từ chối yêu cầu rút' })
})
