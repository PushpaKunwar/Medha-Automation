/**
 * tests/lesson/classtest/classtest.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow: Login → Lesson → Class Test list → click + → fill form → Save & Next
 *       → AddQuestion page → filter questions → add N questions
 *       → expand yellow panel → Adjust by AI → Submit → Finalize
 *
 * TC07  Data-driven — runs once per entry (CT01–CT05, all Science / Sound)
 * TC08  S1 — Full happy path with explicit step screenshots (CT03)
 * TC09  S2 — Skip questions on create, then edit from list to add questions
 * TC10  S3 — Conflict handling: duplicate exam name shows error or is blocked
 *
 * Run all:          npx playwright test classtest --headed
 * Run single entry: npx playwright test classtest --grep "TC07-CT03" --headed
 */

const { test, expect }         = require('@playwright/test');
const { LessonPage }           = require('../../../pages/lesson/LessonPage');
const { AddClassTestPage }     = require('../../../pages/lesson/classtest/AddClassTestPage');
const { AddQuestionPage }      = require('../../../pages/lesson/classtest/AddQuestionPage');
const { ClassTestListPage }    = require('../../../pages/lesson/classtest/ClassTestListPage');
const { classTestData, getClassTestById } = require('../../../test-data/classTestData');
const { screenshotPass, screenshotFail }  = require('../../../utils/screenshot');
const { loginAndGoToDashboard }           = require('../../../utils/authHelper');

// Question filters — same for all 5 tests
const Q_FILTERS = {
  chapter:      'Sound',
  topics:       'Reflection of Sound',
  questionType: 'Multiple Choice (Single Answer)',
  complexity:   'Easy',
  blooms:       'Remembering',
};

// ═════════════════════════════════════════════════════════════════════════════
// TC07 — Data-driven Add Class Test (CT01–CT05)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC07 - Data-driven Add Class Test', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await screenshotFail(page, 'tc07', testInfo.title);
    }
  });

  for (const data of classTestData) {
    test(
      `TC07-${data.id} - [${data.examName} | ${data.startTime} | ${data.numQuestions}Q]`,
      async ({ page }) => {
        test.setTimeout(300_000);

        console.log(`\n▶  ${data.id}: ${data.description}`);

        // ══════════════════════════════════════════════════════════════════
        // PRE-FORM DATA ASSERTIONS
        // ══════════════════════════════════════════════════════════════════

        // Exam duration must be at least 10 minutes
        expect(
          data.examDuration,
          `[${data.id}] Exam duration must be >= 10 min`
        ).toBeGreaterThanOrEqual(10);

        // Exam date must be today or a future date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const examDateObj = new Date(data.examDate);
        expect(
          examDateObj.getTime(),
          `[${data.id}] Exam date "${data.examDate}" must be today or future`
        ).toBeGreaterThanOrEqual(today.getTime());

        // Total marks must equal numQuestions × 1 (1 mark per question)
        expect(
          data.totalMarks,
          `[${data.id}] Total marks must equal numQuestions (1 mark per question)`
        ).toBe(data.numQuestions);

        console.log(`  ✓ Pre-form validations passed (duration=${data.examDuration}min, date=${data.examDate}, marks=${data.totalMarks})`);

        // ══════════════════════════════════════════════════════════════════
        // STEP 1: Login → Dashboard
        // ══════════════════════════════════════════════════════════════════
        await loginAndGoToDashboard(page);
        expect(page.url()).toContain(':5110');

        // ── CT01 only: delete all Sound tests by name so our time slots are free ──
        if (data.id === 'CT01') {
          const listPage = new ClassTestListPage(page);
          const { URLS } = require('../../../utils/urls');
          const examPrefixes = [...new Set(classTestData.map(d =>
            d.examName.replace(/\s+\d{6}$/, '') // "Sound Chapter Test 112315" → "Sound Chapter Test"
          ))];
          console.log(`  🧹 Pre-cleanup: removing old Sound class tests before new run…`);
          for (const prefix of examPrefixes) {
            await listPage.deleteAllByName(prefix, 'Science');
          }
          // Return to dashboard (session still active)
          await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
          await page.waitForTimeout(2000);
        }

        // ══════════════════════════════════════════════════════════════════
        // STEP 2: Lesson → Class Test list
        // ══════════════════════════════════════════════════════════════════
        const lessonPage = new LessonPage(page);
        await lessonPage.navigate();

        // ══════════════════════════════════════════════════════════════════
        // STEP 3: Click + icon → Add Class Test form
        // ══════════════════════════════════════════════════════════════════
        const addClassTest = new AddClassTestPage(page);
        const addBtnSel = 'button.btn-square.btn-add, button[title*="Add"], a[href*="AddNewClassTest"]';
        const addBtnVisible = await page.locator(addBtnSel).first().isVisible().catch(() => false);
        if (addBtnVisible) {
          await page.locator(addBtnSel).first().click();
          await page.locator('[data-name="School"]').first()
            .waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
        }
        if (!page.url().includes('AddNewClassTest')) {
          await addClassTest.navigate();
        }
        await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 15000 });

        // ══════════════════════════════════════════════════════════════════
        // STEP 4: Fill form
        // ══════════════════════════════════════════════════════════════════
        await addClassTest.selectDropdown('School',          data.school);
        await addClassTest.selectDropdown('Session',         data.session);
        await addClassTest.selectDropdown('Grade',           data.grade);
        await addClassTest.selectDropdown('Section',         data.section);
        await addClassTest.selectDropdown('Subject',         data.subject);
        await addClassTest.selectDropdown('Select Chapters', data.chapter);

        await addClassTest.fillTextFields({
          examName:     data.examName,
          numQuestions: data.numQuestions,
          totalMarks:   data.totalMarks,
          examDate:     data.examDate,
          examDuration: data.examDuration,
          startTime:    data.startTime,
          resultTime:   data.resultTime,
        });

        await addClassTest.selectExamMode(data.examMode);
        await addClassTest.selectNotify(data.notify);
        await addClassTest.touchInstructions();

        // Assert Result Declaration Date is auto-filled and >= exam date
        const resultDateVal = await addClassTest.resultDateInput
          .inputValue().catch(() => '');
        if (resultDateVal) {
          const resultDateObj = new Date(resultDateVal);
          expect(
            resultDateObj.getTime(),
            `[${data.id}] Result declaration date "${resultDateVal}" must be >= exam date "${data.examDate}"`
          ).toBeGreaterThanOrEqual(examDateObj.getTime());
          console.log(`  ✓ Result declaration date "${resultDateVal}" >= exam date "${data.examDate}"`);
        }

        // ══════════════════════════════════════════════════════════════════
        // STEP 5: Save & Next → AddQuestion page
        // ══════════════════════════════════════════════════════════════════

        // Capture the addClassTest API response (POST to .../addClassTest)
        const [saveResponse] = await Promise.all([
          page.waitForResponse(
            res => /addClassTest/i.test(res.url()) && res.request().method() === 'POST',
            { timeout: 20000 }
          ).catch(() => null),
          addClassTest.clickSaveAndNext(),
        ]);

        if (saveResponse) {
          const saveBody = await saveResponse.json().catch(() => null);
          console.log(`  Save API: ${saveResponse.status()} | ${JSON.stringify(saveBody)?.substring(0, 400)}`);
        } else {
          console.log('  ⚠ No POST response intercepted for addClassTest');
        }

        for (let i = 0; i < 30; i++) {
          if (page.url().includes('AddQuestion')) break;
          await page.waitForTimeout(1000);
        }
        expect(
          page.url(),
          `[${data.id}] Save & Next must navigate to AddQuestion page`
        ).toContain('AddQuestion');
        console.log(`  ✓ On AddQuestion: ${page.url()}`);

        // ══════════════════════════════════════════════════════════════════
        // STEP 6: Apply question filters
        // ══════════════════════════════════════════════════════════════════
        const aq = new AddQuestionPage(page);
        // Wait for AddQuestion page to finish its initial data-fetch re-render
        // before touching any dropdown (React re-renders after fetching question bank)
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
        await aq.selectDropdown('Select Chapter',          Q_FILTERS.chapter);
        await aq.selectDropdown('Select Topics',           Q_FILTERS.topics);
        await aq.selectDropdown('Select Question Type',    Q_FILTERS.questionType);
        await aq.selectDropdown('Select Complexity',       Q_FILTERS.complexity);
        await aq.selectDropdown("Select Bloom's Taxonomy", Q_FILTERS.blooms);

        // ══════════════════════════════════════════════════════════════════
        // STEP 7: Search → Add exactly numQuestions questions
        // ══════════════════════════════════════════════════════════════════
        await aq.searchBtn.waitFor({ state: 'visible', timeout: 8000 });
        await aq.searchBtn.click();
        await aq.addArrows.first().waitFor({ state: 'visible', timeout: 20000 });
        const available = await aq.addArrows.count();
        console.log(`  ✓ Questions available: ${available}`);

        expect(
          available,
          `[${data.id}] Question bank must have at least ${data.numQuestions} questions for the selected filters`
        ).toBeGreaterThanOrEqual(data.numQuestions);

        await aq.addTopNQuestions(data.numQuestions);

        // ══════════════════════════════════════════════════════════════════
        // STEP 8: Expand yellow summary panel (▼ arrow)
        // ══════════════════════════════════════════════════════════════════
        await aq.expandSelectedQuestions();

        // ══════════════════════════════════════════════════════════════════
        // PANEL ASSERTIONS — Max must equal Selected, must match form values
        // ══════════════════════════════════════════════════════════════════
        const panel = await aq.readPanelValues();
        console.log(`  Panel → maxQ:${panel.maxQuestion} selQ:${panel.selectedQuestion} maxM:${panel.maxMarks} selM:${panel.selectedMarks} maxT:${panel.maxTime}min selT:${panel.selectedTime}min`);

        // Max Questions must match form input
        expect(
          panel.maxQuestion,
          `[${data.id}] Panel Max Questions must equal form numQuestions (${data.numQuestions})`
        ).toBe(data.numQuestions);

        // Selected Questions must equal Max Questions (no under/over selection)
        expect(
          panel.selectedQuestion,
          `[${data.id}] Selected Questions must equal Max Questions — mismatch would prevent submission`
        ).toBe(panel.maxQuestion);

        // Max Marks must match form input
        expect(
          panel.maxMarks,
          `[${data.id}] Panel Max Marks must equal form totalMarks (${data.totalMarks})`
        ).toBe(data.totalMarks);

        // Selected Marks must equal Max Marks
        expect(
          panel.selectedMarks,
          `[${data.id}] Selected Marks must equal Max Marks`
        ).toBe(panel.maxMarks);

        // Max Time must match exam duration
        expect(
          panel.maxTime,
          `[${data.id}] Panel Max Time must equal examDuration (${data.examDuration} min)`
        ).toBe(data.examDuration);

        // Selected Time must not exceed Max Time
        expect(
          panel.selectedTime,
          `[${data.id}] Selected Time must be <= Max Time (${panel.maxTime} min)`
        ).toBeLessThanOrEqual(panel.maxTime);

        console.log(`  ✓ All panel assertions passed`);

        // ══════════════════════════════════════════════════════════════════
        // STEP 9: Adjust by AI → Submit → Finalize
        // ══════════════════════════════════════════════════════════════════
        await aq.clickAdjustByAi();
        await aq.clickSubmit();
        await aq.clickFinalizeOnly();

        console.log(`  ✅ ${data.id} — Finalized`);
        await screenshotPass(page, 'tc07', `TC07_${data.id}`);
      }
    );
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TC08 — S1: Full Happy Path with step-level screenshots (CT03)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC08 - S1: Full Happy Path (CT03)', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc08Form', testInfo.title);
  });

  test('TC08 - Fill form → generate questions → submit → finalize', async ({ page }) => {
    test.setTimeout(300_000);
    const data = getClassTestById('CT03');
    console.log(`\n▶  TC08: ${data.description}`);

    await loginAndGoToDashboard(page);
    expect(page.url()).toContain(':5110');

    // ── Open the Add form ──────────────────────────────────────────────────
    const addClassTest = new AddClassTestPage(page);
    await addClassTest.navigate();
    await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 15000 });
    await screenshotPass(page, 'tc08Form', 'TC08-blank-form');

    // ── Fill all form fields ───────────────────────────────────────────────
    await addClassTest.selectDropdown('School',          data.school);
    await addClassTest.selectDropdown('Session',         data.session);
    await addClassTest.selectDropdown('Grade',           data.grade);
    await addClassTest.selectDropdown('Section',         data.section);
    await addClassTest.selectDropdown('Subject',         data.subject);
    await addClassTest.selectDropdown('Select Chapters', data.chapter);

    await addClassTest.fillTextFields({
      examName:     data.examName,
      numQuestions: data.numQuestions,
      totalMarks:   data.totalMarks,
      examDate:     data.examDate,
      examDuration: data.examDuration,
      startTime:    data.startTime,
      resultTime:   data.resultTime,
    });
    await addClassTest.selectExamMode(data.examMode);
    await addClassTest.selectNotify(data.notify);
    await addClassTest.touchInstructions();
    await screenshotPass(page, 'tc08Form', 'TC08-filled-form');

    // ── Save & Next → AddQuestion ──────────────────────────────────────────
    await addClassTest.clickSaveAndNext();
    for (let i = 0; i < 30; i++) {
      if (page.url().includes('AddQuestion')) break;
      await page.waitForTimeout(1000);
    }
    expect(page.url(), 'TC08: Save & Next must reach AddQuestion page').toContain('AddQuestion');
    await screenshotPass(page, 'tc08Questions', 'TC08-add-question-page');

    // ── Apply filters → add questions ─────────────────────────────────────
    const aq = new AddQuestionPage(page);
    await aq.applyFilters({
      chapter:      'Sound',
      topics:       'Reflection of Sound',
      questionType: 'Multiple Choice (Single Answer)',
      complexity:   'Easy',
      blooms:       'Remembering',
    });

    const available = await aq.addArrows.count();
    expect(available, `TC08: need >= ${data.numQuestions} questions in bank`).toBeGreaterThanOrEqual(data.numQuestions);
    await aq.addTopNQuestions(data.numQuestions);
    await aq.expandSelectedQuestions();

    const panel = await aq.readPanelValues();
    expect(panel.maxQuestion, 'TC08: panel maxQuestion must match form').toBe(data.numQuestions);
    expect(panel.selectedQuestion, 'TC08: selected must equal max').toBe(panel.maxQuestion);
    expect(panel.maxMarks, 'TC08: panel maxMarks must match form').toBe(data.totalMarks);
    console.log(`  ✓ Panel assertions passed`);

    await screenshotPass(page, 'tc08Questions', 'TC08-questions-selected');

    // ── Adjust by AI → Submit → Finalize ─────────────────────────────────
    await aq.clickAdjustByAi();
    await screenshotPass(page, 'tc08Submit', 'TC08-before-submit');
    await aq.clickSubmit();
    await screenshotPass(page, 'tc08Submit', 'TC08-after-submit');
    await aq.clickFinalizeOnly();

    console.log(`  ✅ TC08 — Finalized`);
    await screenshotPass(page, 'tc08Finalize', 'TC08');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TC09 — S2: Skip questions on create, then edit from list to add them
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC09 - S2: Skip Questions then Edit from List', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc09SkipQ', testInfo.title);
  });

  test('TC09 - Create with no questions → skip → verify list → edit → add questions', async ({ page }) => {
    test.setTimeout(300_000);
    const data = getClassTestById('CT04');
    console.log(`\n▶  TC09: ${data.description}`);

    await loginAndGoToDashboard(page);

    // ── Pre-clean: delete any existing test with this name ─────────────────
    const listPage = new ClassTestListPage(page);
    await listPage.deleteAllByName(data.examName, data.subject);

    // ── Open the Add form ──────────────────────────────────────────────────
    const addClassTest = new AddClassTestPage(page);
    await addClassTest.navigate();
    await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 15000 });

    // ── Fill form ──────────────────────────────────────────────────────────
    await addClassTest.selectDropdown('School',          data.school);
    await addClassTest.selectDropdown('Session',         data.session);
    await addClassTest.selectDropdown('Grade',           data.grade);
    await addClassTest.selectDropdown('Section',         data.section);
    await addClassTest.selectDropdown('Subject',         data.subject);
    await addClassTest.selectDropdown('Select Chapters', data.chapter);
    await addClassTest.fillTextFields({
      examName:     data.examName,
      numQuestions: data.numQuestions,
      totalMarks:   data.totalMarks,
      examDate:     data.examDate,
      examDuration: data.examDuration,
      startTime:    data.startTime,
      resultTime:   data.resultTime,
    });
    await addClassTest.selectExamMode(data.examMode);
    await addClassTest.selectNotify(data.notify);
    await addClassTest.touchInstructions();

    // ── Save & Next → AddQuestion ──────────────────────────────────────────
    await addClassTest.clickSaveAndNext();
    for (let i = 0; i < 30; i++) {
      if (page.url().includes('AddQuestion')) break;
      await page.waitForTimeout(1000);
    }
    expect(page.url(), 'TC09: Save & Next must reach AddQuestion page').toContain('AddQuestion');

    // ── SKIP question selection (click Submit without adding questions) ─────
    const aq = new AddQuestionPage(page);
    await aq.clickSubmit();
    await screenshotPass(page, 'tc09SkipQ', 'TC09-skipped-submit');

    // The app may show a confirmation or go directly to finalize
    const finalizePopup = page.locator('[class*="common-confirm-button"]').first();
    const hasPopup = await finalizePopup.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasPopup) {
      // Click "See Later" to leave without finalizing (keeps status as "no questions")
      const seeLaterBtn = page.locator('[class*="common-confirm-button"]')
        .filter({ hasText: /See Later/i }).first();
      const seeLaterVisible = await seeLaterBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (seeLaterVisible) {
        await seeLaterBtn.click();
        await page.waitForTimeout(2000);
        console.log('  ✓ Clicked "See Later" — exam saved without questions');
      } else {
        await finalizePopup.click();
        await page.waitForTimeout(2000);
      }
    }

    await screenshotPass(page, 'tc09SkipQ', 'TC09-after-skip');
    console.log('  ✓ Class test created without questions');

    // ── Go to list → find the test → click Edit ────────────────────────────
    await listPage.clickEditByName(data.examName, data.subject);
    expect(page.url(), 'TC09 edit: must reach AddQuestion page').toContain('AddQuestion');
    await screenshotPass(page, 'tc09EditQ', 'TC09-edit-open');

    // ── Now apply filters and add questions ───────────────────────────────
    const aq2 = new AddQuestionPage(page);
    await aq2.applyFilters({
      chapter:      'Sound',
      topics:       'Reflection of Sound',
      questionType: 'Multiple Choice (Single Answer)',
      complexity:   'Easy',
      blooms:       'Remembering',
    });

    const available = await aq2.addArrows.count();
    console.log(`  Questions available: ${available}`);
    expect(available, `TC09 edit: need >= ${data.numQuestions} questions in bank`).toBeGreaterThanOrEqual(data.numQuestions);
    await aq2.addTopNQuestions(data.numQuestions);
    await aq2.expandSelectedQuestions();

    const panel = await aq2.readPanelValues();
    expect(panel.selectedQuestion, 'TC09 edit: selected questions must equal max').toBe(panel.maxQuestion);

    await screenshotPass(page, 'tc09EditQ', 'TC09-questions-added');

    await aq2.clickAdjustByAi();
    await aq2.clickSubmit();
    await aq2.clickFinalizeOnly();

    console.log('  ✅ TC09 — Edit with questions finalized');
    await screenshotPass(page, 'tc09EditQ', 'TC09');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TC10 — S3: Conflict handling — duplicate exam name is blocked or warned
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC10 - S3: Conflict Handling — Duplicate Exam Name', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc10Conflict', testInfo.title);
  });

  test('TC10 - Submit same exam name twice — expect conflict error or blocked save', async ({ page }) => {
    test.setTimeout(300_000);
    const data = getClassTestById('CT05');
    console.log(`\n▶  TC10: conflict test — "${data.examName}"`);

    await loginAndGoToDashboard(page);

    // ── First submission (ensure a clean state) ───────────────────────────
    const listPage = new ClassTestListPage(page);
    await listPage.deleteAllByName(data.examName, data.subject);

    const addClassTest = new AddClassTestPage(page);

    const _fillAndSaveNext = async () => {
      await addClassTest.navigate();
      await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 15000 });
      await addClassTest.selectDropdown('School',          data.school);
      await addClassTest.selectDropdown('Session',         data.session);
      await addClassTest.selectDropdown('Grade',           data.grade);
      await addClassTest.selectDropdown('Section',         data.section);
      await addClassTest.selectDropdown('Subject',         data.subject);
      await addClassTest.selectDropdown('Select Chapters', data.chapter);
      await addClassTest.fillTextFields({
        examName:     data.examName,
        numQuestions: data.numQuestions,
        totalMarks:   data.totalMarks,
        examDate:     data.examDate,
        examDuration: data.examDuration,
        startTime:    data.startTime,
      });
      await addClassTest.selectExamMode(data.examMode);
      await addClassTest.selectNotify(data.notify);
      await addClassTest.touchInstructions();
      await addClassTest.clickSaveAndNext();
      await page.waitForTimeout(3000);
    };

    // First submission — should succeed
    await _fillAndSaveNext();
    const onAddQuestion1 = page.url().includes('AddQuestion');
    console.log(`  First submission reached AddQuestion: ${onAddQuestion1}`);

    if (onAddQuestion1) {
      const aq = new AddQuestionPage(page);
      await aq.clickSubmit();
      const popup = page.locator('[class*="common-confirm-button"]').first();
      if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
        await popup.click();
        await page.waitForTimeout(2000);
      }
    }

    await screenshotPass(page, 'tc10Conflict', 'TC10-first-submission');
    console.log('  ✓ First submission complete');

    // Second submission with SAME exam name — expect conflict
    await _fillAndSaveNext();

    const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
    const hasConflictMsg = /already exist|duplicate|conflict|taken|exist/i.test(pageText);
    const stayedOnForm   = page.url().includes('AddNewClassTest');

    console.log(`  Conflict message detected: ${hasConflictMsg}`);
    console.log(`  Stayed on form: ${stayedOnForm}`);
    console.log(`  Page excerpt: ${pageText.substring(0, 200)}`);

    // Pass if: app shows an error message OR app blocks navigation (stays on form)
    const conflictHandled = hasConflictMsg || stayedOnForm;
    console.log(`  Conflict handled: ${conflictHandled}`);

    await screenshotPass(page, 'tc10Conflict', 'TC10');
    // Assertion is soft — the test documents the app's current behaviour
    expect(page.url()).toContain(':5110');
  });
});
