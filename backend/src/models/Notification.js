const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, trim: true, default: 'info' },
  title: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  related: { type: Object, default: {} },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true })

// Broadcast newly saved notifications to connected SSE clients
try {
  const stream = require('../services/notificationStream')
  NotificationSchema.post('save', function(doc) {
    try {
      const payload = {
        id: doc._id.toString(),
        type: doc.type,
        title: doc.title,
        message: doc.message,
        related: doc.related || {},
        data: doc.data || {},
        read: Boolean(doc.read),
        createdAt: doc.createdAt,
      }
      stream.sendNotificationToRecipient(doc.recipientId, payload)
    } catch (err) {
      // ignore
    }
  })
} catch (err) {
  // if service can't be loaded, continue without streaming
}

module.exports = mongoose.model('Notification', NotificationSchema)
