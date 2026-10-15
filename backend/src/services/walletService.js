const Wallet = require('../models/Wallet')
const BalanceHistory = require('../models/BalanceHistory')
const Cryptocurrency = require('../models/Cryptocurrency')
const ApiError = require('../utils/ApiError')
const { roundVND, roundQuantity } = require('../utils/round')
const { parsePagination, buildPageResult } = require('../utils/pagination')
const { normalizeSymbol } = require('../utils/string')

const VND = 'VND'

/**
 * Ghi 1 dòng sổ cái sau khi số dư ví đã thay đổi.
 * Bảo chứng: balanceBefore + changeAmount = balanceAfter.
 */
async function recordHistory(wallet, changeAmount, transactionId, reason) {
  const after = wallet.availableBalance
  const before = roundQuantity(after - changeAmount)
  await BalanceHistory.create({
    userId: wallet.userId,
    walletId: wallet._id,
    transactionId,
    changeAmount: roundQuantity(changeAmount),
    balanceBefore: before,
    balanceAfter: after,
    reason,
  })
}

/**
 * CỘNG tiền vào ví (tự tạo ví nếu chưa có).
 * Nguyên tử: findOneAndUpdate + $inc + upsert — không có "check rồi update" tách 2 bước.
 */
async function creditWallet(userId, currencySymbol, amount, { transactionId, reason }) {
  const sym = normalizeSymbol(currencySymbol)
  const amt = roundQuantity(amount)
  if (!(amt > 0)) {
    throw ApiError.badRequest('INVALID_AMOUNT', 'Số tiền phải lớn hơn 0')
  }
  const wallet = await Wallet.findOneAndUpdate(
    { userId, currencySymbol: sym },
    { $inc: { availableBalance: amt } },
    { new: true, upsert: true }
  )
  await recordHistory(wallet, amt, transactionId, reason)
  return wallet
}

/**
 * TRỪ tiền khỏi ví — trái tim của việc chống số dư âm.
 * Điều kiện "đủ tiền" nằm NGAY TRONG filter của update:
 *   availableBalance >= amt
 * → Hai request đồng thời chỉ MỘT được thành công; request thua nhận null → 400.
 */
async function debitWallet(userId, currencySymbol, amount, { transactionId, reason }) {
  const sym = normalizeSymbol(currencySymbol)
  const amt = roundQuantity(amount)
  if (!(amt > 0)) {
    throw ApiError.badRequest('INVALID_AMOUNT', 'Số tiền phải lớn hơn 0')
  }
  const wallet = await Wallet.findOneAndUpdate(
    { userId, currencySymbol: sym, availableBalance: { $gte: amt } },
    { $inc: { availableBalance: -amt } },
    { new: true }
  )
  if (!wallet) {
    throw ApiError.badRequest(
      'INSUFFICIENT_BALANCE',
      sym === VND ? 'Số dư VND không đủ để thực hiện giao dịch' : `Số dư ${sym} không đủ để thực hiện giao dịch`
    )
  }
  await recordHistory(wallet, -amt, transactionId, reason)
  return wallet
}

/**
 * Điều chỉnh số dư theo dấu ± (dùng cho điều chỉnh của Admin).
 * Không cho phép kết quả âm: đi qua debitWallet với điều kiện $gte.
 */
async function adjustWallet(userId, currencySymbol, changeAmount, { transactionId, reason }) {
  const amt = roundQuantity(changeAmount)
  if (!Number.isFinite(amt) || amt === 0) {
    throw ApiError.badRequest('INVALID_AMOUNT', 'Giá trị điều chỉnh phải khác 0')
  }
  if (amt > 0) return creditWallet(userId, currencySymbol, amt, { transactionId, reason })
  return debitWallet(userId, currencySymbol, Math.abs(amt), { transactionId, reason })
}

/**
 * Tổng quan ví của 1 user: ví VND + các ví crypto kèm giá và giá trị quy đổi VND.
 * Ví chưa tồn tại (user mới) → coi như số dư 0.
 */
async function getWalletSummary(userId) {
  const [wallets, coins] = await Promise.all([
    Wallet.find({ userId }).lean(),
    Cryptocurrency.find({}).select('symbol name currentPriceVND').lean(),
  ])
  const coinMap = new Map(coins.map((c) => [c.symbol, c]))

  const items = []
  const vndWallet = wallets.find((w) => w.currencySymbol === VND)
  const vndBalance = vndWallet ? vndWallet.availableBalance : 0
  items.push({
    currencySymbol: VND,
    name: 'Việt Nam Đồng',
    availableBalance: vndBalance,
    currentPriceVND: 1,
    valueVND: vndBalance,
  })

  const cryptoWallets = wallets
    .filter((w) => w.currencySymbol !== VND)
    .sort((a, b) => {
      const pa = coinMap.get(a.currencySymbol)?.currentPriceVND || 0
      const pb = coinMap.get(b.currencySymbol)?.currentPriceVND || 0
      return b.availableBalance * pb - a.availableBalance * pa
    })

  for (const w of cryptoWallets) {
    const coin = coinMap.get(w.currencySymbol)
    const price = coin ? coin.currentPriceVND : 0
    items.push({
      currencySymbol: w.currencySymbol,
      name: coin ? coin.name : w.currencySymbol,
      availableBalance: w.availableBalance,
      currentPriceVND: price,
      valueVND: roundVND(w.availableBalance * price),
    })
  }

  const totalValueVND = items.reduce((sum, item) => sum + item.valueVND, 0)
  return { items, totalValueVND: roundVND(totalValueVND) }
}

/**
 * Sổ cái của user — lọc theo loại tài sản, phân trang.
 */
async function listHistories(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = { userId }
  if (query.currencySymbol) {
    const wallet = await Wallet.findOne({ userId, currencySymbol: normalizeSymbol(query.currencySymbol) })
    if (!wallet) return buildPageResult([], 0, { page, limit })
    filter.walletId = wallet._id
  }
  const [total, items] = await Promise.all([
    BalanceHistory.countDocuments(filter),
    BalanceHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('walletId', 'currencySymbol')
      .populate('transactionId', 'type status side currencySymbol'),
  ])
  return buildPageResult(items, total, { page, limit })
}

module.exports = {
  VND,
  creditWallet,
  debitWallet,
  adjustWallet,
  getWalletSummary,
  listHistories,
}
