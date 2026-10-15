const router = require('express').Router()
const auth = require('../middlewares/auth')
const controller = require('../controllers/contentController')

// FAQ: công khai (trang Hỗ trợ) — Thông báo: cần đăng nhập.
router.get('/faqs', controller.listFaqs)
router.get('/notifications', auth, controller.listNotifications)

module.exports = router
