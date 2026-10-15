const router = require('express').Router()
const { body } = require('express-validator')
const validate = require('../middlewares/validate')
const auth = require('../middlewares/auth')
const controller = require('../controllers/authController')

// Đăng ký — công khai
router.post(
  '/register',
  validate([
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Tên hiển thị phải từ 2 đến 50 ký tự'),
    body('email').trim().toLowerCase().isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6, max: 72 }).withMessage('Mật khẩu phải từ 6 đến 72 ký tự'),
  ]),
  controller.register
)

// Đăng nhập — công khai
router.post(
  '/login',
  validate([
    body('email').trim().toLowerCase().isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
  ]),
  controller.login
)

router.get('/me', auth, controller.getMe)

router.put(
  '/me',
  auth,
  validate([body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Tên hiển thị phải từ 2 đến 50 ký tự')]),
  controller.updateMe
)

router.put(
  '/change-password',
  auth,
  validate([
    body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newPassword').isLength({ min: 6, max: 72 }).withMessage('Mật khẩu mới phải từ 6 đến 72 ký tự'),
  ]),
  controller.changePassword
)

router.post('/logout', auth, controller.logout)

module.exports = router
