import puppeteer from 'puppeteer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || `rec_test_${Date.now()}@example.com`;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password123!';
const TEST_USER_NAME = process.env.TEST_USER_NAME || 'Recorder Candidate';

async function testWeek2Recording() {
  console.log('====================================================');
  console.log('   TESTING WEEK 2 RECORDING PAGE (MANUAL / E2E)');
  console.log('====================================================');
  console.log(`  Config: FRONTEND_URL=${FRONTEND_URL}, BACKEND_URL=${BACKEND_URL}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log(`  [CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`  [PAGE ERROR]:`, err.toString()));
  page.on('response', async res => {
    if (res.url().includes('/api/v1/recordings')) {
      console.log(`  [API RESPONSE ${res.status()}]: ${res.url()}`);
      try {
        const body = await res.text();
        console.log(`  [API BODY]:`, body.substring(0, 300));
      } catch (e) {}
    }
  });

  const report = {};

  try {
    // 1. Register candidate
    console.log('\n[1] Registering candidate user...');
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', TEST_USER_NAME);
    await page.type('input[type="email"]', TEST_USER_EMAIL);
    await page.type('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    console.log(`  -> Auth State URL: ${page.url()}`);

    // 2. Navigate to /record
    console.log('\n[2] Navigating to /record...');
    await page.goto(`${FRONTEND_URL}/record`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 10000 });
    const initialText = await page.evaluate(() => document.body.innerText);
    report['page_loaded'] = initialText.includes('Interview Practice') ? 'PASS' : 'FAIL';
    console.log(`  -> /record loaded: ${report['page_loaded']}`);

    // 3. Request permissions (Allow Camera & Microphone)
    console.log('\n[3] Requesting media permissions...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Allow Camera'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.innerText.includes('Start Recording'));
    }, { timeout: 15000 });
    report['permissions_granted'] = 'PASS';
    console.log(`  -> Fake media permissions granted & video stream bound: PASS`);

    // 4. Start recording
    console.log('\n[4] Starting recording...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Recording'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.innerText.includes('Stop Recording'));
    }, { timeout: 10000 });
    console.log(`  -> Recording started. Recording for 3 seconds...`);
    await new Promise(r => setTimeout(r, 3500));
    report['record_started'] = 'PASS';

    // 5. Stop recording
    console.log('\n[5] Stopping recording...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Stop Recording'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.innerText.includes('Submit for Analysis') || b.innerText.includes('Discard'));
    }, { timeout: 10000 });
    report['record_stopped'] = 'PASS';
    console.log(`  -> Recording stopped. Preview audio ready: PASS`);

    // 6. Submit recording (upload)
    console.log('\n[6] Submitting recording to backend...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit for Analysis') || b.innerText.includes('Submit'));
      if (btn) btn.click();
    });

    // Wait for navigation to /results/:id
    console.log('  -> Waiting for upload and ML audio evaluation...');
    await page.waitForFunction(
      () => window.location.pathname.includes('/results/'),
      { timeout: 120000 }
    );
    console.log(`  -> Navigated to: ${page.url()}`);
    report['upload_success'] = 'PASS';

    // 7. Inspect results page
    console.log('\n[7] Verifying results page...');
    await page.waitForSelector('h1', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    const resultsContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Analysis Results') || text.includes('Interview Analysis') || text.includes('Fluency') || text.includes('Results'),
        hasFluency: text.includes('Fluency') || text.includes('WPM') || text.includes('Words Per Minute'),
        textSnippet: text.substring(0, 300)
      };
    });
    report['results_displayed'] = (resultsContent.hasTitle || resultsContent.hasFluency) ? 'PASS' : 'FAIL';
    console.log(`  -> Results content verified: ${report['results_displayed']}`);
    console.log(`  -> Snippet:`, resultsContent.textSnippet.replace(/\n+/g, ' '));

  } catch (err) {
    console.error('Recording test error:', err);
    report['error'] = err.message;
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('   WEEK 2 RECORDING VERIFICATION SUMMARY');
  console.log('====================================================');
  console.log(JSON.stringify(report, null, 2));
}

testWeek2Recording();
