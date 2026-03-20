const ConsultationAvailability = require("../models/ConsultationAvailability");
const ScheduleEntry = require("../models/ScheduleEntry");
const ConsultationRequest = require("../models/ConsultationRequest");
const ConsultationLog = require("../models/ConsultationLog");
const User = require("../models/User");

const MAX_WEEKLY_MINUTES = 240; // 4 hours

function parseTimeToMinutes(timeStr) {
  const text = (timeStr || "").toString().trim();
  const plainMatch = text.match(/^(\d{2}):(\d{2})$/);
  if (plainMatch) {
    const h = Number(plainMatch[1]);
    const m = Number(plainMatch[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  const ampmMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!ampmMatch) return null;
  let hours = parseInt(ampmMatch[1], 10);
  const mins = parseInt(ampmMatch[2], 10);
  const period = ampmMatch[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function minutesTo24h(totalMinutes) {
  const mins = Math.max(0, Number(totalMinutes) || 0);
  const hour = Math.floor(mins / 60) % 24;
  const minute = mins % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeTeacherFullName(userDoc) {
  return `${userDoc.firstName || ""} ${userDoc.lastName || ""}`.trim();
}

function nowContext() {
  const now = new Date();
  return {
    dayOfWeek: DAYS[now.getDay()],
    minutes: now.getHours() * 60 + now.getMinutes(),
  };
}

async function resolveTeacherStatus(userDoc) {
  if (!userDoc || userDoc.role !== "teacher") {
    return "On Leave";
  }

  if (userDoc.account_status !== "Active") {
    return "On Leave";
  }

  const directStatus = ["On School", "On Meeting", "On Leave"].includes(userDoc.teacher_status)
    ? userDoc.teacher_status
    : "On School";
  return directStatus;
}

function isRequestWithinAvailability(requestMinutes, startTime, endTime) {
  const slotStart = parseTimeToMinutes(startTime);
  const slotEnd = parseTimeToMinutes(endTime);
  if (slotStart === null || slotEnd === null) {
    return false;
  }

  const defaultDurationMinutes = 60;
  const requestEnd = requestMinutes + defaultDurationMinutes;
  return requestMinutes >= slotStart && requestEnd <= slotEnd;
}

function slotDurationMinutes(startTime, endTime) {
  const s = parseTimeToMinutes(startTime);
  const e = parseTimeToMinutes(endTime);
  if (s === null || e === null || e <= s) return 0;
  return e - s;
}

// Returns a conflict message if the teacher has a regular class scheduled that overlaps the proposed consultation
async function checkClassConflict(teacher, dayOfWeek, startTime, endTime, excludeConsultId = null) {
  const newStart = parseTimeToMinutes(startTime);
  const newEnd   = parseTimeToMinutes(endTime);
  if (newStart === null || newEnd === null) return null;

  const entries = await ScheduleEntry.find({ teacher, day: dayOfWeek }).lean();
  for (const entry of entries) {
    const entryStart = entry.timeInMinutes  ?? parseTimeToMinutes(entry.timeIn);
    const entryEnd   = entry.timeOutMinutes ?? parseTimeToMinutes(entry.timeOut);
    if (entryStart === null || entryEnd === null) continue;
    // Overlap: newStart < entryEnd AND newEnd > entryStart
    if (newStart < entryEnd && newEnd > entryStart) {
      return `${teacher} already has a class scheduled on ${dayOfWeek} from ${entry.timeIn} to ${entry.timeOut} (${entry.subject}). Consultation cannot overlap with a scheduled class.`;
    }
  }
  return null;
}

function toClient(doc) {
  return {
    id: doc._id.toString(),
    employeeId: doc.employeeId,
    teacher: doc.teacher,
    dayOfWeek: doc.dayOfWeek,
    startTime: doc.startTime,
    endTime: doc.endTime,
    durationMinutes: slotDurationMinutes(doc.startTime, doc.endTime),
  };
}

function toClientRequest(doc) {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId?.toString?.() || doc.studentId,
    employeeId: doc.employeeId,
    availabilityId: doc.availabilityId?.toString?.() || doc.availabilityId,
    subject: doc.subject,
    purpose: doc.purpose,
    requestDate: doc.requestDate,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function toClientLog(doc) {
  return {
    id: doc._id.toString(),
    requestId: doc.requestId?.toString?.() || doc.requestId,
    timeIn: doc.timeIn,
    timeOut: doc.timeOut,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

// GET /api/consultations/teachers
async function listTeachersForStudents(req, res) {
  try {
    const teacherUsers = await User.find({ role: "teacher" })
      .select("role firstName lastName employeeId department account_status teacher_status avatar")
      .lean();

    const teachers = await Promise.all(
      teacherUsers.map(async (teacherUser) => {
        const fullName = normalizeTeacherFullName(teacherUser);
        const lookupKeys = [
          teacherUser.employeeId,
          fullName,
        ].filter(Boolean);

        const [availabilitySlots, scheduleSubjects, status] = await Promise.all([
          ConsultationAvailability.find({
            $or: [
              { employeeId: { $in: lookupKeys } },
              { teacher: fullName },
            ],
          })
            .sort({ dayOfWeek: 1, startTime: 1 })
            .lean(),
          ScheduleEntry.find({ teacher: fullName }).distinct("subject"),
          resolveTeacherStatus(teacherUser),
        ]);

        return {
          id: teacherUser._id.toString(),
          name: fullName,
          employeeId: teacherUser.employeeId || "",
          avatar: teacherUser.avatar || null,
          department: teacherUser.department || "",
          status,
          available: status === "On School" && availabilitySlots.length > 0,
          subjects: Array.isArray(scheduleSubjects) ? scheduleSubjects.filter(Boolean) : [],
          consultationSlots: availabilitySlots.map((slot) => ({
            id: slot._id.toString(),
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        };
      })
    );

    return res.json({ teachers });
  } catch (error) {
    console.error("listTeachersForStudents error:", error);
    return res.status(500).json({ message: "Failed to fetch teachers.", error: error.message });
  }
}

// POST /api/consultations/requests
async function createConsultationRequest(req, res) {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Only students can create consultation requests." });
    }

    const { teacherId, topic, date, time, notes = "" } = req.body || {};
    if (!teacherId || !topic || !date || !time) {
      return res.status(400).json({ message: "teacherId, topic, date and time are required." });
    }

    const teacherUser = await User.findById(teacherId).lean();
    if (!teacherUser || teacherUser.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const teacherName = normalizeTeacherFullName(teacherUser);
    const teacherStatus = await resolveTeacherStatus(teacherUser);
    if (teacherStatus === "On Leave") {
      return res.status(409).json({ message: `${teacherName} is currently on leave and cannot accept consultation requests right now.` });
    }
    if (teacherStatus === "On Meeting") {
      return res.status(409).json({ message: `${teacherName} is currently on a meeting. Please try again later.` });
    }

    const requestDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(requestDate.getTime())) {
      return res.status(400).json({ message: "Invalid date/time provided." });
    }

    const dayOfWeek = DAYS[requestDate.getDay()];
    const requestMinutes = parseTimeToMinutes(time);
    if (requestMinutes === null) {
      return res.status(400).json({ message: "Invalid time provided." });
    }

    const lookupKeys = [teacherUser.employeeId, teacherName].filter(Boolean);
    const slots = await ConsultationAvailability.find({
      dayOfWeek,
      $or: [
        { employeeId: { $in: lookupKeys } },
        { teacher: teacherName },
      ],
    }).lean();

    const matchedSlot = slots.find((slot) => isRequestWithinAvailability(requestMinutes, slot.startTime, slot.endTime));
    if (!matchedSlot) {
      return res.status(409).json({
        message: "Requested time is outside the teacher's consultation hours for the selected day.",
      });
    }

    const requestDoc = await ConsultationRequest.create({
      studentId: req.user.id,
      employeeId: teacherUser.employeeId || teacherName,
      availabilityId: matchedSlot._id,
      subject: String(topic).trim(),
      purpose: String(notes || "").trim(),
      requestDate,
      status: "PENDING",
    });

    const requestEndMinutes = requestMinutes + 60;
    await ConsultationLog.create({
      requestId: requestDoc._id,
      timeIn: minutesTo24h(requestMinutes),
      timeOut: minutesTo24h(requestEndMinutes),
      notes: "Consultation request created.",
    });

    return res.status(201).json({
      message: "Consultation request submitted.",
      request: toClientRequest(requestDoc),
    });
  } catch (error) {
    console.error("createConsultationRequest error:", error);
    return res.status(500).json({ message: "Failed to create consultation request.", error: error.message });
  }
}

// GET /api/consultations/requests
async function listConsultationRequests(req, res) {
  try {
    const filter = {};
    if (req.user?.role === "student") {
      filter.studentId = req.user.id;
    } else if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    const docs = await ConsultationRequest.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ requests: docs.map(toClientRequest) });
  } catch (error) {
    console.error("listConsultationRequests error:", error);
    return res.status(500).json({ message: "Failed to fetch consultation requests.", error: error.message });
  }
}

// PATCH /api/consultations/requests/:id/status
async function updateConsultationRequestStatus(req, res) {
  try {
    const allowed = ["PENDING", "APPROVED", "RESCHED", "COMPLETED", "CANCELLED"];
    const nextStatus = String(req.body?.status || "").trim().toUpperCase();
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const requestDoc = await ConsultationRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Consultation request not found." });
    }

    requestDoc.status = nextStatus;
    await requestDoc.save();

    const reqDate = new Date(requestDoc.requestDate);
    const timeIn = minutesTo24h(reqDate.getHours() * 60 + reqDate.getMinutes());
    await ConsultationLog.create({
      requestId: requestDoc._id,
      timeIn,
      timeOut: timeIn,
      notes: `Request status updated to ${nextStatus}.`,
    });

    return res.json({ message: "Consultation request updated.", request: toClientRequest(requestDoc) });
  } catch (error) {
    console.error("updateConsultationRequestStatus error:", error);
    return res.status(500).json({ message: "Failed to update consultation request.", error: error.message });
  }
}

// GET /api/consultations/logs?requestId=...
async function listConsultationLogs(req, res) {
  try {
    const filter = {};
    if (req.query.requestId) {
      filter.requestId = req.query.requestId;
    }

    if (req.user?.role === "student") {
      const ownRequests = await ConsultationRequest.find({ studentId: req.user.id }).select("_id").lean();
      const ownIds = ownRequests.map((r) => r._id);
      filter.requestId = filter.requestId
        ? (ownIds.some((id) => id.toString() === String(filter.requestId)) ? filter.requestId : null)
        : { $in: ownIds };
      if (!filter.requestId) {
        return res.json({ logs: [] });
      }
    }

    const docs = await ConsultationLog.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ logs: docs.map(toClientLog) });
  } catch (error) {
    console.error("listConsultationLogs error:", error);
    return res.status(500).json({ message: "Failed to fetch consultation logs.", error: error.message });
  }
}

// GET /api/consultations?teacher=xxx&employeeId=xxx
async function listConsultations(req, res) {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const docs = await ConsultationAvailability.find(filter).sort({ dayOfWeek: 1, startTime: 1 });
    return res.json({ consultations: docs.map(toClient) });
  } catch (error) {
    console.error("listConsultations error:", error);
    return res.status(500).json({ message: "Failed to fetch consultations.", error: error.message });
  }
}

// POST /api/consultations  { employeeId, teacher, dayOfWeek, startTime, endTime }
async function createConsultation(req, res) {
  try {
    const { employeeId, teacher, dayOfWeek, startTime, endTime } = req.body;

    if (!employeeId || !teacher || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: "employeeId, teacher, dayOfWeek, startTime and endTime are required." });
    }

    const duration = slotDurationMinutes(startTime, endTime);
    if (duration <= 0) {
      return res.status(400).json({ message: "endTime must be after startTime." });
    }

    // Check weekly total for this teacher (excluding today's slot if updating)
    const existing = await ConsultationAvailability.find({ employeeId });
    const weeklyUsed = existing.reduce((sum, d) => sum + slotDurationMinutes(d.startTime, d.endTime), 0);

    if (weeklyUsed + duration > MAX_WEEKLY_MINUTES) {
      const remaining = MAX_WEEKLY_MINUTES - weeklyUsed;
      return res.status(409).json({
        message: `Weekly consultation limit exceeded. Each teacher may only have 4 hours (240 minutes) of consultation per week. You have ${remaining} minute(s) remaining.`,
        weeklyUsedMinutes: weeklyUsed,
        remainingMinutes: remaining,
      });
    }

    // Check that no regular class is scheduled at the same time
    const classConflict = await checkClassConflict(teacher, dayOfWeek, startTime, endTime);
    if (classConflict) {
      return res.status(409).json({ message: classConflict });
    }

    const doc = await ConsultationAvailability.create({ employeeId, teacher, dayOfWeek, startTime, endTime });
    return res.status(201).json({ message: "Consultation slot created.", consultation: toClient(doc) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This teacher already has a consultation slot on that day." });
    }
    console.error("createConsultation error:", error);
    return res.status(500).json({ message: "Failed to create consultation slot.", error: error.message });
  }
}

// PUT /api/consultations/:id  { dayOfWeek, startTime, endTime }
async function updateConsultation(req, res) {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    const target = await ConsultationAvailability.findById(id);
    if (!target) return res.status(404).json({ message: "Consultation slot not found." });

    const newStart = startTime ?? target.startTime;
    const newEnd   = endTime   ?? target.endTime;
    const newDay   = dayOfWeek ?? target.dayOfWeek;

    const newDuration = slotDurationMinutes(newStart, newEnd);
    if (newDuration <= 0) {
      return res.status(400).json({ message: "endTime must be after startTime." });
    }

    // Weekly total excluding this slot
    const others = await ConsultationAvailability.find({ employeeId: target.employeeId, _id: { $ne: target._id } });
    const weeklyUsed = others.reduce((sum, d) => sum + slotDurationMinutes(d.startTime, d.endTime), 0);

    if (weeklyUsed + newDuration > MAX_WEEKLY_MINUTES) {
      const remaining = MAX_WEEKLY_MINUTES - weeklyUsed;
      return res.status(409).json({
        message: `Weekly consultation limit exceeded. ${remaining} minute(s) remaining.`,
        weeklyUsedMinutes: weeklyUsed,
        remainingMinutes: remaining,
      });
    }

    // Check that no regular class is scheduled at the same time
    const classConflict = await checkClassConflict(target.teacher, newDay, newStart, newEnd);
    if (classConflict) {
      return res.status(409).json({ message: classConflict });
    }

    target.dayOfWeek  = newDay;
    target.startTime  = newStart;
    target.endTime    = newEnd;
    await target.save();

    return res.json({ message: "Consultation slot updated.", consultation: toClient(target) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This teacher already has a consultation slot on that day." });
    }
    console.error("updateConsultation error:", error);
    return res.status(500).json({ message: "Failed to update consultation slot.", error: error.message });
  }
}

// DELETE /api/consultations/:id
async function deleteConsultation(req, res) {
  try {
    const deleted = await ConsultationAvailability.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Consultation slot not found." });
    return res.json({ message: "Consultation slot deleted." });
  } catch (error) {
    console.error("deleteConsultation error:", error);
    return res.status(500).json({ message: "Failed to delete consultation slot.", error: error.message });
  }
}

// GET /api/consultations/summary?teacher=xxx  — returns weekly total minutes used
async function getWeeklySummary(req, res) {
  try {
    const filter = {};
    if (req.query.teacher)    filter.teacher    = req.query.teacher;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const docs = await ConsultationAvailability.find(filter);
    const weeklyUsedMinutes = docs.reduce((sum, d) => sum + slotDurationMinutes(d.startTime, d.endTime), 0);

    return res.json({
      weeklyUsedMinutes,
      remainingMinutes: Math.max(0, MAX_WEEKLY_MINUTES - weeklyUsedMinutes),
      maxWeeklyMinutes: MAX_WEEKLY_MINUTES,
    });
  } catch (error) {
    console.error("getWeeklySummary error:", error);
    return res.status(500).json({ message: "Failed to get summary.", error: error.message });
  }
}

module.exports = {
  listConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getWeeklySummary,
  listTeachersForStudents,
  createConsultationRequest,
  listConsultationRequests,
  updateConsultationRequestStatus,
  listConsultationLogs,
};
