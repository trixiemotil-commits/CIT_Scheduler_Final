const mongoose = require("mongoose");
const ScheduleEntry = require("../models/ScheduleEntry");
const ScheduleTable = require("../models/ScheduleTable");
const User = require("../models/User");
const ConsultationAvailability = require("../models/ConsultationAvailability");
const ConsultationRequest = require("../models/ConsultationRequest");
const AcademicTerm = require("../models/AcademicTerm");

const YEAR_VALUES = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DAY_VALUES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let ensureDefaultsPromise = null;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveAcademicTermReference(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return mongoose.Types.ObjectId.isValid(trimmed) ? new mongoose.Types.ObjectId(trimmed) : null;
  }
  return null;
}

async function getActiveAcademicTermReference() {
  try {
    const term = await AcademicTerm.findOne({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).select("_id").lean();
    return term?._id || null;
  } catch (error) {
    console.error("Failed to resolve active academic term:", error);
    return null;
  }
}

function parseTimeToMinutes(value) {
  const text = normalizeString(value);
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    throw new Error(`Invalid time value: ${value}`);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time value: ${value}`);
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }
  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
}

function colorForSchedule(room, subject) {
  const normalizedRoom = normalizeString(room);
  const normalizedSubject = normalizeString(subject);

  if (/\blunch\b/i.test(normalizedSubject)) {
    return "color-gray";
  }

  return /(\b406\b|\b407\b|\b408\b|\b409\b|comlab|\bcl\b)/i.test(normalizedRoom)
    ? "color-green"
    : "color-yellow";
}

function toClientTable(table) {
  return {
    id: table._id.toString(),
    teacher: table.teacher,
    label: table.label,
  };
}

function toClientEntry(entry) {
  return {
    id: entry._id.toString(),
    tableLabel: entry.tableLabel,
    entryType: entry.entryType || "class",
    academicTermId: entry.academicTermId?.toString?.() || null,
    year: entry.year,
    section: entry.section,
    day: entry.day,
    timeIn: entry.timeIn,
    timeOut: entry.timeOut,
    teacher: entry.teacher,
    subject: entry.subject,
    room: entry.room,
    roomType: entry.roomType || "Lecture",
    campus: entry.campus || "South Campus",
    parallel: entry.parallel,
    parallelGroupId: entry.parallelGroupId,
    parallelCount: entry.parallelCount,
    parallelSlots: entry.parallelSlots || [],
    color: entry.color,
    addedAt: entry.addedAt || entry.createdAt,
  };
}

async function ensureDefaultTables() {
  if (ensureDefaultsPromise) {
    return ensureDefaultsPromise;
  }

  ensureDefaultsPromise = (async () => {
    for (const year of YEAR_VALUES) {
      try {
        await ScheduleTable.updateOne(
          { label: year },
          { $setOnInsert: { year, label: year } },
          { upsert: true }
        );
      } catch (error) {
        // Concurrent requests can race on the same unique label; keep startup idempotent.
        const duplicateFromWriteErrors = Array.isArray(error?.writeErrors)
          ? error.writeErrors.some((writeError) => writeError?.code === 11000 || writeError?.err?.code === 11000)
          : false;

        if (error?.code !== 11000 && !duplicateFromWriteErrors) {
          throw error;
        }
      }
    }
  })()
    .finally(() => {
      ensureDefaultsPromise = null;
    });

  return ensureDefaultsPromise;
}

function sortTables(tables) {
  return tables.sort((a, b) => a.label.localeCompare(b.label));
}

async function ensureTableExists(tableLabel) {
  const label = normalizeString(tableLabel);
  if (!label) {
    throw new Error("Table label is required.");
  }

  const existing = await ScheduleTable.findOne({ label });
  if (existing) {
    return existing;
  }

  try {
    return await ScheduleTable.create({ teacher: label, label });
  } catch (error) {
    if (error?.code === 11000) {
      const retry = await ScheduleTable.findOne({ label });
      if (retry) {
        return retry;
      }
    }

    throw error;
  }
}

function normalizeParallelSlots(parallelSlots) {
  if (!Array.isArray(parallelSlots)) {
    return [];
  }

  return parallelSlots
    .map((slot) => ({
      section: normalizeString(slot?.section),
      room: normalizeString(slot?.room),
      roomType: normalizeString(slot?.roomType) === "Comlab/Laboratory" ? "Comlab/Laboratory" : "Lecture",
    }))
    .filter((slot) => slot.section);
}

function buildEntryDocs(payload, academicTermId = null) {
  const teacher  = normalizeString(payload.teacher);
  const teacherIsGenericFlag = Boolean(payload.teacherIsGeneric) || normalizeString(payload.teacher).toLowerCase() === 'cit faculty'
  const tableLabel = teacher;  // schedules are stored per teacher
  const year = normalizeString(payload.baseYear || payload.year);
  const day = normalizeString(payload.day);
  const subject = normalizeString(payload.subject);
  const campus = normalizeString(payload.campus) || "South Campus";
  const timeIn = normalizeString(payload.timeIn);
  const timeOut = normalizeString(payload.timeOut);
  const timeInMinutes = parseTimeToMinutes(timeIn);
  const timeOutMinutes = parseTimeToMinutes(timeOut);

  if (!teacher || !day || !subject || !timeIn || !timeOut) {
    throw new Error("Missing required schedule fields.");
  }

  if (!YEAR_VALUES.includes(year)) {
    throw new Error("Invalid year value.");
  }

  if (!DAY_VALUES.includes(day)) {
    throw new Error("Invalid day value.");
  }

  if (timeOutMinutes <= timeInMinutes) {
    throw new Error("Time Out must be after Time In.");
  }

  const parallel = Boolean(payload.parallel);
  const addedAt = payload.addedAt ? new Date(payload.addedAt) : new Date();

  if (parallel) {
    const slots = normalizeParallelSlots(payload.parallelSlots);
    if (!slots.length) {
      throw new Error("Add at least one section for a parallel schedule.");
    }

    const parallelCount = Number(payload.parallelCount) || slots.length;
    const parallelGroupId =
      normalizeString(payload.parallelGroupId) ||
      `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return slots.map((slot) => ({
      tableLabel,
      entryType: "class",
      teacherIsGeneric: teacherIsGenericFlag,
      year,
      section: slot.section,
      day,
      timeIn,
      timeOut,
      timeInMinutes,
      timeOutMinutes,
      teacher,
      subject,
      room: slot.room,
      roomType: slot.roomType,
      campus,
      parallel: true,
      parallelGroupId,
      parallelCount,
      parallelSlots: slots,
      color: slot.roomType === "Comlab/Laboratory" ? "color-green" : colorForSchedule("", subject),
      academicTermId: resolveAcademicTermReference(academicTermId || payload?.academicTermId) || undefined,
      addedAt,
    }));
  }

  const section = normalizeString(payload.section);
  if (!section) {
    throw new Error("Section is required for a non-parallel schedule.");
  }

  const room = normalizeString(payload.room);
  const roomType = normalizeString(payload.roomType) === "Comlab/Laboratory" ? "Comlab/Laboratory" : "Lecture";

  return [
    {
      tableLabel,
      entryType: "class",
      teacherIsGeneric: teacherIsGenericFlag,
      year,
      section,
      day,
      timeIn,
      timeOut,
      timeInMinutes,
      timeOutMinutes,
      teacher,
      subject,
      room,
      roomType,
      campus,
      parallel: false,
      parallelGroupId: null,
      parallelCount: 1,
      parallelSlots: [],
      color: roomType === "Comlab/Laboratory" ? "color-green" : colorForSchedule("", subject),
      academicTermId: resolveAcademicTermReference(academicTermId || payload?.academicTermId) || undefined,
      addedAt,
    },
  ];
}

function buildLunchBreakDoc(payload, academicTermId = null) {
  const teacher = normalizeString(payload.teacher);
  const tableLabel = teacher;
  const day = normalizeString(payload.day);
  const timeIn = normalizeString(payload.timeIn);
  const timeOut = normalizeString(payload.timeOut);
  const teacherIsGenericFlag = Boolean(payload.teacherIsGeneric) || normalizeString(payload.teacher).toLowerCase() === 'cit faculty'

  if (!teacher || !day || !timeIn || !timeOut) {
    throw new Error("Missing required lunch break fields.");
  }

  if (!DAY_VALUES.includes(day)) {
    throw new Error("Invalid day value.");
  }

  const timeInMinutes = parseTimeToMinutes(timeIn);
  const timeOutMinutes = parseTimeToMinutes(timeOut);
  if (timeOutMinutes <= timeInMinutes) {
    throw new Error("Time Out must be after Time In.");
  }

  return {
    tableLabel,
    entryType: "lunch",
    teacherIsGeneric: teacherIsGenericFlag,
    day,
    timeIn,
    timeOut,
    timeInMinutes,
    timeOutMinutes,
    teacher,
    subject: "Lunch Break",
    room: normalizeString(payload.room),
    campus: normalizeString(payload.campus) || "South Campus",
    parallel: false,
    parallelGroupId: null,
    parallelCount: 1,
    parallelSlots: [],
    color: "color-gray",
    academicTermId: resolveAcademicTermReference(academicTermId || payload?.academicTermId) || undefined,
    addedAt: new Date(),
  };
}

function getDescriptorFilter(oldDescriptor) {
  const tableLabel = normalizeString(oldDescriptor?.tableLabel || oldDescriptor?.year);
  if (!tableLabel) {
    throw new Error("Missing original table label.");
  }

  const academicTermId = resolveAcademicTermReference(oldDescriptor?.academicTermId);
  const termFilter = academicTermId ? { academicTermId } : {};
  const parallelGroupId = normalizeString(oldDescriptor?.parallelGroupId);
  if (parallelGroupId) {
    return {
      tableLabel,
      parallelGroupId,
      ...termFilter,
    };
  }

  const section = normalizeString(oldDescriptor?.section);
  const day = normalizeString(oldDescriptor?.day);
  const timeIn = normalizeString(oldDescriptor?.timeIn);
  const timeOut = normalizeString(oldDescriptor?.timeOut);

  if (!section || !day || !timeIn || !timeOut) {
    throw new Error("Missing original schedule descriptor.");
  }

  return {
    tableLabel,
    section,
    day,
    timeIn,
    timeOut,
    ...termFilter,
  };
}

async function getExcludedIds(oldDescriptor) {
  if (!oldDescriptor) {
    return [];
  }

  const filter = getDescriptorFilter(oldDescriptor);
  const existing = await ScheduleEntry.find(filter).select("_id");
  return existing.map((entry) => entry._id);
}

async function findConflict(doc, excludedIds = []) {
  console.debug('findConflict called', {
    teacher: doc.teacher,
    day: doc.day,
    timeIn: doc.timeIn,
    timeOut: doc.timeOut,
    academicTermId: doc.academicTermId || null,
    excludedCount: excludedIds?.length || 0,
  });
  // Overlap: same day, time windows intersect
  const overlapFilter = {
    day: doc.day,
    timeInMinutes: { $lt: doc.timeOutMinutes },
    timeOutMinutes: { $gt: doc.timeInMinutes },
  };

  if (excludedIds.length) {
    overlapFilter._id = { $nin: excludedIds };
  }

  // Schedules in other academic terms must never block this term.
  const termFilter = { academicTermId: doc.academicTermId || null };

  // Rule 1: same teacher at the same time (any room)
  const teacherNameRaw = normalizeString(doc.teacher);
  const teacherName = teacherNameRaw.toLowerCase();
  const isGenericTeacher = !teacherName || teacherName === 'cit faculty';
  console.debug('findConflict teacher normalization', { teacherRaw: teacherNameRaw, teacherName, isGenericTeacher });
  if (!isGenericTeacher) {
    const teacherConflict = await ScheduleEntry.findOne({
      ...overlapFilter,
      teacher: doc.teacher,
      ...termFilter,
    }).lean();

    if (teacherConflict) {
      console.debug('findConflict -> teacherConflict', { teacherConflictId: teacherConflict._id?.toString?.(), teacherConflict });
      return {
        rule: 'teacher',
        message: `Teacher ${doc.teacher} already has a class on ${doc.day} from ${teacherConflict.timeIn} to ${teacherConflict.timeOut}.`,
      };
    }
  }

  // Rule 2: same room at the same time (any teacher)
  if (doc.room) {
    const roomConflict = await ScheduleEntry.findOne({
      ...overlapFilter,
      room: doc.room,
      ...termFilter,
    }).lean();

    if (roomConflict) {
      console.debug('findConflict -> roomConflict', { roomConflictId: roomConflict._id?.toString?.(), roomConflict });
      return {
        rule: 'room',
        message: `Room ${doc.room} is already occupied on ${doc.day} from ${roomConflict.timeIn} to ${roomConflict.timeOut}.`,
      };
    }
  }

  // Rule 3: teacher has a consultation slot that overlaps this class time
  // Rule 3: teacher has a consultation slot that overlaps this class time
  // Skip consultation checks for the generic 'CIT Faculty' placeholder
  if (!isGenericTeacher) {
    const consultQuery = {
      teacher: doc.teacher,
      dayOfWeek: doc.day,
      academicTermId: doc.academicTermId || null,
    };
    const consultSlots = await ConsultationAvailability.find(consultQuery).lean();
    for (const slot of consultSlots) {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd   = parseTimeToMinutes(slot.endTime);
      if (doc.timeInMinutes < slotEnd && doc.timeOutMinutes > slotStart) {
        console.debug('findConflict -> consultConflict', { slot });
        console.debug('findConflict -> consultConflict', { slot });
        return {
          rule: 'consult',
          message: `${doc.teacher} has a consultation slot on ${doc.day} from ${slot.startTime} to ${slot.endTime}. A class cannot be scheduled during consultation hours.`,
        };
      }
    }
  }

  return null;
}

function docForConflictCheck(doc) {
  const tn = normalizeString(doc.teacher).toLowerCase()
  const isGeneric = Boolean(doc.teacherIsGeneric) || !tn || tn === 'cit faculty'
  if (isGeneric) {
    return { ...doc, teacher: '' }
  }
  return doc
}

async function listScheduleTables(_req, res) {
  try {
    const tables = await ScheduleTable.find();
    return res.json({ tables: sortTables(tables.map(toClientTable)) });
  } catch (error) {
    console.error("Failed to list schedule tables:", error);
    return res.status(500).json({ message: "Failed to load schedule tables.", error: error.message });
  }
}

async function createScheduleTable(req, res) {
  try {
    const teacher = normalizeString(req.body.teacher || req.body.label);
    if (!teacher) {
      return res.status(400).json({ message: "Teacher name is required." });
    }

    const label = teacher;

    if (await ScheduleTable.exists({ label })) {
      return res.status(409).json({ message: "A schedule table for this teacher already exists." });
    }

    const table = await ScheduleTable.create({ teacher, label });
    return res.status(201).json({ message: "Schedule table created.", table: toClientTable(table) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A schedule table for this teacher already exists." });
    }

    console.error("Failed to create schedule table:", error);
    return res.status(500).json({ message: "Failed to create schedule table.", error: error.message });
  }
}

async function listSchedules(req, res) {
  try {
    const tableLabel = normalizeString(req.query.tableLabel);
    const teacher = normalizeString(req.query.teacher);
    const filter = {};
    const academicTermId = resolveAcademicTermReference(req.query?.academicTermId) || await getActiveAcademicTermReference();

    if (academicTermId) {
      filter.academicTermId = academicTermId;
    }

    if (tableLabel) {
      filter.tableLabel = tableLabel;
    }

    if (req.user?.role === "teacher") {
      const authUser = await User.findById(req.user.id).select("firstName lastName").lean();
      const teacherName = authUser
        ? `${normalizeString(authUser.firstName)} ${normalizeString(authUser.lastName)}`.trim()
        : "";

      if (!teacherName) {
        return res.status(404).json({ message: "Teacher account not found." });
      }

      filter.teacher = teacherName;
    } else if (teacher) {
      filter.teacher = teacher;
    }

    const entries = await ScheduleEntry.find(filter)
      .sort({ tableLabel: 1, day: 1, timeInMinutes: 1, section: 1 })
      .lean();

    return res.json({ entries: entries.map(toClientEntry) });
  } catch (error) {
    console.error("Failed to list schedules:", error);
    return res.status(500).json({ message: "Failed to load schedules.", error: error.message });
  }
}

async function createSchedule(req, res) {
  try {
    const payload = req.body || {};
    console.debug('createSchedule incoming payload', {
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      teacher: payload.teacher,
      year: payload.year || payload.baseYear,
      section: payload.section,
      timeIn: payload.timeIn,
      timeOut: payload.timeOut,
      academicTermId: payload.academicTermId || null,
      entryType: payload.entryType || 'class',
    });
    const academicTermId = resolveAcademicTermReference(payload?.academicTermId) || await getActiveAcademicTermReference();
    const isLunchBreak = normalizeString(payload.entryType).toLowerCase() === "lunch";
    const docs = isLunchBreak ? [buildLunchBreakDoc(payload, academicTermId)] : buildEntryDocs(payload, academicTermId);
    await ensureTableExists(docs[0].tableLabel);

    for (const doc of docs) {
      const conflictMessage = await findConflict(docForConflictCheck(doc));
      if (conflictMessage) {
        console.debug('createSchedule -> conflictMessage', { type: typeof conflictMessage, conflictMessage, doc });
        const resp = typeof conflictMessage === 'string' ? { message: conflictMessage } : { message: conflictMessage.message, rule: conflictMessage.rule };
        return res.status(409).json({ ...resp, code: "SCHEDULE_CONFLICT" });
      }
    }

    const created = await ScheduleEntry.insertMany(docs);
    return res.status(201).json({
      message: isLunchBreak ? "Lunch break saved." : "Schedule saved.",
      entries: created.map(toClientEntry),
    });
  } catch (error) {
    if (error.message && (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Missing") ||
      error.message.includes("required") ||
      error.message.includes("Time Out") ||
      error.message.includes("parallel schedule")
    )) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to create schedule:", error);
    return res.status(500).json({ message: "Failed to create schedule.", error: error.message });
  }
}

async function createLunchBreak(req, res) {
  try {
    const academicTermId = resolveAcademicTermReference(req.body?.academicTermId) || await getActiveAcademicTermReference();
    const doc = buildLunchBreakDoc(req.body || {}, academicTermId);
    await ensureTableExists(doc.tableLabel);

    const conflictMessage = await findConflict(docForConflictCheck(doc));
    if (conflictMessage) {
      console.debug('createLunchBreak -> conflictMessage', { type: typeof conflictMessage, conflictMessage, doc });
      const resp = typeof conflictMessage === 'string' ? { message: conflictMessage } : { message: conflictMessage.message, rule: conflictMessage.rule };
      return res.status(409).json({ ...resp, code: "SCHEDULE_CONFLICT" });
    }

    const created = await ScheduleEntry.create(doc);
    return res.status(201).json({ message: "Lunch break saved.", entry: toClientEntry(created) });
  } catch (error) {
    if (error.message && (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Missing") ||
      error.message.includes("required") ||
      error.message.includes("Time Out")
    )) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to create lunch break:", error);
    return res.status(500).json({ message: "Failed to create lunch break.", error: error.message });
  }
}

// Lunch breaks do not have a year, section, subject, or room to edit. Keep
// their update path separate from class-schedule replacement so a time-only
// edit cannot be rejected by the regular class validator.
async function updateLunchBreak(req, res) {
  try {
    const lunchId = normalizeString(req.params?.id);
    if (!/^[a-f\d]{24}$/i.test(lunchId)) {
      return res.status(400).json({ message: "Invalid lunch break identifier." });
    }

    const existing = await ScheduleEntry.findById(lunchId);
    const isLunchBreak = existing && (
      existing.entryType === "lunch" ||
      /\blunch\b/i.test(normalizeString(existing.subject))
    );

    if (!isLunchBreak) {
      return res.status(404).json({ message: "Lunch break not found." });
    }

    // Take only the editable values from the request. The owner and the rest
    // of the lunch metadata always come from the original saved entry.
    const next = buildLunchBreakDoc({
      teacher: existing.teacher,
      day: req.body?.day,
      timeIn: req.body?.timeIn,
      timeOut: req.body?.timeOut,
      campus: existing.campus,
      room: "",
    }, existing.academicTermId);

    const conflictMessage = await findConflict(docForConflictCheck(next), [existing._id]);
    if (conflictMessage) {
      console.debug('updateLunchBreak -> conflictMessage', { type: typeof conflictMessage, conflictMessage, next });
      const resp = typeof conflictMessage === 'string' ? { message: conflictMessage } : { message: conflictMessage.message, rule: conflictMessage.rule };
      return res.status(409).json({ ...resp, code: "SCHEDULE_CONFLICT" });
    }

    existing.set({
      ...next,
      // Preserve the original creation marker when a lunch time is changed.
      addedAt: existing.addedAt,
      // Convert older fallback records into the native lunch shape as soon as
      // they are edited.
      year: undefined,
      section: undefined,
    });
    await existing.save();

    return res.json({ message: "Lunch break updated.", entry: toClientEntry(existing) });
  } catch (error) {
    if (error.message && (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Missing") ||
      error.message.includes("required") ||
      error.message.includes("Time Out")
    )) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to update lunch break:", error);
    return res.status(500).json({ message: "Failed to update lunch break.", error: error.message });
  }
}

async function replaceSchedule(req, res) {
  try {
    const { old: oldDescriptor, next } = req.body || {};

    if (!oldDescriptor || !next) {
      return res.status(400).json({ message: "Missing old and next schedule payload." });
    }

    const academicTermId = resolveAcademicTermReference(next?.academicTermId) || await getActiveAcademicTermReference();
    const docs = buildEntryDocs(next, academicTermId);
    await ensureTableExists(docs[0].tableLabel);

    const excludedIds = await getExcludedIds(oldDescriptor);
    for (const doc of docs) {
      const conflictMessage = await findConflict(docForConflictCheck(doc), excludedIds);
      if (conflictMessage) {
        console.debug('replaceSchedule -> conflictMessage', { type: typeof conflictMessage, conflictMessage, doc, excludedIds });
        const resp = typeof conflictMessage === 'string' ? { message: conflictMessage } : { message: conflictMessage.message, rule: conflictMessage.rule };
        return res.status(409).json({ ...resp, code: "SCHEDULE_CONFLICT" });
      }
    }

    const deleteFilter = getDescriptorFilter(oldDescriptor);
    await ScheduleEntry.deleteMany(deleteFilter);

    const created = await ScheduleEntry.insertMany(docs);
    return res.json({ message: "Schedule updated.", entries: created.map(toClientEntry) });
  } catch (error) {
    if (error.message && (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Missing") ||
      error.message.includes("required") ||
      error.message.includes("Time Out") ||
      error.message.includes("parallel schedule")
    )) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to replace schedule:", error);
    return res.status(500).json({ message: "Failed to update schedule.", error: error.message });
  }
}

async function deleteSchedule(req, res) {
  try {
    const { old: oldDescriptor } = req.body || {};
    if (!oldDescriptor) {
      return res.status(400).json({ message: "Missing schedule descriptor to delete." });
    }

    const filter = getDescriptorFilter(oldDescriptor);
    const result = await ScheduleEntry.deleteMany(filter);

    return res.json({ message: "Schedule removed.", deletedCount: result.deletedCount || 0 });
  } catch (error) {
    if (error.message && error.message.startsWith("Missing")) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to delete schedule:", error);
    return res.status(500).json({ message: "Failed to delete schedule.", error: error.message });
  }
}

function getCurrentDayName() {
  const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return WEEK_DAYS[new Date().getDay()] || "Monday";
}

async function getAdminDashboardSummary(req, res) {
  try {
    const [availableTeachers, totalRooms, classesToday, activeConsultations] = await Promise.all([
      User.countDocuments({
        $and: [
          { $or: [{ role: "teacher" }, { roles: "teacher" }] },
        ],
        $or: [
          { teacher_status: "On School" },
          { teacher_status: { $exists: false } },
        ],
      }),
      ScheduleEntry.aggregate([
        {
          $project: {
            rooms: {
              $setUnion: [
                ["$room"],
                {
                  $map: {
                    input: "$parallelSlots",
                    as: "slot",
                    in: "$$slot.room",
                  },
                },
              ],
            },
          },
        },
        { $unwind: "$rooms" },
        { $match: { rooms: { $ne: "" } } },
        { $group: { _id: "$rooms" } },
        { $count: "rooms" },
      ]).then((results) => (results[0]?.rooms || 0)),
      ScheduleEntry.countDocuments({ day: getCurrentDayName() }),
      ConsultationRequest.countDocuments({ status: { $in: ["PENDING", "APPROVED", "RESCHED"] } }),
    ]);

    // Debug log to help diagnose missing data in admin dashboard
    console.debug('getAdminDashboardSummary:', {
      requester: req.user ? { id: req.user.id, role: req.user.role } : null,
      availableTeachers,
      totalRooms,
      classesToday,
      activeConsultations,
    })

    return res.json({
      availableTeachers: Number(availableTeachers) || 0,
      availableRooms: Number(totalRooms) || 0,
      classesToday: Number(classesToday) || 0,
      consultations: Number(activeConsultations) || 0,
    });
  } catch (error) {
    console.error("getAdminDashboardSummary error:", error);
    return res.status(500).json({ message: "Failed to load dashboard summary.", error: error.message });
  }
}

module.exports = {
  listScheduleTables,
  createScheduleTable,
  listSchedules,
  createSchedule,
  createLunchBreak,
  updateLunchBreak,
  replaceSchedule,
  deleteSchedule,
  getAdminDashboardSummary,
};
