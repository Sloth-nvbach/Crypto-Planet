/**
 * Phân trang chuẩn cho mọi API danh sách.
 * Query: ?page=1&limit=20 (limit tối đa 50).
 * Response: { items, page, limit, total, totalPages }
 */
function parsePagination(query = {}, { defaultLimit = 20, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

function buildPageResult(items, total, { page, limit }) {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

module.exports = { parsePagination, buildPageResult }
