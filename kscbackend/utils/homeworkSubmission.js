export function buildHomeworkSubmissionRecord({ homework, user, notes = '', attachments = [] }) {
  return {
    homeworkId: homework?._id ? String(homework._id) : '',
    homeworkTitle: homework?.title || '',
    subject: homework?.subject || '',
    className: homework?.class || '',
    contentType: homework?.contentType || 'assignment',
    teacher: {
      _id: homework?.teacher?._id ? String(homework.teacher._id) : '',
      name: homework?.teacher?.name || '',
    },
    student: {
      _id: user?.id ? String(user.id) : '',
      name: user?.name || '',
      email: user?.email || '',
    },
    notes,
    attachments: (attachments || []).map((item) => ({
      originalName: item?.originalName || item?.name || 'attachment',
      name: item?.name || item?.originalName || 'attachment',
      url: item?.url || '',
      mimetype: item?.mimetype || '',
      size: item?.size || 0,
    })),
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
}
