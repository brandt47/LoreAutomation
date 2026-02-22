const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { getNextWeekRange } = require('./dateUtils');
const {
  updateQuantity,
  openPreorderEditor,
  updatePreorderDates,
  updateCutoffDate,
  saveChanges,
  verifySaved,
} = require('./square');

// ── Configuration ──────────────────────────────────────────────────────────────
const TARGET_URL = 'https://app.squareup.com/dashboard/items/library/v1/XFMFVAPGJINMIF4SUKYUELQM/restaurants';
const STORAGE_PATH = path.join(__dirname, '..', 'storageState.json');
const RESTOCK_QTY = 100;
// ───────────────────────────────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(STORAGE_PATH)) {
    console.error('ERROR: storageState.json not found.');
    console.error('Run "npm run login" first to create an authenticated session.');
    process.exit(1);
  }

  const { cutoff, start, end } = getNextWeekRange();
  const fmt = (d) => d.toISOString().slice(0, 10);
  console.log(`Order cutoff : ${fmt(cutoff)} (Sat)`);
  console.log(`Pickup range : ${fmt(start)} (Wed) → ${fmt(end)} (Sat)`);
  console.log(`Restock qty  : ${RESTOCK_QTY}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_PATH,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      throw new Error(
        'Session expired — redirected to login page. ' +
        'Re-run "npm run login" locally and update the SQUARE_STORAGE_STATE_B64 secret.'
      );
    }

    console.log('Page loaded:', page.url());

    // 1. Reset stock quantity
    await updateQuantity(page, RESTOCK_QTY);
    console.log(`Quantity set to ${RESTOCK_QTY}.`);

    // 2. Update preorder settings
    await openPreorderEditor(page);
    console.log('Preorder editor opened.');

    await updatePreorderDates(page, start, end);
    console.log('Pickup date range filled.');

    await updateCutoffDate(page, cutoff);
    console.log('Order cutoff date filled.');

    await saveChanges(page);
    console.log('Save clicked.');

    await verifySaved(page);
    console.log('Success — quantity restocked and preorder dates updated.');
  } catch (err) {
    console.error('FAILED:', err.message);
    const screenshotPath = path.join(__dirname, '..', 'failure.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved to ${screenshotPath}`);
    console.error(`Current URL: ${page.url()}`);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
})();
