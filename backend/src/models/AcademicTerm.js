const mongoose = require("mongoose");

const academicTermSchema = new mongoose.Schema(
  {
    schoolYear: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      enum: ["1st Semester", "2nd Semester"],
      required: true,
      trim: true,
    },
    sectionCounts: {
      type: Object,
      default: {},
    },
    sectionNames: {
      type: Object,
      default: {},
    },
    rooms: {
      type: [
        {
          name: { type: String, trim: true },
          type: { type: String, enum: ['Lecture', 'Comlab'], default: 'Lecture' },
        },
      ],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

academicTermSchema.index({ schoolYear: 1, semester: 1 }, { unique: true });
academicTermSchema.index({ isPublished: 1 });

module.exports = mongoose.model("AcademicTerm", academicTermSchema);
