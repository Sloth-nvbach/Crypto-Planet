const mongoose = require('mongoose')

/**
 * Kết nối MongoDB Local qua Mongoose.
 * Được gọi từ server.js và scripts/seed.js trước khi làm việc với dữ liệu.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Thiếu biến môi trường MONGODB_URI. Kiểm tra file .env')
  }
  mongoose.connection.on('connected', () => {
    console.log('✅ Đã kết nối MongoDB:', mongoose.connection.name)
  })
  mongoose.connection.on('error', (err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message)
  })
  await mongoose.connect(uri)
  return mongoose.connection
}

module.exports = connectDB
