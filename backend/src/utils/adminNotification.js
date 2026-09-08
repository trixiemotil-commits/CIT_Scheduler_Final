const Notification = require('../models/Notification')
const User = require('../models/User')

async function notifyActiveAdmins({ actorId, type, title, message, related = {}, route = '/admin/dashboard' }) {
  const admins = await User.find({
    account_status: 'Active',
    $or: [{ role: 'admin' }, { roles: 'admin' }],
    ...(actorId ? { _id: { $ne: actorId } } : {}),
  }).select('_id').lean()

  if (!admins.length) return 0

  await Notification.create(admins.map((admin) => ({
    recipientId: admin._id,
    actorId: actorId || null,
    type,
    title,
    message,
    related,
    data: { route },
  })))

  return admins.length
}

module.exports = { notifyActiveAdmins }
