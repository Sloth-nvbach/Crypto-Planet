const User = require('../../models/User')
const Transaction = require('../../models/Transaction')
const asyncHandler = require('../../utils/asyncHandler')
const { parsePagination, buildPageResult } = require('../../utils/pagination')
const { normalizeSymbol } = require('../../utils/string')
const { TX_TYPES, TX_STATUS } = require('../../utils/constants')

/**
 * Toàn bộ giao dịch trong hệ thống — lọc theo email người dùng, loại, trạng thái, tài sản.
 * Lưu ý: lọc theo email để thao tác trực quan (khỏi phải copy ObjectId).
 */
exports.listAll = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const filter = {}

  if (req.query.email) {
    const user = await User.findOne({ email: String(req.query.email).toLowerCase().trim() })
    if (!user) {
      // Email không tồn tại → danh sách trống (không lỗi — dễ dùng hơn)
      return res.json({ success: true, data: buildPageResult([], 0, { page, limit }) })
    }
    filter.userId = user._id
  }
  if (req.query.type && TX_TYPES.includes(req.query.type)) filter.type = req.query.type
  if (req.query.status && TX_STATUS.includes(req.query.status)) filter.status = req.query.status
  if (req.query.symbol) filter.currencySymbol = normalizeSymbol(req.query.symbol)

  const [total, items] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email'),
  ])
  res.json({ success: true, data: buildPageResult(items, total, { page, limit }) })
})
