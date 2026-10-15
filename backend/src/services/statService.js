const User = require('../models/User')
const Transaction = require('../models/Transaction')
const DepositRequest = require('../models/DepositRequest')
const WithdrawalRequest = require('../models/WithdrawalRequest')

/**
 * Thống kê tổng quan cho trang quản trị — dùng aggregation pipeline của MongoDB.
 * Đây cũng là bài học thực hành aggregation $group/$sum/$sort/$limit.
 */
async function getOverview() {
  const [
    totalUsers,
    lockedUsers,
    tradeStatusAgg,
    volumeBySymbolAgg,
    pendingDepositCount,
    pendingWithdrawalCount,
    depositAgg,
    withdrawalAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'locked' }),
    Transaction.aggregate([
      { $match: { type: 'trade' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          volumeVND: { $sum: '$totalValueVND' },
          feeVND: { $sum: '$feeVND' },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { type: 'trade', status: 'completed' } },
      {
        $group: {
          _id: '$currencySymbol',
          volumeVND: { $sum: '$totalValueVND' },
          feeVND: { $sum: '$feeVND' },
          count: { $sum: 1 },
        },
      },
      { $sort: { volumeVND: -1 } },
      { $limit: 10 },
    ]),
    DepositRequest.countDocuments({ status: 'pending' }),
    WithdrawalRequest.countDocuments({ status: 'pending' }),
    DepositRequest.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amountVND' } } },
    ]),
    WithdrawalRequest.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amountVND' } } },
    ]),
  ])

  const byStatus = {}
  let totalTrades = 0
  for (const row of tradeStatusAgg) {
    byStatus[row._id] = row
    totalTrades += row.count
  }

  return {
    totalUsers,
    lockedUsers,
    totalTrades,
    successTrades: byStatus.completed?.count || 0,
    failedTrades: byStatus.failed?.count || 0,
    pendingTrades: byStatus.pending?.count || 0,
    totalVolumeVND: byStatus.completed?.volumeVND || 0,
    feeRevenueVND: byStatus.completed?.feeVND || 0,
    volumeBySymbol: volumeBySymbolAgg.map((row) => ({
      symbol: row._id,
      volumeVND: row.volumeVND,
      feeVND: row.feeVND,
      count: row.count,
    })),
    pendingDepositCount,
    pendingWithdrawalCount,
    totalDepositVND: depositAgg[0]?.total || 0,
    totalWithdrawalVND: withdrawalAgg[0]?.total || 0,
  }
}

module.exports = { getOverview }
