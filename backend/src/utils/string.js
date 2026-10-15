/**
 * Hàm chuỗi dùng chung.
 */
function escapeRegex(str = '') {
  // Chặn regex injection khi tìm kiếm: "." "*" "+" → "\."
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeSymbol(symbol = '') {
  // Chuẩn hóa mã tài sản: bỏ khoảng trắng, viết hoa (btc -> BTC)
  return String(symbol).trim().toUpperCase()
}

module.exports = { escapeRegex, normalizeSymbol }
