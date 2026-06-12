/**
 * tests/auth/login.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth tests — Login, Forgot Password, Logout
 *
 *  TC01  Successful login loads dashboard
 *  TC02  Invalid credentials shows error and stays on login page
 *  TC03  Login page UI elements are present
 *  TC04  Forgot Password flow
 *  TC05  Logout via profile dropdown
 *
 *  Screenshots:
 *    PASS__<TC>.png  — taken once at the end of each passing test
 *    FAIL__<TC>.png  — taken automatically when a test fails
 *
 *  Run all:  npx playwright test tests/auth/login.test.js --headed
 *  Run one:  npx playwright test tests/auth/login.test.js --grep "TC01" --headed
 */

const { test, expect }       = require('@playwright/test');
const { LoginPage }          = require('../../pages/auth/LoginPage');
const { ForgetPasswordPage } = require('../../pages/auth/ForgetPasswordPage');
const { DashboardPage }      = require('../../pages/dashboard/DashboardPage');
const { screenshotPass, screenshotFail } = require('../../utils/screenshot');
const { loginAndGoToDashboard } = require('../../utils/authHelper');
const { credentials }        = require('../../test-data/credentials');

// ── afterEach: screenshot on failure only ─────────────────────────────────────
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    const title  = testInfo.title.toLowerCase();
    const folder = title.includes('forgot') ? 'forgotPassword'
                 : title.includes('logout') ? 'dashboard'
                 : 'login';
    await screenshotFail(page, folder, testInfo.title);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Auth Tests', () => {

  // ── TC01 ───────────────────────────────────────────────────────────────────
  test('TC01 - Successful login loads dashboard', async ({ page }) => {
    const loginPage     = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    expect(page.url()).toContain(':5020');

    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.loginButton).toBeVisible({ timeout: 10000 });

    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('/api/account/login') && res.request().method() === 'POST',
        { timeout: 15000 }
      ),
      loginPage.login(credentials.validUser.email, credentials.validUser.password),
    ]);
    const loginBody = await loginResponse.json();
    console.log('Login API status:', loginResponse.status(), '|', loginBody.message);

    expect(loginResponse.status(), `Login API failed: ${loginBody.message}`).toBe(200);

    await dashboardPage.waitForLoad(30000);
    expect(page.url()).toContain(':5110');
    await expect(loginPage.passwordInput).not.toBeVisible({ timeout: 5000 });
    console.log('Post-login URL:', page.url());

    // ── Pass screenshot (taken only on success) ──────────────────────────────
    await screenshotPass(page, 'dashboard', 'TC01');
  });

  // ── TC02 ───────────────────────────────────────────────────────────────────
  test('TC02 - Invalid credentials shows error and stays on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();

    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('/api/account/login') && res.request().method() === 'POST',
        { timeout: 15000 }
      ),
      loginPage.login('invalid@test.com', 'WrongPassword123'),
    ]);
    const body = await loginResponse.json();
    console.log('Error API response:', body.message);

    expect(loginResponse.status()).not.toBe(200);
    expect(page.url()).toContain(':5020');
    await expect(loginPage.passwordInput).toBeVisible({ timeout: 5000 });

    // ── Pass screenshot ───────────────────────────────────────────────────────
    await screenshotPass(page, 'login', 'TC02');
  });

  // ── TC03 ───────────────────────────────────────────────────────────────────
  test('TC03 - Login page UI elements are present on port 5020', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    expect(page.url()).toContain(':5020');

    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.loginButton).toBeVisible({ timeout: 10000 });
    await expect(loginPage.forgotPasswordLink).toBeVisible({ timeout: 10000 });

    // ── Pass screenshot ───────────────────────────────────────────────────────
    await screenshotPass(page, 'login', 'TC03');
  });

  // ── TC04 ───────────────────────────────────────────────────────────────────
  test('TC04 - Forgot Password flow from login page', async ({ page }) => {
    const loginPage  = new LoginPage(page);
    const forgotPage = new ForgetPasswordPage(page);

    await loginPage.navigate();
    await expect(loginPage.forgotPasswordLink).toBeVisible({ timeout: 10000 });

    await loginPage.clickForgotPassword();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    console.log('Forgot PW URL:', page.url());

    await expect(forgotPage.emailInput).toBeVisible({ timeout: 10000 });

    await forgotPage.fillEmail(credentials.validUser.email);
    await forgotPage.clickSubmit();
    await page.waitForTimeout(2000);

    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page after submit:', pageText.substring(0, 200));
    expect(pageText.toLowerCase()).toMatch(/sent|reset|otp|code|email/i);

    // ── Pass screenshot ───────────────────────────────────────────────────────
    await screenshotPass(page, 'forgotPassword', 'TC04');
  });

  // ── TC05 ───────────────────────────────────────────────────────────────────
  test('TC05 - Logout via profile dropdown in top-right header', async ({ page }) => {
    const dashboardPage = await loginAndGoToDashboard(page);
    expect(page.url()).toContain(':5110');
    console.log('Dashboard URL:', page.url());

    await dashboardPage.clickProfileButton();
    await dashboardPage.waitForDropdown();
    await expect(dashboardPage.profileDropdown).toBeVisible({ timeout: 8000 });
    await expect(dashboardPage.logoutLink).toBeVisible({ timeout: 8000 });

    await dashboardPage.logoutLink.click();
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Post-logout URL:', page.url());

    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(dashboardPage.profileButton).not.toBeVisible({ timeout: 5000 });

    // ── Pass screenshot ───────────────────────────────────────────────────────
    await screenshotPass(page, 'login', 'TC05');
  });

});
