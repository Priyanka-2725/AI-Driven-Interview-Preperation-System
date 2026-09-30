import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function test() {
  try {
    const email = `test${Date.now()}@example.com`;
    const password = 'Password123!';
    await axios.post('http://localhost:5000/api/v1/auth/register', { fullName: 'Test User', email, password });
    
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', { email, password });
    const token = loginRes.data.data.accessToken;

    const form = new FormData();
    form.append('audio', fs.createReadStream('test.webm'), { contentType: 'audio/webm' });

    console.log('Uploading file...');
    const uploadRes = await axios.post('http://localhost:5000/api/v1/recordings', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Upload success:', JSON.stringify(uploadRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response ? JSON.stringify(err.response.data, null, 2) : err);
  }
}
test();
