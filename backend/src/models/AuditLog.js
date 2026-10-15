const mongoose = require('mongoose')

/**
 * AuditLogs — nhật ký thao tác quản trị quan trọng.
 * Ví dụ: khóa/mở tài khoản, điều chỉnh số dư, duyệt/từ chối nạp-rút,
 * thêm/sửa tài sản crypto, đăng thông báo...
 * Mỗi dòng ghi rõ AI làm (actorId), làm GÌ (action), với ĐỐI TƯỢNG nào
 * (targetType/targetId) và LÝ DO (reason) — yêu cầu bắt buộc với điều chỉnh số dư.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true }, // 'user' | 'cryptocurrency' | 'request' | 'ticket' | 'notification' | 'faq'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String, trim: true, maxlength: 300, default: '' },
    details: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ actorId: 1 })
auditLogSchema.index({ targetType: 1, targetId: 1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
