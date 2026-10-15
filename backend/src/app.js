const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const routes = require('./routes')
const notFound = require('./middlewares/notFound')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

// Cho phép frontend (Vite) gọi API — giới hạn theo CLIENT_URL trong .env
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))

// Nhận body JSON (tối đa 1MB — đủ cho mọi request của dự án)
app.use(express.json({ limit: '1mb' }))

// Log request ra console khi phát triển (GET /api/... 200 12ms)
app.use(morgan('dev'))

// Kiểm tra sức khỏe hệ thống — dùng để biết server + DB sống hay không
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Crypto Planet API đang hoạt động' })
})

// Toàn bộ API nghiệp vụ mount dưới /api
app.use('/api', routes)

// 404 và xử lý lỗi tập trung (luôn đặt CUỐI CÙNG)
app.use(notFound)
app.use(errorHandler)

module.exports = app
