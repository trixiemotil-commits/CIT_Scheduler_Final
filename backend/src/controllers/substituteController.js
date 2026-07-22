const SubstituteAssignment = require('../models/SubstituteAssignment')
const User = require('../models/User')

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

function endOfDayUTC(date) {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

function nextDaySixAMUTC(date) {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 6, 0, 0, 0))
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

    // compute expiresAt: next day at 6:00am UTC
    const expiresAt = nextDaySixAMUTC(dt)
    const cleanEntries = Array.isArray(entries) ? entries : []

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
        entries: cleanEntries,
        expiresAt,
      })
    } else {
      // merge entries: add only when no existing entry matches timeIn,timeOut,section,subject
      const existing = assignment.entries || []
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
      await assignment.save()
    }

    const populated = await SubstituteAssignment.findById(assignment._id)
      .populate('originalTeacher', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email')

    return res.status(200).json({ message: 'Substitute assignment saved.', assignment: populated })
  } catch (error) {
    console.error('Failed to create substitute assignment:', error)
    return res.status(500).json({ message: 'Failed to create substitute assignment.', error: error.message })
  }
}

async function listAssignments(req, res) {
  try {
    const { date, teacherId } = req.query || {}
    const target = date ? (parseDateOnly(date) || new Date(date)) : new Date()
    const q = { date: { $gte: startOfDayUTC(target), $lte: endOfDayUTC(target) } }

    if (teacherId) {
      q.$or = [{ substituteTeacher: teacherId }, { originalTeacher: teacherId }]
    }

    let assignments = await SubstituteAssignment.find(q)
      .sort({ createdAt: -1 })
      .populate('originalTeacher', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email')

    if (!assignments.length && date) {
      const fallbackQ = { date: { $gte: startOfDay(target), $lte: endOfDay(target) } }
      if (teacherId) {
        fallbackQ.$or = [{ substituteTeacher: teacherId }, { originalTeacher: teacherId }]
      }
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

module.exports = {
  createAssignment,
  listAssignments,
  getAssignment,
  deleteAssignment,
}
