import mongoose from "mongoose";

const TimetableEntrySchema = new mongoose.Schema({
  day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  teacherIdentity: { type: mongoose.Schema.Types.ObjectId, ref: "DirectoryIdentity", required: true },
  teacherStaffId: { type: String, required: true },
  room: { type: String, default: "" },
}, { _id: false });

const TimetableSchema = new mongoose.Schema({
  term: { type: String, required: true }, year: { type: Number, required: true }, class: { type: String, required: true }, stream: { type: String, required: true },
  entries: { type: [TimetableEntrySchema], default: [] }, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });
TimetableSchema.index({ term: 1, year: 1, class: 1, stream: 1 }, { unique: true });
export default mongoose.models?.Timetable || mongoose.model("Timetable", TimetableSchema);
