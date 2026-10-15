/**
 * Seed dữ liệu mẫu cho Crypto Planet.
 * Chạy: npm run seed  (trong thư mục backend)
 *
 * Nội dung:
 * - Tài khoản quản trị viên (lấy email/mật khẩu từ .env, chỉ tạo khi chưa có)
 * - Tài khoản demo có sẵn số dư (VND 100.000.000, BTC 0.5, ETH 3)
 * - 10 đồng tiền điện tử mẫu (upsert — chạy lại seed sẽ cập nhật giá)
 * - FAQ + thông báo chào mừng
 */
require('dotenv').config()

const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const User = require('../src/models/User')
const Cryptocurrency = require('../src/models/Cryptocurrency')
const Transaction = require('../src/models/Transaction')
const Faq = require('../src/models/Faq')
const Notification = require('../src/models/Notification')
const walletService = require('../src/services/walletService')
const { roundVND } = require('../src/utils/round')

const COINS = [
  { symbol: 'BTC', name: 'Bitcoin', currentPriceVND: 2350000000, changePercent: 1.85, description: 'Bitcoin là đồng tiền điện tử đầu tiên và có vốn hóa lớn nhất thị trường.' },
  { symbol: 'ETH', name: 'Ethereum', currentPriceVND: 82000000, changePercent: -0.92, description: 'Ethereum là nền tảng hợp đồng thông minh phổ biến nhất.' },
  { symbol: 'BNB', name: 'BNB', currentPriceVND: 45000000, changePercent: 0.35, description: 'BNB là token của hệ sinh thái Binance.' },
  { symbol: 'SOL', name: 'Solana', currentPriceVND: 12500000, changePercent: 3.12, description: 'Solana nổi bật với tốc độ giao dịch nhanh và phí thấp.' },
  { symbol: 'XRP', name: 'XRP', currentPriceVND: 38000, changePercent: -1.45, description: 'XRP hướng đến thanh toán quốc tế chi phí thấp.' },
  { symbol: 'ADA', name: 'Cardano', currentPriceVND: 15000, changePercent: 0.62, description: 'Cardano là nền tảng blockchain học thuật.' },
  { symbol: 'DOGE', name: 'Dogecoin', currentPriceVND: 4500, changePercent: 5.08, description: 'Dogecoin là đồng meme coin lâu đời nhất.' },
  { symbol: 'TRX', name: 'TRON', currentPriceVND: 1200, changePercent: -0.31, description: 'TRON tập trung vào nội dung số và giải trí.' },
  { symbol: 'LINK', name: 'Chainlink', currentPriceVND: 320000, changePercent: 2.4, description: 'Chainlink kết nối dữ liệu thực vào hợp đồng thông minh.' },
  { symbol: 'AVAX', name: 'Avalanche', currentPriceVND: 1800000, changePercent: -2.18, description: 'Avalanche là nền tảng hợp đồng thông minh tốc độ cao.' },
]

const FAQS = [
  {
    question: 'Crypto Planet là gì?',
    answer:
      'Crypto Planet là website MÔ PHỎNG sàn giao dịch tiền điện tử, được xây dựng nhằm mục đích học tập MERN Stack. Mọi số dư và giao dịch đều là dữ liệu mô phỏng trong cơ sở dữ liệu, KHÔNG phải tiền thật.',
    order: 1,
  },
  {
    question: 'Tiền trong hệ thống có phải tiền thật không?',
    answer:
      'Không. Toàn bộ số dư VND và tài sản là số liệu mô phỏng. Hệ thống không kết nối blockchain, không cổng thanh toán và không có tiền thật.',
    order: 2,
  },
  {
    question: 'Làm thế nào để có số dư VND?',
    answer:
      'Vào trang "Nạp/Rút", tạo yêu cầu nạp tiền mô phỏng. Quản trị viên sẽ phê duyệt yêu cầu và số dư của bạn được cộng tự động. Bạn cũng có thể dùng thử tài khoản demo có sẵn số dư.',
    order: 3,
  },
  {
    question: 'Phí giao dịch là bao nhiêu?',
    answer:
      'Phí giao dịch mua/bán là 0.5% giá trị lệnh (có thể thay đổi qua cấu hình hệ thống). Phí được tính và ghi rõ trong chi tiết từng giao dịch.',
    order: 4,
  },
  {
    question: 'Tôi gặp lỗi khi giao dịch thì làm sao?',
    answer:
      'Hãy kiểm tra số dư khả dụng và trạng thái tài sản. Nếu vẫn có lỗi, gửi yêu cầu hỗ trợ từ trang Hỗ trợ — quản trị viên sẽ phản hồi trong thời gian sớm nhất.',
    order: 5,
  },
]

/**
 * Cấp vốn ban đầu cho ví user demo — đi qua đúng quy trình hệ thống:
 * tạo Transaction(adjustment) + creditWallet (ghi sổ cái) → dữ liệu seed
 * vẫn nhất quán với sổ cái, có thể đối soát như dữ liệu thật.
 */
async function fundWallet(userId, symbol, amount, reason) {
  const coin = COINS.find((c) => c.symbol === symbol)
  const price = coin ? coin.currentPriceVND : 1
  const tx = await Transaction.create({
    userId,
    type: 'adjustment',
    currencySymbol: symbol,
    quantity: amount,
    price,
    totalValueVND: roundVND(amount * price),
    feeVND: 0,
    status: 'pending',
    note: reason,
  })
  await walletService.creditWallet(userId, symbol, amount, { transactionId: tx._id, reason })
  tx.status = 'completed'
  await tx.save({ validateBeforeSave: false })
}

async function seed() {
  await connectDB()
  console.log('\n🌱 Bắt đầu seed dữ liệu Crypto Planet...\n')

  // 1) Quản trị viên — lấy từ .env, chỉ tạo khi chưa có
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cryptoplanet.vn').toLowerCase()
  let admin = await User.findOne({ email: adminEmail })
  if (!admin) {
    admin = await User.create({
      name: 'Quản trị viên',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    })
    console.log('✅ Đã tạo tài khoản quản trị viên:', adminEmail)
  } else {
    console.log('ℹ️  Tài khoản quản trị viên đã tồn tại:', adminEmail)
  }

  // 2) Người dùng demo — có sẵn số dư để thử giao dịch ngay
  let demo = await User.findOne({ email: 'demo@cryptoplanet.vn' })
  if (!demo) {
    demo = await User.create({ name: 'Người dùng Demo', email: 'demo@cryptoplanet.vn', password: 'demo1234' })
    await fundWallet(demo._id, 'VND', 100000000, 'Khởi tạo số dư demo')
    await fundWallet(demo._id, 'BTC', 0.5, 'Khởi tạo số dư demo')
    await fundWallet(demo._id, 'ETH', 3, 'Khởi tạo số dư demo')
    console.log('✅ Đã tạo tài khoản demo: demo@cryptoplanet.vn / demo1234 (VND 100.000.000, BTC 0.5, ETH 3)')
  } else {
    console.log('ℹ️  Tài khoản demo đã tồn tại: demo@cryptoplanet.vn / demo1234')
  }

  // 3) Danh mục tiền điện tử — upsert theo symbol (chạy lại sẽ cập nhật giá mới)
  for (const coin of COINS) {
    await Cryptocurrency.findOneAndUpdate({ symbol: coin.symbol }, { $set: coin }, { upsert: true, new: true })
  }
  console.log(`✅ Đã đồng bộ ${COINS.length} đồng tiền điện tử mẫu`)

  // 4) FAQ
  await Faq.deleteMany({})
  await Faq.insertMany(FAQS)
  console.log('✅ Đã tạo câu hỏi thường gặp (FAQ)')

  // 5) Thông báo chào mừng
  const hasWelcome = await Notification.findOne({ title: 'Chào mừng đến với Crypto Planet' })
  if (!hasWelcome) {
    await Notification.create({
      title: 'Chào mừng đến với Crypto Planet',
      content:
        'Crypto Planet là sàn giao dịch MÔ PHỎNG phục vụ học tập. Số dư trong hệ thống không phải tiền thật. Hãy khám phá thị trường và thử mua/bán ngay hôm nay!',
      type: 'announcement',
      isPublished: true,
      createdBy: admin._id,
    })
    console.log('✅ Đã tạo thông báo chào mừng')
  } else {
    console.log('ℹ️  Thông báo chào mừng đã tồn tại')
  }

  console.log('\n🎉 Seed hoàn tất!')
  console.log('   Quản trị viên :', adminEmail, '/ mật khẩu trong .env (ADMIN_PASSWORD)')
  console.log('   Người dùng demo: demo@cryptoplanet.vn / demo1234\n')

  await mongoose.connection.close()
  process.exit(0)
}

seed().catch(async (err) => {
  console.error('❌ Seed thất bại:', err.message)
  try {
    await mongoose.connection.close()
  } catch {
    /* bỏ qua */
  }
  process.exit(1)
})
