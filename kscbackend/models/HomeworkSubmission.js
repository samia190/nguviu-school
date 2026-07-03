import mongoose from 'mongoose';

const HomeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: { type: String, required: true, index: true },
    homeworkTitle: { type: String, default: '' },
    subject: { type: String, default: '' },
    className: { type: String, default: '' },
    contentType: { type: String, default: 'assignment' },
    teacher: {
      _id: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    student: {
      _id: { type: String, default: '' },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    notes: { type: String, default: '' },
    attachments: [
      {
        originalName: String,
        name: String,
        url: String,
        mimetype: String,
        size: Number,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models?.HomeworkSubmission || mongoose.model('HomeworkSubmission', HomeworkSubmissionSchema);
