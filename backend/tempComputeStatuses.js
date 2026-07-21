require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const cursor = users.find({ $or: [{ role: 'teacher' }, { roles: 'teacher' }] });
    const results = [];
    while (await cursor.hasNext()) {
      const u = await cursor.next();
      const userDoc = u;
      function resolveTeacherStatusLocal(userDoc) {
        if (!userDoc || !((Array.isArray(userDoc.roles) ? userDoc.roles : [userDoc.role]).includes('teacher'))) {
          return 'On Leave';
        }
        if (userDoc.account_status !== 'Active') return 'On Leave';
        if (userDoc.teacher_status_expires_at && new Date(userDoc.teacher_status_expires_at) <= new Date()) {
          return 'On School';
        }
        const directStatus = ['On School', 'On Leave'].includes(userDoc.teacher_status) ? userDoc.teacher_status : 'On School';
        return directStatus;
      }
      results.push({
        id: String(userDoc._id),
        name: `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
        email: userDoc.email,
        stored_teacher_status: userDoc.teacher_status,
        teacher_status_expires_at: userDoc.teacher_status_expires_at || null,
        account_status: userDoc.account_status || null,
        computed_status: resolveTeacherStatusLocal(userDoc),
      });
    }
    console.log(JSON.stringify(results, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
