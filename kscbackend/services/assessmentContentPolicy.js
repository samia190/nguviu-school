import sanitizeHtml from "sanitize-html";

export const TIMETABLE_DAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);

export function sanitiseExamPaperHtml(html) {
  return sanitizeHtml(String(html || ""), { allowedTags: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4", "ol", "ul", "li", "table", "thead", "tbody", "tr", "th", "td", "blockquote", "pre", "code", "a", "img"], allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] }, allowedSchemes: ["https", "data"], allowedSchemesByTag: { img: ["https", "data"] }, transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) } });
}

export function canReplaceExamPaper(hasStartedSession) { return !hasStartedSession; }

export function validateTimetableRow(row) {
  const errors = []; const required = ["term", "year", "class", "stream", "day", "startTime", "endTime", "subject", "teacherStaffId"];
  for (const field of required) if (!String(row?.[field] || "").trim()) errors.push(`${field} is required`);
  if (!/^\d{4}$/.test(String(row?.year || ""))) errors.push("year must be four digits");
  if (!TIMETABLE_DAYS.has(row?.day)) errors.push("day must be Monday through Sunday");
  if (!/^\d{2}:\d{2}$/.test(String(row?.startTime || "")) || !/^\d{2}:\d{2}$/.test(String(row?.endTime || ""))) errors.push("startTime and endTime must use HH:MM");
  if (String(row?.startTime || "") >= String(row?.endTime || "")) errors.push("endTime must be after startTime");
  return errors;
}
