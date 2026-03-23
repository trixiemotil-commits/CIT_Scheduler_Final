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

async function findTeacherUserByIdentifier(identifier) {
  const key = String(identifier || "").trim();
  if (!key) return null;

  // First, try the canonical employeeId lookup.
  let teacherUser = await User.findOne({ role: "teacher", employeeId: key }).lean();
  if (teacherUser) return teacherUser;

  // Fallback for legacy records where full teacher name may be stored.
  const teachers = await User.find({ role: "teacher" })
    .select("role firstName lastName employeeId department account_status teacher_status avatar")
    .lean();

  const normalizedKey = key.toLowerCase();
  return (
    teachers.find((t) => normalizeTeacherFullName(t).toLowerCase() === normalizedKey)
    || null
  );
}

function nowContext() {
  const now = new Date();
  return {
    dayOfWeek: DAYS[now.getDay()],
    minutes: now.getHours() * 60 + now.getMinutes(),
  };
}

function nextDateForDay(dayOfWeek, timeStr) {
  const targetIndex = DAYS.indexOf(dayOfWeek);
  const timeMinutes = parseTimeToMinutes(timeStr);
  if (targetIndex < 0 || timeMinutes === null) {
    return null;
  }

  const now = new Date();
  const currentIndex = now.getDay();
  let delta = (targetIndex - currentIndex + 7) % 7;

  // If slot is today but already passed, schedule the next week.
  if (delta === 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (timeMinutes <= nowMinutes) {
      delta = 7;
    }
  }

  const candidate = new Date(now);
  candidate.setHours(0, 0, 0, 0);
  candidate.setDate(candidate.getDate() + delta);

  // Persist consultationDate as date-only (UTC midnight) to avoid timezone day shifts.
  return new Date(Date.UTC(
    candidate.getFullYear(),
    candidate.getMonth(),
    candidate.getDate(),
    0,
    0,
    0,
    0
  ));
}

function dateOnlyToUtc(dateStr) {
  const match = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
}

async function resolveTeacherStatus(userDoc) {
  if (!userDoc || userDoc.role !== "teacher") {
    return "On Leave";
  }

  if (userDoc.account_status !== "Active") {
    return "On Leave";
  }

  const directStatus = ["On School", "On Meeting", "On Leave", "Main Campus", "On Main Campus"].includes(userDoc.teacher_status)
    ? userDoc.teacher_status
    : "On School";

  // Explicit meeting/leave flags should always win.
  if (directStatus === "On Meeting" || directStatus === "On Leave") {
    return directStatus;
  }

  const teacherName = normalizeTeacherFullName(userDoc);
  if (!teacherName) {
    return directStatus === "Main Campus" ? "On Main Campus" : directStatus;
  }

  const now = nowContext();
  const activeEntry = await ScheduleEntry.findOne({
    teacher: teacherName,
    day: now.dayOfWeek,
    timeInMinutes: { $lte: now.minutes },
    timeOutMinutes: { $gt: now.minutes },
  })
    .select("campus color")
    .lean();

  if (activeEntry) {
    const onMainCampus =
      activeEntry.campus === "Main Campus" ||
      activeEntry.color === "color-orange";

    return onMainCampus ? "On Main Campus" : "On School";
  }

  if (directStatus === "Main Campus") {
    return "On Main Campus";
  }

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

function normalizeConsultationLogNote(noteText) {
  const text = String(noteText || "").trim();
  if (!text) return "";

  const withPrefix = text.match(/(?:^|\s)Notes:\s*(.+)$/i);
  if (withPrefix && withPrefix[1]) {
    return withPrefix[1].trim();
  }

  if (/^Consultation request created\.?$/i.test(text)) {
    return "";
  }

  if (/^Request status updated to\s+[A-Z_]+\.?$/i.test(text)) {
    return "";
  }

  return text;
}

function toClientRequest(doc, studentMeta = null, availabilityMeta = null, consultationNotes = "") {
  const idText = doc._id?.toString?.() || doc.id?.toString?.() || ""
  const ticketSuffix = idText.slice(-6).toUpperCase()
  const studentName = studentMeta
    ? `${studentMeta.firstName || ""} ${studentMeta.lastName || ""}`.trim()
    : ""
  return {
    id: doc._id.toString(),
    ticketNumber: ticketSuffix ? `TKT-${ticketSuffix}` : null,
    studentId: doc.studentId?.toString?.() || doc.studentId,
    studentName,
    studentNumber: studentMeta?.studentId || "",
    studentAvatar: studentMeta?.avatar || null,
    employeeId: doc.employeeId,
    availabilityId: doc.availabilityId?.toString?.() || doc.availabilityId,
    subject: doc.subject,
    purpose: doc.purpose,
    requestDate: doc.requestDate,
    consultationDate: doc.consultationDate,
    consultationDayOfWeek: availabilityMeta?.dayOfWeek || "",
    consultationStartTime: availabilityMeta?.startTime || "",
    consultationEndTime: availabilityMeta?.endTime || "",
    consultationNotes: consultationNotes || "",
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

async function enrichRequestsWithQueue(requests) {
  const ACTIVE_QUEUE_STATUSES = ["APPROVED"];
  const queueable = requests.filter(
    (req) => req?.availabilityId && req?.consultationDate && ACTIVE_QUEUE_STATUSES.includes(req.status)
  );

  if (!queueable.length) {
    return requests.map((req) => ({ ...req, queuePosition: null, queueTotal: null, isNextInQueue: false }));
  }

  const groups = new Map();
  for (const req of queueable) {
    const date = new Date(req.consultationDate);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const dateKey = date.toISOString().slice(0, 10);
    const key = `${req.employeeId}|${req.availabilityId}|${dateKey}`;
    if (!groups.has(key)) {
      groups.set(key, {
        employeeId: req.employeeId,
        availabilityId: req.availabilityId,
        consultationDate: date,
      });
    }
  }

  const queueDocsByKey = new Map();
  for (const [key, info] of groups.entries()) {
    const docs = await ConsultationRequest.find({
      employeeId: info.employeeId,
      availabilityId: info.availabilityId,
      consultationDate: info.consultationDate,
      status: { $in: ACTIVE_QUEUE_STATUSES },
    })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id")
      .lean();

    queueDocsByKey.set(key, docs.map((d) => d._id.toString()));
  }

  return requests.map((req) => {
    const status = String(req.status || "").toUpperCase();
    if (!ACTIVE_QUEUE_STATUSES.includes(status) || !req.availabilityId || !req.consultationDate) {
      return { ...req, queuePosition: null, queueTotal: null, isNextInQueue: false };
    }

    const date = new Date(req.consultationDate);
    if (Number.isNaN(date.getTime())) {
      return { ...req, queuePosition: null, queueTotal: null, isNextInQueue: false };
    }

    const key = `${req.employeeId}|${req.availabilityId}|${date.toISOString().slice(0, 10)}`;
    const queueIds = queueDocsByKey.get(key) || [];
    const idx = queueIds.findIndex((id) => id === String(req.id));

    if (idx < 0) {
      return { ...req, queuePosition: null, queueTotal: queueIds.length || null, isNextInQueue: false };
    }

    const position = idx + 1;
    return {
      ...req,
      queuePosition: position,
      queueTotal: queueIds.length,
      isNextInQueue: position === 1,
    };
  });
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

        const [availabilitySlots, scheduleEntries, status] = await Promise.all([
          ConsultationAvailability.find({
            $or: [
              { employeeId: { $in: lookupKeys } },
              { teacher: fullName },
            ],
          })
            .sort({ dayOfWeek: 1, startTime: 1 })
            .lean(),
          ScheduleEntry.find({ teacher: fullName })
            .select("subject year section")
            .lean(),
          resolveTeacherStatus(teacherUser),
        ]);

        const subjectSet = new Set();
        const yearSet = new Set();
        const sectionSet = new Set();
        const yearSectionSet = new Set();
        const subjectAssignmentSet = new Set();

        for (const entry of scheduleEntries) {
          const subject = String(entry?.subject || "").trim();
          const year = String(entry?.year || "").trim();
          const section = String(entry?.section || "").trim();

          if (subject) subjectSet.add(subject);
          if (year) yearSet.add(year);
          if (section) sectionSet.add(section);
          if (year && section) yearSectionSet.add(`${year}||${section}`);
          if (subject && year && section) subjectAssignmentSet.add(`${subject}||${year}||${section}`);
        }

        return {
          id: teacherUser._id.toString(),
          name: fullName,
          employeeId: teacherUser.employeeId || "",
          avatar: teacherUser.avatar || null,
          department: teacherUser.department || "",
          status,
          available: status === "On School" && availabilitySlots.length > 0,
          subjects: Array.from(subjectSet),
          assignedYears: Array.from(yearSet),
          assignedSections: Array.from(sectionSet),
          assignedYearSections: Array.from(yearSectionSet).map((pair) => {
            const [year, section] = pair.split("||");
            return { year, section };
          }),
          subjectAssignments: Array.from(subjectAssignmentSet).map((triple) => {
            const [subject, year, section] = triple.split("||");
            return { subject, year, section };
          }),
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

    const { teacherId, topic, availabilityId, date, time, notes = "" } = req.body || {};
    if (!teacherId || !topic) {
      return res.status(400).json({ message: "teacherId and topic are required." });
    }

    if (!availabilityId && (!date || !time)) {
      return res.status(400).json({ message: "availabilityId is required (or provide date and time for legacy requests)." });
    }

    const teacherUser = await User.findById(teacherId).lean();
    if (!teacherUser || teacherUser.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const teacherName = normalizeTeacherFullName(teacherUser);
    const teacherStatus = await resolveTeacherStatus(teacherUser);
    if (teacherStatus !== "On School") {
      return res.status(409).json({
        message: `${teacherName} can only accept consultation requests while on school status. Current status: ${teacherStatus}.`,
      });
    }

    const lookupKeys = [teacherUser.employeeId, teacherName].filter(Boolean);
    let matchedSlot = null;
    let consultationDate = null;
    let requestMinutes = null;

    if (availabilityId) {
      matchedSlot = await ConsultationAvailability.findOne({
        _id: availabilityId,
        $or: [
          { employeeId: { $in: lookupKeys } },
          { teacher: teacherName },
        ],
      }).lean();

      if (matchedSlot) {
        consultationDate = nextDateForDay(matchedSlot.dayOfWeek, matchedSlot.startTime);
        requestMinutes = parseTimeToMinutes(matchedSlot.startTime);
      }
    } else {
      consultationDate = dateOnlyToUtc(date);
      if (!consultationDate || Number.isNaN(consultationDate.getTime())) {
        return res.status(400).json({ message: "Invalid date/time provided." });
      }

      const dayOfWeek = DAYS[consultationDate.getDay()];
      requestMinutes = parseTimeToMinutes(time);
      if (requestMinutes === null) {
        return res.status(400).json({ message: "Invalid time provided." });
      }

      const slots = await ConsultationAvailability.find({
        dayOfWeek,
        $or: [
          { employeeId: { $in: lookupKeys } },
          { teacher: teacherName },
        ],
      }).lean();

      matchedSlot = slots.find((slot) => isRequestWithinAvailability(requestMinutes, slot.startTime, slot.endTime));
    }

    if (!matchedSlot) {
      return res.status(409).json({
        message: "Requested time is outside the teacher's consultation hours for the selected day.",
      });
    }

    if (!consultationDate || Number.isNaN(consultationDate.getTime()) || requestMinutes === null) {
      return res.status(400).json({ message: "Selected consultation availability is invalid." });
    }

    const requestDate = new Date();

    const teacherKey = teacherUser.employeeId || teacherName;
    const existingPending = await ConsultationRequest.findOne({
      studentId: req.user.id,
      employeeId: teacherKey,
      availabilityId: matchedSlot._id,
      status: "PENDING",
    }).lean();

    if (existingPending) {
      return res.status(409).json({
        message: "You already have a pending request for this teacher and consultation schedule. Please choose another time slot or another teacher.",
      });
    }

    const requestDoc = await ConsultationRequest.create({
      studentId: req.user.id,
      employeeId: teacherKey,
      availabilityId: matchedSlot._id,
      subject: String(topic).trim(),
      purpose: String(notes || "").trim(),
      requestDate,
      consultationDate,
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
    } else if (req.user?.role === "teacher") {
      const teacherUser = await User.findById(req.user.id)
        .select("firstName lastName employeeId")
        .lean();

      if (!teacherUser) {
        return res.status(404).json({ message: "Teacher profile not found." });
      }

      const teacherName = normalizeTeacherFullName(teacherUser);
      const teacherKeys = [teacherUser.employeeId, teacherName]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      if (!teacherKeys.length) {
        return res.status(400).json({ message: "Teacher profile is missing employee details." });
      }

      filter.employeeId = teacherKeys.length === 1
        ? teacherKeys[0]
        : { $in: teacherKeys };
    } else if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    const docs = await ConsultationRequest.find(filter).sort({ createdAt: -1 }).lean();

    const studentIds = [...new Set(
      docs
        .map((doc) => String(doc.studentId || "").trim())
        .filter(Boolean)
    )];

    const students = studentIds.length
      ? await User.find({ _id: { $in: studentIds } })
        .select("firstName lastName studentId avatar")
        .lean()
      : [];

    const availabilityIds = [...new Set(
      docs
        .map((doc) => String(doc.availabilityId || "").trim())
        .filter(Boolean)
    )];

    const availabilities = availabilityIds.length
      ? await ConsultationAvailability.find({ _id: { $in: availabilityIds } })
        .select("dayOfWeek startTime endTime")
        .lean()
      : [];

    const studentById = new Map(
      students.map((student) => [String(student._id), student])
    );

    const availabilityById = new Map(
      availabilities.map((slot) => [String(slot._id), slot])
    );

    const requestIds = docs.map((doc) => doc._id).filter(Boolean);
    const logs = requestIds.length
      ? await ConsultationLog.find({ requestId: { $in: requestIds } })
        .select("requestId notes createdAt")
        .sort({ createdAt: -1 })
        .lean()
      : [];

    const noteByRequestId = new Map();
    for (const log of logs) {
      const requestId = String(log.requestId || "");
      if (!requestId || noteByRequestId.has(requestId)) {
        continue;
      }

      const normalizedNote = normalizeConsultationLogNote(log.notes);
      if (normalizedNote) {
        noteByRequestId.set(requestId, normalizedNote);
      }
    }

    const requests = docs.map((doc) =>
      toClientRequest(
        doc,
        studentById.get(String(doc.studentId || "")) || null,
        availabilityById.get(String(doc.availabilityId || "")) || null,
        noteByRequestId.get(String(doc._id || "")) || ""
      )
    );
    const withQueue = await enrichRequestsWithQueue(requests);
    return res.json({ requests: withQueue });
  } catch (error) {
    console.error("listConsultationRequests error:", error);
    return res.status(500).json({ message: "Failed to fetch consultation requests.", error: error.message });
  }
}

// PUT /api/consultations/requests/:id
async function updateConsultationRequestByStudent(req, res) {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Only students can edit consultation requests." });
    }

    const { id } = req.params;
    const { topic, availabilityId, notes = "" } = req.body || {};

    if (!topic || !availabilityId) {
      return res.status(400).json({ message: "topic and availabilityId are required." });
    }

    const requestDoc = await ConsultationRequest.findById(id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Consultation request not found." });
    }

    if (String(requestDoc.studentId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own consultation requests." });
    }

    const teacherUser = await findTeacherUserByIdentifier(requestDoc.employeeId);
    if (!teacherUser) {
      return res.status(404).json({ message: "Teacher not found for this request." });
    }

    const teacherName = normalizeTeacherFullName(teacherUser);
    const teacherStatus = await resolveTeacherStatus(teacherUser);
    if (teacherStatus !== "On School") {
      return res.status(409).json({
        message: `${teacherName} can only accept consultation requests while on school status. Current status: ${teacherStatus}.`,
      });
    }

    const lookupKeys = [teacherUser.employeeId, teacherName].filter(Boolean);
    const matchedSlot = await ConsultationAvailability.findOne({
      _id: availabilityId,
      $or: [
        { employeeId: { $in: lookupKeys } },
        { teacher: teacherName },
      ],
    }).lean();

    if (!matchedSlot) {
      return res.status(409).json({ message: "Selected consultation availability is invalid for this teacher." });
    }

    const consultationDate = nextDateForDay(matchedSlot.dayOfWeek, matchedSlot.startTime);
    if (!consultationDate || Number.isNaN(consultationDate.getTime())) {
      return res.status(400).json({ message: "Selected consultation availability is invalid." });
    }

    const existingPending = await ConsultationRequest.findOne({
      _id: { $ne: requestDoc._id },
      studentId: req.user.id,
      employeeId: requestDoc.employeeId,
      availabilityId: matchedSlot._id,
      status: "PENDING",
    }).lean();

    if (existingPending) {
      return res.status(409).json({
        message: "You already have a pending request for this teacher and consultation schedule. Please choose another time slot or another teacher.",
      });
    }

    const canonicalTeacherKey = teacherUser.employeeId || teacherName;

    requestDoc.subject = String(topic).trim();
    requestDoc.purpose = String(notes || "").trim();
    requestDoc.employeeId = canonicalTeacherKey;
    requestDoc.availabilityId = matchedSlot._id;
    requestDoc.consultationDate = consultationDate;
    requestDoc.status = "PENDING";
    await requestDoc.save();

    return res.json({ message: "Consultation request updated.", request: toClientRequest(requestDoc) });
  } catch (error) {
    console.error("updateConsultationRequestByStudent error:", error);
    return res.status(500).json({ message: "Failed to update consultation request.", error: error.message });
  }
}

// PATCH /api/consultations/requests/:id/status
async function updateConsultationRequestStatus(req, res) {
  try {
    const allowed = ["PENDING", "APPROVED", "RESCHED", "COMPLETED", "CANCELLED"];
    const nextStatus = String(req.body?.status || "").trim().toUpperCase();
    const statusNotes = String(req.body?.notes || "").trim();
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const requestDoc = await ConsultationRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Consultation request not found." });
    }

    const actorRole = req.user?.role;
    if (actorRole === "student") {
      if (String(requestDoc.studentId) !== String(req.user.id)) {
        return res.status(403).json({ message: "You can only update your own consultation requests." });
      }

      if (nextStatus !== "CANCELLED") {
        return res.status(403).json({ message: "Students are only allowed to cancel consultation requests." });
      }

      if (String(requestDoc.status || "").toUpperCase() === "APPROVED") {
        return res.status(409).json({ message: "Approved consultation requests can no longer be cancelled by students." });
      }
    }

    requestDoc.status = nextStatus;
    await requestDoc.save();

    const reqDate = new Date(requestDoc.requestDate);
    const timeIn = minutesTo24h(reqDate.getHours() * 60 + reqDate.getMinutes());
    const logNotes = [
      `Request status updated to ${nextStatus}.`,
      statusNotes ? `Notes: ${statusNotes}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    await ConsultationLog.create({
      requestId: requestDoc._id,
      timeIn,
      timeOut: timeIn,
      notes: logNotes,
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
  updateConsultationRequestByStudent,
  updateConsultationRequestStatus,
  listConsultationLogs,
};
