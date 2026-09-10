const Notification = require('../models/Notification')
const ConsultationRequest = require('../models/ConsultationRequest')
const User = require('../models/User')

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

    return res.json({ notifications: await Promise.all(docs.map(async (d) => {
      const request = requestById.get(String(d.related?.consultationRequestId))
      const student = request?.studentId
      const teacher = request?.employeeId
        ? await User.findOne({ employeeId: request.employeeId }).select('firstName lastName avatar').lean()
        : null
      const actor = d.actorId && typeof d.actorId === 'object' ? d.actorId : null
      const data = {
        ...(d.data || {}),
        ...(actor ? {
          actorName: `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
          avatar: actor.avatar || d.data?.avatar || null,
        } : {}),
        ...(student ? {
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          subject: request.subject || '',
          consultationTime: [request.consultationStartTime, request.consultationEndTime].filter(Boolean).join(' - '),
          avatar: student.avatar || d.data?.avatar || null,
        } : {}),
        ...(teacher && d.type === 'consultation_status' ? {
          teacherName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
          avatar: teacher.avatar || d.data?.avatar || null,
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
