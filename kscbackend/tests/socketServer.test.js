import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecordingSessionPayload, createRoomState, getIceServers, getListenIps } from '../socketServer.js';
import requireAuth from '../middleware/requireAuth.js';

test('getListenIps returns configured listen IPs', () => {
  process.env.MEDIASOUP_LISTEN_IPS = '192.168.1.10,10.0.0.5';
  assert.deepEqual(getListenIps(), [
    { ip: '192.168.1.10', announcedIp: undefined },
    { ip: '10.0.0.5', announcedIp: undefined },
  ]);
});

test('getIceServers parses STUN and TURN entries', () => {
  process.env.STUN_TURN_SERVERS = 'stun:stun.l.google.com:19302,turn:example.com|teacher|secret';
  process.env.PUBLIC_IP = '203.0.113.10';
  assert.deepEqual(getIceServers(), [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['turn:example.com'], username: 'teacher', credential: 'secret' },
  ]);
});

test('createRoomState initializes recording as disabled', () => {
  const room = createRoomState();
  assert.equal(room.recording, false);
  assert.ok(room.members instanceof Map);
  assert.ok(room.producers instanceof Map);
  assert.ok(room.consumers instanceof Map);
  assert.ok(room.transports instanceof Map);
});

test('buildRecordingSessionPayload marks active and stopped recording states', () => {
  const started = buildRecordingSessionPayload({ roomId: 'room-1', enabled: true, startedAt: '2026-01-01T00:00:00.000Z' });
  const stopped = buildRecordingSessionPayload({ roomId: 'room-1', enabled: false, startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:05:00.000Z' });

  assert.equal(started.status, 'recording');
  assert.equal(started.roomId, 'room-1');
  assert.equal(stopped.status, 'stopped');
  assert.equal(stopped.endedAt, '2026-01-01T00:05:00.000Z');
});

test('requireAuth default export is callable', () => {
  const req = { headers: {} };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  const next = () => { res.nextCalled = true; };

  requireAuth(req, res, next);

  assert.equal(res.code, 401);
  assert.equal(res.payload.error, 'Unauthorized');
  assert.equal(res.nextCalled, undefined);
});
