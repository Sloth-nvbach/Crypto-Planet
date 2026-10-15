const ApiError = require('../utils/ApiError')

/**
 * 404 cho mọi đường dẫn không khớp route nào.
 */
module.exports = (req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`))
}
