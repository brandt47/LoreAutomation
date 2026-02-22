/**
 * Square Dashboard UI interaction helpers.
 *
 * Selectors were discovered via Playwright Codegen against the real page.
 * The calendar picker is a Square Market component; navigation uses the
 * forward-arrow market-button to move month-by-month.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ── Calendar helpers ────────────────────────────────────────────────────────────

async function clickCalendarForward(page) {
  await page.locator('market-button:nth-child(3) > .market-icon > svg').first().click();
  await page.waitForTimeout(300);
}

async function navigateCalendarToMonth(page, targetDate) {
  const label = `${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

  for (let i = 0; i < 12; i++) {
    const visible = await page.getByText(label).isVisible().catch(() => false);
    if (visible) return;
    await clickCalendarForward(page);
  }
  throw new Error(`Could not navigate calendar to ${label}`);
}

async function selectDayButton(page, day) {
  await page.getByRole('button', { name: String(day), exact: true }).click();
}

// ── Quantity ─────────────────────────────────────────────────────────────────────

/**
 * Reset the stock quantity for the item variation.
 *
 * The Ember component IDs (e.g. #ember2127) are dynamic. The stock "Edit"
 * button is the 4th exact-match Edit button on the page (nth(3)), located
 * in the Availability section. We scroll it into view first because the
 * edit sheet is a scrollable panel.
 */
async function updateQuantity(page, quantity) {
  const editBtn = page.getByRole('button', { name: 'Edit', exact: true }).nth(3);
  await editBtn.scrollIntoViewIfNeeded();
  await editBtn.click();

  const qtyInput = page.getByLabel('Quantity', { exact: true }).getByPlaceholder('Quantity');
  await qtyInput.click({ clickCount: 3 });
  await qtyInput.fill(String(quantity));
  await qtyInput.press('Enter');

  await page.getByRole('button', { name: 'Done' }).click();
}

// ── Preorder settings ────────────────────────────────────────────────────────────

async function openPreorderEditor(page) {
  const btn = page.getByRole('button', { name: 'Edit preorder settings' });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.getByRole('textbox', { name: 'Date range' })
    .waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Pick start and end dates in the "Date range" calendar.
 *
 * @param {import('playwright').Page} page
 * @param {Date} startDate
 * @param {Date} endDate
 */
async function updatePreorderDates(page, startDate, endDate) {
  await page.getByRole('textbox', { name: 'Date range' }).click();

  await navigateCalendarToMonth(page, startDate);
  await selectDayButton(page, startDate.getDate());

  const crossesMonth =
    endDate.getMonth() !== startDate.getMonth() ||
    endDate.getFullYear() !== startDate.getFullYear();
  if (crossesMonth) {
    await navigateCalendarToMonth(page, endDate);
  }
  await selectDayButton(page, endDate.getDate());
}

/**
 * Pick a single date in the "Date" field.
 * Uncomment in run.js once the purpose of this field is confirmed.
 */
async function updateCutoffDate(page, date) {
  await page.getByRole('textbox', { name: 'Date', exact: true }).click();
  await navigateCalendarToMonth(page, date);
  await selectDayButton(page, date.getDate());
}

async function saveChanges(page) {
  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(1000);

  const saveBtn = page.getByRole('button', { name: 'Save' });
  const isDisabled = await saveBtn.isDisabled().catch(() => true);
  if (!isDisabled) {
    await saveBtn.click();
  }
}

async function verifySaved(page) {
  const toast = page.getByText(/saved|success|updated/i);
  const appeared = await toast.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
  if (!appeared) {
    const saveDisabled = await page.getByRole('button', { name: 'Save' }).isDisabled().catch(() => false);
    if (!saveDisabled) {
      throw new Error('Save did not produce a confirmation and button is still enabled');
    }
  }
}

module.exports = {
  updateQuantity,
  openPreorderEditor,
  updatePreorderDates,
  updateCutoffDate,
  saveChanges,
  verifySaved,
};
