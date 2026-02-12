// tools/migrate-users.js
const fs = require('fs');
const path = require('path');

const usersFile = path.join(process.cwd(), 'data', 'users.json');
const raw = fs.existsSync(usersFile) ? fs.readFileSync(usersFile, 'utf8') : '[]';
const users = raw ? JSON.parse(raw) : [];

// Choose mode: 'keep' keeps current role; 'pending' forces pending for all
const mode = process.argv[2] || 'keep';

const migrated = users.map(u => {
  if (!u.requestedRole) u.requestedRole = u.role || 'user';
  if (mode === 'pending') u.role = 'pending';
  // ensure fields exist
  u.createdAt = u.createdAt || new Date().toISOString();
  return u;
});

fs.writeFileSync(usersFile, JSON.stringify(migrated, null, 2), 'utf8');
console.log('Migrated users file, mode=', mode);
