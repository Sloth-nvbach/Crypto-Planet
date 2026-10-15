const Cryptocurrency = require('../models/Cryptocurrency')
const Transaction = require('../models/Transaction')
const walletService = require('./walletService')
const ApiError = require('../utils/ApiError')
const { roundVND, roundQuantity } = require('../utils/round')
const { TRADE_FEE_PERCENT, TX_SIDES, TX_STATUS } = require('../utils/constants')
const { normalizeSymbol } = require('../utils/string')
const { parsePagination, buildPageResult } = require('../utils/pagination')

/**
 * THỰC THI LỆNH THỊ TRƯỜNG — luồng quan trọng nhất của hệ thống (DESIGN.md 7.2).
 *
 * B1. Chuẩn hóa & kiểm tra: số lượng > 0, coin đang hoạt động.
 * B2. Backend TỰ đọc giá → tính tổng giá trị + phí. KHÔNG nhận giá từ client.
 * B3. Chèn Transaction(pending) kèm idempotencyKey — unique index là "cuộc đua":
 *     request gửi lại thua cuộc ngay tại đây → trả kết quả gốc, không trừ tiền lần 2.
 * B4. Trừ ví nguồn (nguyên tử, điều kiện đủ tiền) → cộng ví đích → ghi sổ cái.
 * B5. Nếu lỗi giữa chừng: hoàn tiền các bước đã trừ (compensation) + đánh dấu failed.
 */
async function executeTrade(user, { symbol, side, quantity, idempotencyKey }) {
  // B1 — chuẩn hóa đầu vào
  const qty = roundQuantity(quantity)
  if (!Number.isFinite(qty) || qty <= 0) {
    throw ApiError.badRequest('INVALID_QUANTITY', 'Số lượng giao dịch phải lớn hơn 0')
  }
  if (!TX_SIDES.includes(side)) {
    throw ApiError.badRequest('INVALID_SIDE', 'Loại lệnh phải là mua hoặc bán')
  }
  const coin = await Cryptocurrency.findOne({ symbol: normalizeSymbol(symbol), isActive: true })
  if (!coin) {
    throw ApiError.notFound('CRYPTO_NOT_FOUND', 'Tài sản không tồn tại hoặc hiện không hỗ trợ giao dịch')
  }

  // B2 — backend tự tính giá trị và phí
  const price = coin.currentPriceVND
  const totalValue = roundVND(qty * price)
  if (totalValue < 1) {
    throw ApiError.badRequest('INVALID_QUANTITY', 'Giá trị giao dịch quá nhỏ, vui lòng tăng số lượng')
  }
  const fee = roundVND((totalValue * TRADE_FEE_PERCENT) / 100)
  const reason = `${side === 'buy' ? 'Mua' : 'Bán'} ${qty} ${coin.symbol}`

  // B3 — chốt quyền thực hiện bằng idempotencyKey (unique index)
  let tx
  try {
    tx = await Transaction.create({
      userId: user._id,
      type: 'trade',
      side,
      currencySymbol: coin.symbol,
      quantity: qty,
      price,
      totalValueVND: totalValue,
      feeVND: fee,
      status: 'pending',
      idempotencyKey,
    })
  } catch (err) {
    if (err.code === 11000) {
      // Trùng key → đây là request gửi lại, trả về kết quả lần đầu
      const existing = await Transaction.findOne({ userId: user._id, idempotencyKey })
      if (!existing) throw err
      const samePayload =
        existing.currencySymbol === coin.symbol && existing.side === side && existing.quantity === qty
      if (!samePayload) {
        throw ApiError.conflict('IDEMPOTENCY_CONFLICT', 'Yêu cầu trùng lặp nhưng dữ liệu không khớp')
      }
      if (existing.status === 'pending') {
        throw ApiError.conflict('IDEMPOTENCY_IN_PROGRESS', 'Giao dịch đang được xử lý, vui lòng chờ kết quả')
      }
      return { transaction: existing, replayed: true }
    }
    throw err
  }

  // B4 — di chuyển tài sản giữa 2 ví
  const debitedSteps = [] // các bước TRỪ đã áp dụng — để hoàn tác nếu lỗi (compensation)
  try {
    if (side === 'buy') {
      const totalDebit = totalValue + fee
      await walletService.debitWallet(user._id, walletService.VND, totalDebit, {
        transactionId: tx._id,
        reason,
      })
      debitedSteps.push({ currencySymbol: walletService.VND, amount: totalDebit })
      await walletService.creditWallet(user._id, coin.symbol, qty, { transactionId: tx._id, reason })
    } else {
      await walletService.debitWallet(user._id, coin.symbol, qty, { transactionId: tx._id, reason })
      debitedSteps.push({ currencySymbol: coin.symbol, amount: qty })
      const totalReceive = Math.max(0, totalValue - fee)
      if (totalReceive > 0) {
        await walletService.creditWallet(user._id, walletService.VND, totalReceive, {
          transactionId: tx._id,
          reason,
        })
      }
    }
    tx.status = 'completed'
    await tx.save({ validateBeforeSave: false })
  } catch (err) {
    // B5 — hoàn tác các bước đã trừ rồi mới báo lỗi
    for (const step of debitedSteps) {
      try {
        await walletService.creditWallet(user._id, step.currencySymbol, step.amount, {
          transactionId: tx._id,
          reason: `Hoàn tiền do giao dịch #${tx.id} thất bại`,
        })
      } catch (refundErr) {
        console.error('❌ Hoàn tiền thất bại (cần đối soát thủ công):', refundErr.message)
      }
    }
    tx.status = 'failed'
    await tx.save({ validateBeforeSave: false })
    if (err instanceof ApiError) throw err
    console.error('❌ Lỗi thực thi giao dịch:', err)
    throw new ApiError(500, 'TRADE_FAILED', 'Giao dịch thất bại do lỗi hệ thống. Số dư của bạn đã được hoàn lại.')
  }

  return { transaction: tx, replayed: false }
}

/**
 * Lịch sử giao dịch (trade) của user + bộ lọc + phân trang.
 */
async function listTrades(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = { userId, type: 'trade' }
  if (query.symbol) filter.currencySymbol = normalizeSymbol(query.symbol)
  if (query.side && TX_SIDES.includes(query.side)) filter.side = query.side
  if (query.status && TX_STATUS.includes(query.status)) filter.status = query.status
  if (query.from || query.to) {
    const createdAt = {}
    const from = new Date(query.from)
    const to = new Date(query.to)
    if (!Number.isNaN(from.getTime())) createdAt.$gte = from
    if (!Number.isNaN(to.getTime())) createdAt.$lte = to
    filter.createdAt = createdAt
  }
  const [total, items] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  return buildPageResult(items, total, { page, limit })
}

/**
 * Chi tiết 1 giao dịch — KIỂM TRA CHỦ SỞ HỮU để chống IDOR
 * (user A truy cập giao dịch của user B → 404).
 */
async function getTradeById(userId, id) {
  const tx = await Transaction.findOne({ _id: id, userId, type: 'trade' })
  if (!tx) {
    throw ApiError.notFound('TRADE_NOT_FOUND', 'Không tìm thấy giao dịch')
  }
  return tx
}

module.exports = { executeTrade, listTrades, getTradeById }
