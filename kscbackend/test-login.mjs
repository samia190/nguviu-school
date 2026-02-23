import fs from 'fs';
const BASE = 'https://kangarugirlsschool.onrender.com';
const results = [];

const endpoints = [
  { url: '/api/health', method: 'GET' },
  { url: '/api/hero-content?page=home', method: 'GET' },
  { url: '/api/events', method: 'GET' },
  { url: '/api/student-life', method: 'GET' },
  { url: '/api/content/gallery', method: 'GET' },
  { url: '/api/auth/login', method: 'POST', body: { email: 'admin@example.com', password: 'kangaruAD567MIN@9812' } },
];

for (const ep of endpoints) {
  try {
    const opts = { method: ep.method, signal: AbortSignal.timeout(20000) };
    if (ep.body) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(ep.body);
    }
    const r = await fetch(BASE + ep.url, opts);
    const t = await r.text();
    results.push(`${r.status} ${ep.method} ${ep.url} => ${t.substring(0, 200)}`);
  } catch (e) {
    results.push(`ERR ${ep.method} ${ep.url} => ${e.message}`);
  }
}

fs.writeFileSync('test-results.txt', results.join('\n'));
console.log('Done — see test-results.txt');
process.exit(0);
