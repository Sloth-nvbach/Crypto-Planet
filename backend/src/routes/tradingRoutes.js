const router = require('express').Router()
const { body } = require('express-validator')
const validate = require('../middlewares/validate')
const auth = require('../middlewares/auth')
const controller = require('../controllers/tradingController')

/**
 * Tạo lệnh mua/bán (lệnh thị trường).
 * LƯU Ý BẢO MẬT: request KHÔNG có trường giá — backend tự đọc giá từ DB,
 * nên client không thể thao túng giá giao dịch.
 */
router.post(
  '/',
  auth,
  validate([
    body('symbol').trim().toUpperCase().isLength({ min: 2, max: 10 }).withMessage('Mã tài sản không hợp lệ'),
    body('side').isIn(['buy', 'sell']).withMessage('Loại lệnh phải là mua hoặc bán'),
    body('quantity').isFloat({ gt: 0, lt: 1e12 }).withMessage('Số lượng phải là số lớn hơn 0'),
    body('idempotencyKey').trim().isLength({ min: 8, max: 64 }).withMessage('Thiếu mã chống giao dịch trùng lặp'),
  ]),
  controller.createTrade
)

router.get('/', auth, controller.listTrades)
router.get('/:id', auth, controller.getTrade)

module.exports = router
