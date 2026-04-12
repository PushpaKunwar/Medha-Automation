const { chromium } = require('@playwright/test');
const { credentials } = require('./test-data/credentials');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--use-fake-ui-for-media-stream'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, permissions: ['microphone', 'camera'] });
  const page = await context.newPage();

  // Login
  await page.goto('https://live.mafatlaleducation.com:5020/');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(credentials.validUser.email);
  await page.locator('input[type="password"]').first().fill(credentials.validUser.password);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/account/login') && r.request().method() === 'POST'),
    page.locator('button[type="submit"], button:has-text("Login")').first().click(),
  ]);
  await page.locator('.profileSectionInHeader').waitFor({ state: 'visible', timeout: 30000 });
  await page.goto('https://live.mafatlaleducation.com:5110/classtest/AddNewClassTest', { waitUntil: 'commit' });
  await page.waitForTimeout(4000);

  // Helper
  async function selectDropdown(dataName, optionText) {
    const trigger = page.locator(`[data-name="${dataName}"]`).first();
    await trigger.click();
    await page.waitForTimeout(800);
    const option = page.locator(`ul.filterOptionsListCustomSelectCampus li`).filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 8000 });
    await option.click();
    await page.waitForTimeout(1000);
    console.log(`✓ ${dataName} = "${optionText}"`);
  }

  // All data-names BEFORE filling
  const beforeNames = await page.evaluate(() =>
    [...document.querySelectorAll('[data-name]')].map(el => ({
      name: el.getAttribute('data-name'),
      text: el.textContent.trim().substring(0, 30)
    }))
  );
  console.log('\n--- data-names BEFORE ---\n', JSON.stringify(beforeNames, null, 2));

  // Fill School → Session → Grade → Section → Subject, check Chapter data-name
  await selectDropdown('School', 'Mafatlal Academy');
  await selectDropdown('Session', '2025-2026');
  await selectDropdown('Grade', 'IX');

  // Section options
  await page.locator('[data-name="Section"]').first().click();
  await page.waitForTimeout(800);
  const secOpts = await page.locator('ul.filterOptionsListCustomSelectCampus li').allTextContents();
  console.log('Section options:', secOpts);
  await page.locator('ul.filterOptionsListCustomSelectCampus li').filter({ hasText: 'A' }).first().click();
  await page.waitForTimeout(800);
  console.log('✓ Section = A');

  await selectDropdown('Subject', 'Science');

  // data-names AFTER filling subject
  const afterNames = await page.evaluate(() =>
    [...document.querySelectorAll('[data-name]')].map(el => ({
      name: el.getAttribute('data-name'),
      text: el.textContent.trim().substring(0, 30)
    }))
  );
  console.log('\n--- data-names AFTER subject ---\n', JSON.stringify(afterNames, null, 2));

  // Open Chapter dropdown and see options
  const chapterDataNames = afterNames.filter(e => /chapter|chap/i.test(e.name));
  console.log('\n--- Chapter dropdown candidates ---\n', chapterDataNames);

  // Try clicking each to find Sound
  for (const dn of afterNames) {
    if (/chapter|chap|topic/i.test(dn.name)) {
      console.log(`Trying dropdown [data-name="${dn.name}"]`);
      await page.locator(`[data-name="${dn.name}"]`).first().click();
      await page.waitForTimeout(800);
      const opts = await page.locator('ul.filterOptionsListCustomSelectCampus li').allTextContents();
      console.log(`Options for ${dn.name}:`, opts.slice(0, 10));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: 'debug-form-after-subject.png' });
  await browser.close();
})();
