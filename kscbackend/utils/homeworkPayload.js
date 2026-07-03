export function buildHomeworkPayload(body = {}) {
  const {
    title,
    description,
    subject,
    class: className,
    contentType,
    dueDate,
    status,
    stream,
    academicYear,
    term,
    topic,
    department,
    resourceType,
    visibility,
    allowedClasses,
    allowedStreams,
  } = body;

  return {
    title,
    description,
    subject,
    class: className,
    contentType: contentType || "notes",
    dueDate,
    status,
    stream,
    academicYear,
    term,
    topic,
    department,
    resourceType: resourceType || "notes",
    visibility: visibility || "whole-school",
    allowedClasses: Array.isArray(allowedClasses) ? allowedClasses : [],
    allowedStreams: Array.isArray(allowedStreams) ? allowedStreams : [],
  };
}
