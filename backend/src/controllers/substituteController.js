const mongoose = require('mongoose')
const SubstituteAssignment = require('../models/SubstituteAssignment')
const User = require('../models/User')
const ConsultationRequest = require('../models/ConsultationRequest')
const AcademicTerm = require('../models/AcademicTerm')
const Notification = require('../models/Notification')

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseDateOnly(date) {
  if (typeof date !== 'string') return null
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
  return new Date(Date.UTC(year, month, day))
}

function startOfDayUTC(date) {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function resolveAcademicTermReference(value) {
  if (!value) return null
  if (value instanceof mongoose.Types.ObjectId) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    return mongoose.Types.ObjectId.isValid(trimmed) ? new mongoose.Types.ObjectId(trimmed) : null
  }
  return null
}

async function getActiveAcademicTermReference() {
  try {
    const term = await AcademicTerm.findOne({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).select('_id').lean()
    return term?._id || null
  } catch (error) {
    console.error('Failed to resolve active academic term:', error)
    return null
  }
}

function endOfDayUTC(date) {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function nextDaySixAMUTC(date) {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 6, 0, 0, 0))
}

function isLunchBreakEntry(entry = {}) {
  return (
    String(entry.entryType || '').trim().toLowerCase() === 'lunch' ||
    String(entry.color || '').trim().toLowerCase() === 'color-gray' ||
    /\blunch(?:\s+break)?\b/i.test(String(entry.subject || ''))
  )
}

function substituteEntrySignature(substituteTeacher, entry = {}) {
  return [
    String(substituteTeacher || ''),
    normalizeString(entry.year),
    normalizeString(entry.section),
    normalizeString(entry.subject),
    normalizeString(entry.timeIn),
    normalizeString(entry.timeOut),
  ].join('|')
}

function teacherFullName(teacher, fallback = 'A teacher') {
  const name = `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.trim()
  return name || fallback
}

async function notifyStudentsOfSubstitutes({
  originalTeacher,
  date,
  newAssignments,
  previousSignatures,
  actorId,
}) {
  const original = await User.findById(originalTeacher).select('firstName lastName').lean()
  const originalName = teacherFullName(original, 'Your teacher')
  const notifications = []
  const queuedNotificationKeys = new Set()

  for (const [substituteTeacherId, entries] of newAssignments.entries()) {
    const substitute = await User.findById(substituteTeacherId).select('firstName lastName').lean()
    const substituteName = teacherFullName(substitute, 'A substitute teacher')

    for (const entry of entries) {
      const assignmentKey = substituteEntrySignature(substituteTeacherId, entry)
      const year = normalizeString(entry.year)
      const sections = [
        normalizeString(entry.section),
        ...(Array.isArray(entry.parallelSlots)
          ? entry.parallelSlots.map((slot) => normalizeString(slot?.section))
          : []),
      ].filter(Boolean)
      const uniqueSections = [...new Set(sections)]
      if (!year || !uniqueSections.length) continue

      const students = await User.find({
        account_status: 'Active',
        yearLevel: year,
        section: { $in: uniqueSections },
        $or: [
          { role: 'student' },
          { roles: 'student' },
        ],
      }).select('_id').lean()

      const subject = normalizeString(entry.subject) || 'your class'
      const timeRange = entry.timeIn && entry.timeOut
        ? ` from ${entry.timeIn} to ${entry.timeOut}`
        : ''

      for (const student of students) {
        const queueKey = `${student._id}|${assignmentKey}`
        if (queuedNotificationKeys.has(queueKey)) continue

        // This also backfills notifications for assignments saved before this fix,
        // while avoiding a duplicate when an unchanged assignment is saved again.
        if (previousSignatures.has(assignmentKey)) {
          const alreadyNotified = await Notification.exists({
            recipientId: student._id,
            type: 'substitute_assignment',
            'related.originalTeacherId': String(originalTeacher),
            'related.assignmentKey': assignmentKey,
            'related.date': date,
          })
          if (alreadyNotified) continue
        }

        queuedNotificationKeys.add(queueKey)
        notifications.push({
          recipientId: student._id,
          actorId: actorId || null,
          type: 'substitute_assignment',
          title: 'Substitute teacher assigned',
          message: `${substituteName} will substitute for ${originalName} in ${subject}${timeRange} on ${date}.`,
          related: {
            originalTeacherId: String(originalTeacher),
            substituteTeacherId: String(substituteTeacherId),
            date,
            assignmentKey,
            subject,
            year,
            section: normalizeString(entry.section),
          },
          data: { route: '/student/dashboard' },
        })
      }
    }
  }

  if (notifications.length) {
    // create() runs Notification save hooks so connected students receive the alert over SSE.
    await Notification.create(notifications)
  }
  return notifications.length
}

async function createAssignment(req, res) {
  try {
    const { originalTeacher, substituteTeacher, date, entries } = req.body || {}
    if (!originalTeacher || !substituteTeacher || !date) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    const parsedDate = parseDateOnly(date)
    const dt = parsedDate || new Date(date)
    if (isNaN(dt.getTime())) return res.status(400).json({ message: 'Invalid date.' })

    const academicTermId = resolveAcademicTermReference(req.body?.academicTermId) || await getActiveAcademicTermReference()

    // compute expiresAt: next day at 6:00am UTC
    const expiresAt = nextDaySixAMUTC(dt)
    const cleanEntries = Array.isArray(entries)
      ? entries.filter((entry) => !isLunchBreakEntry(entry))
      : []
    if (!cleanEntries.length) {
      return res.status(400).json({ message: 'Lunch breaks cannot be assigned to a substitute.' })
    }

    // For idempotency: try to find an existing assignment for same original/substitute/date
    // Use a normalized UTC day key to avoid timezone mismatch
    const dateKey = startOfDayUTC(dt)
    let assignment = await SubstituteAssignment.findOne({
      originalTeacher,
      substituteTeacher,
      date: dateKey,
    })

    if (!assignment) {
      assignment = await SubstituteAssignment.create({
        originalTeacher,
        substituteTeacher,
        date: dateKey,
        academicTermId,
        entries: cleanEntries,
        expiresAt,
      })
    } else {
      // merge entries: add only when no existing entry matches timeIn,timeOut,section,subject
      const existing = (assignment.entries || []).filter((entry) => !isLunchBreakEntry(entry))
      for (const e of cleanEntries) {
        const found = existing.some((ex) =>
          String(ex.timeIn || '') === String(e.timeIn || '') &&
          String(ex.timeOut || '') === String(e.timeOut || '') &&
          String((ex.section || '')) === String((e.section || '')) &&
          String((ex.subject || '')).trim() === String((e.subject || '')).trim()
        )
        if (!found) existing.push(e)
      }
      assignment.entries = existing
      assignment.expiresAt = expiresAt
      assignment.academicTermId = assignment.academicTermId || academicTermId || null
      await assignment.save()
    }

    const populated = await SubstituteAssignment.findById(assignment._id)
      .populate('originalTeacher', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email')

    // Notify substitute teacher about the assignment
    try {
      if (populated && populated.substituteTeacher) {
        await Notification.create({
          recipientId: populated.substituteTeacher._id,
          actorId: req.user?.id || null,
          type: 'substitute_assignment',
          title: 'Substitute assignment',
          message: `You have been assigned as a substitute for ${populated.originalTeacher ? `${populated.originalTeacher.firstName || ''} ${populated.originalTeacher.lastName || ''}`.trim() : 'a teacher'} on ${date}.`,
          related: { substituteAssignmentId: populated._id.toString(), date },
        })
      }
    } catch (err) {
      console.warn('Failed to create substitute notification:', err.message)
    }

    // Notify affected students:
    // - students who have PENDING/APPROVED consultation requests for the original teacher
    // - students assigned to the original teacher's schedule entries for that date
    try {
      // obtain authoritative teacher identity (employeeId + full name)
      let teacherDoc = null
      try {
        teacherDoc = populated.originalTeacher && populated.originalTeacher._id
          ? await User.findById(String(populated.originalTeacher._id)).select('employeeId firstName lastName').lean()
          : null
      } catch (e) { teacherDoc = null }

      const originalName = teacherDoc ? `${teacherDoc.firstName || ''} ${teacherDoc.lastName || ''}`.trim() : (populated.originalTeacher ? `${populated.originalTeacher.firstName || ''} ${populated.originalTeacher.lastName || ''}`.trim() : originalTeacher)
      const lookupKeys = [teacherDoc?.employeeId, originalName].filter(Boolean)

      // 1) students with active requests
      const reqStudents = await ConsultationRequest.find({
        employeeId: { $in: lookupKeys },
        status: { $in: ['PENDING','APPROVED'] },
      }).select('studentId').lean()
      const studentIds = new Set(reqStudents.map(r => String(r.studentId)).filter(Boolean))

      // 2) students from schedule entries (for broader notification)
      const scheduleEntries = await require('../models/ScheduleEntry').find({ teacher: originalName }).select('year section').lean()
      const yearSectionPairs = scheduleEntries
        .map((e) => ({ year: String(e.year || '').trim(), section: String(e.section || '').trim() }))
        .filter((p) => p.year && p.section)

      if (yearSectionPairs.length) {
        const orClauses = yearSectionPairs.map((p) => ({ yearLevel: p.year, section: p.section }))
        // also attempt matching by 'grade' field if present
        const orClausesGrade = yearSectionPairs.map((p) => ({ grade: p.year, section: p.section }))
        const studentsFromSchedule = await User.find({ role: 'student', $or: [...orClauses, ...orClausesGrade] }).select('_id').lean()
        for (const s of studentsFromSchedule) studentIds.add(String(s._id))
      }

      // create notifications for each studentId (best-effort)
      for (const sid of Array.from(studentIds)) {
        try {
          await Notification.create({
            recipientId: sid,
            actorId: req.user?.id || null,
            type: 'substitute_assignment',
            title: 'Substitute teacher assigned',
            message: `${originalName} will be substituted on ${date}. Please check your schedule.`,
            related: { substituteAssignmentId: populated._id.toString(), date },
          })
        } catch (err) {
          // ignore individual failures
        }
      }
    } catch (err) {
      console.warn('Failed to notify students about substitute assignment:', err.message)
    }

    return res.status(200).json({ message: 'Substitute assignment saved.', assignment: populated })
  } catch (error) {
    console.error('Failed to create substitute assignment:', error)
    return res.status(500).json({ message: 'Failed to create substitute assignment.', error: error.message })
  }
}

async function syncAssignments(req, res) {
  try {
    const { originalTeacher, date, substituteAssignments, assignments } = req.body || {}
    if (!originalTeacher || !date || !Array.isArray(assignments)) {
      return res.status(400).json({ message: 'Original teacher, date, and assignments are required.' })
    }

    const target = parseDateOnly(date) || new Date(date)
    if (isNaN(target.getTime())) {
      return res.status(400).json({ message: 'Invalid date.' })
    }

    const grouped = new Map()
    for (const item of assignments) {
      const substituteTeacher = item?.substituteTeacher
      const cleanEntries = Array.isArray(item?.entries)
        ? item.entries.filter((entry) => !isLunchBreakEntry(entry))
        : []
      if (!substituteTeacher || !cleanEntries.length) continue
      const key = String(substituteTeacher)
      const current = grouped.get(key) || []
      current.push(...cleanEntries)
      grouped.set(key, current)
    }

    const dateKey = startOfDayUTC(target)
    const academicTermId = resolveAcademicTermReference(req.body?.academicTermId) || await getActiveAcademicTermReference()
    const expiresAt = nextDaySixAMUTC(target)
    const previousAssignments = await SubstituteAssignment.find({
      originalTeacher,
      date: { $gte: startOfDayUTC(target), $lte: endOfDayUTC(target) },
    }).select('substituteTeacher entries').lean()
    const previousSignatures = new Set(
      previousAssignments.flatMap((assignment) => (
        (assignment.entries || []).map((entry) => (
          substituteEntrySignature(assignment.substituteTeacher, entry)
        ))
      ))
    )
    const operations = [
      {
        deleteMany: {
          filter: {
            originalTeacher,
            date: { $gte: startOfDayUTC(target), $lte: endOfDayUTC(target) },
          },
        },
      },
      ...Array.from(grouped.entries()).map(([substituteTeacher, entries]) => ({
        insertOne: {
          document: {
            originalTeacher,
            substituteTeacher,
            date: dateKey,
            academicTermId,
            entries,
            expiresAt,
          },
        },
      })),
    ]

    await SubstituteAssignment.bulkWrite(operations, { ordered: true })
    await User.findByIdAndUpdate(originalTeacher, {
      $set: {
        substituteAssignments:
          substituteAssignments && typeof substituteAssignments === 'object'
            ? substituteAssignments
            : {},
      },
    })

    let notifiedStudents = 0
    try {
      notifiedStudents = await notifyStudentsOfSubstitutes({
        originalTeacher,
        date,
        newAssignments: grouped,
        previousSignatures,
        actorId: req.user?.id,
      })
    } catch (notificationError) {
      console.warn('Substitutes updated, but student notifications failed:', notificationError.message)
    }

    return res.json({
      message: grouped.size ? 'Substitute assignments updated.' : 'Substitute assignments removed.',
      assignmentCount: grouped.size,
      notifiedStudents,
    })
  } catch (error) {
    console.error('Failed to synchronize substitute assignments:', error)
    return res.status(500).json({ message: 'Failed to update substitute assignments.', error: error.message })
  }
}

async function listAssignments(req, res) {
  try {
    const { date } = req.query || {}
    const teacherId = req.user?.role === 'teacher' ? req.user.id : req.query?.teacherId
    if (!teacherId) {
      return res.json({ assignments: [] })
    }
    const target = date ? (parseDateOnly(date) || new Date(date)) : new Date()
    const academicTermId = resolveAcademicTermReference(req.query?.academicTermId) || await getActiveAcademicTermReference()
    const q = {
      date: { $gte: startOfDayUTC(target), $lte: endOfDayUTC(target) },
      $or: [{ substituteTeacher: teacherId }, { originalTeacher: teacherId }],
    }

    if (academicTermId) {
      q.academicTermId = academicTermId
    }

    let assignments = await SubstituteAssignment.find(q)
      .sort({ createdAt: -1 })
      .populate('originalTeacher', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email')

    if (!assignments.length && date) {
      const fallbackQ = { date: { $gte: startOfDay(target), $lte: endOfDay(target) } }
      fallbackQ.$or = [{ substituteTeacher: teacherId }, { originalTeacher: teacherId }]
      assignments = await SubstituteAssignment.find(fallbackQ)
        .sort({ createdAt: -1 })
        .populate('originalTeacher', 'firstName lastName email')
        .populate('substituteTeacher', 'firstName lastName email')
    }

    return res.json({ assignments })
  } catch (error) {
    console.error('Failed to list substitute assignments:', error)
    return res.status(500).json({ message: 'Failed to list substitute assignments.', error: error.message })
  }
}

async function getAssignment(req, res) {
  try {
    const { id } = req.params
    const assignment = await SubstituteAssignment.findById(id)
      .populate('originalTeacher', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email')
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
    if (
      req.user?.role === 'teacher' &&
      String(assignment.originalTeacher?._id || assignment.originalTeacher) !== String(req.user.id) &&
      String(assignment.substituteTeacher?._id || assignment.substituteTeacher) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'This substitute schedule is only visible to the involved teachers.' })
    }
    return res.json({ assignment })
  } catch (error) {
    console.error('Failed to get substitute assignment:', error)
    return res.status(500).json({ message: 'Failed to get substitute assignment.', error: error.message })
  }
}

async function deleteAssignment(req, res) {
  try {
    const { id } = req.params
    const doc = await SubstituteAssignment.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ message: 'Assignment not found.' })
    return res.json({ message: 'Assignment deleted.' })
  } catch (error) {
    console.error('Failed to delete substitute assignment:', error)
    return res.status(500).json({ message: 'Failed to delete substitute assignment.', error: error.message })
  }
}

async function deleteAssignmentsForTeacher(req, res) {
  try {
    const { originalTeacher, date } = req.query || {}
    if (!originalTeacher || !date) {
      return res.status(400).json({ message: 'Original teacher and date are required.' })
    }

    const target = parseDateOnly(date) || new Date(date)
    if (isNaN(target.getTime())) {
      return res.status(400).json({ message: 'Invalid date.' })
    }

    const result = await SubstituteAssignment.deleteMany({
      originalTeacher,
      date: { $gte: startOfDayUTC(target), $lte: endOfDayUTC(target) },
    })

    return res.json({
      message: 'Substitute assignments removed.',
      deletedCount: result.deletedCount || 0,
    })
  } catch (error) {
    console.error('Failed to remove substitute assignments:', error)
    return res.status(500).json({ message: 'Failed to remove substitute assignments.', error: error.message })
  }
}

module.exports = {
  createAssignment,
  listAssignments,
  getAssignment,
  deleteAssignment,
  deleteAssignmentsForTeacher,
  syncAssignments,
}
