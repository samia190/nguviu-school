# Word Paper Assessments and Timetable Distribution

## Word-paper assessment workflow

Teachers continue to create the exam in the existing **Teacher Exam Management** workspace. After the exam record exists, select **Word Paper** for that exam and upload a `.docx` question paper. The system stores the original file in configured protected storage, converts the readable Word content to a restricted HTML representation, and saves a cryptographic checksum with a numbered paper version.

> Students never receive the editable `.docx` source through the student exam endpoint. They receive the rendered, read-only question paper only after the server has created their authorised exam session.

| Stage | Teacher action | System control |
| --- | --- | --- |
| Authoring | Upload a `.docx` paper, optionally adding approved HTTPS image/audio/video/resource links. | Only the exam owner or an administrator can upload a paper. Scriptable markup is stripped from the rendered version. |
| Preparation | Correct and replace the paper before students begin. | Each replacement creates a new version. |
| First student start | A student starts an authorised exam session. | The server freezes the exact paper version and checksum into that session. The paper cannot be replaced after any session has started. |
| Student work | The student views the immutable paper, writes answers, and uploads working evidence. | Questions are not editable. Answers and files are tied to the authenticated student’s active server-side session. |
| Review | The owning teacher opens **Review Working**, then **Open exact paper & answers**. | The teacher receives the paper version used by that student, saved answers, and only that session’s uploaded evidence. |

## Word and media rules

Use `.docx` for the paper itself. Embedded Word images are rendered as restricted inline images. For audio, video, or larger teaching material, first upload the approved media through the existing protected teacher resource upload workflow and then add its HTTPS reference as media metadata when preparing the Word paper.

Do not include answer keys in the Word paper. Marking guidance belongs in teacher-only marking materials, not in the student-delivered paper.

## Timetable Excel workflow

An administrator opens **Timetables** in the existing Administrator Dashboard, downloads the current template, fills in one lesson per row, validates the workbook, corrects all errors, and explicitly confirms distribution.

| Template column | Requirement |
| --- | --- |
| `term`, `year` | Academic term and four-digit year. |
| `class`, `stream` | Must match an active verified student group. |
| `day` | Monday through Sunday. |
| `startTime`, `endTime` | 24-hour `HH:MM` format; end time must be later. |
| `subject`, `room` | Lesson subject and optional room. |
| `teacherStaffId` | Must match an active verified teacher directory record. |

The confirmation transaction groups rows by term, year, class, and stream. Students see only the timetable for their verified class and stream. Teachers receive only the entries explicitly assigned to their verified staff identity.

## Release checks

Before enabling a new Word-paper or timetable workflow in production, test it in staging with a non-live teacher, student, class, and stream. Confirm the following: the student cannot obtain or edit the source document; a teacher cannot replace a paper after the first session starts; an unrelated teacher cannot access the evidence; and an invalid class, stream, teacher staff ID, or time range is rejected at timetable preview.
