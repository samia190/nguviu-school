import ProctoringLog from '../models/ProctoringLog.js';
import Exam from '../models/Exam.js';
import { isExamManager } from '../utils/examAccess.js';

const monitoringSockets = new Map();

export function attachMonitoringSocket(io) {
  io.on('connection', (socket) => {
    socket.on('monitoring:subscribe', async ({ examId }, callback) => {
      try {
        if (!examId) throw new Error('Exam identifier is required.');
        const exam = await Exam.findById(examId);
        if (!exam || !isExamManager(exam, socket.user)) throw new Error('Not authorized to monitor this exam.');
        const roomId = `monitoring:exam:${String(examId)}`;
        socket.join(roomId);
        monitoringSockets.set(socket.id, roomId);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      monitoringSockets.delete(socket.id);
    });
  });
}

export async function broadcastMonitoringEvent(payload) {
  const { examId, sessionId, eventType, severity, description, details, log } = payload;
  const roomId = examId ? `monitoring:exam:${String(examId)}` : null;

  if (!roomId) return null;

  const normalized = {
    _id: log?._id || null,
    sessionId: sessionId || null,
    eventType,
    severity,
    description: description || 'Monitoring event',
    details: details || {},
    timestamp: log?.timestamp || new Date().toISOString(),
    acknowledged: log?.acknowledged || false,
  };

  try {
    const latestLog = log || await ProctoringLog.findOne({ sessionId }).sort({ timestamp: -1 }).lean();
    if (latestLog) {
      normalized._id = latestLog._id;
      normalized.timestamp = latestLog.timestamp;
      normalized.acknowledged = latestLog.acknowledged || false;
    }
  } catch (error) {
    console.warn('[Monitoring] Unable to enrich broadcast payload:', error.message);
  }

  const io = globalThis.__IO_INSTANCE;
  if (io && typeof io.to === 'function') {
    io.to(roomId).emit('monitoringEvent', normalized);
  }

  return normalized;
}
