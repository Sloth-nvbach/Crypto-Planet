const router = require('express').Router()
const controller = require('../controllers/marketController')

// Toàn bộ market API là CÔNG KHAI (khách chưa đăng nhập vẫn xem được giá).
router.get('/cryptocurrencies', controller.list)
router.get('/cryptocurrencies/:symbol', controller.detail)

module.exports = router
