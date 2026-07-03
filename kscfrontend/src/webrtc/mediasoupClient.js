import io from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

let socket;
let device;
let producerTransport;
const consumerTransports = new Map();

export async function createSocket(token, serverOrigin) {
  if (socket && socket.connected) return socket;

  // Determine the socket server origin
  // Priority: explicit serverOrigin -> window.__SOCKET_ORIGIN -> window.__API_ORIGIN -> current origin
  let origin = serverOrigin;
  if (!origin || origin === '') {
    if (typeof window !== 'undefined') {
      origin = window.__SOCKET_ORIGIN || window.__API_ORIGIN || window.location.origin;
    } else {
      origin = '/';
    }
  }

  console.log('[Socket.IO] Connecting to origin:', origin);
  if (!token) {
    console.error('[Socket.IO] ❌ NO TOKEN PROVIDED - Connection will fail');
  }

  socket = io(origin, {
    auth: { token },
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 15000, // Increased timeout for slower networks
  });

  socket.on('connect', () => console.log('[Socket.IO] ✅ Connected'));
  socket.on('connect_error', (err) => {
    console.error('[Socket.IO] ❌ Connect error:', err.message || err);
    if (err.data?.content) console.error('[Socket.IO] Details:', err.data.content);
  });
  socket.on('disconnect', (reason) => console.warn('[Socket.IO] ⚠️  Disconnected:', reason));
  socket.on('authExpired', ({ reason }) => console.warn('[Socket.IO] Auth expired:', reason));
  socket.on('duplicateConnection', ({ reason }) => console.warn('[Socket.IO] Duplicate connection:', reason));
  socket.on('error', (err) => console.error('[Socket.IO] Socket error:', err));
  socket.on('ping', (data) => {
    // Respond to server heartbeat ping immediately
    socket.emit('pong', { ts: data?.ts || Date.now() });
  });
  
  // Wait for connection to establish or timeout
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn('[Socket.IO] ⚠️ Connection timeout (15s) - returning socket in connecting state');
      resolve(socket);
    }, 15000);
    
    if (socket.connected) {
      clearTimeout(timeout);
      console.log('[Socket.IO] Already connected');
      resolve(socket);
    } else {
      socket.once('connect', () => {
        clearTimeout(timeout);
        console.log('[Socket.IO] ✅ Socket connection established');
        resolve(socket);
      });
      socket.once('connect_error', (err) => {
        clearTimeout(timeout);
        console.error('[Socket.IO] Connection failed:', err.message);
        reject(err);
      });
    }
  });
}

export async function joinRoom(roomId, role) {
  return new Promise((resolve, reject) => {
    socket.emit('joinRoom', { roomId, role }, (resp) => {
      if (!resp || !resp.ok) return reject(resp?.error || 'joinRoom failed');
      resolve(resp);
    });
  });
}

export async function createDevice(rtpCapabilities) {
  if (!device) {
    device = new mediasoupClient.Device();
  }
  if (!device.loaded) {
    await device.load({ routerRtpCapabilities: rtpCapabilities });
  }
  return device;
}

export async function createSendTransport(roomId) {
  return new Promise((resolve, reject) => {
    console.log(`[mediasoupClient] 🚚 Requesting send transport for room ${roomId}`);
    socket.emit('createWebRtcTransport', { roomId }, async (resp) => {
      console.log(`[mediasoupClient] 📨 createWebRtcTransport response:`, resp);
      if (!resp || !resp.ok) {
        console.error('[mediasoupClient] ❌ createWebRtcTransport failed:', resp?.error);
        return reject(resp?.error || 'createWebRtcTransport failed');
      }
      const params = resp.params;
      if (!params?.iceParameters) {
        console.error('[mediasoupClient] ❌ Invalid transport params - missing iceParameters:', params);
        return reject('Invalid transport parameters - missing iceParameters');
      }
      console.log('[mediasoupClient] ✅ Transport params received:', { id: params.id, iceServers: params.iceServers?.length });
      try {
        producerTransport = device.createSendTransport(params);

        producerTransport.on('connect', async ({ dtlsParameters }, cb, errCb) => {
          console.log(`[mediasoupClient] 🔗 Transport connect event`);
          socket.emit('connectTransport', { roomId, transportId: producerTransport.id, dtlsParameters }, (res) => {
            if (res.ok) {
              console.log(`[mediasoupClient] ✅ Transport connected`);
              cb();
            } else {
              console.error(`[mediasoupClient] ❌ connectTransport failed:`, res.error);
              errCb(res.error || 'connectTransport failed');
            }
          });
        });

        producerTransport.on('produce', async (producerParameters, cb, errCb) => {
          console.log(`[mediasoupClient] 🎙️ Produce event for kind: ${producerParameters.kind}`);
          socket.emit('produce', { roomId, transportId: producerTransport.id, kind: producerParameters.kind, rtpParameters: producerParameters.rtpParameters }, (res) => {
            if (res.ok) {
              console.log(`[mediasoupClient] ✅ Producer created on server, id: ${res.id}`);
              // STAGE 2: Student Producer (emit from server side)
              console.log(`[STAGE 2] PRODUCER CREATED: id=${res.id}, kind=${producerParameters.kind}, transportId=${producerTransport.id}, roomId=${roomId}`);
              cb({ id: res.id });
            } else {
              console.error(`[mediasoupClient] ❌ produce failed:`, res.error);
              errCb(res.error || 'produce failed');
            }
          });
        });

        resolve(producerTransport);
      } catch (err) {
        console.error('[mediasoupClient] ❌ Failed to create send transport:', err.message);
        reject(err);
      }
    });
  });
}

// Produce a track (camera / microphone). Returns the produced id and local producer.
export async function produce({ kind = 'video', track, encodings = undefined, codecOptions = undefined, appData = {} } = {}) {
  if (!producerTransport) throw new Error('Producer transport not initialized');

  // mediasoup-client's produce will trigger the 'produce' event on the transport
  // which our server handler uses to create a server-side producer and return an id.
  const producer = await producerTransport.produce({ track, encodings, codecOptions, appData, kind });

  // producer.id is the local id; server id will be returned via the transport 'produce' callback
  // but our transport setup uses the 'produce' observer to return server id inside the callback
  return { id: producer.id, kind, producer };
}

export async function getProducers(roomId) {
  return new Promise((resolve) => {
    console.log(`[mediasoupClient] 📊 Requesting producers for room ${roomId}`);
    socket.emit('getProducers', { roomId }, (resp) => {
      console.log(`[mediasoupClient] 📊 getProducers response:`, resp);
      resolve(resp);
    });
  });
}

export async function consume(roomId, producerId) {
  return new Promise((resolve, reject) => {
    console.log(`[mediasoupClient] 🍽️ Requesting consume for producer ${producerId}`);
    socket.emit('consume', { roomId, producerId, rtpCapabilities: device.rtpCapabilities }, (resp) => {
      console.log(`[mediasoupClient] 📨 consume response:`, resp);
      if (!resp || !resp.ok) {
        console.error('[mediasoupClient] ❌ consume failed:', resp?.error);
        return reject(resp?.error || 'consume failed');
      }
      const params = resp.params || {};
      const transportParams = {
        id: params.transportId || params.id,
        iceParameters: params.iceParameters,
        iceCandidates: params.iceCandidates || [],
        dtlsParameters: params.dtlsParameters,
        iceServers: params.iceServers || []
      };
      if (!transportParams.iceParameters) {
        console.error('[mediasoupClient] ❌ Invalid consumer params - missing iceParameters:', params);
        return reject('Invalid consumer parameters - missing iceParameters');
      }
      try {
        console.log(`[mediasoupClient] 🎧 Creating recv transport...`, transportParams);
        let transport = consumerTransports.get(transportParams.id);
        if (!transport) {
          transport = device.createRecvTransport(transportParams);
          console.log(`[mediasoupClient] ✅ Recv transport created`);
          transport.on('connect', ({ dtlsParameters }, cb, errCb) => {
            console.log(`[mediasoupClient] 🔗 Consumer transport connect`);
            socket.emit('connectTransport', { roomId, transportId: transport.id, dtlsParameters }, (res) => {
              if (res.ok) {
                console.log(`[mediasoupClient] ✅ Consumer transport connected`);
                cb();
              } else {
                console.error(`[mediasoupClient] ❌ Consumer connectTransport failed:`, res.error);
                errCb(res.error || 'connectTransport failed');
              }
            });
          });
          consumerTransports.set(transport.id, transport);
        }

        (async () => {
          try {
            console.log(`[mediasoupClient] 📥 Creating consumer...`);
            const consumer = await transport.consume({ id: params.consumerId || params.id, producerId: params.producerId, kind: params.kind, rtpParameters: params.rtpParameters });
            if (consumer.track) {
              console.log(`[mediasoupClient] ✅ Consumer created, initial track kind: ${consumer.track?.kind}`);
              // STAGE 5: Consumer Creation
              console.log(`[STAGE 5] CONSUMER CREATED: id=${consumer.id}, producerId=${params.producerId}, kind=${consumer.kind}, paused=${consumer.paused}, track.readyState=${consumer.track.readyState}, track.enabled=${consumer.track.enabled}`);
              console.log(`[STAGE 5] TRANSPORT: id=${transport.id}, state=${transport.closed ? 'CLOSED' : 'OPEN'}`);
            } else {
              console.log(`[mediasoupClient] ⏳ Consumer created; waiting for remote track...`);
              console.log(`[STAGE 5] CONSUMER CREATED (NO TRACK YET): id=${consumer.id}, producerId=${params.producerId}, kind=${consumer.kind}, paused=${consumer.paused}`);
            }
            consumer.on('track', (track) => {
              console.log(`[mediasoupClient] 🎬 Remote track arrived for consumer ${consumer.id}: ${track?.kind}`);
              console.log(`[STAGE 5] REMOTE TRACK ARRIVED: id=${track.id}, kind=${track.kind}, readyState=${track.readyState}, enabled=${track.enabled}`);
            });
            await consumer.resume();
            resolve({ consumer, transport });
          } catch (err) {
            console.error(`[mediasoupClient] ❌ Failed to create consumer:`, err);
            reject(err);
          }
        })();
      } catch (err) {
        reject(err);
      }
    });
  });
}

export function getSocket() { return socket; }
