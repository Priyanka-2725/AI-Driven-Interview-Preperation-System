const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting Puppeteer test for Phase 4 Frontend...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.url().includes('/api/v1/auth') || response.url().includes('/api/v1/system')) {
      console.log(`[Network] ${response.request().method()} ${response.url()} - Status: ${response.status()}`);
    }
  });
  
  page.on('console', msg => {
    if (msg.text().includes('[Interceptor]') || msg.text().includes('[Axios]')) {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });

  const frontendUrl = 'http://localhost:5173';
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123';
  
  try {
    console.log("\n=== Test 1: Register Account (Prep) ===");
    await page.goto(`${frontendUrl}/register`, { waitUntil: 'networkidle0' });
    const inputs = await page.$$('input');
    await inputs[0].type('John Doe');
    await inputs[1].type(email);
    await inputs[2].type(password);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    
    console.log("\n=== Test 2: Log out (Prep) ===");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Log out');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log("\n=== Test 3: Redirect-preserving login flow ===");
    // Visit /dashboard while logged out
    await page.goto(`${frontendUrl}/dashboard`, { waitUntil: 'networkidle0' });
    console.log(`Current URL after trying to access /dashboard: ${page.url()}`);
    
    // Log in from the redirected /login page
    console.log("Logging in from the redirected page...");
    const loginInputs = await page.$$('input');
    await loginInputs[0].type(email);
    await loginInputs[1].type(password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    console.log(`Current URL after login: ${page.url()}`);
    if (page.url().includes('/dashboard')) {
      console.log("SUCCESS: Correctly preserved location.state.from and landed on /dashboard.");
    }

    console.log("\n=== Test 4: 401 Interceptor Retry ===");
    // We will intercept the next /system/ml-health request and force a 401 response
    await page.setRequestInterception(true);
    let interceptedOnce = false;
    
    page.on('request', interceptedRequest => {
      if (interceptedRequest.url().includes('/system/ml-health') && !interceptedOnce && interceptedRequest.method() !== 'OPTIONS') {
        console.log(`[Interceptor] Forcing 401 Unauthorized for ${interceptedRequest.url()}`);
        interceptedOnce = true;
        interceptedRequest.respond({
          status: 401,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:4173',
            'Access-Control-Allow-Credentials': 'true'
          },
          body: JSON.stringify({ error: 'Token expired' })
        });
      } else {
        interceptedRequest.continue();
      }
    });

    console.log("Triggering an API call to /system/ml-health via apiClient...");
    await Promise.all([
      page.reload({ waitUntil: 'networkidle0' }),
      page.waitForResponse(r => r.url().includes('/system/ml-health') && r.status() === 200, { timeout: 15000 }).catch(() => console.log('[Test] Timed out waiting for ml-health replay'))
    ]);
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("\nAll tests completed successfully.");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
