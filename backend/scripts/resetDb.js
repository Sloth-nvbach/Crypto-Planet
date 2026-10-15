/**
 * Xóa toàn bộ database crypto_planet (đặt lại dự án về trạng thái trắng).
 * Dùng khi muốn seed lại từ đầu cho sạch sẽ. Chạy: npm run reset
 */
require('dotenv').config()

const mongoose = require('mongoose')

async function reset() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Thiếu MONGODB_URI trong .env')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGODB_URI)
  await mongoose.connection.dropDatabase()
  console.log(`🗑️  Đã xóa toàn bộ database "${mongoose.connection.name}"`)
  await mongoose.connection.close()
  process.exit(0)
}

reset().catch((err) => {
  console.error('❌ Xóa database thất bại:', err.message)
  process.exit(1)
})
