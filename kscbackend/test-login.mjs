import fs from 'fs';
const BASE = 'https://kangarugirlsschool.onrender.com';
const results = [];

// Test hero POST (no auth needed)
try {
  const imgPath = '../kscfrontend/public/images/DSC_5353.jpg';
  const imgBuf = fs.readFileSync(imgPath);
  const blob = new Blob([imgBuf], { type: 'image/jpeg' });
  
  const form = new FormData();
  form.append('media', blob, 'DSC_5353.jpg');
  form.append('type', 'slide');
  form.append('page', 'home');
  form.append('title', 'Test Slide');
  form.append('description', 'Test');
  form.append('displayOrder', '0');

  const r = await fetch(BASE + '/api/hero-content', { method: 'POST', body: form });
  const t = await r.text();
  results.push(`hero POST: ${r.status} => ${t.substring(0, 300)}`);
} catch (e) {
  results.push(`hero POST: ERROR => ${e.message}`);
}

// Test gallery POST (no auth)
try {
  const r = await fetch(BASE + '/api/content/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Gallery', body: 'Test' }),
  });
  const t = await r.text();
  results.push(`gallery POST: ${r.status} => ${t.substring(0, 300)}`);
} catch (e) {
  results.push(`gallery POST: ERROR => ${e.message}`);
}

// Test login with more detail
try {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'kangaruAD567MIN@9812' }),
  });
  const t = await r.text();
  results.push(`login: ${r.status} => ${t}`);
} catch (e) {
  results.push(`login: ERROR => ${e.message}`);
}

fs.writeFileSync('test-results.txt', results.join('\n\n'));
console.log('Done — see test-results.txt');
process.exit(0);
