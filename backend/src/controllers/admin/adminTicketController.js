const supportService = require('../../services/supportService')
const asyncHandler = require('../../utils/asyncHandler')

/**
 * Danh sách toàn bộ yêu cầu hỗ trợ — lọc theo trạng thái.
 */
exports.list = asyncHandler(async (req, res) => {
  const data = await supportService.listTicketsForAdmin(req.query)
  res.json({ success: true, data })
})

/**
 * Phản hồi / đóng ticket.
 * Body: { adminResponse, status: 'answered' | 'closed' }
 */
exports.respond = asyncHandler(async (req, res) => {
  const ticket = await supportService.respondTicket(req.user, req.params.id, req.body)
  res.json({ success: true, data: { ticket }, message: 'Đã cập nhật yêu cầu hỗ trợ' })
})
