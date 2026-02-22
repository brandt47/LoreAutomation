const { chromium } = require('playwright');
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '..', 'storageState.json');

(async () => {
  console.log('='.repeat(60));
  console.log('  Square Login — Session Capture');
  console.log('='.repeat(60));
  console.log();
  console.log('A browser window will open to the Square login page.');
  console.log('Log in with your Square credentials and complete any 2FA.');
  console.log('The session will be saved automatically once you reach the Dashboard.');
  console.log();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://squareup.com/login');
  console.log('Browser opened — waiting for you to log in…');

  await page.waitForURL('**/dashboard/**', { timeout: 300_000 });

  console.log();
  console.log('Dashboard detected — saving session…');
  await context.storageState({ path: STORAGE_PATH });
  console.log(`Session saved to ${STORAGE_PATH}`);
  console.log('You can now run the automation with: npm start');

  await browser.close();
})();
