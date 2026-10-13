const User = require("../models/User");

function getManilaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getManilaMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

async function autoClockOutTeachers() {
  if (getManilaMinutes() < 20 * 60) return 0;
  const result = await User.updateMany(
    {
      $and: [
        { $or: [{ role: "teacher" }, { roles: "teacher" }] },
        {
          $or: [
            { teacher_clocked_out: { $ne: true } },
            { teacher_status: { $ne: "Offline" } },
            { teacher_admin_status: { $ne: "Offline" } },
            { teacher_availability: { $ne: "Unavailable" } },
            { teacher_time_in: { $ne: null } },
            { teacher_status_expires_at: { $ne: null } },
          ],
        },
      ],
    },
    {
      $set: {
        teacher_status: "Offline",
        teacher_admin_status: "Offline",
        teacher_availability: "Unavailable",
        teacher_time_in: null,
        teacher_clocked_out: true,
        teacher_status_expires_at: null,
      },
    },
  );
  return result.modifiedCount || 0;
}

async function resetTeacherStatusesDaily() {
  try {
    await autoClockOutTeachers();
    const today = getManilaDateKey();
    const result = await User.updateMany(
      {
        $and: [
          { $or: [{ role: "teacher" }, { roles: "teacher" }] },
          { teacher_status_reset_date: { $ne: today } },
        ],
      },
      {
        $set: {
          teacher_status: "Offline",
          teacher_admin_status: "Offline",
          teacher_availability: "Unavailable",
          teacher_time_in: null,
          teacher_clocked_out: true,
          teacher_status_expires_at: null,
          teacher_status_reset_date: today,
          teacher_status_updated_date: "",
        },
      },
    );
    return result.modifiedCount || 0;
  } catch (error) {
    console.error("Failed to reset daily teacher statuses:", error.message);
    return 0;
  }
}

resetTeacherStatusesDaily.getManilaDateKey = getManilaDateKey;
resetTeacherStatusesDaily.getManilaMinutes = getManilaMinutes;
module.exports = resetTeacherStatusesDaily;
