const express = require('express')
const { authRequired } = require('../middleware/authMiddleware')
const { listNotifications, markAsRead, markAllRead } = require('../controllers/notificationController')
const streamService = require('../services/notificationStream')

const router = express.Router()

router.get('/', authRequired, listNotifications)
router.patch('/:id/read', authRequired, markAsRead)
router.patch('/mark-all-read', authRequired, markAllRead)

// Server-Sent Events stream for real-time notifications (accepts token in query)
router.get('/stream', (req, res) => streamService.attachSSE(req, res))

module.exports = router
