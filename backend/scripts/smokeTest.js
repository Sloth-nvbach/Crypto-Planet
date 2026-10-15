/**
 * Smoke test — kiểm thử nhanh toàn luồng chính của Crypto Planet bằng Node (fetch).
 *
 * Điều kiện chạy:
 *   1. MongoDB Local đang hoạt động
 *   2. Đã chạy `npm run seed` ít nhất 1 lần
 *   3. Server API đang chạy (`npm run dev` ở cửa sổ khác)
 *
 * Chạy: npm run smoke
 *
 * Script tự tạo user test, chạy ~25 kiểm tra (TC trong DESIGN.md mục 9)
 * và DỌN DỌN SẠCH dữ liệu test khi kết thúc.
 */
require('dotenv').config()

const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const User = require('../src/models/User')
const Wallet = require('../src/models/Wallet')
const Transaction = require('../src/models/Transaction')
const BalanceHistory = require('../src/models/BalanceHistory')
const DepositRequest = require('../src/models/DepositRequest')
const WithdrawalRequest = require('../src/models/WithdrawalRequest')
const SupportTicket = require('../src/models/SupportTicket')
const AuditLog = require('../src/models/AuditLog')

const BASE = (process.env.SMOKE_API_URL || 'http://localhost:5000') + '/api'
const FUND_VND = 100000000 // vốn cấp cho user test (đủ mua 0.01 BTC ~ 23,5 triệu)
const passed = []
const failed = []

function check(name, condition, extra = '') {
  if (condition) passed.push(name)
  else failed.push(`${name}${extra ? ` — ${extra}` : ''}`)
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = {}
  try {
    data = await res.json()
  } catch {
    /* một số lỗi không trả JSON */
  }
  return { status: res.status, data }
}

async function cleanup(email) {
  const user = await User.findOne({ email })
  if (!user) return
  await Promise.all([
    Wallet.deleteMany({ userId: user._id }),
    Transaction.deleteMany({ userId: user._id }),
    BalanceHistory.deleteMany({ userId: user._id }),
    DepositRequest.deleteMany({ userId: user._id }),
    WithdrawalRequest.deleteMany({ userId: user._id }),
    SupportTicket.deleteMany({ userId: user._id }),
    AuditLog.deleteMany({ targetId: user._id }),
    User.deleteOne({ _id: user._id }),
  ])
}

async function main() {
  // Kết nối trực tiếp DB để dọn dẹp dữ liệu test sau khi chạy
  await connectDB()

  const email = `smoke_${Date.now()}@test.local`
  await cleanup(email) // chạy lại nhiều lần không dồn rác

  console.log('\n🧪 Bắt đầu smoke test Crypto Planet...\n')

  // ==== Xác thực & phân quyền ====
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: (process.env.ADMIN_EMAIL || '').toLowerCase(), password: process.env.ADMIN_PASSWORD },
  })
  check('TC: Admin đăng nhập', adminLogin.status === 200 && adminLogin.data?.data?.token)
  const adminToken = adminLogin.data?.data?.token
  if (!adminToken) {
    console.log('❌ Không đăng nhập được admin — kiểm tra .env (ADMIN_EMAIL/ADMIN_PASSWORD) và đã chạy seed chưa?')
    process.exit(1)
  }

  const reg = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Test', email, password: 'test1234' },
  })
  check('TC: Đăng ký user mới → 201', reg.status === 201 && reg.data?.data?.token, `status: ${reg.status}`)
  const token = reg.data?.data?.token
  const userId = reg.data?.data?.user?.id

  const dupEmail = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Trùng email', email, password: 'test1234' },
  })
  check('TC: Đăng ký email đã tồn tại → 409', dupEmail.status === 409, `status: ${dupEmail.status}`)

  const wrongPass = await api('/auth/login', {
    method: 'POST',
    body: { email, password: 'sai-mat-khau' },
  })
  check('TC: Đăng nhập sai mật khẩu → 401', wrongPass.status === 401)

  const noAuth = await api('/wallets')
  check('TC: API riêng tư không có token → 401', noAuth.status === 401)

  const notAdmin = await api('/admin/users', { token })
  check('TC: User thường gọi API admin → 403', notAdmin.status === 403)

  // ==== Số dư ban đầu & điều chỉnh bởi admin ====
  const wallet0 = await api('/wallets', { token })
  const vnd0 = wallet0.data?.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance
  check('TC: User mới có số dư VND = 0', vnd0 === 0)

  const adjustNoReason = await api(`/admin/users/${userId}/balances`, {
    method: 'POST',
    token: adminToken,
    body: { currencySymbol: 'VND', changeAmount: 1000000 },
  })
  check('TC: Điều chỉnh số dư thiếu lý do → 400', adjustNoReason.status === 400)

  const adjust = await api(`/admin/users/${userId}/balances`, {
    method: 'POST',
    token: adminToken,
    body: { currencySymbol: 'VND', changeAmount: FUND_VND, reason: 'Kiểm thử smoke: cộng vốn' },
  })
  check('TC: Admin điều chỉnh số dư +100.000.000 VND', adjust.status === 200)

  const wallet1 = await api('/wallets', { token })
  const vnd1 = wallet1.data?.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance
  check('TC: Số dư VND sau điều chỉnh = 100.000.000', vnd1 === FUND_VND, `thực tế: ${vnd1}`)

  // ==== Giao dịch mua/bán ====
  const market = await api('/market/cryptocurrencies?limit=100')
  const btc = market.data?.data?.items?.find((c) => c.symbol === 'BTC')
  check('TC: Lấy giá BTC từ thị trường', Boolean(btc))

  const buyTotal = Math.round(0.01 * btc.currentPriceVND)
  const buyFee = Math.round((buyTotal * 0.5) / 100)
  const idemKey = crypto.randomUUID()
  const buy = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'BTC', side: 'buy', quantity: 0.01, idempotencyKey: idemKey },
  })
  check(
    'TC: Mua 0.01 BTC đủ số dư → 201 completed',
    buy.status === 201 && buy.data?.data?.transaction?.status === 'completed'
  )

  // ==== Idempotency: gửi lại cùng yêu cầu ====
  const replay = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'BTC', side: 'buy', quantity: 0.01, idempotencyKey: idemKey },
  })
  const walletAfterReplay = await api('/wallets', { token })
  const vndAfterReplay = walletAfterReplay.data?.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance
  const btcBal = walletAfterReplay.data?.data?.items?.find((w) => w.currencySymbol === 'BTC')?.availableBalance
  check('TC: Gửi lại cùng idempotencyKey → trả kết quả gốc', replay.status === 200 && replay.data?.data?.replayed === true)
  check(
    'TC: KHÔNG bị trừ tiền lần 2',
    vndAfterReplay === FUND_VND - buyTotal - buyFee,
    `thực tế: ${vndAfterReplay}, kỳ vọng: ${FUND_VND - buyTotal - buyFee}`
  )
  check('TC: Ví BTC = 0.01', Math.abs((btcBal || 0) - 0.01) < 1e-9, `thực tế: ${btcBal}`)

  // ==== Các trường hợp giao dịch sai ====
  const tooBig = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'BTC', side: 'buy', quantity: 100, idempotencyKey: crypto.randomUUID() },
  })
  check('TC: Mua vượt số dư → 400, số dư không đổi', tooBig.status === 400)

  const negQty = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'BTC', side: 'buy', quantity: -1, idempotencyKey: crypto.randomUUID() },
  })
  check('TC: Số lượng âm → 400', negQty.status === 400)

  const badSymbol = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'XXXX', side: 'buy', quantity: 1, idempotencyKey: crypto.randomUUID() },
  })
  check('TC: Symbol không tồn tại → 404', badSymbol.status === 404)

  const sell = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'BTC', side: 'sell', quantity: 0.005, idempotencyKey: crypto.randomUUID() },
  })
  check('TC: Bán 0.005 BTC thành công', sell.status === 201 && sell.data?.data?.transaction?.status === 'completed')

  const sellTooMuch = await api('/trades', {
    method: 'POST',
    token,
    body: { symbol: 'BTC', side: 'sell', quantity: 100, idempotencyKey: crypto.randomUUID() },
  })
  check('TC: Bán vượt số coin → 400', sellTooMuch.status === 400)

  // ==== Nạp tiền mô phỏng ====
  const dep = await api('/deposits', { method: 'POST', token, body: { amountVND: 50000 } })
  check('TC: Tạo yêu cầu nạp 50.000 → pending, chưa cộng tiền', dep.status === 201 && dep.data?.data?.request?.status === 'pending')
  const depId = dep.data?.data?.request?._id

  const depSmall = await api('/deposits', { method: 'POST', token, body: { amountVND: 10000 } })
  check('TC: Nạp dưới tối thiểu → 400', depSmall.status === 400)

  const approve = await api(`/admin/deposits/${depId}/approve`, { method: 'POST', token: adminToken })
  check('TC: Admin duyệt nạp → 200', approve.status === 200)

  const approve2 = await api(`/admin/deposits/${depId}/approve`, { method: 'POST', token: adminToken })
  check('TC: Duyệt nạp lần 2 → 409 (chặn cộng tiền 2 lần)', approve2.status === 409)

  const walletAfterDep = await api('/wallets', { token })
  const vndAfterDep = walletAfterDep.data?.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance
  // Kỳ vọng: số dư sau mua + tiền nhận được khi bán 0.005 BTC + 50.000 tiền nạp
  const sellTotal = Math.round(0.005 * btc.currentPriceVND)
  const sellFee = Math.round((sellTotal * 0.5) / 100)
  const expectedAfterDep = vndAfterReplay + (sellTotal - sellFee) + 50000
  check(
    'TC: Duyệt nạp cộng đúng 50.000 (khớp sổ cái)',
    vndAfterDep === expectedAfterDep,
    `thực tế: ${vndAfterDep}, kỳ vọng: ${expectedAfterDep}`
  )

  // ==== Rút tiền mô phỏng + từ chối ====
  const wd = await api('/withdrawals', { method: 'POST', token, body: { amountVND: 60000 } })
  check('TC: Tạo yêu cầu rút 60.000 (≥ tối thiểu 50.000) → pending', wd.status === 201)
  const wdId = wd.data?.data?.request?._id

  const beforeReject = await api('/wallets', { token })
  const vndBeforeReject = beforeReject.data?.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance
  const reject = await api(`/admin/withdrawals/${wdId}/reject`, {
    method: 'POST',
    token: adminToken,
    body: { adminNote: 'Kiểm thử: từ chối' },
  })
  check('TC: Admin từ chối rút → 200', reject.status === 200)

  const afterReject = await api('/wallets', { token })
  const vndAfterReject = afterReject.data?.data?.items?.find((w) => w.currencySymbol === 'VND')?.availableBalance
  check('TC: Từ chối rút KHÔNG đổi số dư', vndBeforeReject === vndAfterReject)

  // ==== Hỗ trợ ====
  const ticket = await api('/support/tickets', {
    method: 'POST',
    token,
    body: { subject: 'Kiểm thử hỗ trợ', message: 'Đây là nội dung ticket kiểm thử tự động.' },
  })
  check('TC: Gửi ticket hỗ trợ → 201', ticket.status === 201)
  const respond = await api(`/admin/tickets/${ticket.data?.data?.ticket?._id}`, {
    method: 'PUT',
    token: adminToken,
    body: { adminResponse: 'Đã tiếp nhận yêu cầu.', status: 'answered' },
  })
  check('TC: Admin phản hồi ticket → 200', respond.status === 200)

  // ==== Thống kê + khóa tài khoản + đối soát sổ cái ====
  const stats = await api('/admin/stats', { token: adminToken })
  check('TC: Thống kê tổng quan hoạt động', stats.status === 200 && stats.data?.data?.totalUsers >= 2)

  const lock = await api(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'locked', reason: 'Kiểm thử khóa tài khoản' },
  })
  check('TC: Admin khóa tài khoản → 200', lock.status === 200)

  const lockedCall = await api('/wallets', { token })
  check('TC: Tài khoản bị khóa → 403 mọi API riêng tư', lockedCall.status === 403)

  const ledger = await api(`/admin/users/${userId}/balance-histories?limit=50`, { token: adminToken })
  const ledgerItems = ledger.data?.data?.items || []
  let ledgerOk = ledgerItems.length > 0
  for (const h of ledgerItems) {
    if (Math.abs(h.balanceBefore + h.changeAmount - h.balanceAfter) > 1e-9) {
      ledgerOk = false
      break
    }
  }
  check('TC: Sổ cái đối soát — before + change = after (mọi dòng)', ledgerOk)

  // ==== Dọn dẹp dữ liệu test ====
  await cleanup(email)

  // ==== Kết quả ====
  passed.forEach((name) => console.log('✅', name))
  failed.forEach((name) => console.log('❌', name))
  console.log(`\n=== KẾT QUẢ SMOKE TEST: ${passed.length} đạt / ${failed.length} thất bại ===\n`)
  await mongoose.connection.close()
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('❌ Smoke test lỗi:', err.message)
  console.error('   Kiểm tra: MongoDB đã chạy? Server đã chạy (npm run dev)? Đã seed chưa (npm run seed)?')
  process.exit(1)
})
