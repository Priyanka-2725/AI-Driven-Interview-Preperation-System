const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true, // Use new headless
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=d:\\AI-INTERVIEW-COACH\\ml-service\\tests\\fixtures\\speech.wav' // Or just default fake audio
    ]
  });
  
  const page = await browser.newPage();
  
  console.log("Navigating to setup...");
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'load' });
  
  const uniqueEmail = `test_${Date.now()}@test.com`;
  console.log("Registering via API as " + uniqueEmail);
  
  const token = await page.evaluate(async (email) => {
    const res = await fetch('http://127.0.0.1:5000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test User', email, password: 'password123' })
    });
    const data = await res.json();
    if (data.data && data.data.accessToken) {
      localStorage.setItem('auth_token', data.data.accessToken);
      return data.data.accessToken;
    }
    throw new Error(JSON.stringify(data));
  }, uniqueEmail);
  
  console.log("Token obtained and set in localStorage.");
  
  console.log("Navigating to /record...");
  await page.goto('http://127.0.0.1:4173/record', { waitUntil: 'load' });
  
  console.log("Requesting permissions...");
  // Click "Allow Camera & Microphone"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Allow Camera & Microphone'));
    if (btn) btn.click();
  });
  
  // Wait for Ready state
  await page.waitForSelector('button:has-text("Start Recording")', { timeout: 10000 }).catch(() => {});
  // Alternatively, just wait a bit and click start
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Starting recording...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Start Recording'));
    if (btn) btn.click();
  });
  
  console.log("Recording for 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Stopping recording...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Stop Recording'));
    if (btn) btn.click();
  });
  
  console.log("Waiting for submit button...");
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Submitting...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Submit for Analysis'));
    if (btn) btn.click();
  });
  
  console.log("Waiting for upload to finish (navigating to results)...");
  // We can take a screenshot of the loading UI
  await page.screenshot({ path: 'loading-state.png' });
  
  try {
    await page.waitForNavigation({ timeout: 15000, waitUntil: 'load' });
    console.log("Navigation complete to: " + page.url());
    await page.screenshot({ path: 'results-state.png' });
    
    // Check uploads directory
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const uploadsDir = 'd:\\\\AI-INTERVIEW-COACH\\\\backend\\\\uploads\\\\recordings';
    const files = fs.readdirSync(uploadsDir);
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (webmFile) {
      console.log("Found uploaded file: " + webmFile);
      const ffprobeCmd = `ffprobe -v error -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${path.join(uploadsDir, webmFile)}"`;
      const output = execSync(ffprobeCmd, { encoding: 'utf-8' });
      console.log("FFPROBE STREAMS (Should only be audio):");
      console.log(output.trim());
    }
  } catch(e) {
    console.log("Navigation timeout or error: " + e.message);
  }

  await browser.close();
})();
