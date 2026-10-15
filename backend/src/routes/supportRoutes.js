const router = require('express').Router()
const { body } = require('express-validator')
const validate = require('../middlewares/validate')
const auth = require('../middlewares/auth')
const controller = require('../controllers/supportController')

// Endpoint: POST/GET /api/support/tickets và GET /api/support/tickets/:id
router.post(
  '/tickets',
  auth,
  validate([
    body('subject').trim().isLength({ min: 5, max: 100 }).withMessage('Tiêu đề phải từ 5 đến 100 ký tự'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Nội dung phải từ 10 đến 2000 ký tự'),
  ]),
  controller.createTicket
)

router.get('/tickets', auth, controller.listMyTickets)
router.get('/tickets/:id', auth, controller.getMyTicket)

module.exports = router
