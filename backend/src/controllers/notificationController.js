const Notification = require('../models/Notification')

async function listNotifications(req, res) {
  try {
    const filter = { recipientId: req.user.id }
    const docs = await Notification.find(filter).sort({ createdAt: -1 }).limit(200).lean()
    return res.json({ notifications: docs.map((d) => ({
      id: d._id.toString(),
      type: d.type,
      title: d.title,
      message: d.message,
      related: d.related || {},
      data: d.data || {},
      read: Boolean(d.read),
      createdAt: d.createdAt,
    })) })
  } catch (error) {
    console.error('listNotifications error:', error)
    return res.status(500).json({ message: 'Failed to load notifications.', error: error.message })
  }
}

async function markAsRead(req, res) {
  try {
    const id = req.params.id
    const doc = await Notification.findById(id)
    if (!doc) return res.status(404).json({ message: 'Notification not found.' })
    if (String(doc.recipientId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' })
    doc.read = true
    await doc.save()
    return res.json({ message: 'Marked as read.' })
  } catch (error) {
    console.error('markAsRead error:', error)
    return res.status(500).json({ message: 'Failed to mark notification.' , error: error.message })
  }
}

async function markAllRead(req, res) {
  try {
    const filter = { recipientId: req.user.id, read: false }
    const result = await Notification.updateMany(filter, { $set: { read: true } })
    return res.json({ message: 'Marked all as read.', modifiedCount: result.nModified ?? result.modifiedCount ?? 0 })
  } catch (error) {
    console.error('markAllRead error:', error)
    return res.status(500).json({ message: 'Failed to mark all notifications.' , error: error.message })
  }
}

module.exports = { listNotifications, markAsRead, markAllRead }
