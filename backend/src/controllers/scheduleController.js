const ScheduleEntry = require("../models/ScheduleEntry");
const ScheduleTable = require("../models/ScheduleTable");

const YEAR_VALUES = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DAY_VALUES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let ensureDefaultsPromise = null;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
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

function colorForRoom(room) {
  if (!room) {
    return "color-green";
  }

  return room.startsWith("Cl.") ? "color-green" : "color-yellow";
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
    year: entry.year,
    section: entry.section,
    day: entry.day,
    timeIn: entry.timeIn,
    timeOut: entry.timeOut,
    teacher: entry.teacher,
    subject: entry.subject,
    room: entry.room,
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
    }))
    .filter((slot) => slot.section);
}

function buildEntryDocs(payload) {
  const teacher  = normalizeString(payload.teacher);
  const tableLabel = teacher;  // schedules are stored per teacher
  const year = normalizeString(payload.baseYear || payload.year);
  const day = normalizeString(payload.day);
  const subject = normalizeString(payload.subject);
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
      parallel: true,
      parallelGroupId,
      parallelCount,
      parallelSlots: slots,
      color: colorForRoom(slot.room),
      addedAt,
    }));
  }

  const section = normalizeString(payload.section);
  if (!section) {
    throw new Error("Section is required for a non-parallel schedule.");
  }

  const room = normalizeString(payload.room);

  return [
    {
      tableLabel,
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
      parallel: false,
      parallelGroupId: null,
      parallelCount: 1,
      parallelSlots: [],
      color: colorForRoom(room),
      addedAt,
    },
  ];
}

function getDescriptorFilter(oldDescriptor) {
  const tableLabel = normalizeString(oldDescriptor?.tableLabel || oldDescriptor?.year);
  if (!tableLabel) {
    throw new Error("Missing original table label.");
  }

  const parallelGroupId = normalizeString(oldDescriptor?.parallelGroupId);
  if (parallelGroupId) {
    return {
      tableLabel,
      parallelGroupId,
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
  // Overlap: same day, time windows intersect
  const overlapFilter = {
    day: doc.day,
    timeInMinutes: { $lt: doc.timeOutMinutes },
    timeOutMinutes: { $gt: doc.timeInMinutes },
  };

  if (excludedIds.length) {
    overlapFilter._id = { $nin: excludedIds };
  }

  // Rule 1: same teacher at the same time (any room)
  const teacherConflict = await ScheduleEntry.findOne({
    ...overlapFilter,
    teacher: doc.teacher,
  }).lean();

  if (teacherConflict) {
    return `Teacher ${doc.teacher} already has a class on ${doc.day} from ${teacherConflict.timeIn} to ${teacherConflict.timeOut}.`;
  }

  // Rule 2: same room at the same time (any teacher)
  if (doc.room) {
    const roomConflict = await ScheduleEntry.findOne({
      ...overlapFilter,
      room: doc.room,
    }).lean();

    if (roomConflict) {
      return `Room ${doc.room} is already occupied on ${doc.day} from ${roomConflict.timeIn} to ${roomConflict.timeOut}.`;
    }
  }

  return null;
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
    return res.status(500).json({ message: "Failed to create schedule table.", error: error.message });
  }
}

async function listSchedules(req, res) {
  try {
    const tableLabel = normalizeString(req.query.tableLabel);
    const filter = tableLabel ? { tableLabel } : {};

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
    const docs = buildEntryDocs(req.body || {});
    await ensureTableExists(docs[0].tableLabel);

    for (const doc of docs) {
      const conflictMessage = await findConflict(doc);
      if (conflictMessage) {
        return res.status(409).json({ message: conflictMessage, code: "SCHEDULE_CONFLICT" });
      }
    }

    const created = await ScheduleEntry.insertMany(docs);
    return res.status(201).json({ message: "Schedule saved.", entries: created.map(toClientEntry) });
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

async function replaceSchedule(req, res) {
  try {
    const { old: oldDescriptor, next } = req.body || {};

    if (!oldDescriptor || !next) {
      return res.status(400).json({ message: "Missing old and next schedule payload." });
    }

    const docs = buildEntryDocs(next);
    await ensureTableExists(docs[0].tableLabel);

    const excludedIds = await getExcludedIds(oldDescriptor);
    for (const doc of docs) {
      const conflictMessage = await findConflict(doc, excludedIds);
      if (conflictMessage) {
        return res.status(409).json({ message: conflictMessage, code: "SCHEDULE_CONFLICT" });
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

module.exports = {
  listScheduleTables,
  createScheduleTable,
  listSchedules,
  createSchedule,
  replaceSchedule,
  deleteSchedule,
};
