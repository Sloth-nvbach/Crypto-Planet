const statService = require('../../services/statService')
const asyncHandler = require('../../utils/asyncHandler')

/**
 * Thống kê tổng quan cho dashboard quản trị.
 */
exports.overview = asyncHandler(async (_req, res) => {
  const data = await statService.getOverview()
  res.json({ success: true, data })
})
