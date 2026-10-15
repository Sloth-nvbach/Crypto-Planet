require('dotenv').config()

const app = require('./app')
const connectDB = require('./config/db')

// Kiểm tra biến môi trường bắt buộc ngay khi khởi động
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET']
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Thiếu biến môi trường ${key}. Hãy tạo file .env từ .env.example`)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Crypto Planet API: http://localhost:${PORT}`)
      console.log(`   Fee giao dịch: ${process.env.TRADE_FEE_PERCENT || 0}% | Môi trường: ${process.env.NODE_ENV || 'development'}`)
    })
  })
  .catch((err) => {
    console.error('❌ Không kết nối được MongoDB:', err.message)
    console.error('   Kiểm tra MongoDB Local đã chạy chưa (service MongoDB trên Windows).')
    process.exit(1)
  })
