const mongoose = require('mongoose')

const SubstituteEntrySchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed },
  tableLabel: { type: String, trim: true },
  teacher: { type: String, trim: true },
  subject: { type: String, trim: true },
  room: { type: String, trim: true },
  section: { type: String, trim: true },
  year: { type: String, trim: true },
  campus: { type: String, trim: true },
  entryType: { type: String, trim: true },
  color: { type: String, trim: true },
  timeIn: { type: String, trim: true },
  timeOut: { type: String, trim: true },
  parallel: { type: Boolean, default: false },
  parallelGroupId: { type: String, trim: true },
  parallelCount: { type: Number, default: 1 },
  parallelSlots: [{
    section: { type: String, trim: true },
    room: { type: String, trim: true },
  }],
  addedAt: { type: String, trim: true },
}, { _id: false })

const SubstituteAssignmentSchema = new mongoose.Schema(
  {
    originalTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    substituteTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    academicTermId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicTerm', default: null, index: true },
    entries: { type: [SubstituteEntrySchema], default: [] },
    // expiresAt drives MongoDB TTL index to remove records after expiration
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true, collection: 'substitute schedule' }
)

module.exports = mongoose.model('SubstituteAssignment', SubstituteAssignmentSchema)
