import dotenv from "dotenv";
dotenv.config();

import { connectToDatabase } from "../services/dbConnection.js";
import Exam from "../models/Exam.js";
import ExamSession from "../models/ExamSession.js";
import StudentExamResult from "../models/StudentExamResult.js";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const syncIndexes = process.argv.includes("--sync-indexes");
const now = new Date();
const examCache = new Map();

async function getExam(id) {
  const key = String(id);
  if (!examCache.has(key)) examCache.set(key, await Exam.findById(id).lean());
  return examCache.get(key);
}

async function run() {
  await connectToDatabase();
  const sessions = await ExamSession.find({}).sort({ examId: 1, studentId: 1, startTime: 1, _id: 1 }).lean();
  const attemptCounters = new Map();
  const operations = [];

  for (const session of sessions) {
    const pair = `${session.examId}:${session.studentId}`;
    const attemptNumber = (attemptCounters.get(pair) || 0) + 1;
    attemptCounters.set(pair, attemptNumber);
    const exam = await getExam(session.examId);
    const durationMs = Math.max(1, Number(exam?.duration || 60)) * 60_000;
    const startTime = session.startTime ? new Date(session.startTime) : now;
    const expiresAt = session.expiresAt ? new Date(session.expiresAt) : session.endTime ? new Date(session.endTime) : new Date(startTime.getTime() + durationMs);
    const status = session.status === "in_progress" && expiresAt <= now ? "expired" : session.status;
    operations.push({
      updateOne: {
        filter: { _id: session._id },
        update: {
          $set: {
            expiresAt,
            attemptNumber: session.attemptNumber || attemptNumber,
            answerVersion: Number.isInteger(session.answerVersion) ? session.answerVersion : 0,
            status,
            ...(status === "expired" && !session.endTime ? { endTime: expiresAt } : {}),
          },
        },
      },
    });
  }

  const duplicateResults = await StudentExamResult.aggregate([
    { $group: { _id: "$sessionId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (duplicateResults.length) {
    throw new Error(`Cannot create the unique StudentExamResult session index: ${duplicateResults.length} duplicate session result group(s) must be reconciled first.`);
  }

  console.log(`Prepared ${operations.length} exam-session updates. Mode: ${apply ? "APPLY" : "DRY RUN"}.`);
  if (!apply) {
    console.log("Review a database backup and run with --apply before enabling production exam routes.");
    await mongoose.disconnect();
    return;
  }

  if (operations.length) await ExamSession.bulkWrite(operations, { ordered: false });
  if (syncIndexes) {
    await ExamSession.syncIndexes();
    await StudentExamResult.syncIndexes();
  }
  console.log("Production exam-session migration completed.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error.message || error);
  await mongoose.disconnect();
  process.exit(1);
});
