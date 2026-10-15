/**
 * Quy ước số liệu tài chính (xem DESIGN.md mục 5.6):
 * - Tiền VND: số NGUYÊN đồng (VND không có đơn vị lẻ nhỏ hơn).
 * - Số lượng crypto: làm tròn 8 chữ số thập phân.
 *
 * Mọi tính toán tiền/số lượng trong services đều phải đi qua 2 hàm này
 * để tránh lỗi số thực (0.1 + 0.2 = 0.30000000000000004).
 */
const QTY_DECIMALS = 8

function roundVND(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

function roundQuantity(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return NaN
  const factor = 10 ** QTY_DECIMALS
  return Math.round(n * factor) / factor
}

module.exports = { roundVND, roundQuantity, QTY_DECIMALS }
