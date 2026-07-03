import os from 'os';

// Note: mediasoup is an optional dependency for real-time features. Import
// dynamically so the server can still start when the package isn't installed.

let workerPool = [];

export async function createWorkerPool() {
  if (workerPool.length > 0) return workerPool;
  // Try dynamic import; if mediasoup is not installed, return an empty pool
  // and allow the rest of the server to run without real-time capabilities.
  let mediasoupLib;
  try {
    const mod = await import('mediasoup');
    mediasoupLib = mod.default || mod;
  } catch (err) {
    console.warn('mediasoup not available: real-time features disabled.');
    return [];
  }

  const cpus = Math.max(1, os.cpus().length - 1);
  for (let i = 0; i < cpus; i++) {
    const worker = await mediasoupLib.createWorker({
      rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '20000', 10),
      rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '20100', 10),
      logLevel: process.env.MEDIASOUP_LOG_LEVEL || 'ERROR',
      logTags: [ 'ice', 'dtls', 'rtp', 'srtp', 'rtcp' ],
    });

    worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds...');
      setTimeout(() => process.exit(1), 2000);
    });

    workerPool.push(worker);
  }

  return workerPool;
}

export function getWorker() {
  if (!workerPool || workerPool.length === 0) return null;
  // simple round-robin
  const worker = workerPool.shift();
  workerPool.push(worker);
  return worker;
}
