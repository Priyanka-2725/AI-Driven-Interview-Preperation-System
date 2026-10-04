const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { execSync } = require('child_process');

async function runTests() {
  const api = axios.create({ baseURL: 'http://localhost:5000/api/v1', validateStatus: () => true });
  
  console.log('Registering users...');
  const u1 = { email: 'user1_' + Date.now() + '@test.com', password: 'password123A', fullName: 'User One' };
  const r1 = await api.post('/auth/register', u1);
  const token1 = r1.data.data.accessToken;
  const auth1 = { headers: { Authorization: 'Bearer ' + token1 } };
  
  const u2 = { email: 'user2_' + Date.now() + '@test.com', password: 'password123A', fullName: 'User Two' };
  const r2 = await api.post('/auth/register', u2);
  const token2 = r2.data.data.accessToken;
  const auth2 = { headers: { Authorization: 'Bearer ' + token2 } };
  
  console.log('\n--- TEST: Oversized (51MB) rejection ---');
  const largePath = path.join(__dirname, 'large.webm');
  if (!fs.existsSync(largePath)) {
    execSync(`fsutil file createnew "${largePath}" 53000000`);
  }
  const formLarge = new FormData();
  formLarge.append('audio', fs.createReadStream(largePath), { filename: 'large.webm', contentType: 'audio/webm' });
  formLarge.append('durationSeconds', '10');
  const rLarge = await api.post('/recordings', formLarge, { headers: { ...auth1.headers, ...formLarge.getHeaders() } });
  console.log('Response Status (51MB file):', rLarge.status);
  console.log('Response Body:', JSON.stringify(rLarge.data, null, 2));
  
  console.log('\n--- TEST: ffmpeg conversion failure (corrupt file) ---');
  const corruptPath = path.join(__dirname, 'corrupt.webm');
  fs.writeFileSync(corruptPath, 'This is not a real webm file, it is text.');
  const formCorrupt = new FormData();
  formCorrupt.append('audio', fs.createReadStream(corruptPath), { filename: 'corrupt.webm', contentType: 'audio/webm' });
  formCorrupt.append('durationSeconds', '10');
  const rCorrupt = await api.post('/recordings', formCorrupt, { headers: { ...auth1.headers, ...formCorrupt.getHeaders() } });
  console.log('Response Status:', rCorrupt.status);
  console.log('Response Body:', JSON.stringify(rCorrupt.data, null, 2));

  console.log('\n--- TEST: Overlong duration (>300s) rejection ---');
  // I will just use a tiny valid webm and pass 301 as durationSeconds. Wait, the backend uses ffmpeg duration!
  // It says `const conversionResult = await audioConversionService.convertToWav(req.file.path); durationSeconds = conversionResult.durationSeconds;`
  // So it gets the real duration.
  // To mock the backend check, I would need a real >300s audio. This is hard to do without ffmpeg.
  // Let me invoke ffmpeg through the backend's ffmpeg-static.
  const ffmpegStatic = require('ffmpeg-static');
  const overlongPath = path.join(__dirname, 'overlong.webm');
  try {
    execSync(`"${ffmpegStatic}" -f lavfi -i anullsrc=r=44100:cl=mono -t 301 -c:a libopus "${overlongPath}" -y`);
    const formOverlong = new FormData();
    formOverlong.append('audio', fs.createReadStream(overlongPath), { filename: 'overlong.webm', contentType: 'audio/webm' });
    const rOverlong = await api.post('/recordings', formOverlong, { headers: { ...auth1.headers, ...formOverlong.getHeaders() } });
    console.log('Response Status (301s file):', rOverlong.status);
    console.log('Response Body:', JSON.stringify(rOverlong.data, null, 2));
  } catch (e) {
    console.error('Error generating overlong:', e.message);
  }
  
  console.log('\n--- TEST: Valid Upload, Ownership, and DELETE ---');
  const validPath = path.join(__dirname, 'valid.webm');
  // generate a 1 second valid silent audio for ownership testing
  try {
    execSync(`"${ffmpegStatic}" -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -c:a libopus "${validPath}" -y`);
    const formValid = new FormData();
    formValid.append('audio', fs.createReadStream(validPath), { filename: 'valid.webm', contentType: 'audio/webm' });
    const rValid = await api.post('/recordings', formValid, { headers: { ...auth1.headers, ...formValid.getHeaders() } });
    
    // Now test GET as User 2
    const recId = rValid.data.data._id;
    console.log('\n--- TEST: Ownership - User 2 trying to GET User 1 recording ---');
    const rGetU2 = await api.get('/recordings/' + recId, auth2);
    console.log('User 2 GET Status:', rGetU2.status);
    console.log('User 2 GET Body:', JSON.stringify(rGetU2.data, null, 2));
    
    console.log('\n--- TEST: DELETE removes file and DB doc ---');
    const uploadDir = path.join(__dirname, '..', 'uploads', 'recordings');
    const filesBefore = fs.readdirSync(uploadDir);
    console.log('Files in uploads/ before DELETE:', filesBefore);
    const rDelete = await api.delete('/recordings/' + recId, auth1);
    console.log('User 1 DELETE Status:', rDelete.status);
    const filesAfter = fs.readdirSync(uploadDir);
    console.log('Files in uploads/ after DELETE:', filesAfter);
  } catch(e) {
    console.error('Error with valid test:', e.message);
  }

  // clean up
  if (fs.existsSync(corruptPath)) fs.unlinkSync(corruptPath);
  if (fs.existsSync(largePath)) fs.unlinkSync(largePath);
  if (fs.existsSync(overlongPath)) fs.unlinkSync(overlongPath);
  if (fs.existsSync(validPath)) fs.unlinkSync(validPath);
}

runTests().catch(console.error);
