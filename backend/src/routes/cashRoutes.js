const express = require('express')
const { body } = require('express-validator')
const validate = require('../middlewares/validate')
const auth = require('../middlewares/auth')
const controller = require('../controllers/cashController')

const MIN_DEPOSIT_VND = parseInt(process.env.MIN_DEPOSIT_VND, 10) || 50000
const MIN_WITHDRAWAL_VND = parseInt(process.env.MIN_WITHDRAWAL_VND, 10) || 50000
const MAX_CASH_VND = 1000000000

// ==================== Nạp tiền mô phỏng ====================
const depositRouter = express.Router()

depositRouter.post(
  '/',
  auth,
  validate([
    body('amountVND')
      .isInt({ min: MIN_DEPOSIT_VND, max: MAX_CASH_VND })
      .withMessage(`Số tiền nạp phải là số nguyên từ ${MIN_DEPOSIT_VND.toLocaleString('vi-VN')} đến 1.000.000.000 ₫`),
  ]),
  controller.createDeposit
)
depositRouter.get('/', auth, controller.listMyDeposits)

// ==================== Rút tiền mô phỏng ====================
const withdrawalRouter = express.Router()

withdrawalRouter.post(
  '/',
  auth,
  validate([
    body('amountVND')
      .isInt({ min: MIN_WITHDRAWAL_VND, max: MAX_CASH_VND })
      .withMessage(`Số tiền rút phải là số nguyên từ ${MIN_WITHDRAWAL_VND.toLocaleString('vi-VN')} đến 1.000.000.000 ₫`),
  ]),
  controller.createWithdrawal
)
withdrawalRouter.get('/', auth, controller.listMyWithdrawals)
// Hủy yêu cầu rút đang chờ (tùy chọn — chỉ đổi trạng thái, không đụng số dư)
withdrawalRouter.post('/:id/cancel', auth, controller.cancelMyWithdrawal)

module.exports = { depositRouter, withdrawalRouter }
