const mongoose = require("mongoose");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { logActivity } = require("../utils/activityLogWriter");

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTeacherIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanString).filter(Boolean))];
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
  };
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function notifyStudentsOfEvent(event, actorId) {
  const students = await User.find({
    account_status: "Active",
    $or: [
      { role: "student" },
      { roles: "student" },
    ],
  }).select("_id").lean();

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

    const event = await Event.create({
      ...payload,
      status: "active",
      createdBy: cleanString(req.user?.id || req.user?._id || req.user?.email),
    });

    let notifiedStudents = 0;
    try {
      notifiedStudents = await notifyStudentsOfEvent(event, req.user?.id);
    } catch (notificationError) {
      console.warn("Event created, but student notifications failed:", notificationError.message);
    }

    await logActivity({
      actor: req.user,
      action: `Created event ${event.title}`,
      path: req.originalUrl || "/api/events",
      method: req.method,
      req,
    });

    return res.status(201).json({ event: serializeEvent(event), notifiedStudents });
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

    Object.assign(existing, payload);
    if (["active", "archived"].includes(requestedStatus)) {
      existing.status = requestedStatus;
    }
    await existing.save();

    await logActivity({
      actor: req.user,
      action: `Updated event ${existing.title}${existing.status === "archived" ? " (archived)" : ""}`,
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
