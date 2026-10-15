const Cryptocurrency = require('../models/Cryptocurrency')
const ApiError = require('../utils/ApiError')
const { TRADE_FEE_PERCENT } = require('../utils/constants')
const { parsePagination, buildPageResult } = require('../utils/pagination')
const { escapeRegex, normalizeSymbol } = require('../utils/string')

const SORT_FIELDS = {
  price: 'currentPriceVND',
  change: 'changePercent',
  name: 'name',
}

/**
 * Danh sách tài sản CÔNG KHAI (chỉ isActive) + tìm kiếm + sắp xếp + phân trang.
 * Kèm feePercent để frontend hiển thị phí dự kiến ở trang giao dịch.
 */
async function listCryptocurrencies(query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50 })
  const filter = { isActive: true }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i')
    filter.$or = [{ name: rx }, { symbol: rx }]
  }
  const sortField = SORT_FIELDS[query.sort] || 'currentPriceVND'
  const order = query.order === 'asc' ? 1 : -1

  const [total, items] = await Promise.all([
    Cryptocurrency.countDocuments(filter),
    Cryptocurrency.find(filter).sort({ [sortField]: order }).skip(skip).limit(limit),
  ])
  return { ...buildPageResult(items, total, { page, limit }), feePercent: TRADE_FEE_PERCENT }
}

/**
 * Chi tiết 1 tài sản công khai (404 nếu không có hoặc đã bị ẩn).
 */
async function getCryptocurrency(symbol) {
  const coin = await Cryptocurrency.findOne({ symbol: normalizeSymbol(symbol), isActive: true })
  if (!coin) {
    throw ApiError.notFound('CRYPTO_NOT_FOUND', 'Không tìm thấy tài sản hoặc tài sản hiện không hỗ trợ')
  }
  return { coin, feePercent: TRADE_FEE_PERCENT }
}

/**
 * Danh sách ĐẦY ĐỦ cho Admin (kể cả tài sản đang ẩn).
 */
async function listAllCryptocurrencies() {
  return Cryptocurrency.find({}).sort({ createdAt: 1 })
}

module.exports = { listCryptocurrencies, getCryptocurrency, listAllCryptocurrencies, TRADE_FEE_PERCENT }
