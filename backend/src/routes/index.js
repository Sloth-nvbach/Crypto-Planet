const router = require('express').Router()

const authRoutes = require('./authRoutes')
const marketRoutes = require('./marketRoutes')
const walletRoutes = require('./walletRoutes')
const tradingRoutes = require('./tradingRoutes')
const { depositRouter, withdrawalRouter } = require('./cashRoutes')
const supportRoutes = require('./supportRoutes')
const contentRoutes = require('./contentRoutes')
const adminRoutes = require('./adminRoutes')

router.use('/auth', authRoutes)
router.use('/market', marketRoutes)
router.use('/wallets', walletRoutes)
router.use('/trades', tradingRoutes)
router.use('/deposits', depositRouter)
router.use('/withdrawals', withdrawalRouter)
router.use('/support', supportRoutes)
router.use('/', contentRoutes) // /api/faqs và /api/notifications
router.use('/admin', adminRoutes)

module.exports = router
