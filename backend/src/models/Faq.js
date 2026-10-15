const mongoose = require('mongoose')

/**
 * Faqs — câu hỏi thường gặp, hiển thị công khai trên trang Hỗ trợ.
 */
const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Câu hỏi là bắt buộc'],
      trim: true,
      maxlength: [200, 'Câu hỏi tối đa 200 ký tự'],
    },
    answer: {
      type: String,
      required: [true, 'Câu trả lời là bắt buộc'],
      trim: true,
      maxlength: [1000, 'Câu trả lời tối đa 1000 ký tự'],
    },
    order: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Faq', faqSchema)
