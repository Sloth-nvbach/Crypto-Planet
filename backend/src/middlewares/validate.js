const { validationResult } = require('express-validator')
const ApiError = require('../utils/ApiError')

/**
 * Chạy chuỗi rule express-validator và chặn request nếu dữ liệu sai.
 * Thông báo lỗi lấy theo: "trường sai đầu tiên" — đảm bảo message tiếng Việt hiển thị cho user.
 *
 * Cách dùng trong routes:
 *   router.post('/', auth, validate([
 *     body('quantity').isFloat({ gt: 0 }).withMessage('Số lượng phải lớn hơn 0'),
 *   ]), controller.create)
 */
module.exports = (chains) => async (req, _res, next) => {
  await Promise.all(chains.map((chain) => chain.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const first = errors.array()[0]
    return next(new ApiError(400, 'VALIDATION_ERROR', first.msg))
  }
  next()
}
