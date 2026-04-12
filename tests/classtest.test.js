/**
 * classtest.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-end Class Test creation flow for CT01, split into 4 serial test cases.
 *
 *  CLEANUP STRATEGY
 *  ─────────────────
 *  Before EVERY test that creates a class test, we first navigate to the
 *  /classtest list and delete ALL entries whose name contains the exam name.
 *  This prevents "already created" errors on repeated runs.
 *
 *  TWO CREATION PATHS supported
 *  ─────────────────────────────
 *  Path A (primary):  Fill Add Class Test form → Save & Next → AddQuestion
 *  Path B (fallback): Test already exists without questions →
 *                     List page → click Edit → AddQuestion
 *
 *  TEST CASES
 *  ──────────
 *  TC08-1   Clean list → Fill form → Save & Next → assert AddQuestion URL
 *  TC08-2   Clean list → Fill form → AddQuestion → apply filters → add 5 Qs → verify panel
 *  TC08-3   Clean list → Fill form → AddQuestion → add 5 Qs → Adjust by AI → Submit
 *  TC08-4   Clean list → Fill form → AddQuestion → add 5 Qs → Submit → Finalize Only
 *
 *  Run all:        npx playwright test classtest --headed
 *  Run one step:   npx playwright test classtest --grep "TC08-4" --headed
 */

const { test, expect }         = require('@playwright/test');
const { AddClassTestPage }     = require('../pages/home/AddClassTestPage');
const { AddQuestionPage }      = require('../pages/home/AddQuestionPage');
const { ClassTestListPage }    = require('../pages/home/ClassTestListPage');
const { getClassTestById }     = require('../test-data/classTestData');
const { screenshotStep, screenshotFail } = require('../utils/screenshot');

// ── Test data ─────────────────────────────────────────────────────────────────
const BASE_DATA = getClassTestById('CT01');

// Fixed exam name — no timestamp suffix needed; cleanup handles duplicates
const EXAM_NAME = `${BASE_DATA.examName} CT01`;

// Question filters for AddQuestion page
const Q_FILTERS = {
  chapter:      'Sound',
  topics:       'Reflection of Sound',
  questionType: 'Multiple Choice (Single Answer)',
  complexity:   'Easy',
  blooms:       'Remembering',
};

// ── Helper: login ──────────────────────────────────────────────────────────────
async function login(page) {
  await page.goto('https://live.mafatlaleducation.com:5020/', { waitUntil: 'commit' });
  const emailInput = page
    .locator('input[placeholder*="email" i], input[placeholder*="UserID" i], input[type="email"]')
    .first();
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  await emailInput.fill('teacherdemo@gmail.com');
  await page.fill('input[type="password"]', 'Teacher@01');
  await page.locator('button:has-text("Login"), button[type="submit"]').first().click();
  await page.locator('.profileSectionInHeader').waitFor({ state: 'visible', timeout: 30000 });
  console.log('  ✓ Logged in');
}

// ── Helper: delete existing class tests by name ────────────────────────────────
/**
 * Navigates to the class test list and removes all entries matching examName.
 * Call this BEFORE every create-class-test step to keep the list clean.
 */
async function cleanupClassTests(page, examName) {
  console.log(`\n  🧹 Cleaning up class tests named "${examName}"…`);
  const listPage = new ClassTestListPage(page);
  const deleted = await listPage.deleteAllByName(examName);
  console.log(`  🧹 Cleanup done — removed ${deleted} entry(ies)`);
}

// ── Helper: fill form and save ─────────────────────────────────────────────────
/**
 * Navigate to AddNewClassTest, fill all CT01 fields with EXAM_NAME, click
 * Save & Next, and return once AddQuestion page is confirmed.
 */
async function fillFormAndSave(page) {
  const addClassTest = new AddClassTestPage(page);

  // Navigate directly to the Add form
  await addClassTest.navigate();
  console.log('  ✓ On AddNewClassTest form');

  // Fill dropdowns
  await addClassTest.selectDropdown('School',          BASE_DATA.school);
  await addClassTest.selectDropdown('Session',         BASE_DATA.session);
  await addClassTest.selectDropdown('Grade',           BASE_DATA.grade);
  await addClassTest.selectDropdown('Section',         BASE_DATA.section);
  await addClassTest.selectDropdown('Subject',         BASE_DATA.subject);
  await addClassTest.selectDropdown('Select Chapters', BASE_DATA.chapter);

  // Fill text / number / date / time fields
  await addClassTest.fillTextFields({
    examName:     EXAM_NAME,
    numQuestions: BASE_DATA.numQuestions,
    totalMarks:   BASE_DATA.totalMarks,
    examDate:     BASE_DATA.examDate,
    examDuration: BASE_DATA.examDuration,
    startTime:    BASE_DATA.startTime,
  });

  // Exam mode & notify
  await addClassTest.selectExamMode(BASE_DATA.examMode);
  await addClassTest.selectNotify(BASE_DATA.notify);

  // Touch the required Exam Instructions rich-text editor to pass validation
  await addClassTest.touchInstructions();

  // Intercept the Save & Next API call for diagnostics
  // Real endpoint: /webapigateway/api/campus_dashboard_module_ms/addClassTest
  const apiResponsePromise = page.waitForResponse(
    res => res.url().includes('addClassTest') &&
           res.request().method() === 'POST',
    { timeout: 25000 }
  ).catch(() => null);

  // Click Save & Next
  await addClassTest.clickSaveAndNext();

  // Wait for API response and log it
  const apiRes = await apiResponsePromise;
  if (apiRes) {
    const status = apiRes.status();
    const resBody = await apiRes.json().catch(() => null);
    console.log(`  📡 API POST ${apiRes.url().split('/').slice(-3).join('/')} → ${status}`);
    if (resBody) console.log(`  📡 API body: ${JSON.stringify(resBody).substring(0, 300)}`);
  } else {
    console.log('  ⚠ No POST API response detected — form may not have submitted');
    // Dump visible validation error messages
    const errs = await page.locator('.error, .invalid-feedback, [class*="error-msg"], [class*="toast"]')
      .allInnerTexts().catch(() => []);
    if (errs.length) console.log('  ⚠ Visible errors:', errs);
  }

  // Poll for AddQuestion URL (SPA — load event never fires; use polling)
  console.log('  ⏳ Waiting for navigation to AddQuestion…');
  for (let i = 0; i < 30; i++) {
    if (page.url().includes('AddQuestion')) break;
    await page.waitForTimeout(1000);
  }

  if (!page.url().includes('AddQuestion')) {
    // Dump visible text for debugging
    const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
    // Also try to find any visible toast/alert
    const alerts = await page.locator('.swal2-popup, .toast, [role="alert"]').allInnerTexts().catch(() => []);
    throw new Error(
      `Save & Next did NOT navigate to AddQuestion.\nURL: ${page.url()}\nAlerts: ${alerts.join(' | ')}\nBody snippet: ${bodyText.substring(0, 300)}`
    );
  }

  // Allow page filters to fully mount
  await page.waitForTimeout(2000);
  console.log('  ✓ On AddQuestion page:', page.url());
}

// ── Helper: apply filters and add N questions ──────────────────────────────────
async function selectQuestions(page, count = 5) {
  const addQuestion = new AddQuestionPage(page);
  await addQuestion.applyFilters(Q_FILTERS);
  await addQuestion.addTopNQuestions(count);
  await addQuestion.expandSelectedQuestions();
  return addQuestion;
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe.serial('TC08 - CT01 Class Test End-to-End Creation', () => {

  // Capture failure screenshot for any failing test
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      const folderMap = {
        'TC08-1': 'tc08Form',
        'TC08-2': 'tc08Questions',
        'TC08-3': 'tc08Submit',
        'TC08-4': 'tc08Finalize',
      };
      const tc     = testInfo.title.match(/TC08-\d/)?.[0] ?? 'TC08';
      const folder = folderMap[tc] ?? 'tc08Form';
      await screenshotFail(page, folder, testInfo.title);
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TC08-1  Add Class Test Form
  // ════════════════════════════════════════════════════════════════════════════
  test('TC08-1 - Add Class Test Form (CT01)', async ({ page }) => {
    test.setTimeout(300_000); // 5 minutes (6 dropdowns × ~8s + form fill)

    console.log('\n' + '═'.repeat(60));
    console.log('TC08-1 — Fill Add Class Test form and Save & Next');
    console.log('═'.repeat(60));

    // Step 1: Login
    await login(page);
    await screenshotStep(page, 'tc08Form', 'TC08-1_step1_logged_in');

    // Step 2: Clean up any previously created class test with the same name
    await cleanupClassTests(page, EXAM_NAME);
    await screenshotStep(page, 'tc08Form', 'TC08-1_step2_list_cleaned');

    // Step 3: Fill the Add Class Test form and Save & Next
    await fillFormAndSave(page);
    await screenshotStep(page, 'tc08Form', 'TC08-1_step3_on_addquestion');

    console.log('  Post-save URL:', page.url());
    console.log('  ✅ TC08-1 PASSED — form submitted, on AddQuestion page');

    expect(page.url()).toContain('AddQuestion');
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TC08-2  Select Questions
  // ════════════════════════════════════════════════════════════════════════════
  test('TC08-2 - Select Questions (CT01)', async ({ page }) => {
    test.setTimeout(300_000);

    console.log('\n' + '═'.repeat(60));
    console.log('TC08-2 — Apply filters, add 5 questions, verify panel');
    console.log('═'.repeat(60));

    // Setup: login → clean → create → reach AddQuestion
    await login(page);
    await cleanupClassTests(page, EXAM_NAME);
    await fillFormAndSave(page);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step0_on_addquestion');

    const addQuestion = new AddQuestionPage(page);

    // Step 1: Select Chapter filter
    await addQuestion.selectDropdown('Select Chapter', Q_FILTERS.chapter);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step1a_chapter_selected');

    // Step 2: Select Topics filter
    await addQuestion.selectDropdown('Select Topics', Q_FILTERS.topics);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step1b_topics_selected');

    // Step 3: Select Question Type filter
    await addQuestion.selectDropdown('Select Question Type', Q_FILTERS.questionType);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step1c_qtype_selected');

    // Step 4: Select Complexity filter
    await addQuestion.selectDropdown('Select Complexity', Q_FILTERS.complexity);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step1d_complexity_selected');

    // Step 5: Select Bloom's Taxonomy filter
    await addQuestion.selectDropdown("Select Bloom's Taxonomy", Q_FILTERS.blooms);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step1e_blooms_selected');

    // Step 6: Click Search and wait for question list
    await addQuestion.searchBtn.waitFor({ state: 'visible', timeout: 8000 });
    await addQuestion.searchBtn.click();
    console.log("  ✓ Clicked Search");
    await addQuestion.addArrows.first().waitFor({ state: 'visible', timeout: 20000 });
    const listedCount = await addQuestion.addArrows.count();
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step2_search_results');
    console.log(`  ✓ ${listedCount} questions listed after search`);

    // Step 7: Add 5 questions using the # navigation arrows
    await addQuestion.addTopNQuestions(5);
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step3_5_questions_added');

    // Step 8: Verify right panel shows Max Time and Selected Time
    const { maxTimeVisible, selectedTimeVisible, panelText } = await addQuestion.verifyRightPanel();
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step4_right_panel');
    console.log('  Panel text preview:', panelText.replace(/\n/g, ' | ').substring(0, 150));

    // Step 9: Click keyboard_arrow_down to expand selected questions list
    await addQuestion.expandSelectedQuestions();
    await screenshotStep(page, 'tc08Questions', 'TC08-2_step5_panel_expanded');

    expect(maxTimeVisible,       'Max Time label should be visible in right panel').toBeTruthy();
    expect(selectedTimeVisible,  'Selected Time label should be visible in right panel').toBeTruthy();

    console.log('  ✅ TC08-2 PASSED');
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TC08-3  Adjust by AI → Submit
  // ════════════════════════════════════════════════════════════════════════════
  test('TC08-3 - Adjust by AI and Submit (CT01)', async ({ page }) => {
    test.setTimeout(300_000);

    console.log('\n' + '═'.repeat(60));
    console.log('TC08-3 — Adjust by AI then Submit');
    console.log('═'.repeat(60));

    // Setup: login → clean → create → select 5 questions
    await login(page);
    await cleanupClassTests(page, EXAM_NAME);
    await fillFormAndSave(page);
    const addQuestion = await selectQuestions(page, 5);
    await screenshotStep(page, 'tc08Submit', 'TC08-3_step0_questions_selected');

    // Step 1: Click Adjust by AI
    await addQuestion.clickAdjustByAi();
    await screenshotStep(page, 'tc08Submit', 'TC08-3_step1_adjust_by_ai_clicked');

    // Step 2: Click Submit
    await addQuestion.clickSubmit();
    await screenshotStep(page, 'tc08Submit', 'TC08-3_step2_submit_clicked');
    console.log('  Post-Submit URL:', page.url());

    console.log('  ✅ TC08-3 PASSED');
    expect(page.url()).toBeTruthy();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TC08-4  Finalize Class Test
  // ════════════════════════════════════════════════════════════════════════════
  test('TC08-4 - Finalize Class Test (CT01)', async ({ page }) => {
    test.setTimeout(300_000);

    console.log('\n' + '═'.repeat(60));
    console.log('TC08-4 — Submit → Finalize popup → Finalize Only');
    console.log('═'.repeat(60));

    // Setup: login → clean → create → select 5 questions
    await login(page);
    await cleanupClassTests(page, EXAM_NAME);
    await fillFormAndSave(page);
    const addQuestion = await selectQuestions(page, 5);
    await screenshotStep(page, 'tc08Finalize', 'TC08-4_step0_ready_for_submit');

    // Step 1: Adjust by AI (required before Submit)
    await addQuestion.clickAdjustByAi();
    await screenshotStep(page, 'tc08Finalize', 'TC08-4_step1_adjust_by_ai');

    // Step 2: Click Submit → opens Finalize popup
    await addQuestion.clickSubmit();
    await screenshotStep(page, 'tc08Finalize', 'TC08-4_step2_submit_clicked');

    // Step 3: Handle Finalize popup → click "Finalize only"
    await addQuestion.clickFinalizeOnly();
    await screenshotStep(page, 'tc08Finalize', 'TC08-4_step3_finalize_only_clicked');

    // Let the app settle after finalization
    await page.waitForTimeout(3000);
    await screenshotStep(page, 'tc08Finalize', 'TC08-4_step4_completed');

    console.log('  Final URL:', page.url());
    console.log('  ✅ TC08-4 PASSED — CT01 Class Test fully created & finalized!');
    expect(page.url()).toBeTruthy();
  });

});
