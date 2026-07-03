import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import RecordingSession from './models/RecordingSession.js';
import ExamSession from './models/ExamSession.js';
import { createWorkerPool, getWorker } from './services/mediasoupWorker.js';
import { attachMonitoringSocket } from './services/realtimeMonitoring.js';

const rooms = new Map();

const mediaCodecs = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
];

export function getListenIps() {
  const configured = (process.env.MEDIASOUP_LISTEN_IPS || '127.0.0.1').split(',').map((ip) => ip.trim()).filter(Boolean);
  return configured.map((ip) => ({ ip, announcedIp: process.env.PUBLIC_IP || undefined }));
}

export function getIceServers() {
  const configured = (process.env.STUN_TURN_SERVERS || 'stun:stun.l.google.com:19302').split(',').map((entry) => entry.trim()).filter(Boolean);
  return configured.map((entry) => {
    if (entry.startsWith('turn:')) {
      const [uri, username, credential] = entry.split('|');
      return { urls: [uri], username: username || process.env.TURN_USERNAME || '', credential: credential || process.env.TURN_PASSWORD || '' };
    }
    return { urls: [entry] };
  });
}

function getMetrics() {
  return {
    rooms: rooms.size,
    connections: 0,
    producers: Array.from(rooms.values()).reduce((sum, room) => sum + room.producers.size, 0),
    consumers: Array.from(rooms.values()).reduce((sum, room) => sum + room.consumers.size, 0),
    transports: Array.from(rooms.values()).reduce((sum, room) => sum + room.transports.size, 0),
  };
}

export function createRoomState() {
  return { producers: new Map(), consumers: new Map(), transports: new Map(), members: new Map(), recording: false, createdAt: Date.now() };
}

export function buildRecordingSessionPayload({ roomId, enabled, startedAt, endedAt }) {
  return {
    roomId,
    status: enabled ? 'recording' : 'stopped',
    startedAt: startedAt || null,
    endedAt: enabled ? null : endedAt || null,
    recordedAt: enabled ? startedAt || new Date().toISOString() : endedAt || new Date().toISOString(),
  };
}

async function ensureRoom(roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);

  const worker = getWorker();
  if (!worker) throw new Error('No mediasoup worker available');

  const router = await worker.createRouter({ mediaCodecs });
  const room = { router, ...createRoomState() };
  rooms.set(roomId, room);
  return room;
}

function cleanupSocket(socket, io) {
  for (const [roomId, room] of rooms.entries()) {
    const member = room.members.get(socket.user?.id || socket.id);
    if (member && member.socketId === socket.id) {
      room.members.delete(socket.user?.id || socket.id);
    }

    for (const [producerId, producerInfo] of room.producers.entries()) {
      if (producerInfo.socketId === socket.id) {
        try { producerInfo.producer.close(); } catch {}
        room.producers.delete(producerId);
        io.to(roomId).emit('producerClosed', { producerId });
      }
    }

    for (const [consumerId, consumerInfo] of room.consumers.entries()) {
      if (consumerInfo.socketId === socket.id) {
        try { consumerInfo.consumer.close(); } catch {}
        room.consumers.delete(consumerId);
      }
    }
  }
}

export async function initSocketServer(httpServer) {
  await createWorkerPool();

  const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : '*';
  console.log('[Socket.IO] CORS origins:', corsOrigins);

  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
    allowEIO3: true,
    transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6, // 1MB
  });

  globalThis.__IO_INSTANCE = io;
  attachMonitoringSocket(io);
  console.log('[Socket.IO] Server initialized with WebSocket + polling transports');

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        console.warn('[Socket.IO] Auth rejected - no token provided');
        return next(new Error('Authentication error: token required'));
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
      if (expiresAt && expiresAt <= new Date()) {
        console.warn('[Socket.IO] Auth rejected - token expired');
        return next(new Error('Authentication error: token expired'));
      }
      socket.user = { ...payload, id: payload.id || payload._id, role: payload.role || 'student' };
      // Initialize heartbeat timestamp - this is critical!
      socket.data = socket.data || {};
      socket.data.lastHeartbeat = Date.now();
      socket.data.lastPingTs = Date.now();
      console.log('[Socket.IO] Auth success:', socket.id, 'user:', socket.user?.email || socket.user?.id, 'role:', socket.user?.role);
      next();
    } catch (err) {
      console.error('[Socket.IO] Auth error:', err?.message || err);
      next(new Error('Authentication error: ' + (err?.message || 'unknown')));
    }
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] ✅ Connected:', socket.id, 'user:', socket.user?.email || socket.user?.id, 'transport:', socket.conn?.transport?.name);

    const heartbeatInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - (socket.data.lastHeartbeat || Date.now());
      if (timeSinceLastHeartbeat > 90000) {
        console.warn('[Socket.IO] Heartbeat timeout:', socket.id, 'last heartbeat:', timeSinceLastHeartbeat + 'ms ago');
        socket.emit('authExpired', { reason: 'Heartbeat timeout (90s)' });
        socket.disconnect(true);
        return;
      }
      socket.data.lastPingTs = Date.now();
      socket.emit('ping', { ts: Date.now() });
    }, 30000);

    socket.on('pong', ({ ts }) => {
      socket.data.lastHeartbeat = Date.now();
      if (ts) {
        const latency = Date.now() - ts;
        if (latency > 5000) console.warn('[Socket.IO] High latency:', socket.id, latency + 'ms');
      }
    });

    socket.on('joinRoom', async ({ roomId, role }, cb) => {
      try {
        if (!roomId) throw new Error('roomId required');
        const allowedRole = socket.user?.role || role || 'student';
        if (role === 'teacher' && !['teacher', 'admin', 'superadmin'].includes(allowedRole)) {
          throw new Error('Only teachers/admins can join as teacher');
        }
        if (role === 'student' && allowedRole !== 'student') {
          throw new Error('Only students can join as student');
        }

        const room = await ensureRoom(roomId);
        const userId = socket.user?.id;
        const existingMember = room.members.get(userId);
        if (existingMember && existingMember.socketId !== socket.id) {
          io.to(existingMember.socketId).emit('duplicateConnection', { reason: 'Another session was opened' });
          io.sockets.sockets.get(existingMember.socketId)?.disconnect(true);
        }

        room.members.set(userId, { socketId: socket.id, role: allowedRole, joinedAt: Date.now() });
        socket.data.roomId = roomId;
        socket.join(roomId);
        
        // STAGE 4: Teacher Join Logging
        if (role === 'teacher') {
          console.log(`[STAGE 4] TEACHER JOINED:`);
          console.log(`[STAGE 4]   Room ID: ${roomId}`);
          console.log(`[STAGE 4]   User ID: ${userId}`);
          console.log(`[STAGE 4]   Role: teacher`);
          console.log(`[STAGE 4]   Room has ${room.producers.size} producers`);
          Array.from(room.producers.entries()).forEach(([pid, pdata]) => {
            console.log(`[STAGE 4]     Producer: id=${pid}, kind=${pdata.kind}, userId=${pdata.userId}`);
          });
        }
        
        cb({ ok: true, rtpCapabilities: room.router.rtpCapabilities, iceServers: getIceServers(), metrics: getMetrics(), recording: room.recording });
      } catch (err) {
        console.error('joinRoom error', err);
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('createWebRtcTransport', async ({ roomId }, cb) => {
      try {
        const room = await ensureRoom(roomId);
        const transport = await room.router.createWebRtcTransport({
          listenIps: getListenIps(),
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        });

        transport.on('icestatechange', (state) => {
          if (state === 'closed') console.warn('[Socket.IO] Transport ICE closed:', transport.id);
        });
        transport.on('dtlsstatechange', (state) => {
          if (state === 'closed') console.warn('[Socket.IO] Transport DTLS closed:', transport.id);
        });

        room.transports.set(transport.id, transport);
        if (!transport.iceParameters) {
          throw new Error('Transport iceParameters missing');
        }
        const params = {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates || [],
          dtlsParameters: transport.dtlsParameters,
          iceServers: getIceServers()
        };
        console.log('[Socket.IO] ✅ Transport created:', transport.id, 'with', params.iceCandidates.length, 'ICE candidates');
        cb({ ok: true, params });
      } catch (err) {
        console.error('[Socket.IO] createWebRtcTransport error:', err.message);
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('connectTransport', async ({ roomId, transportId, dtlsParameters }, cb) => {
      try {
        const room = await ensureRoom(roomId);
        const transport = room.transports.get(transportId);
        if (!transport) throw new Error('Transport not found');
        await transport.connect({ dtlsParameters });
        cb({ ok: true });
      } catch (err) {
        console.error('connectTransport error', err);
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('restartTransport', async ({ roomId, transportId }, cb) => {
      try {
        const room = await ensureRoom(roomId);
        const transport = room.transports.get(transportId);
        if (!transport) throw new Error('Transport not found');
        await transport.restartIce();
        cb({ ok: true, params: { iceParameters: transport.iceParameters, iceCandidates: transport.iceCandidates } });
      } catch (err) {
        console.error('restartTransport error', err);
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('produce', async ({ roomId, transportId, kind, rtpParameters, appData }, cb) => {
      try {
        console.log(`[Socket.IO] 🎙️ PRODUCE from student: kind=${kind}, user=${socket.user?.id}`);
        if (socket.user?.role !== 'student') throw new Error('Only students can produce streams');
        
        const room = await ensureRoom(roomId);
        const transport = room.transports.get(transportId);
        if (!transport) throw new Error('Transport not found');
        
        console.log(`[Socket.IO] 🎬 Creating producer...`);
        const producer = await transport.produce({ kind, rtpParameters, appData: { socketId: socket.id, userId: socket.user?.id, role: socket.user?.role, ...appData } });
        
        producer.on('transportclose', () => {
          console.log(`[Socket.IO] 🛑 Producer transport closed: ${producer.id}`);
          room.producers.delete(producer.id);
        });
        
        room.producers.set(producer.id, { producer, socketId: socket.id, userId: socket.user?.id, kind });
        console.log(`[Socket.IO] ✅ Producer created: ${producer.id}, broadcasting newProducer to room ${roomId}...`);
        
        socket.to(roomId).emit('newProducer', { producerId: producer.id, socketId: socket.id, kind, userId: socket.user?.id });
        console.log(`[Socket.IO] 📢 newProducer emitted to room`);
        
        cb({ ok: true, id: producer.id });
      } catch (err) {
        console.error('[Socket.IO] ❌ produce error', err.message);
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('consume', async ({ roomId, producerId, rtpCapabilities }, cb) => {
      try {
        console.log(`[Socket.IO] 🍽️ CONSUME from teacher: producerId=${producerId}`);
        if (!['teacher', 'admin', 'superadmin'].includes(socket.user?.role)) throw new Error('Only teachers/admins can consume streams');
        
        const room = await ensureRoom(roomId);
        const producerEntry = room.producers.get(producerId);
        if (!producerEntry) throw new Error('Producer not found');
        
        console.log(`[Socket.IO] ✅ Producer found, checking canConsume...`);
        const canConsume = room.router.canConsume({ producerId, rtpCapabilities });
        if (!canConsume) throw new Error('Cannot consume');

        let consumerTransport = Array.from(room.transports.values()).find((transport) => transport.appData?.ownerSocketId === socket.id && transport.appData?.type === 'consumer');
        if (!consumerTransport) {
          console.log(`[Socket.IO] 🏗️ Creating new consumer transport...`);
          consumerTransport = await room.router.createWebRtcTransport({ listenIps: getListenIps(), enableUdp: true, enableTcp: true, preferUdp: true });
          consumerTransport.appData = { ownerSocketId: socket.id, type: 'consumer' };
          room.transports.set(consumerTransport.id, consumerTransport);
          console.log(`[Socket.IO] ✅ Consumer transport created`);
        }

        console.log(`[Socket.IO] 📥 Creating consumer for producer ${producerId}...`);
        const consumer = await consumerTransport.consume({ producerId, rtpCapabilities, paused: false });
        console.log(`[Socket.IO] ✅ Consumer created: ${consumer.id}, kind: ${consumer.kind}`);
        
        consumer.on('transportclose', () => {
          console.log(`[Socket.IO] 🛑 Consumer transport closed: ${consumer.id}`);
          room.consumers.delete(consumer.id);
        });
        consumer.on('producerclose', () => {
          console.log(`[Socket.IO] 🛑 Producer closed for consumer: ${consumer.id}`);
          room.consumers.delete(consumer.id);
        });
        
        room.consumers.set(consumer.id, { consumer, socketId: socket.id, producerId });
        const transportParams = {
          id: consumerTransport.id,
          iceParameters: consumerTransport.iceParameters,
          iceCandidates: consumerTransport.iceCandidates || [],
          dtlsParameters: consumerTransport.dtlsParameters,
          iceServers: getIceServers()
        };
        console.log(`[Socket.IO] ✅ Sending consumer params to teacher with transport ${consumerTransport.id}`);
        cb({
          ok: true,
          params: {
            ...transportParams,
            consumerId: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused,
            transportId: consumerTransport.id
          }
        });
      } catch (err) {
        console.error('[Socket.IO] ❌ consume error', err.message);
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('getProducers', ({ roomId }, cb) => {
      try {
        const room = rooms.get(roomId);
        if (!room) return cb({ ok: true, producers: [] });
        
        // STAGE 3: Server room inspection on getProducers
        console.log(`[STAGE 3] GET PRODUCERS REQUEST:`);
        console.log(`[STAGE 3]   Room ID: ${roomId}`);
        console.log(`[STAGE 3]   Room exists: ${room ? 'YES' : 'NO'}`);
        console.log(`[STAGE 3]   Producers in room: ${room.producers.size}`);
        console.log(`[STAGE 3]   Room Members: ${room.members.size}`);
        
        const producers = Array.from(room.producers.entries()).map(([id, producerInfo]) => {
          console.log(`[STAGE 3]     Producer: id=${id}, kind=${producerInfo.kind}, userId=${producerInfo.userId}`);
          return { id, socketId: producerInfo.socketId, userId: producerInfo.userId, kind: producerInfo.kind };
        });
        
        cb({ ok: true, producers });
      } catch (err) {
        cb({ ok: false, error: err.message });
      }
    });

    socket.on('toggleRecording', async ({ roomId, enabled }, cb) => {
      try {
        if (!['teacher', 'admin', 'superadmin'].includes(socket.user?.role)) throw new Error('Only teachers/admins can toggle recording');
        const room = await ensureRoom(roomId);
        const nextEnabled = Boolean(enabled);
        room.recording = nextEnabled;
        const payload = buildRecordingSessionPayload({
          roomId,
          enabled: nextEnabled,
          startedAt: nextEnabled ? new Date().toISOString() : room.recordingSession?.startedAt,
          endedAt: nextEnabled ? null : new Date().toISOString(),
        });
        room.recordingSession = payload;

        const examSession = await ExamSession.findOne({ _id: roomId }).lean();
        if (examSession) {
          const doc = await RecordingSession.findOneAndUpdate(
            { roomId, sessionId: examSession._id, status: nextEnabled ? 'recording' : 'stopped' },
            {
              $set: {
                roomId,
                examId: examSession.examId,
                sessionId: examSession._id,
                status: nextEnabled ? 'recording' : 'stopped',
                recordingEnabled: nextEnabled,
                startedAt: nextEnabled ? new Date(payload.startedAt) : undefined,
                endedAt: nextEnabled ? undefined : new Date(payload.endedAt),
                createdBy: socket.user?.id,
                createdByRole: socket.user?.role,
                metadata: { roomId },
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          await ExamSession.findByIdAndUpdate(examSession._id, {
            recordingState: nextEnabled ? 'recording' : 'stopped',
            recordingSessionId: doc._id,
          });
        }

        io.to(roomId).emit('recordingStateChanged', { roomId, enabled: room.recording, recordingSession: payload });
        cb?.({ ok: true, enabled: room.recording, recordingSession: payload });
      } catch (err) {
        console.error('toggleRecording error', err);
        cb?.({ ok: false, error: err.message });
      }
    });

    socket.on('getMetrics', (cb) => {
      cb({ ok: true, metrics: getMetrics() });
    });

    socket.on('disconnect', () => {
      clearInterval(heartbeatInterval);
      cleanupSocket(socket, io);
      console.log('[Socket.IO] ⚠️  Disconnected:', socket.id, 'user:', socket.user?.email || socket.user?.id);
    });

    socket.on('error', (err) => {
      console.error('[Socket.IO] Socket error:', socket.id, err?.message || err);
    });
  });

  io.on('connect_error', (err) => {
    console.error('[Socket.IO] Server connection error:', err?.message || err);
  });

  console.log('[Socket.IO] ✅ Socket.IO + mediasoup signaling server ready');
}

export default initSocketServer;
