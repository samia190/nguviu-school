import test from "node:test";
import assert from "node:assert/strict";
import { buildHomeworkPayload } from "../utils/homeworkPayload.js";

test("buildHomeworkPayload preserves teaching metadata and visibility", () => {
  const payload = buildHomeworkPayload({
    title: "Chapter 5",
    description: "Revision notes",
    subject: "Mathematics",
    class: "Form 3",
    contentType: "notes",
    dueDate: "2026-08-10",
    status: "published",
    stream: "North",
    academicYear: "2026",
    term: "Term 1",
    topic: "Algebra",
    department: "Mathematics",
    resourceType: "notes",
    visibility: "selected-stream",
    allowedClasses: ["Form 3"],
    allowedStreams: ["North"],
  });

  assert.equal(payload.title, "Chapter 5");
  assert.equal(payload.class, "Form 3");
  assert.equal(payload.stream, "North");
  assert.equal(payload.academicYear, "2026");
  assert.equal(payload.term, "Term 1");
  assert.equal(payload.topic, "Algebra");
  assert.equal(payload.department, "Mathematics");
  assert.equal(payload.resourceType, "notes");
  assert.equal(payload.visibility, "selected-stream");
  assert.deepEqual(payload.allowedClasses, ["Form 3"]);
  assert.deepEqual(payload.allowedStreams, ["North"]);
});

test("buildHomeworkPayload falls back to sensible defaults", () => {
  const payload = buildHomeworkPayload({ title: "Demo", subject: "English", class: "Grade 10" });

  assert.equal(payload.title, "Demo");
  assert.equal(payload.contentType, "notes");
  assert.equal(payload.resourceType, "notes");
  assert.equal(payload.visibility, "whole-school");
  assert.deepEqual(payload.allowedClasses, []);
  assert.deepEqual(payload.allowedStreams, []);
});
