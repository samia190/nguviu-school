# Kangaru Excel Import and Student Study Support Guide

## Administrator access

The new **Excel Imports** workspace is inside the existing Administrator Dashboard. Only authenticated `admin` and `superadmin` users can open it. A standard administrator can provision students, teachers, and staff; only a `superadmin` can confirm a workbook containing administrator accounts.

> Always download the current template from the dashboard. Do not edit header names or add password columns.

## Account import workflow

1. Select **Accounts** and download the template.
2. Complete one row per account.
3. Upload the workbook and review every row in the validation preview.
4. Fix all invalid or duplicate rows in the workbook, then upload again.
5. Confirm the validated import.

| Required field | Applies to | Notes |
| --- | --- | --- |
| `name` | All accounts | Display name. |
| `email` | All accounts | Must be unique and valid. |
| `role` | All accounts | `student`, `teacher`, `staff`, or `admin`. |
| `admissionNumber` | Students | Must be unique. |
| `dateOfBirth` | Students | Use `YYYY-MM-DD`. |
| `curriculum` | Students | `CBE` or `8-4-4`. |
| `staffId`, `department`, `subjects` | Teachers/staff as applicable | Comma-separate subjects. |

No password is imported, generated into the workbook, or returned by the system. The system generates a high-entropy unusable temporary secret and a one-time password setup link. Account import confirmation is blocked until `RESEND_API_KEY` and `FRONTEND_URL` are configured securely.

## Student results import workflow

1. Select **Student results** and download the template.
2. Enter one row per subject result for each student and term.
3. Upload the workbook for validation. Every `admissionNumber` must already map to a student account.
4. Confirm only when all rows are valid.
5. Select **Publish results immediately** only after the responsible school team has approved the data.

| Required field | Notes |
| --- | --- |
| `admissionNumber` | Must match an existing student account. |
| `term` | `Term 1`, `Term 2`, or `Term 3`. |
| `year` | Four-digit academic year. |
| `examType` | Supported type such as `End of Term`. |
| `curriculum` | `CBE` or `8-4-4`. |
| `class` | Student’s academic class. |
| `subject` | One subject per spreadsheet row. |
| `marks` | Number between 0 and 100. |

Rows are grouped by student, term, year, exam type, and curriculum. The system calculates total marks, average marks, and an overall grade; it upserts the matching result record. Only **published** results are visible to the matching signed-in student.

## Student support after results publication

The existing student Results page now includes:

- a protected study-support assistant that receives only the signed-in student’s published result summary;
- suggested study priorities and a revision routine for lower-scoring subjects;
- matched **approved school materials** from published homework/revision-library items for the student’s class, stream, and priority subjects;
- step-by-step explanations, worked examples, and practice-question support through the server-side AI providers.

The assistant must not diagnose health or wellbeing, reveal another student’s data, make disciplinary decisions, or claim future outcomes as certain. A teacher should review any serious academic or wellbeing concern.

## Production safeguards

Imports are staged for 24 hours before confirmation. The system validates workbook size, row count, role, emails, student identity matching, curriculum, result values, and duplicate account identifiers. Account and result writes use database transactions. Administrators should still keep an approved original workbook and perform imports in a controlled release window.
