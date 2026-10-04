const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testCorrupt() {
  const api = axios.create({ baseURL: 'http://localhost:5000/api/v1', validateStatus: () => true });
  
  const u1 = { email: 'user1_' + Date.now() + '@test.com', password: 'password123A', fullName: 'User One' };
  const r1 = await api.post('/auth/register', u1);
  const token1 = r1.data.data.accessToken;
  const auth1 = { headers: { Authorization: 'Bearer ' + token1 } };
  
  console.log('--- TEST: ffmpeg conversion failure (corrupt file) ---');
  const corruptPath = path.join(__dirname, 'corrupt.webm');
  fs.writeFileSync(corruptPath, 'This is not a real webm file, it is text.');
  const formCorrupt = new FormData();
  formCorrupt.append('audio', fs.createReadStream(corruptPath), { filename: 'corrupt.webm', contentType: 'audio/webm' });
  const rCorrupt = await api.post('/recordings', formCorrupt, { headers: { ...auth1.headers, ...formCorrupt.getHeaders() } });
  console.log('Response Status:', rCorrupt.status);
  console.log('Response Body:', JSON.stringify(rCorrupt.data, null, 2));

  if (fs.existsSync(corruptPath)) fs.unlinkSync(corruptPath);
}

testCorrupt().catch(console.error);
