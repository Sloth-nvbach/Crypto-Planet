const AuditLog = require('../models/AuditLog')
const { parsePagination, buildPageResult } = require('../utils/pagination')

/**
 * Ghi nhật ký thao tác quản trị (audit log).
 * Lỗi ghi log KHÔNG được làm hỏng nghiệp vụ chính — chỉ in ra console server.
 */
async function writeAudit({ actorId, action, targetType, targetId, reason = '', details = '' }) {
  try {
    await AuditLog.create({ actorId, action, targetType, targetId, reason, details })
  } catch (err) {
    console.error('❌ Không ghi được audit log:', err.message)
  }
}

/**
 * Danh sách nhật ký (Admin) — lọc theo người thao tác / loại hành động.
 */
async function listLogs(query = {}) {
  const { page, limit, skip } = parsePagination(query)
  const filter = {}
  if (query.actorId) filter.actorId = query.actorId
  if (query.action) filter.action = query.action

  const [total, items] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actorId', 'name email'),
  ])
  return buildPageResult(items, total, { page, limit })
}

module.exports = { writeAudit, listLogs }
