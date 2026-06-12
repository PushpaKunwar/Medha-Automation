/**
 * utils/authHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared login helpers used across all test files.
 * Centralised here to avoid duplication across login / todo / classtest / worksheet tests.
 */

const { expect }        = require('@playwright/test');
const { LoginPage }     = require('../pages/auth/LoginPage');
const { DashboardPage } = require('../pages/dashboard/DashboardPage');
const { credentials }   = require('../test-data/credentials');
const { URLS }          = require('./urls');

/**
 * Full POM login — navigates to login page, submits credentials via LoginPage,
 * asserts HTTP 200 on the login API, waits for dashboard to load.
 *
 * Use this in tests that need to verify the login flow itself (TC01) OR
 * that need a clean, assertion-backed login before the real test steps.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} expect  — Playwright expect function
 * @returns {Promise<DashboardPage>}
 */
async function loginAndGoToDashboard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();

  // If the app already has an active session it redirects away from the login page
  // to the dashboard — in that case the POST to /api/account/login never fires.
  // Detect this: after navigate(), if we are no longer on the login URL, skip the
  // credentials flow entirely and just go straight to the dashboard.
  const afterNavUrl = page.url();
  const alreadyLoggedIn = !afterNavUrl.includes(URLS.login) ||
    !(await loginPage.isLoginPageVisible().catch(() => false));

  if (alreadyLoggedIn) {
    console.log('  ℹ  Session already active — skipping login step');
    await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForTimeout(2000);
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad(30000);
    return dashboard;
  }

  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/api/account/login') && res.request().method() === 'POST',
      { timeout: 15000 }
    ),
    loginPage.login(credentials.validUser.email, credentials.validUser.password),
  ]);

  expect(loginResponse.status()).toBe(200);

  // After login the SPA may redirect to :5110 — navigate there explicitly if needed
  await page.waitForTimeout(2000);
  if (!page.url().includes(':5110')) {
    console.log(`  ↳ Navigating to dashboard (${URLS.dashboard}) after login…`);
    // Retry up to 3 times in case of transient network errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        console.log(`  ↳ Navigation attempt ${attempt} failed (${e.message.split('\n')[0]}) — retrying…`);
        await page.waitForTimeout(3000);
      }
    }
    await page.waitForTimeout(2000);
  }

  const dashboard = new DashboardPage(page);
  await dashboard.waitForLoad(30000);
  return dashboard;
}

/**
 * Lightweight login — fills credentials directly without going through LoginPage POM.
 * Faster than loginAndGoToDashboard; use in scenario tests (TC08–TC15) where
 * the login flow itself is NOT what is being tested.
 *
 * @param {import('@playwright/test').Page} page
 */
async function login(page) {
  await page.goto(URLS.login, { waitUntil: 'commit' });

  const emailInput = page.locator(
    'input[placeholder*="email" i], input[placeholder*="UserID" i], input[type="email"]'
  ).first();
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  await emailInput.fill(credentials.validUser.email);
  await page.fill('input[type="password"]', credentials.validUser.password);
  await page.locator('button:has-text("Login")').first().click();

  // Wait for dashboard to load — try profile header first, fall back to sidebar nav
  const profileSection = page.locator('.profileSectionInHeader');
  const sidebarNav = page.locator('a:has-text("Dashboard"), a:has-text("Lesson"), .sidenav, nav').first();

  const profileLoaded = await profileSection.waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true).catch(() => false);

  if (!profileLoaded) {
    // Dashboard sidebar is visible even when profile header is slow — accept that
    await sidebarNav.waitFor({ state: 'visible', timeout: 20000 });
  }
  console.log('  ✓ Logged in');
}

module.exports = { loginAndGoToDashboard, login };
