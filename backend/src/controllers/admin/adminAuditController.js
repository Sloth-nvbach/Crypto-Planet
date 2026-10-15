const auditService = require('../../services/auditService')
const asyncHandler = require('../../utils/asyncHandler')

/**
 * Nhật ký thao tác quản trị (audit log) — lọc theo người thao tác / hành động.
 */
exports.list = asyncHandler(async (req, res) => {
  const data = await auditService.listLogs(req.query)
  res.json({ success: true, data })
})
