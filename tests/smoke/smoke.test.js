/**
 * tests/smoke/smoke.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SMOKE SUITE — Fast checks that the app is alive and critical pages load.
 * Run before any deployment or after environment changes.
 * Target run time: < 2 minutes total.
 *
 * Run:  npx playwright test tests/smoke --headed
 */

const { test, expect, URLS } = require('../../fixtures/baseFixture');

test.describe('Smoke Tests', () => {

  // ── S01: Login page loads ───────────────────────────────────────────────────
  test('S01 - Login page loads with email and password fields', async ({ loginPage, page }) => {
    await loginPage.navigate();

    await expect(page).toHaveURL(new RegExp(URLS.login.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/$/, '').replace('https', 'https?')));
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    console.log('  ✓ Login page is alive');
  });

  // ── S02: Valid login reaches dashboard ─────────────────────────────────────
  test('S02 - Valid login loads dashboard', async ({ loginPage, dashboardPage, page }) => {
    const { credentials } = require('../../test-data/credentials');

    await loginPage.navigate();

    const isLoginVisible = await loginPage.isLoginPageVisible().catch(() => false);
    if (isLoginVisible) {
      await loginPage.login(credentials.validUser.email, credentials.validUser.password);
      await page.waitForTimeout(3000);
    }

    if (!page.url().includes(':5110')) {
      await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
    }

    await dashboardPage.waitForLoad(20000);
    expect(page.url()).toContain(':5110');
    console.log('  ✓ Dashboard reachable after login');
  });

  // ── S03: Class Test list page loads ────────────────────────────────────────
  test('S03 - Class Test list page loads', async ({ authenticatedPage: page }) => {
    await page.goto(`${URLS.dashboard}classtest`, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('classtest');
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('404');
    console.log('  ✓ Class Test list page loaded');
  });

  // ── S04: Worksheet list page loads ─────────────────────────────────────────
  test('S04 - Worksheet list page loads', async ({ authenticatedPage: page }) => {
    await page.goto(URLS.worksheet, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('assignment');
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('404');
    console.log('  ✓ Worksheet list page loaded');
  });

  // ── S05: Collaboration list page loads ─────────────────────────────────────
  test('S05 - Collaboration list page loads', async ({ authenticatedPage: page }) => {
    await page.goto(URLS.collaboration, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('collaboration');
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('404');
    console.log('  ✓ Collaboration list page loaded');
  });

});
