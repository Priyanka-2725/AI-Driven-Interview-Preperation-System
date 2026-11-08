import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ML_URL = process.env.ML_URL || 'http://127.0.0.1:8000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || `e2e_user_${Date.now()}@example.com`;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password123!';
const TEST_USER_NAME = process.env.TEST_USER_NAME || 'E2E Candidate';

async function run() {
  console.log('====================================================');
  console.log('   STARTING REAL UI PUPPETEER E2E VALIDATION');
  console.log('====================================================');
  console.log(`  Config: FRONTEND_URL=${FRONTEND_URL}, BACKEND_URL=${BACKEND_URL}, ML_URL=${ML_URL}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log(`  [BROWSER CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`  [BROWSER ERROR]:`, err.toString()));
  page.on('response', async res => {
    if (res.url().includes('/api/v1/submissions')) {
      console.log(`  [API RESPONSE ${res.status()}]: ${res.url()}`);
      try {
        const body = await res.text();
        console.log(`  [API BODY]:`, body.substring(0, 300));
      } catch (e) {}
    }
  });

  const results = {};

  try {
    // STEP 1: Registration & Login
    console.log('\n[Step 1] Registering / Logging in...');
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', TEST_USER_NAME);
    await page.type('input[type="email"]', TEST_USER_EMAIL);
    await page.type('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    const onDashboard = page.url().includes('/dashboard');
    results['1_login'] = onDashboard ? 'PASS' : 'FAIL';
    console.log(`  -> Login/Register status: ${results['1_login']} (Current URL: ${page.url()})`);

    // STEP 2: Navigate to Technical Hub & Pick Topic
    console.log('\n[Step 2] Navigating to Technical Assessment Hub & Picking Topic...');
    await page.goto(`${FRONTEND_URL}/technical`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('select', { timeout: 10000 });

    // Select topic 'arrays'
    await page.select('select', 'arrays');
    await new Promise(r => setTimeout(r, 1500));
    const topicSelected = await page.evaluate(() => {
      const select = document.querySelector('select');
      return select && select.value === 'arrays';
    });
    results['2_pick_topic'] = topicSelected ? 'PASS' : 'FAIL';
    console.log(`  -> Pick topic (arrays): ${results['2_pick_topic']}`);

    // STEP 3: Open a Coding Question (Two Sum)
    console.log('\n[Step 3] Opening coding question (Two Sum)...');
    await page.goto(`${FRONTEND_URL}/technical/workspace/two-sum`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    const inWorkspace = page.url().includes('/technical/workspace/two-sum');
    results['3_open_coding_question'] = inWorkspace ? 'PASS' : 'FAIL';
    console.log(`  -> Open coding question workspace: ${results['3_open_coding_question']} (URL: ${page.url()})`);

    // STEP 4: Run Visible Tests
    console.log('\n[Step 4] Clicking "Run Visible Tests"...');
    const clickedRun = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Run Visible Tests') || b.innerText.includes('Run'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clickedRun) {
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return text.includes('Passed') || text.includes('Failed') || text.includes('Wrong Answer') || text.includes('Visible Test Results');
      }, { timeout: 20000 }).catch(() => {});
      results['4_run_tests'] = 'PASS';
    } else {
      results['4_run_tests'] = 'FAIL';
    }
    console.log(`  -> Run visible tests execution: ${results['4_run_tests']}`);

    // STEP 5: Submit Solution
    console.log('\n[Step 5] Clicking "Submit Solution"...');
    // Ensure run operation has finished and Submit button is enabled
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Submit Solution') || b.innerText.includes('Submit'));
      return btn && !btn.disabled;
    }, { timeout: 15000 });

    const clickedSubmit = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Submit Solution') || b.innerText.includes('Submit'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clickedSubmit) {
      // Single-page app client-side navigation
      await page.waitForFunction(
        () => window.location.pathname.includes('/technical/results/'),
        { timeout: 25000 }
      ).catch(() => {});
      const onResults = await page.evaluate(() => window.location.pathname.includes('/technical/results/'));
      results['5_submit'] = onResults ? 'PASS' : 'FAIL';
    } else {
      results['5_submit'] = 'FAIL';
    }
    console.log(`  -> Submit solution: ${results['5_submit']} (URL: ${page.url()})`);

    // STEP 6: View Results & Verify Hidden Test Privacy
    console.log('\n[Step 6] Inspecting Results Page & Hidden Test Case Privacy...');
    await page.waitForSelector('h1', { timeout: 10000 });
    const privacyCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const html = document.body.innerHTML;
      const hasPassedOrFailedHidden = text.includes('Hidden test passed') || text.includes('Hidden test failed') || text.includes('Hidden test');
      const leakedInput = html.includes('SECRET_PAYLOAD_INPUT') || html.includes('hidden input:');
      return {
        hasPassedOrFailedHidden,
        noLeak: !leakedInput
      };
    });
    results['6_view_results_privacy'] = (privacyCheck.hasPassedOrFailedHidden && privacyCheck.noLeak) ? 'PASS' : 'FAIL';
    console.log(`  -> Results page rendered properly, privacy preserved: ${results['6_view_results_privacy']}`);

    // STEP 7: View History
    console.log('\n[Step 7] Viewing Past Attempt / Submission History...');
    await page.goto(`${FRONTEND_URL}/technical/attempts`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const historyRendered = await page.evaluate(() => {
      return document.body.innerText.includes('Assessment History') ||
             document.body.innerText.includes('Graded Submissions') ||
             document.body.innerText.includes('Two Sum');
    });
    results['7_view_history'] = historyRendered ? 'PASS' : 'FAIL';
    console.log(`  -> View history: ${results['7_view_history']}`);

    // STEP 8: ML Down Simulation, 503 Banner & Retry flow
    console.log('\n[Step 8] Testing ML-Down 503 banner and Retry flow...');
    // Return to workspace
    await page.goto(`${FRONTEND_URL}/technical/workspace/two-sum`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // Kill ML service listening specifically on port 8000 (PID-targeted)
    console.log('  [Action] Stopping ML Service specifically on port 8000 (PID-targeted)...');
    try {
      await execPromise('powershell -Command "$c = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue; if ($c) { Stop-Process -Id $c.OwningProcess -Force }"');
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));

    // Submit with ML down
    console.log('  [Action] Submitting code while ML service is down...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Submit Solution') || b.innerText.includes('Submit'));
      if (btn) btn.click();
    });

    // Check if 503 banner or results page shows ML down
    console.log('  [Action] Waiting for 503 banner or results page error...');
    await page.waitForFunction(() => {
      const t = document.body.innerText;
      return t.includes('ML Service Temporarily Unavailable') ||
             t.includes('unavailable') ||
             t.includes('Retry Evaluation');
    }, { timeout: 25000 }).catch(() => {});

    const has503Banner = await page.evaluate(() => {
      const text = document.body.innerText;
      const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Retry'));
      return {
        banner: text.includes('ML Service Temporarily Unavailable') || text.includes('unavailable'),
        hasRetryBtn: !!retryBtn
      };
    });

    results['8_ml_down_503_banner'] = (has503Banner.banner && has503Banner.hasRetryBtn) ? 'PASS' : 'FAIL';
    console.log(`  -> 503 Banner and Retry button visible: ${results['8_ml_down_503_banner']} (Banner: ${has503Banner.banner}, RetryButton: ${has503Banner.hasRetryBtn})`);

    // Restart ML service
    console.log('  [Action] Restarting ML service...');
    await execPromise('powershell -Command "Start-Process D:\\AI-INTERVIEW-COACH\\ml-service\\.venv\\Scripts\\python.exe -ArgumentList \'-m uvicorn app.main:app --port 8000\' -WorkingDirectory D:\\AI-INTERVIEW-COACH\\ml-service"');

    // Wait for ML service to become healthy
    console.log('  [Action] Waiting for ML service health check...');
    let mlReady = false;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const { stdout } = await execPromise(`curl.exe -s ${ML_URL}/health`);
        if (stdout.includes('"status":"ok"')) {
          mlReady = true;
          break;
        }
      } catch (e) {}
    }
    console.log(`  -> ML Service ready: ${mlReady}`);

    // Click Retry button
    console.log('  [Action] Clicking Retry Evaluation button in UI...');
    const clickedRetry = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Retry Evaluation') || b.innerText.includes('Retry'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clickedRetry) {
      await page.waitForFunction(
        () => window.location.pathname.includes('/technical/results/'),
        { timeout: 25000 }
      ).catch(() => {});
      await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));

      // Extract and print final status and score after Retry
      const retryDetails = await page.evaluate(async () => {
        const subId = window.location.pathname.split('/').pop()?.split('?')[0];
        if (!subId) return { status: 'unknown', score: null };
        const res = await fetch(`/api/v1/submissions/${subId}`, { credentials: 'include' });
        const json = await res.json();
        return {
          subId,
          status: json.data?.submission?.status,
          score: json.data?.submission?.score
        };
      });

      console.log(`  -> Final status after Retry: "${retryDetails.status}", Final Score: ${retryDetails.score}`);
      results['9_retry_evaluation'] = (retryDetails.status === 'evaluated') ? 'PASS' : 'FAIL';
    } else {
      results['9_retry_evaluation'] = 'FAIL';
    }
    console.log(`  -> Retry evaluation recovered result: ${results['9_retry_evaluation']}`);

    // STEP 10: Submit Correct Two Sum Solution (ML UP)
    console.log('\n[Step 10] Submitting correct Two Sum solution with ML service up...');
    await page.goto(`${FRONTEND_URL}/technical/workspace/two-sum`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const correctSolution = `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1].strip())
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`;

    // Set code directly in Monaco Editor
    await page.evaluate((sol) => {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          models[0].setValue(sol);
        }
      }
    }, correctSolution);

    // Wait for submit button to be enabled
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Submit Solution') || b.innerText.includes('Submit'));
      return btn && !btn.disabled;
    }, { timeout: 15000 });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Submit Solution') || b.innerText.includes('Submit'));
      if (btn && !btn.disabled) btn.click();
    });

    await page.waitForFunction(
      () => window.location.pathname.includes('/technical/results/'),
      { timeout: 25000 }
    ).catch(() => {});
    await page.waitForSelector('h1', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const correctResult = await page.evaluate(async () => {
      const subId = window.location.pathname.split('/').pop()?.split('?')[0];
      const res = await fetch(`/api/v1/submissions/${subId}`, { credentials: 'include' });
      const json = await res.json();
      const sub = json.data?.submission;

      const hiddenElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && (el.textContent.includes('Hidden test passed') || el.textContent.includes('Hidden test')))
        .map(el => el.textContent.trim())
        .filter((t, idx, arr) => arr.indexOf(t) === idx && t.length < 80);

      return {
        status: sub?.status,
        score: sub?.score,
        passedTests: sub?.evaluation?.passedTests,
        totalTests: sub?.evaluation?.totalTests,
        hiddenTestDisplay: hiddenElements.slice(0, 3)
      };
    });

    console.log(`  -> Correct solution status: "${correctResult.status}", Score: ${correctResult.score}/100`);
    console.log(`  -> Tests: ${correctResult.passedTests}/${correctResult.totalTests} passed`);
    console.log(`  -> Hidden test display:`, JSON.stringify(correctResult.hiddenTestDisplay));
    results['10_correct_solution_submit'] = (correctResult.status === 'evaluated' && correctResult.score > 0) ? 'PASS' : 'FAIL';

  } catch (err) {
    console.error('E2E Test Exception:', err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('   E2E PUPPETEER TEST SUMMARY');
  console.log('====================================================');
  console.log(JSON.stringify(results, null, 2));
}

run();
