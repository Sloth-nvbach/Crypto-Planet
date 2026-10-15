/**
 * asyncHandler — bọc controller async để mọi throw/reject
 * tự động chuyển tới errorHandler, không cần try/catch lặp lại.
 *
 * Cách dùng: router.get('/...', auth, asyncHandler(controller.list))
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
