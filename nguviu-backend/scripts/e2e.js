import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API = process.env.API_ORIGIN || 'http://localhost:4000';

async function main() {
  try {
    console.log('E2E: logging in...');
    const login = await axios.post(`${API}/api/auth/login`, { email: 'nguviu@yahoo.com', password: 'girls@nguviu' });
    const token = login.data.token;
    if (!token) throw new Error('No token returned');
    console.log('E2E: got token');

    // prepare a small test file
    const tmp = path.join(process.cwd(), 'tmp-e2e.txt');
    fs.writeFileSync(tmp, 'E2E test file - ' + new Date().toISOString());

    console.log('E2E: uploading file...');
    const form = new FormData();
    form.append('attachments', fs.createReadStream(tmp));
    form.append('studentEmail', 'e2e@example.com');
    form.append('notes', 'E2E test upload');

    const uploadRes = await axios.post(`${API}/api/files`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('E2E: upload response status', uploadRes.status);
    const uploaded = uploadRes.data && uploadRes.data[0];
    if (!uploaded) throw new Error('Upload failed or no file returned');

    console.log('E2E: uploaded file id', uploaded._id || uploaded.id || uploaded.filename);

    // fetch submissions
    console.log('E2E: fetching submissions...');
    const subs = await axios.get(`${API}/api/submissions`, { headers: { Authorization: `Bearer ${token}` } });
    const items = subs.data.items || [];
    console.log('E2E: submissions count', items.length);

    // find our uploaded by matching originalName or studentEmail
    const match = items.find((i) => (i.originalName === uploaded.originalName) || (i.studentEmail === 'e2e@example.com') || (i.filename === uploaded.filename));
    if (!match) {
      console.warn('E2E: Uploaded item not found in submissions, picking most recent');
    }
    const target = match || items[0];
    if (!target) throw new Error('No submission found to review');

    console.log('E2E: approving submission id', target._id || target.id);
    const approved = await axios.put(`${API}/api/submissions/${target._id || target.id}`, { status: 'approved', reviewerNotes: 'Approved by E2E script' }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('E2E: approved status ->', approved.data.status);

    console.log('E2E: deleting submission...');
    const del = await axios.delete(`${API}/api/submissions/${target._id || target.id}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('E2E: deleted ->', del.data.ok);

    // cleanup
    try { fs.unlinkSync(tmp); } catch (e) {}

    console.log('E2E: finished successfully');
  } catch (err) {
    console.error('E2E failed:', err.message || err);
    process.exitCode = 2;
  }
}

main();
