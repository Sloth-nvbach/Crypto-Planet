const Notification = require('../../models/Notification')
const Faq = require('../../models/Faq')
const auditService = require('../../services/auditService')
const ApiError = require('../../utils/ApiError')
const asyncHandler = require('../../utils/asyncHandler')
const { parsePagination, buildPageResult } = require('../../utils/pagination')

// ==================== Thông báo hệ thống ====================

exports.listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const [total, items] = await Promise.all([
    Notification.countDocuments({}),
    Notification.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  res.json({ success: true, data: buildPageResult(items, total, { page, limit }) })
})

exports.createNotification = asyncHandler(async (req, res) => {
  const { title, content, type = 'announcement', isPublished = true } = req.body
  const notification = await Notification.create({ title, content, type, isPublished, createdBy: req.user._id })
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'create_notification',
    targetType: 'notification',
    targetId: notification._id,
    details: title,
  })
  res.status(201).json({ success: true, data: { notification }, message: 'Đã đăng thông báo' })
})

exports.updateNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
  if (!notification) throw ApiError.notFound('NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo')
  const { title, content, type, isPublished } = req.body
  if (title !== undefined) notification.title = title
  if (content !== undefined) notification.content = content
  if (type !== undefined) notification.type = type
  if (isPublished !== undefined) notification.isPublished = isPublished
  await notification.save()
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'update_notification',
    targetType: 'notification',
    targetId: notification._id,
    details: notification.title,
  })
  res.json({ success: true, data: { notification }, message: 'Đã cập nhật thông báo' })
})

exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id)
  if (!notification) throw ApiError.notFound('NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo')
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'delete_notification',
    targetType: 'notification',
    targetId: notification._id,
    details: notification.title,
  })
  res.json({ success: true, message: 'Đã xóa thông báo' })
})

// ==================== FAQ ====================

exports.listFaqs = asyncHandler(async (_req, res) => {
  const items = await Faq.find({}).sort({ order: 1, createdAt: 1 })
  res.json({ success: true, data: { items } })
})

exports.createFaq = asyncHandler(async (req, res) => {
  const { question, answer, order = 0, isActive = true } = req.body
  const faq = await Faq.create({ question, answer, order, isActive })
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'manage_faq',
    targetType: 'faq',
    targetId: faq._id,
    details: `Thêm FAQ: ${question}`,
  })
  res.status(201).json({ success: true, data: { faq }, message: 'Đã thêm câu hỏi' })
})

exports.updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id)
  if (!faq) throw ApiError.notFound('FAQ_NOT_FOUND', 'Không tìm thấy câu hỏi')
  const { question, answer, order, isActive } = req.body
  if (question !== undefined) faq.question = question
  if (answer !== undefined) faq.answer = answer
  if (order !== undefined) faq.order = order
  if (isActive !== undefined) faq.isActive = isActive
  await faq.save()
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'manage_faq',
    targetType: 'faq',
    targetId: faq._id,
    details: `Sửa FAQ: ${faq.question}`,
  })
  res.json({ success: true, data: { faq }, message: 'Đã cập nhật câu hỏi' })
})

exports.deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id)
  if (!faq) throw ApiError.notFound('FAQ_NOT_FOUND', 'Không tìm thấy câu hỏi')
  await auditService.writeAudit({
    actorId: req.user._id,
    action: 'manage_faq',
    targetType: 'faq',
    targetId: faq._id,
    details: `Xóa FAQ: ${faq.question}`,
  })
  res.json({ success: true, message: 'Đã xóa câu hỏi' })
})
