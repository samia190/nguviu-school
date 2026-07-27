import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHomeworkSubmissionRecord } from '../utils/homeworkSubmission.js';

test('buildHomeworkSubmissionRecord creates a teacher-visible submission payload', () => {
  const homework = {
    _id: 'homework-123',
    title: 'Algebra Assignment',
    subject: 'Mathematics',
    class: 'Grade 10',
    contentType: 'assignment',
    teacher: { _id: 'teacher-1', name: 'Ms. Jane' }
  };

  const user = { id: 'student-1', name: 'John Doe', email: 'john@example.com' };

  const payload = buildHomeworkSubmissionRecord({
    homework,
    user,
    notes: 'Completed with working shown',
    attachments: [{ originalName: 'assignment.pdf', url: 'https://example.com/assignment.pdf' }],
  });

  assert.equal(payload.homeworkId, 'homework-123');
  assert.equal(payload.subject, 'Mathematics');
  assert.equal(payload.className, 'Grade 10');
  assert.equal(payload.teacher._id, 'teacher-1');
  assert.equal(payload.student._id, 'student-1');
  assert.equal(payload.status, 'pending');
  assert.equal(payload.attachments.length, 1);
  assert.equal(payload.notes, 'Completed with working shown');
});
