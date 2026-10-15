const DepositRequest = require('../models/DepositRequest')
const WithdrawalRequest = require('../models/WithdrawalRequest')
const Transaction = require('../models/Transaction')
const walletService = require('./walletService')
const auditService = require('./auditService')
const ApiError = require('../utils/ApiError')
const { parsePagination, buildPageResult } = require('../utils/pagination')
const { roundVND } = require('../utils/round')

const MIN_DEPOSIT_VND = parseInt(process.env.MIN_DEPOSIT_VND, 10) || 50000
const MIN_WITHDRAWAL_VND = parseInt(process.env.MIN_WITHDRAWAL_VND, 10) || 50000

const CASH_STATUSES = ['pending', 'approved', 'rejected', 'cancelled']

function formatVNDShort(n) {
  return `${new Intl.NumberFormat('vi-VN').format(n)} ₫`
}

// ==================== NẠP TIỀN (mô phỏng) ====================

/**
 * Người dùng tạo yêu cầu nạp — CHƯA thay đổi số dư, chờ Admin phê duyệt.
 */
async function createDeposit(user, amountVND) {
  const amount = roundVND(amountVND)
  if (amount < MIN_DEPOSIT_VND) {
    throw ApiError.badRequest('INVALID_AMOUNT', `Số tiền nạp tối thiểu là ${formatVNDShort(MIN_DEPOSIT_VND)}`)
  }
  return DepositRequest.create({ userId: user._id, amountVND: amount, status: 'pending' })
}

async function listMyDeposits(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = { userId }
  if (query.status && CASH_STATUSES.includes(query.status)) filter.status = query.status
  const [total, items] = await Promise.all([
    DepositRequest.countDocuments(filter),
    DepositRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  return buildPageResult(items, total, { page, limit })
}

async function listDepositsForAdmin(query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = {}
  if (query.status && CASH_STATUSES.includes(query.status)) filter.status = query.status
  if (query.userId) filter.userId = query.userId
  const [total, items] = await Promise.all([
    DepositRequest.countDocuments(filter),
    DepositRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('processedBy', 'name'),
  ])
  return buildPageResult(items, total, { page, limit })
}

/**
 * Admin DUYỆT nạp:
 * 1. Atomic pending → approved (chặn duyệt 2 lần — request thứ 2 nhận 409).
 * 2. Tạo Transaction(deposit) rồi cộng ví VND qua walletService (kèm sổ cái).
 * 3. Nếu cộng tiền lỗi → trả request về pending + giao dịch failed để duyệt lại sau.
 */
async function approveDeposit(admin, requestId) {
  const request = await DepositRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'approved', processedBy: admin._id, processedAt: new Date() },
    { new: true }
  )
  if (!request) {
    throw ApiError.conflict('REQUEST_NOT_PENDING', 'Yêu cầu nạp đã được xử lý hoặc không tồn tại')
  }

  let tx = null
  try {
    tx = await Transaction.create({
      userId: request.userId,
      type: 'deposit',
      currencySymbol: 'VND',
      quantity: request.amountVND,
      price: 1,
      totalValueVND: request.amountVND,
      feeVND: 0,
      status: 'pending',
      referenceId: request._id,
    })
    await walletService.creditWallet(request.userId, 'VND', request.amountVND, {
      transactionId: tx._id,
      reason: 'Nạp tiền được phê duyệt',
    })
    tx.status = 'completed'
    await tx.save({ validateBeforeSave: false })
  } catch (err) {
    console.error('❌ Lỗi khi duyệt nạp:', err.message)
    if (tx) {
      tx.status = 'failed'
      await tx.save({ validateBeforeSave: false }).catch(() => {})
    }
    await DepositRequest.updateOne(
      { _id: request._id },
      { status: 'pending', $unset: { processedBy: '', processedAt: '' } }
    )
    throw new ApiError(500, 'DEPOSIT_APPROVE_FAILED', 'Duyệt yêu cầu nạp thất bại do lỗi hệ thống. Vui lòng thử lại.')
  }

  await auditService.writeAudit({
    actorId: admin._id,
    action: 'approve_deposit',
    targetType: 'request',
    targetId: request._id,
    reason: `Duyệt nạp ${formatVNDShort(request.amountVND)}`,
  })
  return request
}

/**
 * Admin TỪ CHỐI nạp — chỉ đổi trạng thái, số dư KHÔNG thay đổi.
 */
async function rejectDeposit(admin, requestId, adminNote = '') {
  const request = await DepositRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'rejected', adminNote, processedBy: admin._id, processedAt: new Date() },
    { new: true }
  )
  if (!request) {
    throw ApiError.conflict('REQUEST_NOT_PENDING', 'Yêu cầu nạp đã được xử lý hoặc không tồn tại')
  }
  await auditService.writeAudit({
    actorId: admin._id,
    action: 'reject_deposit',
    targetType: 'request',
    targetId: request._id,
    reason: adminNote || 'Từ chối yêu cầu nạp',
  })
  return request
}

// ==================== RÚT TIỀN (mô phỏng) ====================

/**
 * Người dùng tạo yêu cầu rút — CHƯA trừ số dư.
 * Theo thiết kế đã chốt: tiền chỉ bị trừ khi Admin duyệt (kiểm tra đủ tiền nguyên tử).
 */
async function createWithdrawal(user, amountVND) {
  const amount = roundVND(amountVND)
  if (amount < MIN_WITHDRAWAL_VND) {
    throw ApiError.badRequest('INVALID_AMOUNT', `Số tiền rút tối thiểu là ${formatVNDShort(MIN_WITHDRAWAL_VND)}`)
  }
  return WithdrawalRequest.create({ userId: user._id, amountVND: amount, status: 'pending' })
}

/**
 * Người dùng hủy yêu cầu rút ĐANG CHỜ duyệt — số dư KHÔNG thay đổi.
 */
async function cancelMyWithdrawal(user, requestId) {
  const request = await WithdrawalRequest.findOneAndUpdate(
    { _id: requestId, userId: user._id, status: 'pending' },
    { status: 'cancelled' },
    { new: true }
  )
  if (!request) {
    throw ApiError.notFound('REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu rút đang chờ')
  }
  return request
}

async function listMyWithdrawals(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = { userId }
  if (query.status && CASH_STATUSES.includes(query.status)) filter.status = query.status
  const [total, items] = await Promise.all([
    WithdrawalRequest.countDocuments(filter),
    WithdrawalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  return buildPageResult(items, total, { page, limit })
}

async function listWithdrawalsForAdmin(query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = {}
  if (query.status && CASH_STATUSES.includes(query.status)) filter.status = query.status
  if (query.userId) filter.userId = query.userId
  const [total, items] = await Promise.all([
    WithdrawalRequest.countDocuments(filter),
    WithdrawalRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('processedBy', 'name'),
  ])
  return buildPageResult(items, total, { page, limit })
}

/**
 * Admin DUYỆT rút — trừ ví VND NGAY TẠI ĐÂY bằng debitWallet nguyên tử.
 * Nếu người dùng đã tiêu hết tiền từ khi tạo yêu cầu → 400 kèm hướng dẫn từ chối,
 * request tự động trở về trạng thái pending, số dư KHÔNG sai lệch.
 */
async function approveWithdrawal(admin, requestId) {
  const request = await WithdrawalRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'approved', processedBy: admin._id, processedAt: new Date() },
    { new: true }
  )
  if (!request) {
    throw ApiError.conflict('REQUEST_NOT_PENDING', 'Yêu cầu rút đã được xử lý hoặc không tồn tại')
  }

  let tx = null
  try {
    tx = await Transaction.create({
      userId: request.userId,
      type: 'withdrawal',
      currencySymbol: 'VND',
      quantity: request.amountVND,
      price: 1,
      totalValueVND: request.amountVND,
      feeVND: 0,
      status: 'pending',
      referenceId: request._id,
    })
    await walletService.debitWallet(request.userId, 'VND', request.amountVND, {
      transactionId: tx._id,
      reason: 'Rút tiền được phê duyệt',
    })
    tx.status = 'completed'
    await tx.save({ validateBeforeSave: false })
  } catch (err) {
    console.error('❌ Lỗi khi duyệt rút:', err.message)
    if (tx) {
      tx.status = 'failed'
      await tx.save({ validateBeforeSave: false }).catch(() => {})
    }
    await WithdrawalRequest.updateOne(
      { _id: request._id },
      { status: 'pending', $unset: { processedBy: '', processedAt: '' } }
    )
    if (err instanceof ApiError && err.code === 'INSUFFICIENT_BALANCE') {
      throw ApiError.badRequest(
        'INSUFFICIENT_BALANCE',
        'Số dư hiện tại của người dùng không đủ để duyệt yêu cầu rút này. Hãy từ chối kèm ghi chú.'
      )
    }
    throw new ApiError(500, 'WITHDRAWAL_APPROVE_FAILED', 'Duyệt yêu cầu rút thất bại do lỗi hệ thống. Vui lòng thử lại.')
  }

  await auditService.writeAudit({
    actorId: admin._id,
    action: 'approve_withdrawal',
    targetType: 'request',
    targetId: request._id,
    reason: `Duyệt rút ${formatVNDShort(request.amountVND)}`,
  })
  return request
}

async function rejectWithdrawal(admin, requestId, adminNote = '') {
  const request = await WithdrawalRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'rejected', adminNote, processedBy: admin._id, processedAt: new Date() },
    { new: true }
  )
  if (!request) {
    throw ApiError.conflict('REQUEST_NOT_PENDING', 'Yêu cầu rút đã được xử lý hoặc không tồn tại')
  }
  await auditService.writeAudit({
    actorId: admin._id,
    action: 'reject_withdrawal',
    targetType: 'request',
    targetId: request._id,
    reason: adminNote || 'Từ chối yêu cầu rút',
  })
  return request
}

module.exports = {
  createDeposit,
  listMyDeposits,
  listDepositsForAdmin,
  approveDeposit,
  rejectDeposit,
  createWithdrawal,
  cancelMyWithdrawal,
  listMyWithdrawals,
  listWithdrawalsForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  MIN_DEPOSIT_VND,
  MIN_WITHDRAWAL_VND,
}
