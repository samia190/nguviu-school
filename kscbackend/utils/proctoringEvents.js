export const EVENT_SEVERITY_RULES = {
  window_blur: "warning",
  window_focus: "info",
  copy_paste: "warning",
  right_click: "warning",
  page_visibility: "warning",
  tab_switch: "warning",
  screenshot_detected: "critical",
  recording_started: "critical",
  suspicious_movement: "critical",
  multiple_faces: "critical",
  no_face: "critical",
  auto_save: "info",
  answer_submitted: "info",
  activity_update: "info",
  camera_started: "info",
  camera_stopped: "info",
  question_viewed: "info",
  question_answered: "info",
  fullscreen_enter: "warning",
  fullscreen_exit: "warning",
  refresh_or_close: "warning",
  file_uploaded: "info",
  print_attempt: "warning",
};

export function classifyEventSeverity(eventType, fallback = "info") {
  return EVENT_SEVERITY_RULES[eventType] || fallback;
}
