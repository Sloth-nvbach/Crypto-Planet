const mongoose = require('mongoose')

/**
 * Cryptocurrencies — danh mục tài sản hệ thống hỗ trợ.
 * - symbol là khóa tham chiếu (dạng chuỗi) cho Wallets/Transactions → KHÔNG cho sửa sau khi tạo.
 * - currentPriceVND: giá tham khảo VND (số nguyên đồng), do Admin cập nhật.
 * - isActive=false → ẩn khỏi thị trường và chặn giao dịch.
 */
const cryptoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tài sản là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên tài sản tối đa 100 ký tự'],
    },
    symbol: {
      type: String,
      required: [true, 'Mã tài sản là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{2,10}$/, 'Mã tài sản gồm 2-10 ký tự in hoa/số (ví dụ BTC)'],
    },
    currentPriceVND: {
      type: Number,
      required: [true, 'Giá tham khảo là bắt buộc'],
      min: [1, 'Giá tham khảo phải lớn hơn 0'],
      set: (v) => Math.round(Number(v) || 0), // VND luôn là số nguyên đồng
    },
    changePercent: {
      type: Number,
      default: 0,
      min: [-100, 'Phần trăm biến động không hợp lệ'],
      max: [1000, 'Phần trăm biến động không hợp lệ'],
    },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true, maxlength: [1000, 'Mô tả tối đa 1000 ký tự'], default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Cryptocurrency', cryptoSchema)
