const router = require('express').Router()
const auth = require('../middlewares/auth')
const controller = require('../controllers/walletController')

// Mọi API ví đều yêu cầu đăng nhập.
router.get('/', auth, controller.getWallets)
router.get('/histories', auth, controller.getHistories)

module.exports = router
