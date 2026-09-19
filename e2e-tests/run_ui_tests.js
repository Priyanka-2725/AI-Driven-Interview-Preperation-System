import puppeteer from 'puppeteer';

async function testResponsiveLayout(page, path, name) {
  const widths = [360, 768, 1440];
  console.log(`\nTesting Responsive Layout for ${name} (${path})`);
  
  for (const width of widths) {
    await page.setViewport({ width, height: 900 });
    await page.goto(`http://localhost:5174${path}`, { waitUntil: 'networkidle2', timeout: 120000 });
    
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasOverflow) {
      console.log(`[FAIL] ${name} at ${width}px has horizontal overflow`);
    } else {
      console.log(`[PASS] ${name} at ${width}px fits within viewport`);
    }
  }
}

async function testKeyboardAccessibility(page, path, name) {
  console.log(`\nTesting Keyboard Accessibility for ${name} (${path})`);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:5174${path}`, { waitUntil: 'networkidle2', timeout: 120000 });
  
  // Tab through until we loop or hit max
  let tabCount = 0;
  let prevActive = null;
  const maxTabs = 20;
  
  while (tabCount < maxTabs) {
    await page.keyboard.press('Tab');
    tabCount++;
    
    const elementState = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      
      const style = window.getComputedStyle(el);
      // Tailwind's ring uses box-shadow, check for either outline or box-shadow
      const hasFocusRing = style.outlineStyle !== 'none' || (style.boxShadow && style.boxShadow !== 'none');
      
      return {
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        text: el.innerText.substring(0, 20) || el.value || el.name || el.id || 'unknown',
        hasFocusRing
      };
    });
    
    if (!elementState) break; // Reached end of document or no focusable elements
    
    if (elementState.hasFocusRing) {
      console.log(`[PASS] Focus on <${elementState.tag} type="${elementState.type}"> "${elementState.text.replace(/\n/g, ' ')}" -> Visible focus ring detected`);
    } else {
      console.log(`[FAIL] Focus on <${elementState.tag} type="${elementState.type}"> "${elementState.text.replace(/\n/g, ' ')}" -> No focus ring detected`);
    }
    
    if (prevActive === elementState.text) {
      break; // Stuck on same element
    }
    prevActive = elementState.text;
  }
}

async function testDashboardAccessibility(page) {
  console.log(`\nTesting Keyboard Accessibility for Dashboard (/dashboard)`);
  await page.setViewport({ width: 1440, height: 900 });
  
  // First, we need to login to reach the dashboard
  await page.goto(`http://localhost:5174/login`, { waitUntil: 'networkidle2', timeout: 120000 });
  
  // Type in dummy credentials and login (this uses the mock backend or real backend if registered)
  // Assuming test@test.com / password123 is registered, or we just register a fresh one.
  // We'll just register a fresh one to be safe.
  await page.goto(`http://localhost:5174/register`, { waitUntil: 'networkidle2', timeout: 120000 });
  const uniqueEmail = `test_${Date.now()}@test.com`;
  await page.type('input[type="text"]', 'Test User');
  await page.type('input[type="email"]', uniqueEmail);
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);

  // Now we are on dashboard
  let tabCount = 0;
  let prevActive = null;
  const maxTabs = 30;
  
  while (tabCount < maxTabs) {
    await page.keyboard.press('Tab');
    tabCount++;
    
    const elementState = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      
      const style = window.getComputedStyle(el);
      const hasFocusRing = style.outlineStyle !== 'none' || (style.boxShadow && style.boxShadow !== 'none');
      
      return {
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        text: (el.innerText || el.value || el.name || el.id || 'unknown').substring(0, 30).replace(/\n/g, ' '),
        hasFocusRing
      };
    });
    
    if (!elementState) break;
    
    if (elementState.hasFocusRing) {
      console.log(`[PASS] Focus on <${elementState.tag} type="${elementState.type}"> "${elementState.text}" -> Visible focus ring`);
    } else {
      console.log(`[FAIL] Focus on <${elementState.tag} type="${elementState.type}"> "${elementState.text}" -> No focus ring detected`);
    }
    
    if (prevActive === elementState.text) break;
    prevActive = elementState.text;
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    
    await testResponsiveLayout(page, '/', 'Landing Page');
    await testResponsiveLayout(page, '/login', 'Login Page');
    await testResponsiveLayout(page, '/register', 'Register Page');
    
    await testKeyboardAccessibility(page, '/login', 'Login Page');
    await testKeyboardAccessibility(page, '/register', 'Register Page');
    
    // Auth flow and dashboard
    await testDashboardAccessibility(page);
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
