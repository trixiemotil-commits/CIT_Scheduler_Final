const Notification = require('../models/Notification')
const ConsultationRequest = require('../models/ConsultationRequest')
const User = require('../models/User')

function formatConsultationTime(time) {
  const match = String(time || '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!match) return String(time || '')
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()
  if (minutes > 59) return String(time)
  if (meridiem) {
    if (hours < 1 || hours > 12) return String(time)
    if (meridiem === 'PM' && hours < 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0
  } else if (hours > 23) {
    return String(time)
  }
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

async function listNotifications(req, res) {
  try {
    const filter = { recipientId: req.user.id }
    const docs = await Notification.find(filter)
      .populate('actorId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    const requestIds = docs
      .map((doc) => doc.related?.consultationRequestId)
      .filter(Boolean)
    const requests = requestIds.length
      ? await ConsultationRequest.find({ _id: { $in: requestIds } })
        .populate('studentId', 'firstName lastName avatar')
        .select('studentId employeeId subject consultationStartTime consultationEndTime')
        .lean()
      : []
    const requestById = new Map(requests.map((request) => [String(request._id), request]))
    const employeeIds = [...new Set(requests.map((request) => request.employeeId).filter(Boolean))]
    const teachers = employeeIds.length
      ? await User.find({ employeeId: { $in: employeeIds } }).select('employeeId firstName lastName avatar').lean()
      : []
    const teacherByEmployeeId = new Map(teachers.map((teacher) => [teacher.employeeId, teacher]))
    const recentConsultationActions = new Map()
    const visibleDocs = docs.filter((doc) => {
      const requestId = doc.related?.consultationRequestId
      if (!requestId || !String(doc.type || '').startsWith('consultation_')) return true
      const actionKey = [requestId, doc.related?.status || ''].join(':')
      const createdAt = new Date(doc.createdAt).getTime()
      const previousCreatedAt = recentConsultationActions.get(actionKey)
      if (previousCreatedAt !== undefined && previousCreatedAt - createdAt < 10000) return false
      recentConsultationActions.set(actionKey, createdAt)
      return true
    })

    return res.json({ notifications: visibleDocs.map((d) => {
      const request = requestById.get(String(d.related?.consultationRequestId))
      const student = request?.studentId
      const teacher = teacherByEmployeeId.get(request?.employeeId)
      const actor = d.actorId && typeof d.actorId === 'object' ? d.actorId : null
      const data = {
        ...(d.data || {}),
        ...(request ? {
          subject: request.subject || '',
          consultationTime: [
            formatConsultationTime(request.consultationStartTime),
            formatConsultationTime(request.consultationEndTime),
          ].filter(Boolean).join(' - '),
        } : {}),
        ...(actor ? {
          actorName: `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
          avatar: actor.avatar || d.data?.avatar || student?.avatar || null,
        } : {}),
        ...(student ? {
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          avatar: actor?.avatar || d.data?.avatar || student.avatar || null,
        } : {}),
        ...(teacher ? {
          teacherName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
        } : {}),
      }

      return {
      id: d._id.toString(),
      type: d.type,
      title: d.title,
      message: d.message,
      related: d.related || {},
      data,
      read: Boolean(d.read),
      createdAt: d.createdAt,
      }
    }) })
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

async function clearNotifications(req, res) {
  try {
    const result = await Notification.deleteMany({ recipientId: req.user.id })
    return res.json({
      message: 'Notifications cleared.',
      deletedCount: result.deletedCount ?? result.n ?? 0,
    })
  } catch (error) {
    console.error('clearNotifications error:', error)
    return res.status(500).json({ message: 'Failed to clear notifications.', error: error.message })
  }
}

module.exports = { listNotifications, markAsRead, markAllRead, clearNotifications }
