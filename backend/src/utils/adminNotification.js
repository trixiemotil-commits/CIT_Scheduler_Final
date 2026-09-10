const Notification = require('../models/Notification')
const User = require('../models/User')

async function notifyActiveAdmins({ actorId, type, title, message, related = {}, route = '/admin/dashboard' }) {
  const admins = await User.find({
    account_status: 'Active',
    $or: [{ role: 'admin' }, { roles: 'admin' }],
    ...(actorId ? { _id: { $ne: actorId } } : {}),
  }).select('_id').lean()

  if (!admins.length) return 0

  const actor = actorId
    ? await User.findById(actorId).select('firstName lastName avatar').lean()
    : null
  const actorData = actor ? {
    actorName: `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
    avatar: actor.avatar || null,
  } : {}

  await Notification.create(admins.map((admin) => ({
    recipientId: admin._id,
    actorId: actorId || null,
    type,
    title,
    message,
    related,
    data: { route, ...actorData },
  })))

  return admins.length
}

async function notifyActiveStudents({ actorId, type, title, message, related = {}, route = '/student/teachers' }) {
  const students = await User.find({
    account_status: 'Active',
    $or: [{ role: 'student' }, { roles: 'student' }],
  }).select('_id').lean()

  if (!students.length) return 0

  await Notification.create(students.map((student) => ({
    recipientId: student._id,
    actorId: actorId || null,
    type,
    title,
    message,
    related,
    data: { route },
  })))

  return students.length
}

module.exports = { notifyActiveAdmins, notifyActiveStudents }
