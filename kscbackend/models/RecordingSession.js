import mongoose from 'mongoose';

const RecordingSessionSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession' },
    status: { type: String, enum: ['recording', 'stopped'], default: 'stopped' },
    recordingEnabled: { type: Boolean, default: false },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByRole: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

RecordingSessionSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.models?.RecordingSession || mongoose.model('RecordingSession', RecordingSessionSchema);
