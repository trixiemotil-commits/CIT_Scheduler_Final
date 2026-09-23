const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const authRoutes = require("../routes/authRoutes");
const rbacRoutes = require("../routes/rbacRoutes");
const userRoutes = require("../routes/userRoutes");
const scheduleRoutes = require("../routes/scheduleRoutes");
const academicTermRoutes = require("../routes/academicTermRoutes");
const substituteRoutes = require("../routes/substituteRoutes");
const consultationRoutes = require("../routes/consultationRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const eventRoutes = require("../routes/eventRoutes");
const activityLogRoutes = require("../routes/activityLogRoutes");
const activityLogger = require("../middleware/activityLogger");
const ConsultationAvailability = require("../models/ConsultationAvailability");
const Event = require("../models/Event");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    'https://deployed-cit-sched.vercel.app',
    'https://deployed-cit-sched-git-main-iggyt0929-1567s-projects.vercel.app',
    'https://citscheduler.com',
'https://www.citscheduler.com',
'https://cit-scheduler-final-zo9k.vercel.app'
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(activityLogger);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rbac", rbacRoutes);
app.use("/api/users", userRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/academic-terms", academicTermRoutes);
app.use("/api/substitutes", substituteRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/activity-logs", activityLogRoutes);

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && error?.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON payload." });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({ message: "Uploaded image is too large. Please choose a smaller photo." });
  }

  return next(error);
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function archiveExpiredEvents() {
  try {
    const events = await Event.find({ status: "active" }).lean();
    const now = Date.now();
    let archivedCount = 0;

    for (const event of events) {
      if (!event.date) continue;
      const endDate = new Date(`${event.date}T${event.endTime || "23:59:59"}`);
      if (Number.isNaN(endDate.getTime())) continue;
      if (now <= endDate.getTime()) continue;

      const archiveAfter = new Date(endDate);
      archiveAfter.setMonth(archiveAfter.getMonth() + 1);

      if (now < archiveAfter.getTime()) continue;

      await Event.updateOne({ _id: event._id }, { $set: { status: "archived" } });
      archivedCount += 1;
    }

    if (archivedCount > 0) {
      console.log(`Archived ${archivedCount} event${archivedCount === 1 ? "" : "s"} after their one-month archive window.`);
    }
  } catch (error) {
    console.error("Failed to archive expired events:", error.message);
  }
}

async function autoClockOutTeachers() {
  try {
    const timeZone = process.env.APP_TIME_ZONE || "Asia/Manila";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const day = parts.find(part => part.type === "weekday")?.value;
    const hour = Number(parts.find(part => part.type === "hour")?.value);
    const minute = Number(parts.find(part => part.type === "minute")?.value);
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(day);
    const isPastClockOut = hour > 19 || (hour === 19 && minute >= 30);
    if (!isWeekday || !isPastClockOut) return;

    const result = await User.updateMany(
      {
        $or: [{ role: "teacher" }, { roles: "teacher" }],
        teacher_clocked_out: { $ne: true },
        teacher_time_in: { $ne: null },
      },
      {
        $set: {
          teacher_clocked_out: true,
          teacher_time_in: null,
          teacher_status: "On Leave",
          teacher_availability: "Unavailable",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Automatically clocked out ${result.modifiedCount} teacher${result.modifiedCount === 1 ? "" : "s"} after 7:30 PM.`);
    }
  } catch (error) {
    console.error("Failed to automatically clock out teachers:", error.message);
  }
}

async function startServer() {
  try {
    await connectDB();
    await archiveExpiredEvents();
    await autoClockOutTeachers();
    // Replace the legacy cross-term uniqueness rule with a term-scoped rule.
    const consultationIndexes = await ConsultationAvailability.collection.indexes();
    if (consultationIndexes.some((index) => index.name === "employeeId_1_dayOfWeek_1")) {
      await ConsultationAvailability.collection.dropIndex("employeeId_1_dayOfWeek_1");
    }
    await ConsultationAvailability.collection.createIndex(
      { employeeId: 1, dayOfWeek: 1, academicTermId: 1 },
      { unique: true, name: "employeeId_1_dayOfWeek_1_academicTermId_1" }
    );
    const server = app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}`);
    });

    setInterval(() => {
      archiveExpiredEvents();
    }, 24 * 60 * 60 * 1000);

    setInterval(() => {
      autoClockOutTeachers();
    }, 60 * 1000);

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the existing backend process before starting a new one.`
        );
      } else {
        console.error("Server failed to bind:", error.message);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
