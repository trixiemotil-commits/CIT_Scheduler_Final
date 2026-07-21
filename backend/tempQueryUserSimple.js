require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI missing');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const doc = await users.findOne(
      { email: 'tepa.guangco.au@phinmaed.com' },
      {
        projection: {
          avatar: 0,
          passwordHash: 0,
          passwordOtpHash: 0,
          passwordOtpExpiresAt: 0,
          passwordOtpLastSentAt: 0,
          currentSessionId: 0,
          __v: 0,
        },
      }
    );
    console.log(JSON.stringify(doc, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
