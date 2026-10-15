const router = require('express').Router()
const { body } = require('express-validator')

const auth = require('../middlewares/auth')
const { requireAdmin } = require('../middlewares/authorize')
const validate = require('../middlewares/validate')

const statController = require('../controllers/admin/adminStatController')
const userController = require('../controllers/admin/adminUserController')
const cryptoController = require('../controllers/admin/adminCryptoController')
const txController = require('../controllers/admin/adminTransactionController')
const cashController = require('../controllers/admin/adminCashController')
const ticketController = require('../controllers/admin/adminTicketController')
const contentController = require('../controllers/admin/adminContentController')
const auditController = require('../controllers/admin/adminAuditController')

/**
 * MỌI route dưới /api/admin đều đi qua auth + requireAdmin.
 * → Frontend không thể tự "thăng cấp" quyền: chỉ backend quyết định.
 */
router.use(auth, requireAdmin)

// ==================== Thống kê ====================
router.get('/stats', statController.overview)

// ==================== Quản lý người dùng ====================
router.get('/users', userController.list)
router.get('/users/:id', userController.detail)
router.patch(
  '/users/:id/status',
  validate([
    body('status').isIn(['active', 'locked']).withMessage('Trạng thái không hợp lệ'),
    body('reason').trim().isLength({ min: 3, max: 300 }).withMessage('Vui lòng nhập lý do (từ 3 ký tự)'),
  ]),
  userController.updateStatus
)
router.get('/users/:id/transactions', userController.userTransactions)
router.get('/users/:id/balance-histories', userController.userHistories)

// Điều chỉnh số dư — reason BẮT BUỘC (yêu cầu ghi rõ trong thiết kế)
router.post(
  '/users/:id/balances',
  validate([
    body('currencySymbol').trim().toUpperCase().isLength({ min: 2, max: 10 }).withMessage('Mã tài sản không hợp lệ'),
    body('changeAmount')
      .custom((v) => Number.isFinite(Number(v)) && Number(v) !== 0)
      .withMessage('Giá trị điều chỉnh phải là số khác 0'),
    body('reason').trim().isLength({ min: 5, max: 300 }).withMessage('Lý do điều chỉnh là bắt buộc (từ 5 ký tự)'),
  ]),
  userController.adjustBalance
)

// ==================== Quản lý tiền điện tử ====================
router.get('/cryptocurrencies', cryptoController.list)
router.post(
  '/cryptocurrencies',
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Tên tài sản phải từ 2 đến 100 ký tự'),
    body('symbol').trim().toUpperCase().matches(/^[A-Z0-9]{2,10}$/).withMessage('Mã tài sản gồm 2-10 ký tự in hoa/số'),
    body('currentPriceVND').isInt({ min: 1, max: 1e15 }).withMessage('Giá tham khảo phải là số nguyên lớn hơn 0'),
    body('changePercent').optional().isFloat({ min: -100, max: 1000 }).withMessage('Phần trăm biến động không hợp lệ'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Mô tả tối đa 1000 ký tự'),
    body('isActive').optional().isBoolean().withMessage('isActive phải là boolean'),
  ]),
  cryptoController.create
)
router.put(
  '/cryptocurrencies/:symbol',
  validate([
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Tên tài sản phải từ 2 đến 100 ký tự'),
    body('currentPriceVND').optional().isInt({ min: 1, max: 1e15 }).withMessage('Giá tham khảo phải là số nguyên lớn hơn 0'),
    body('changePercent').optional().isFloat({ min: -100, max: 1000 }).withMessage('Phần trăm biến động không hợp lệ'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Mô tả tối đa 1000 ký tự'),
    body('isActive').optional().isBoolean().withMessage('isActive phải là boolean'),
  ]),
  cryptoController.update
)

// ==================== Quản lý giao dịch ====================
router.get('/transactions', txController.listAll)

// ==================== Quản lý nạp / rút ====================
router.get('/deposits', cashController.listDeposits)
router.post('/deposits/:id/approve', cashController.approveDeposit)
router.post(
  '/deposits/:id/reject',
  validate([body('adminNote').optional().trim().isLength({ max: 300 }).withMessage('Ghi chú tối đa 300 ký tự')]),
  cashController.rejectDeposit
)

router.get('/withdrawals', cashController.listWithdrawals)
router.post('/withdrawals/:id/approve', cashController.approveWithdrawal)
router.post(
  '/withdrawals/:id/reject',
  validate([body('adminNote').optional().trim().isLength({ max: 300 }).withMessage('Ghi chú tối đa 300 ký tự')]),
  cashController.rejectWithdrawal
)

// ==================== Quản lý hỗ trợ ====================
router.get('/tickets', ticketController.list)
router.put(
  '/tickets/:id',
  validate([
    body('adminResponse').optional().trim().isLength({ max: 2000 }).withMessage('Phản hồi tối đa 2000 ký tự'),
    body('status').isIn(['answered', 'closed']).withMessage('Trạng thái phải là đã phản hồi hoặc đã đóng'),
  ]),
  ticketController.respond
)

// ==================== Quản lý nội dung ====================
router.get('/notifications', contentController.listNotifications)
router.post(
  '/notifications',
  validate([
    body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Tiêu đề phải từ 3 đến 150 ký tự'),
    body('content').trim().isLength({ min: 3, max: 2000 }).withMessage('Nội dung phải từ 3 đến 2000 ký tự'),
    body('type').optional().isIn(['announcement', 'system', 'maintenance']).withMessage('Loại thông báo không hợp lệ'),
    body('isPublished').optional().isBoolean(),
  ]),
  contentController.createNotification
)
router.put(
  '/notifications/:id',
  validate([
    body('title').optional().trim().isLength({ min: 3, max: 150 }).withMessage('Tiêu đề phải từ 3 đến 150 ký tự'),
    body('content').optional().trim().isLength({ min: 3, max: 2000 }).withMessage('Nội dung phải từ 3 đến 2000 ký tự'),
    body('type').optional().isIn(['announcement', 'system', 'maintenance']).withMessage('Loại thông báo không hợp lệ'),
    body('isPublished').optional().isBoolean(),
  ]),
  contentController.updateNotification
)
router.delete('/notifications/:id', contentController.deleteNotification)

router.get('/faqs', contentController.listFaqs)
router.post(
  '/faqs',
  validate([
    body('question').trim().isLength({ min: 5, max: 200 }).withMessage('Câu hỏi phải từ 5 đến 200 ký tự'),
    body('answer').trim().isLength({ min: 5, max: 1000 }).withMessage('Câu trả lời phải từ 5 đến 1000 ký tự'),
    body('order').optional().isInt({ min: 0 }).withMessage('Thứ tự phải là số nguyên không âm'),
    body('isActive').optional().isBoolean(),
  ]),
  contentController.createFaq
)
router.put(
  '/faqs/:id',
  validate([
    body('question').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Câu hỏi phải từ 5 đến 200 ký tự'),
    body('answer').optional().trim().isLength({ min: 5, max: 1000 }).withMessage('Câu trả lời phải từ 5 đến 1000 ký tự'),
    body('order').optional().isInt({ min: 0 }).withMessage('Thứ tự phải là số nguyên không âm'),
    body('isActive').optional().isBoolean(),
  ]),
  contentController.updateFaq
)
router.delete('/faqs/:id', contentController.deleteFaq)

// ==================== Nhật ký quản trị ====================
router.get('/audit-logs', auditController.list)

module.exports = router
