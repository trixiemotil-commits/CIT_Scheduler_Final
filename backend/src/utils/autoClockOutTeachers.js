const User = require("../models/User");

async function autoClockOutTeachers() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    if (hour * 60 + minute < 20 * 60) return 0;

    const result = await User.updateMany(
      {
        $and: [
          { $or: [{ role: "teacher" }, { roles: "teacher" }] },
          {
            $or: [
              { teacher_clocked_out: { $ne: true } },
              { teacher_time_in: { $ne: null } },
              { teacher_status: { $ne: "Offline" } },
              { teacher_admin_status: { $ne: "Offline" } },
              { teacher_availability: { $ne: "Unavailable" } },
              { teacher_status_expires_at: { $ne: null } },
            ],
          },
        ],
      },
      [
        {
          $set: {
            teacher_clocked_out: true,
            teacher_time_in: null,
            teacher_status: "Offline",
            teacher_availability: "Unavailable",
            teacher_admin_status: "Offline",
            teacher_status_expires_at: null,
          },
        },
      ],
    );

    const modifiedCount = result.modifiedCount || 0;
    if (modifiedCount > 0) {
      console.log(`Automatically clocked out ${modifiedCount} teacher${modifiedCount === 1 ? "" : "s"} at or after 8:00 PM Philippine time.`);
    }
    return modifiedCount;
  } catch (error) {
    console.error("Failed to automatically clock out teachers:", error.message);
    return 0;
  }
}

module.exports = autoClockOutTeachers;
