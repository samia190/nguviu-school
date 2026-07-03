import ProctoringLog from '../models/ProctoringLog.js';

const monitoringSockets = new Map();

export function attachMonitoringSocket(io) {
  io.on('connection', (socket) => {
    socket.on('monitoring:subscribe', ({ examId }) => {
      if (!examId) return;
      socket.join(String(examId));
      monitoringSockets.set(socket.id, String(examId));
    });

    socket.on('disconnect', () => {
      monitoringSockets.delete(socket.id);
    });
  });
}

export async function broadcastMonitoringEvent(payload) {
  const { examId, sessionId, eventType, severity, description, details, log } = payload;
  const roomId = examId ? String(examId) : null;

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
