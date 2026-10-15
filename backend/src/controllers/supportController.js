const supportService = require('../services/supportService')
const asyncHandler = require('../utils/asyncHandler')

exports.createTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.createTicket(req.user, req.body)
  res.status(201).json({ success: true, data: { ticket }, message: 'Đã gửi yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi sớm.' })
})

exports.listMyTickets = asyncHandler(async (req, res) => {
  const data = await supportService.listMyTickets(req.user._id, req.query)
  res.json({ success: true, data })
})

exports.getMyTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.getMyTicket(req.user._id, req.params.id)
  res.json({ success: true, data: { ticket } })
})
