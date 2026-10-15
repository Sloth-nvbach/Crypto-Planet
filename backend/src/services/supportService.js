const SupportTicket = require('../models/SupportTicket')
const auditService = require('./auditService')
const ApiError = require('../utils/ApiError')
const { TICKET_STATUS } = require('../utils/constants')
const { parsePagination, buildPageResult } = require('../utils/pagination')

/**
 * Người dùng gửi yêu cầu hỗ trợ.
 */
async function createTicket(user, { subject, message }) {
  return SupportTicket.create({ userId: user._id, subject, message, status: 'open' })
}

async function listMyTickets(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = { userId }
  if (query.status && TICKET_STATUS.includes(query.status)) filter.status = query.status
  const [total, items] = await Promise.all([
    SupportTicket.countDocuments(filter),
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ])
  return buildPageResult(items, total, { page, limit })
}

/**
 * Chi tiết ticket của chính mình (chống IDOR: filter theo userId).
 */
async function getMyTicket(userId, ticketId) {
  const ticket = await SupportTicket.findOne({ _id: ticketId, userId })
  if (!ticket) {
    throw ApiError.notFound('TICKET_NOT_FOUND', 'Không tìm thấy yêu cầu hỗ trợ')
  }
  return ticket
}

async function listTicketsForAdmin(query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = {}
  if (query.status && TICKET_STATUS.includes(query.status)) filter.status = query.status
  const [total, items] = await Promise.all([
    SupportTicket.countDocuments(filter),
    SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
  ])
  return buildPageResult(items, total, { page, limit })
}

/**
 * Admin phản hồi / đóng ticket.
 * status nhận: 'answered' (Đã phản hồi) hoặc 'closed' (Đã đóng).
 */
async function respondTicket(admin, ticketId, { adminResponse, status }) {
  const ticket = await SupportTicket.findById(ticketId)
  if (!ticket) {
    throw ApiError.notFound('TICKET_NOT_FOUND', 'Không tìm thấy yêu cầu hỗ trợ')
  }
  if (!['answered', 'closed'].includes(status)) {
    throw ApiError.badRequest('INVALID_STATUS', 'Trạng thái phản hồi không hợp lệ')
  }
  ticket.adminResponse = adminResponse || ticket.adminResponse
  ticket.status = status
  ticket.respondedBy = admin._id
  ticket.respondedAt = new Date()
  await ticket.save()

  await auditService.writeAudit({
    actorId: admin._id,
    action: 'respond_ticket',
    targetType: 'ticket',
    targetId: ticket._id,
    details: `Cập nhật ticket thành "${status}"`,
  })
  return ticket
}

module.exports = { createTicket, listMyTickets, getMyTicket, listTicketsForAdmin, respondTicket }
