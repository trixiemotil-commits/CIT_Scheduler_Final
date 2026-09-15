const mongoose = require("mongoose");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { logActivity } = require("../utils/activityLogWriter");
const { notifyActiveAdmins } = require("../utils/adminNotification");

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTeacherIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanString).filter(Boolean))];
}

function cleanStudentYearLevels(value) {
  const allowed = new Set(["1st Year", "2nd Year", "3rd Year", "4th Year"]);
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanString).filter((yearLevel) => allowed.has(yearLevel)))];
}

async function validateEventTeacherIds(teacherIds, allowedExistingIds = new Set()) {
  if (!teacherIds.length) return null;

  const idsToValidate = teacherIds.filter((teacherId) => !allowedExistingIds.has(String(teacherId)));
  if (!idsToValidate.length) return null;

  const teachers = await User.find({
    _id: { $in: idsToValidate },
    account_status: "Active",
    teacher_status: "On School",
    $or: [{ role: "teacher" }, { roles: "teacher" }],
  }).select("_id").lean();
  const eligibleIds = new Set(teachers.map((teacher) => String(teacher._id)));
  const unavailable = idsToValidate.find((teacherId) => !eligibleIds.has(String(teacherId)));
  return unavailable ? "Only active teachers with status On School can be assigned to an event." : null;
}

function serializeEvent(event) {
  const value = event?.toObject ? event.toObject() : event;
  if (!value) return value;
  return { ...value, id: String(value._id) };
}

function eventPayload(body = {}) {
  return {
    title: cleanString(body.title),
    description: cleanString(body.description),
    date: cleanString(body.date),
    time: cleanString(body.time),
    endTime: cleanString(body.endTime),
    location: cleanString(body.location),
    image: typeof body.image === "string" ? body.image : "",
    teacherIds: cleanTeacherIds(body.teacherIds),
    studentYearLevels: cleanStudentYearLevels(body.studentYearLevels),
  };
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isEventEnded(event, now = new Date()) {
  if (!event?.date) return false;

  const today = localDateString(now);
  if (event.date < today) return true;
  if (event.date > today) return false;

  const endTime = cleanString(event.endTime);
  if (!endTime) return false;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return endTime <= currentTime;
}

async function notifyStudentsOfEvent(event, actorId) {
  const studentQuery = {
    account_status: "Active",
    $or: [
      { role: "student" },
      { roles: "student" },
    ],
  };
  if (event.studentYearLevels?.length) {
    studentQuery.yearLevel = { $in: event.studentYearLevels };
  }
  const students = await User.find(studentQuery).select("_id").lean();

  if (!students.length) return 0;

  const dateText = event.date ? ` on ${event.date}` : "";
  const timeText = event.time ? ` at ${event.time}${event.endTime ? `–${event.endTime}` : ""}` : "";
  const locationText = event.location ? ` in ${event.location}` : "";
  const notifications = students.map((student) => ({
    recipientId: student._id,
    actorId: actorId || null,
    type: "new_event",
    title: "New event posted",
    message: `${event.title}${dateText}${timeText}${locationText}.`,
    related: { eventId: event._id.toString() },
    data: { route: "/student/events" },
  }));

  // Model.create uses save hooks, which also pushes each notification over SSE.
  await Notification.create(notifications);
  return notifications.length;
}

async function notifyTeachersOfEvent(event, actorId) {
  if (!event.teacherIds?.length) return 0;

  const teachers = await User.find({
    _id: { $in: event.teacherIds },
    account_status: "Active",
    $or: [{ role: "teacher" }, { roles: "teacher" }],
  }).select("_id").lean();

  if (!teachers.length) return 0;

  const notifications = teachers.map((teacher) => ({
    recipientId: teacher._id,
    actorId: actorId || null,
    type: "new_event",
    title: "New event assigned",
    message: `${event.title}${event.date ? ` on ${event.date}` : ""}${event.time ? ` at ${event.time}` : ""}.`,
    related: { eventId: event._id.toString() },
    data: { route: "/teacher/events" },
  }));

  await Notification.create(notifications);
  return notifications.length;
}

async function listEvents(req, res) {
  try {
    const query = {};
    const requestedStatus = cleanString(req.query.status).toLowerCase();

    // Non-admin users must never receive archived events.
    if (req.user?.role !== "admin") {
      query.status = "active";
    } else if (["active", "archived"].includes(requestedStatus)) {
      query.status = requestedStatus;
    }

    if (req.user?.role === "teacher") {
      query.$or = [
        { teacherIds: { $exists: false } },
        { teacherIds: { $size: 0 } },
        { teacherIds: String(req.user.id) },
      ];
    } else if (req.user?.role === "student") {
      const student = await User.findById(req.user.id).select("yearLevel").lean();
      query.$or = [
        { studentYearLevels: { $exists: false } },
        { studentYearLevels: { $size: 0 } },
        { studentYearLevels: student?.yearLevel || "__unassigned__" },
      ];
    }

    const events = await Event.find(query).sort({ date: 1, time: 1, createdAt: -1 }).lean();
    return res.json({ events: events.map(serializeEvent) });
  } catch (error) {
    console.error("Failed to list events:", error);
    return res.status(500).json({ message: "Failed to load events.", error: error.message });
  }
}

async function createEvent(req, res) {
  try {
    const payload = eventPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Event title is required." });
    }
    if (payload.date && payload.date < localDateString()) {
      return res.status(400).json({ message: "New events cannot use a past date." });
    }
    if (!payload.date || !payload.time || !payload.endTime) {
      return res.status(400).json({ message: "Event date, start time, and end time are required." });
    }
    if (payload.endTime <= payload.time) {
      return res.status(400).json({ message: "Event end time must be later than its start time." });
    }
    const teacherValidationError = await validateEventTeacherIds(payload.teacherIds);
    if (teacherValidationError) {
      return res.status(400).json({ message: teacherValidationError });
    }

    const event = await Event.create({
      ...payload,
      status: "active",
      createdBy: cleanString(req.user?.id || req.user?._id || req.user?.email),
    });

    let notifiedStudents = 0;
    let notifiedTeachers = 0;
    try {
      notifiedStudents = await notifyStudentsOfEvent(event, req.user?.id);
      notifiedTeachers = await notifyTeachersOfEvent(event, req.user?.id);
    } catch (notificationError) {
      console.warn("Event created, but student notifications failed:", notificationError.message);
    }

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "event_created_admin",
        title: "New event created",
        message: `${event.title} was added to the events calendar.`,
        related: { eventId: event._id.toString() },
        route: "/admin/events",
      });
    } catch (notificationError) {
      console.warn("Event created, but admin notification failed:", notificationError.message);
    }

    await logActivity({
      actor: req.user,
      action: `Added event ${event.title}`,
      path: req.originalUrl || "/api/events",
      method: req.method,
      req,
    });

    return res.status(201).json({ event: serializeEvent(event), notifiedStudents, notifiedTeachers });
  } catch (error) {
    console.error("Failed to create event:", error);
    return res.status(500).json({ message: "Failed to create event.", error: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id." });
    }

    const existing = await Event.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Event not found." });
    }

    const payload = eventPayload(req.body);
    const requestedStatus = cleanString(req.body.status).toLowerCase();
    if (!payload.title) {
      return res.status(400).json({ message: "Event title is required." });
    }
    if (requestedStatus !== "archived" && (!payload.date || !payload.time || !payload.endTime)) {
      return res.status(400).json({ message: "Event date, start time, and end time are required." });
    }
    if (requestedStatus !== "archived" && payload.endTime <= payload.time) {
      return res.status(400).json({ message: "Event end time must be later than its start time." });
    }
    const teacherValidationError = await validateEventTeacherIds(
      payload.teacherIds,
      new Set((existing.teacherIds || []).map(String))
    );
    if (teacherValidationError) {
      return res.status(400).json({ message: teacherValidationError });
    }

    Object.assign(existing, payload);
    if (["active", "archived"].includes(requestedStatus)) {
      existing.status = requestedStatus;
    }
    await existing.save();

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "event_updated_admin",
        title: "Event updated",
        message: `${existing.title} was updated${existing.status === "archived" ? " and archived" : ""}.`,
        related: { eventId: existing._id.toString(), status: existing.status },
        route: "/admin/events",
      });
    } catch (notificationError) {
      console.warn("Event updated, but admin notification failed:", notificationError.message);
    }

    await logActivity({
      actor: req.user,
      action: existing.status === "archived"
        ? `Event ended: ${existing.title}`
        : `Edited event ${existing.title}`,
      path: req.originalUrl || `/api/events/${req.params.id}`,
      method: req.method,
      req,
    });

    return res.json({ event: serializeEvent(existing) });
  } catch (error) {
    console.error("Failed to update event:", error);
    return res.status(500).json({ message: "Failed to update event.", error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id." });
    }

    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "event_deleted_admin",
        title: "Event deleted",
        message: `${event.title} was removed from the events calendar.`,
        related: { eventId: event._id.toString() },
        route: "/admin/events",
      });
    } catch (notificationError) {
      console.warn("Event deleted, but admin notification failed:", notificationError.message);
    }

    await logActivity({
      actor: req.user,
      action: `Deleted event ${event.title}`,
      path: req.originalUrl || `/api/events/${req.params.id}`,
      method: req.method,
      req,
    });

    return res.json({ message: "Event deleted." });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return res.status(500).json({ message: "Failed to delete event.", error: error.message });
  }
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
