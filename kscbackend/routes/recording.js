import express from 'express';
import RecordingSession from '../models/RecordingSession.js';
import ExamSession from '../models/ExamSession.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/sessions/:sessionId/recording', requireAuth, async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ ok: false, error: 'Session not found' });

    const recording = await RecordingSession.findOne({ sessionId: session._id }).sort({ createdAt: -1 });
    res.json({ ok: true, recording });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/rooms/:roomId/recording', requireAuth, async (req, res) => {
  try {
    const recording = await RecordingSession.findOne({ roomId: req.params.roomId }).sort({ createdAt: -1 });
    res.json({ ok: true, recording });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
