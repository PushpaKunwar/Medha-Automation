/**
 * tests/regression/regression.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * REGRESSION SUITE — Full end-to-end happy flow for every major module.
 * Run after any feature change or release candidate to verify nothing regressed.
 *
 * Covers:
 *   REG01  Login happy flow          (TC01)
 *   REG02  Class Test happy flow     (TC07 – 5 data-driven entries)
 *   REG03  Worksheet happy flow      (TC11 – 5 data-driven entries)
 *   REG04  Collaboration happy flow  (TC16 – 8 data-driven entries)
 *
 * Run:  npx playwright test tests/regression --headed
 */

const { test, expect, URLS } = require('../../fixtures/baseFixture');
const { loginAndGoToDashboard } = require('../../utils/authHelper');
const { screenshotPass, screenshotFail } = require('../../utils/screenshot');

// ─── Data ────────────────────────────────────────────────────────────────────
const { activeClassTestData: classTestData }       = require('../../test-data/classTestData');
const { activeWorksheetData: worksheetData }       = require('../../test-data/worksheetData');
const { activeCollaborationData: collaborationData } = require('../../test-data/collaborationData');

// ─── Page objects ────────────────────────────────────────────────────────────
const { LessonPage }         = require('../../pages/lesson/LessonPage');
const { ClassTestListPage }  = require('../../pages/lesson/classtest/ClassTestListPage');
const { AddClassTestPage }   = require('../../pages/lesson/classtest/AddClassTestPage');
const { AddQuestionPage }    = require('../../pages/lesson/classtest/AddQuestionPage');
const { WorksheetPage }      = require('../../pages/lesson/worksheet/WorksheetPage');
const { CollaborationPage }  = require('../../pages/lesson/collaboration/CollaborationPage');

// ─── Question filters (shared for all class test entries) ─────────────────────
const Q_FILTERS = {
  chapter:      'Sound',
  topics:       'Reflection of Sound',
  questionType: 'Multiple Choice (Single Answer)',
  complexity:   'Easy',
  blooms:       'Remembering',
};

// ═══════════════════════════════════════════════════════════════════════════════
// REG01 — Login happy flow
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('REG01 - Login Happy Flow', () => {
  test.setTimeout(60_000);

  test('REG01 - Valid credentials load the dashboard', async ({ loginPage, dashboardPage, page }) => {
    const { credentials } = require('../../test-data/credentials');

    await loginPage.navigate();
    const isVisible = await loginPage.isLoginPageVisible().catch(() => false);
    if (isVisible) {
      const [res] = await Promise.all([
        page.waitForResponse(
          r => r.url().includes('/api/account/login') && r.request().method() === 'POST',
          { timeout: 15000 }
        ),
        loginPage.login(credentials.validUser.email, credentials.validUser.password),
      ]);
      expect(res.status()).toBe(200);
      await page.waitForTimeout(2000);
    }

    if (!page.url().includes(':5110')) {
      await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
    }

    await dashboardPage.waitForLoad(30000);
    expect(page.url()).toContain(':5110');
    console.log('  ✓ REG01 passed — Dashboard loaded');
    await screenshotPass(page, 'dashboard', 'REG01_login');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REG02 — Class Test happy flow  (data-driven CT01–CT05)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('REG02 - Class Test Happy Flow', () => {
  test.setTimeout(300_000);

  for (const data of classTestData) {
    test(`REG02-${data.id} - [${data.examName.replace(/\s\d{6}$/, '')} | ${data.startTime} | ${data.numQuestions}Q]`, async ({ page }) => {

      // ── Login ──────────────────────────────────────────────────────────────
      await loginAndGoToDashboard(page);
      expect(page.url()).toContain(':5110');

      // ── Pre-cleanup (CT01 only) ─────────────────────────────────────────────
      if (data.id === 'CT01') {
        try {
          const listPage = new ClassTestListPage(page);
          const prefixes = [...new Set(classTestData.map(d => d.examName.replace(/\s+\d{6}$/, '')))];
          console.log(`  🧹 REG02 pre-cleanup: removing old Sound class tests…`);
          for (const prefix of prefixes) {
            await listPage.deleteAllByName(prefix, 'Science');
          }
        } catch (cleanupErr) {
          console.log(`  ⚠ Pre-cleanup failed: ${cleanupErr.message.split('\n')[0]}`);
          console.log(`  ⚠ Continuing anyway — test will fail on API if slot is taken`);
        }
        await page.goto(URLS.dashboard, { waitUntil: 'commit', timeout: 20000 });
        await page.waitForTimeout(2000);
      }

      // ── Navigate to Add Class Test form ────────────────────────────────────
      // Navigate directly; retry once with a reload if the School dropdown doesn't appear
      // (handles cases where the React SPA context is stale after cleanup navigation)
      const formUrl = `${URLS.dashboard}classtest/AddNewClassTest`;
      await page.goto(formUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() =>
        page.goto(formUrl, { waitUntil: 'commit', timeout: 20000 })
      );
      const schoolTrigger = page.locator('[data-name="School"]').first();
      const formLoaded = await schoolTrigger.waitFor({ state: 'visible', timeout: 20000 })
        .then(() => true).catch(() => false);
      if (!formLoaded) {
        console.log('  ↻ Form not loaded — reloading page…');
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
        await schoolTrigger.waitFor({ state: 'visible', timeout: 20000 });
      }

      // ── Fill form ───────────────────────────────────────────────────────────
      const form = new AddClassTestPage(page);
      await form.selectDropdown('School',           data.school);
      await form.selectDropdown('Session',          data.session);
      await form.selectDropdown('Grade',            data.grade);
      await form.selectDropdown('Section',          data.section);
      await form.selectDropdown('Subject',          data.subject);
      await form.selectDropdown('Select Chapters',  data.chapter);
      await form.fillTextFields({
        examName:     data.examName,
        numQuestions: data.numQuestions,
        totalMarks:   data.totalMarks,
        examDate:     data.examDate,
        examDuration: data.examDuration,
        startTime:    data.startTime,
        resultTime:   data.resultTime,
      });
      await form.selectExamMode(data.examMode);
      await form.selectNotify(data.notify);
      await form.touchInstructions();

      // ── Save & Next ─────────────────────────────────────────────────────────
      const [saveRes] = await Promise.all([
        page.waitForResponse(r => /addClassTest/i.test(r.url()) && r.request().method() === 'POST', { timeout: 30000 }),
        form.clickSaveAndNext(),
      ]);
      const body = await saveRes.json().catch(() => ({}));
      console.log(`  Save API: ${saveRes.status()} | ${JSON.stringify(body)}`);
      expect(body.status, `[${data.id}] API must return 201`).toBe(201);
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('AddQuestion');

      // ── Add questions ───────────────────────────────────────────────────────
      const aq = new AddQuestionPage(page);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await aq.selectDropdown('Select Chapter',          Q_FILTERS.chapter);
      await aq.selectDropdown('Select Topics',           Q_FILTERS.topics);
      await aq.selectDropdown('Select Question Type',    Q_FILTERS.questionType);
      await aq.selectDropdown('Select Complexity',       Q_FILTERS.complexity);
      await aq.selectDropdown("Select Bloom's Taxonomy", Q_FILTERS.blooms);
      await aq.searchBtn.waitFor({ state: 'visible', timeout: 8000 });
      await aq.searchBtn.click();
      await aq.addArrows.first().waitFor({ state: 'visible', timeout: 20000 });
      const available = await aq.addArrows.count();
      expect(available).toBeGreaterThanOrEqual(data.numQuestions);
      await aq.addTopNQuestions(data.numQuestions);

      // ── Panel assertions ────────────────────────────────────────────────────
      await aq.expandSelectedQuestions();
      const panel = await aq.readPanelValues();
      expect(panel.maxQuestion).toBe(data.numQuestions);
      expect(panel.selectedQuestion).toBe(data.numQuestions);

      // ── Finalize ────────────────────────────────────────────────────────────
      await aq.clickAdjustByAi();
      await aq.clickSubmit();
      await aq.clickFinalizeOnly();
      console.log(`  ✅ REG02-${data.id} Finalized`);
      await screenshotPass(page, 'tc07', `REG02_${data.id}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REG03 — Worksheet happy flow  (data-driven WS01–WS05)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('REG03 - Worksheet Happy Flow', () => {
  test.setTimeout(180_000);

  for (const ws of worksheetData) {
    test(`REG03-${ws.id} - [${ws.subject} | ${ws.chapter} | ${ws.complexity}]`, async ({ page }) => {
      await loginAndGoToDashboard(page);

      const worksheetPage = new WorksheetPage(page);
      await worksheetPage.navigate();

      await worksheetPage.runWizardWithRetry(ws);
      await worksheetPage.fillPostGenerateForm(ws);
      await worksheetPage.clickSave();
      await worksheetPage.clickFinalizeWorksheet();

      const finalUrl = page.url();
      const onAssignmentList = finalUrl.includes('assignment') || finalUrl.includes('Worksheet');
      expect(onAssignmentList, `Expected assignment list or worksheet page after finalize, got: ${finalUrl}`).toBe(true);
      console.log(`  ✅ REG03-${ws.id} Finalized`);
      await screenshotPass(page, 'tc11', `REG03_${ws.id}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REG04 — Collaboration happy flow  (data-driven COL01–COL08)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('REG04 - Collaboration Happy Flow', () => {
  test.setTimeout(120_000);

  for (const col of collaborationData) {
    test(`REG04-${col.id} - [${col.subject} | ${col.chapter}]`, async ({ page }) => {
      await loginAndGoToDashboard(page);

      const collabPage = new CollaborationPage(page);
      await collabPage.navigate();
      await collabPage.clickAddCollaboration();
      await collabPage.fillForm(col);
      await collabPage.clickSubmit();
      await collabPage.verifyInListing(col);

      console.log(`  ✅ REG04-${col.id} Collaboration created`);
      await screenshotPass(page, 'tc16', `REG04_${col.id}`);
    });
  }
});
