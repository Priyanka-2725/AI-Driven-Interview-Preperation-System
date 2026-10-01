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
  
  console.log("Navigating to register...");
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
  
  const uniqueEmail = `test_${Date.now()}@test.com`;
  console.log("Registering as " + uniqueEmail);
  
  // Use page.evaluate to set input values to avoid issues with custom Input components
  await page.evaluate((email) => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.type === 'text' && input.name === '') input.value = 'Test User';
      if (input.type === 'email') input.value = email;
      if (input.type === 'password') input.value = 'password123';
      
      // Dispatch events so React picks it up
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, uniqueEmail);
  
  await new Promise(r => setTimeout(r, 500));
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  console.log("Navigating to /record...");
  await page.goto('http://localhost:5173/record', { waitUntil: 'networkidle2' });
  
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
    await page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle2' });
    console.log("Navigation complete to: " + page.url());
    await page.screenshot({ path: 'results-state.png' });
  } catch(e) {
    console.log("Navigation timeout or error: " + e.message);
  }

  await browser.close();
})();
