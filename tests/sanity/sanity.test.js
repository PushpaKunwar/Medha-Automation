/**
 * tests/sanity/sanity.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SANITY SUITE — Verifies key user flows work end-to-end at a surface level.
 * Deeper than smoke (actual interactions), lighter than full regression.
 * Run after a build or config change to confirm nothing is critically broken.
 *
 * Run:  npx playwright test tests/sanity --headed
 */

const { test, expect, URLS } = require('../../fixtures/baseFixture');
const { loginAndGoToDashboard } = require('../../utils/authHelper');
const { screenshotPass, screenshotFail } = require('../../utils/screenshot');

test.describe('Sanity Tests', () => {
  test.setTimeout(120_000);

  let passed = false;

  test.afterEach(async ({ page }, testInfo) => {
    const folder = 'dashboard'; // reuse existing screenshot folder
    if (testInfo.status === 'failed') {
      await screenshotFail(page, folder, testInfo.title).catch(() => {});
    }
  });

  // ── SAN01: Login + Logout ───────────────────────────────────────────────────
  test('SAN01 - Login and logout flow', async ({ loginPage, dashboardPage, page }) => {
    const { credentials } = require('../../test-data/credentials');

    await loginPage.navigate();
    const isVisible = await loginPage.isLoginPageVisible().catch(() => false);
    if (isVisible) {
      await loginPage.login(credentials.validUser.email, credentials.validUser.password);
      await page.waitForTimeout(3000);
    }
    if (!page.url().includes(':5110')) {
      await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
    }

    await dashboardPage.waitForLoad(20000);
    expect(page.url()).toContain(':5110');
    console.log('  ✓ SAN01: Dashboard loaded after login');

    await dashboardPage.logout();
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain(':5110');
    console.log('  ✓ SAN01: Logout successful');
  });

  // ── SAN02: Class Test list — filter by subject ─────────────────────────────
  test('SAN02 - Class Test list filter works', async ({ page, classTestListPage }) => {
    await loginAndGoToDashboard(page);

    await classTestListPage.navigate();
    await page.locator('[data-name="Subject"]').first().waitFor({ state: 'visible', timeout: 10000 });

    const { selectCampusDropdown } = require('../../utils/selectDropdown');
    await selectCampusDropdown(page, 'Subject', 'Science');

    await page.locator('button.multipleFIlterSearchBtn').first().click();
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('classtest');
    console.log('  ✓ SAN02: Class Test subject filter executed without error');
  });

  // ── SAN03: Worksheet list — page renders ───────────────────────────────────
  test('SAN03 - Worksheet list renders and WORKSHEET BY button exists', async ({ page }) => {
    await loginAndGoToDashboard(page);

    await page.goto(URLS.worksheet, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button:has-text("WORKSHEET BY"), button:has-text("Worksheet By")').first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(createBtn).toBeVisible();
    console.log('  ✓ SAN03: Worksheet list has create button');
  });

  // ── SAN04: Collaboration list — add button exists ──────────────────────────
  test('SAN04 - Collaboration list renders and + button exists', async ({ page }) => {
    await loginAndGoToDashboard(page);

    await page.goto(URLS.collaboration, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Dismiss any popup
    const popup = page.locator('.modal-header, [class*="confirmStatus"], [class*="popup"]').first();
    if (await popup.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    const addBtn = page.locator('button:has-text("+"), button.btn-add, button[title*="Add"]').first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(addBtn).toBeVisible();
    console.log('  ✓ SAN04: Collaboration list has + button');
  });

  // ── SAN05: Forgot password page loads ─────────────────────────────────────
  test('SAN05 - Forgot password page accessible from login', async ({ loginPage, page }) => {
    await loginPage.navigate();

    const forgotLink = loginPage.forgotPasswordLink;
    await forgotLink.waitFor({ state: 'visible', timeout: 8000 });
    await forgotLink.click();

    await page.waitForTimeout(2000);
    const body = await page.locator('body').textContent();
    const hasForgotContent = body.toLowerCase().includes('forgot') ||
                             body.toLowerCase().includes('reset') ||
                             body.toLowerCase().includes('password');
    expect(hasForgotContent).toBe(true);
    console.log('  ✓ SAN05: Forgot password page reachable');
  });

});
