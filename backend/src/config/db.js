const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in backend/.env");
  }

  await mongoose.connect(uri);
  console.log("MongoDB Atlas connected.");

  await dropStaleRegisteredIdIndex();
  await backfillRegisteredIds();
  await ensureSparseStudentIdIndex();
  await migrateUserStatusFields();
}

async function dropStaleRegisteredIdIndex() {
  // Drop stale unique index left over from a previous schema version.
  // Without this, the unique constraint rejects more than one null document.
  try {
    await mongoose.connection.collection("users").dropIndex("registeredId_1");
    console.log("Dropped stale index: registeredId_1");
  } catch (err) {
    // Index/collection missing — nothing to do.
    const benignCodes = ["IndexNotFound", "NamespaceNotFound"];
    if (!benignCodes.includes(err.codeName) && ![26, 27].includes(err.code)) {
      console.warn("Could not drop registeredId_1 index:", err.message);
    }
  }
}

async function backfillRegisteredIds() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return;
    }

    const collections = await db.listCollections({ name: "users" }).toArray();
    if (!collections.length) {
      return;
    }

    const collection = db.collection("users");
    const cursor = collection.find(
      {
        $or: [
          { registeredId: { $exists: false } },
          { registeredId: null }
        ]
      },
      { projection: { _id: 1 } }
    );

    let patched = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      await collection.updateOne(
        { _id: doc._id },
        { $set: { registeredId: doc._id.toString() } }
      );
      patched += 1;
    }

    await cursor.close();

    if (patched) {
      console.log(`Backfilled registeredId for ${patched} user(s).`);
    }
  } catch (err) {
    const benignCodes = ["NamespaceNotFound"];
    if (!benignCodes.includes(err.codeName) && ![26].includes(err.code)) {
      console.warn("Failed to backfill registeredId values:", err.message);
    }
  }
}

async function ensureSparseStudentIdIndex() {
  try {
    const collection = mongoose.connection.collection("users");
    const indexes = await collection.indexes();
    const studentIndex = indexes.find((idx) => idx.name === "studentId_1");

    if (studentIndex && !studentIndex.sparse) {
      await collection.dropIndex("studentId_1");
      console.log("Dropped non-sparse studentId index.");
    }

    await collection.createIndex({ studentId: 1 }, { unique: true, sparse: true, name: "studentId_1" });
    console.log("Ensured sparse studentId index.");
  } catch (err) {
    const benignCodes = ["NamespaceNotFound", "IndexNotFound"];
    if (!benignCodes.includes(err.codeName) && ![26, 27].includes(err.code)) {
      console.warn("Failed to ensure sparse studentId index:", err.message);
    }
  }
}

async function migrateUserStatusFields() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return;
    }

    const collections = await db.listCollections({ name: "users" }).toArray();
    if (!collections.length) {
      return;
    }

    const users = db.collection("users");

    // Backfill account_status from legacy status or default to Active.
    const accountResult = await users.updateMany(
      {
        $or: [
          { account_status: { $exists: false } },
          { account_status: null },
          { account_status: "" },
        ],
      },
      [
        {
          $set: {
            account_status: {
              $cond: {
                if: { $in: ["$status", ["Pending", "Active", "Inactive", "Denied", "Archived"]] },
                then: "$status",
                else: {
                  $cond: {
                    if: { $eq: ["$role", "student"] },
                    then: "Pending",
                    else: "Active",
                  },
                },
              },
            },
          },
        },
      ]
    );

    // Set teacher_status only for teacher users when missing.
    const teacherStatusResult = await users.updateMany(
      {
        role: "teacher",
        $or: [
          { teacher_status: { $exists: false } },
          { teacher_status: null },
          { teacher_status: "" },
        ],
      },
      {
        $set: {
          teacher_status: "On School",
        },
      }
    );

    // Remove teacher_status for non-teacher accounts.
    await users.updateMany(
      { role: { $ne: "teacher" }, teacher_status: { $exists: true } },
      { $unset: { teacher_status: "" } }
    );

    // Drop legacy status field once migrated.
    await users.updateMany(
      { status: { $exists: true } },
      { $unset: { status: "" } }
    );

    const touched = (accountResult.modifiedCount || 0) + (teacherStatusResult.modifiedCount || 0);
    if (touched > 0) {
      console.log(`Migrated user status fields for ${touched} user record(s).`);
    }
  } catch (err) {
    const benignCodes = ["NamespaceNotFound"];
    if (!benignCodes.includes(err.codeName) && ![26].includes(err.code)) {
      console.warn("Failed to migrate user status fields:", err.message);
    }
  }
}

module.exports = connectDB;
