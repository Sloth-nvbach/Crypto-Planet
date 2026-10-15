const Faq = require('../models/Faq')
const Notification = require('../models/Notification')
const asyncHandler = require('../utils/asyncHandler')
const { parsePagination, buildPageResult } = require('../utils/pagination')

/**
 * Danh sách FAQ đang hiển thị — CÔNG KHAI (trang Hỗ trợ).
 */
exports.listFaqs = asyncHandler(async (_req, res) => {
  const items = await Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 })
  res.json({ success: true, data: { items } })
})

/**
 * Thông báo hệ thống đã đăng — chỉ người dùng đăng nhập xem được.
 */
exports.listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const filter = { isPublished: true }
  const [total, items] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  res.json({ success: true, data: buildPageResult(items, total, { page, limit }) })
})
