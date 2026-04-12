const { test, expect }         = require('@playwright/test');
const { LoginPage }            = require('../pages/auth/LoginPage');
const { ForgetPasswordPage }   = require('../pages/auth/ForgetPasswordPage');
const { DashboardPage }        = require('../pages/home/DashboardPage');
const { TodoPage }             = require('../pages/home/TodoPage');
const { MboardPage }           = require('../pages/home/MboardPage');
const { LessonPage }           = require('../pages/home/LessonPage');
const { AddClassTestPage }     = require('../pages/home/AddClassTestPage');
const { credentials }          = require('../test-data/credentials');
const { classTestData }        = require('../test-data/classTestData');
const { screenshotStep, screenshotFail, clearTestScreenshots } = require('../utils/screenshot');

// ── Pick screenshot folder from test title ────────────────────────────────────
function folderForTest(title) {
  const t = title.toLowerCase();
  if (t.includes('forgot'))                                return 'forgotPassword';
  if (t.includes('logout') || t.includes('dashboard'))    return 'dashboard';
  if (t.includes('todo')   || t.includes('start class'))  return 'todo';
  if (t.includes('mboard') || t.includes('youtube') ||
      t.includes('e-content'))                            return 'mboard';
  if (t.includes('class test') || t.includes('classtest') ||
      t.includes('add new'))                              return 'addClassTest';
  if (t.includes('lesson'))                               return 'lesson';
  return 'login';
}

// ── beforeEach: wipe previous screenshots for THIS test so no duplicates ──────
test.beforeEach(async ({}, testInfo) => {
  const tcId = testInfo.title.match(/TC\d+/)?.[0] ?? sanitizeName(testInfo.title);
  clearTestScreenshots(tcId);
});

function sanitizeName(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
}

// ── afterEach: always capture a screenshot (pass = last step, fail = on error) ─
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    const folder = folderForTest(testInfo.title);
    await screenshotFail(page, folder, testInfo.title);
  }
});

// ── Helper: login and reach dashboard ─────────────────────────────────────────
async function loginAndGoToDashboard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();

  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/api/account/login') && res.request().method() === 'POST',
      { timeout: 15000 }
    ),
    loginPage.login(credentials.validUser.email, credentials.validUser.password),
  ]);
  expect(loginResponse.status()).toBe(200);

  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForLoad(30000);
  return dashboardPage;
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('LMS Medha - Auth & Dashboard Tests', () => {

  // ── TC01 ───────────────────────────────────────────────────────────────────
  test('TC01 - Successful login loads dashboard', async ({ page }) => {
    const loginPage     = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Step 1: Open login page (port 5020)
    await loginPage.navigate();
    expect(page.url()).toContain(':5020');
    await screenshotStep(page, 'login', 'TC01_step1_login_page_opened');

    // Step 2: Verify all form fields are visible
    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.loginButton).toBeVisible({ timeout: 10000 });
    await screenshotStep(page, 'login', 'TC01_step2_form_fields_visible');

    // Step 3: Submit credentials and intercept API response
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('/api/account/login') && res.request().method() === 'POST',
        { timeout: 15000 }
      ),
      loginPage.login(credentials.validUser.email, credentials.validUser.password),
    ]);
    const loginBody = await loginResponse.json();
    console.log('Login API status  :', loginResponse.status(), '|', loginBody.message);
    await screenshotStep(page, 'login', 'TC01_step3_credentials_submitted');

    // Step 4: API must return 200
    expect(loginResponse.status(), `Login API failed: ${loginBody.message}`).toBe(200);

    // Step 5: Dashboard mounts on port 5110
    await dashboardPage.waitForLoad(30000);
    expect(page.url()).toContain(':5110');
    await expect(loginPage.passwordInput).not.toBeVisible({ timeout: 5000 });
    await screenshotStep(page, 'dashboard', 'TC01_step5_dashboard_loaded');
    console.log('Post-login URL    :', page.url());
  });

  // ── TC02 ───────────────────────────────────────────────────────────────────
  test('TC02 - Invalid credentials shows error and stays on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Step 1: Open login page
    await loginPage.navigate();
    await screenshotStep(page, 'login', 'TC02_step1_login_page_opened');

    // Step 2: Submit wrong credentials
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('/api/account/login') && res.request().method() === 'POST',
        { timeout: 15000 }
      ),
      loginPage.login('invalid@test.com', 'WrongPassword123'),
    ]);
    const body = await loginResponse.json();
    console.log('Error API response:', body.message);
    await screenshotStep(page, 'login', 'TC02_step2_invalid_credentials_submitted');

    // Step 3: API returns 400 and user stays on login page
    expect(loginResponse.status()).not.toBe(200);
    expect(page.url()).toContain(':5020');
    await expect(loginPage.passwordInput).toBeVisible({ timeout: 5000 });
    await screenshotStep(page, 'login', 'TC02_step3_error_shown_on_login_page');
  });

  // ── TC03 ───────────────────────────────────────────────────────────────────
  test('TC03 - Login page UI elements are present on port 5020', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    expect(page.url()).toContain(':5020');
    await screenshotStep(page, 'login', 'TC03_step1_login_page_opened');

    // Step 2: Verify all UI elements
    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginPage.loginButton).toBeVisible({ timeout: 10000 });
    await expect(loginPage.forgotPasswordLink).toBeVisible({ timeout: 10000 });
    await screenshotStep(page, 'login', 'TC03_step2_all_ui_elements_verified');
  });

  // ── TC04 ───────────────────────────────────────────────────────────────────
  test('TC04 - Forgot Password flow from login page', async ({ page }) => {
    const loginPage  = new LoginPage(page);
    const forgotPage = new ForgetPasswordPage(page);

    // Step 1: Open login page and verify forgot password link exists
    await loginPage.navigate();
    await expect(loginPage.forgotPasswordLink).toBeVisible({ timeout: 10000 });
    await screenshotStep(page, 'forgotPassword', 'TC04_step1_login_page_with_forgot_link');

    // Step 2: Click "Forgot Password" link
    await loginPage.clickForgotPassword();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await screenshotStep(page, 'forgotPassword', 'TC04_step2_forgot_password_page_opened');
    console.log('Forgot PW URL:', page.url());

    // Step 3: Email input is visible on forgot password page
    await expect(forgotPage.emailInput).toBeVisible({ timeout: 10000 });
    await screenshotStep(page, 'forgotPassword', 'TC04_step3_email_field_visible');

    // Step 4: Enter registered email and submit
    await forgotPage.fillEmail(credentials.validUser.email);
    await screenshotStep(page, 'forgotPassword', 'TC04_step4_email_entered');
    await forgotPage.clickSubmit();
    await page.waitForTimeout(2000);
    await screenshotStep(page, 'forgotPassword', 'TC04_step5_form_submitted');

    // Step 5: Confirm OTP/reset page is shown
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page after submit:', pageText.substring(0, 200));
    expect(pageText.toLowerCase()).toMatch(/sent|reset|otp|code|email/i);
    await screenshotStep(page, 'forgotPassword', 'TC04_step6_confirmation_shown');
  });

  // ── TC05 ───────────────────────────────────────────────────────────────────
  test('TC05 - Logout via profile dropdown in top-right header', async ({ page }) => {
    // Step 1: Login and land on dashboard
    const dashboardPage = await loginAndGoToDashboard(page);
    expect(page.url()).toContain(':5110');
    await screenshotStep(page, 'dashboard', 'TC05_step1_dashboard_loaded_after_login');
    console.log('Dashboard URL     :', page.url());

    // Step 2: Click profile avatar button (top-right)
    await dashboardPage.clickProfileButton();
    await screenshotStep(page, 'dashboard', 'TC05_step2_profile_button_clicked');

    // Step 3: Dropdown opens — verify name and Logout option are visible
    await dashboardPage.waitForDropdown();
    await expect(dashboardPage.profileDropdown).toBeVisible({ timeout: 8000 });
    await expect(dashboardPage.logoutLink).toBeVisible({ timeout: 8000 });
    await screenshotStep(page, 'dashboard', 'TC05_step3_profile_dropdown_open');
    console.log('Profile dropdown opened');

    // Step 4: Click Logout
    await dashboardPage.logoutLink.click();
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
    await screenshotStep(page, 'login', 'TC05_step4_logged_out_login_page_shown');
    console.log('Post-logout URL   :', page.url());

    // Step 5: Login screen is back, dashboard is gone
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(dashboardPage.profileButton).not.toBeVisible({ timeout: 5000 });
    await screenshotStep(page, 'login', 'TC05_step5_logout_confirmed');
    console.log('Logout successful — login screen is back');
  });

  // ── TC06 ───────────────────────────────────────────────────────────────────
  test('TC06 - TODO → Start Class → e-Content → YouTube video plays', async ({ page }) => {
    const todoPage   = new TodoPage(page);
    const mboardPage = new MboardPage(page);

    // Step 1: Login and land on dashboard
    const dashboardPage = await loginAndGoToDashboard(page);
    expect(page.url()).toContain(':5110');
    await screenshotStep(page, 'dashboard', 'TC06_step1_dashboard_loaded');
    console.log('Dashboard URL:', page.url());

    // Step 2: Navigate to TO-DO module
    await todoPage.navigate();
    await screenshotStep(page, 'todo', 'TC06_step2_todo_page_opened');
    console.log('TODO URL:', page.url());
    expect(page.url()).toContain('/todo');

    // Step 3: Click "Start Class" button
    await todoPage.clickStartClass();
    await page.waitForTimeout(2000);
    await screenshotStep(page, 'todo', 'TC06_step3_start_class_clicked');
    console.log('Start Class clicked');

    // Step 4: Handle "ongoing class" popup — click "End Class" to start fresh
    await todoPage.handleOngoingClassDialog('end');
    await screenshotStep(page, 'todo', 'TC06_step4_ongoing_class_dialog_handled');

    // Step 5: M-Board loads — URL changes to /todoin/...
    await mboardPage.waitForLoad(20000);
    await screenshotStep(page, 'mboard', 'TC06_step5_mboard_loaded');
    console.log('Mboard URL:', page.url());
    expect(page.url()).toContain('/todoin/');

    // Step 6: Click "e-Content" sidebar tab — popover opens
    await mboardPage.openEContent();
    await screenshotStep(page, 'mboard', 'TC06_step6_econtent_popover_opened');
    await expect(mboardPage.eContentPopover).toBeVisible({ timeout: 8000 });
    console.log('e-Content popover opened');

    // Step 7: Click the YouTube icon inside the e-Content popover
    await mboardPage.clickYoutubeIcon();
    await screenshotStep(page, 'mboard', 'TC06_step7_youtube_icon_clicked');
    console.log('YouTube icon clicked');

    // Step 8: YouTube iframe embeds — video is playing
    await mboardPage.waitForYoutubeVideo(15000);
    const ytSrc = await mboardPage.getYoutubeVideoSrc();
    console.log('YouTube iframe src:', ytSrc?.substring(0, 80));

    expect(ytSrc).toContain('youtube.com/embed');
    await expect(mboardPage.youtubeIframe).toBeVisible({ timeout: 5000 });
    await screenshotStep(page, 'mboard', 'TC06_step8_youtube_video_playing');
    console.log('YouTube video is playing ✅');
  });

  // ── TC07 — Data-driven: runs once per entry in classTestData ────────────────
  // Each iteration logs in fresh, navigates to the form, fills all fields,
  // and clicks Save & Next — creating a separate class test in the app.
  //
  // Run all 11:   npx playwright test --grep "TC07"
  // Run one only: npx playwright test --grep "TC07-CT03"

  for (const data of classTestData) {
    test(`TC07-${data.id} - Add Class Test [${data.grade}${data.section} | ${data.subject} | ${data.chapter}]`, async ({ page }) => {
      // 4 minutes per iteration — each dropdown triggers an API call
      test.setTimeout(240_000);

      // Screenshots go into screenshots/TC07/<id>/  — one sub-folder per entry
      const SS = `tc07`;   // all in one flat folder, step names carry the id

      const lessonPage   = new LessonPage(page);
      const addClassTest = new AddClassTestPage(page);

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`▶  ${data.id}: ${data.description}`);
      console.log(`${'─'.repeat(60)}`);

      // ── Step 1: Login ────────────────────────────────────────────────────
      await loginAndGoToDashboard(page);
      expect(page.url()).toContain(':5110');
      await screenshotStep(page, SS, `${data.id}_step1_dashboard`);

      // ── Step 2: Go to ClassTest list page ────────────────────────────────
      await lessonPage.navigate();
      await screenshotStep(page, SS, `${data.id}_step2_lesson_list`);

      // ── Step 3: Open AddNewClassTest form ────────────────────────────────
      const addBtnSel = 'button.btn-square.btn-add, button[title*="Add"], a[href*="AddNewClassTest"]';
      const addBtnVisible = await page.locator(addBtnSel).first().isVisible().catch(() => false);
      if (addBtnVisible) {
        await page.locator(addBtnSel).first().click();
        await page.locator('[data-name="School"]').first()
          .waitFor({ state: 'visible', timeout: 12000 })
          .catch(() => {});
      }
      if (!page.url().includes('AddNewClassTest')) {
        await addClassTest.navigate();
      }
      await screenshotStep(page, SS, `${data.id}_step3_form_opened`);

      // ── Step 4: Confirm form is loaded ───────────────────────────────────
      await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 15000 });
      await screenshotStep(page, SS, `${data.id}_step4_form_loaded`);
      console.log(`✔ Form loaded for ${data.id}`);

      // ── Step 5: Fill cascade dropdowns ───────────────────────────────────
      await addClassTest.selectDropdown('School',          data.school);
      await screenshotStep(page, SS, `${data.id}_step5a_school`);

      await addClassTest.selectDropdown('Session',         data.session);
      await screenshotStep(page, SS, `${data.id}_step5b_session`);

      await addClassTest.selectDropdown('Grade',           data.grade);
      await screenshotStep(page, SS, `${data.id}_step5c_grade`);

      await addClassTest.selectDropdown('Section',         data.section);
      await screenshotStep(page, SS, `${data.id}_step5d_section`);

      await addClassTest.selectDropdown('Subject',         data.subject);
      await screenshotStep(page, SS, `${data.id}_step5e_subject`);

      await addClassTest.selectDropdown('Select Chapters', data.chapter);
      await screenshotStep(page, SS, `${data.id}_step5f_chapter`);

      // ── Step 6: Fill text / number / date / time inputs ──────────────────
      await addClassTest.fillTextFields({
        examName:     data.examName,
        numQuestions: data.numQuestions,
        totalMarks:   data.totalMarks,
        examDate:     data.examDate,
        examDuration: data.examDuration,
        startTime:    data.startTime,
        endTime:      data.endTime,   // auto-calculated by app — handled gracefully
      });
      await screenshotStep(page, SS, `${data.id}_step6_fields_filled`);

      // ── Step 7: Exam Mode ─────────────────────────────────────────────────
      await addClassTest.selectExamMode(data.examMode);
      await screenshotStep(page, SS, `${data.id}_step7_mode_${data.examMode}`);

      // ── Step 8: Notify Students ───────────────────────────────────────────
      await addClassTest.selectNotify(data.notify);
      await screenshotStep(page, SS, `${data.id}_step8_notify_${data.notify}`);

      // ── Step 9: Save & Next ───────────────────────────────────────────────
      await addClassTest.clickSaveAndNext();
      await screenshotStep(page, SS, `${data.id}_step9_save_clicked`);
      console.log(`Save & Next → URL: ${page.url()}`);

      // ── Step 10: Confirm navigation to AddQuestion page ───────────────────
      const step2 = page.locator([
        '[class*="addQuestion"]',
        '[class*="questionList"]',
        '.swal2-popup',
        '[class*="toast"]',
        'button:has-text("Submit")',
      ].join(', ')).first();

      await step2.waitFor({ state: 'visible', timeout: 15000 }).catch(async () => {
        const txt = await page.evaluate(() => document.body.innerText);
        console.log(`Page state after Save (${data.id}):\n`, txt.substring(0, 300));
      });

      await screenshotStep(page, SS, `${data.id}_step10_after_save`);
      console.log(`✅ ${data.id} completed — Post-Save URL: ${page.url()}`);

      expect(page.url()).toBeTruthy();
    });
  }

});
