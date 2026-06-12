/**
 * tests/lesson/worksheet/worksheet.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC11  Data-driven Create Worksheet (WS01–WS05)
 * TC12  S1 — Full happy path: wizard → generate → save → verify list
 * TC13  S2 — Create then delete
 * TC14  S3 — Edit an existing worksheet
 * TC15  S4 — Step-by-step wizard with screenshot per step
 *
 * Run all:          npx playwright test worksheet --headed
 * Run single entry: npx playwright test worksheet --grep "TC11-WS01" --headed
 */

const path = require('path');
const { test, expect }    = require('@playwright/test');
const { WorksheetPage }   = require('../../../pages/lesson/worksheet/WorksheetPage');
const { worksheetData, getWorksheetById } = require('../../../test-data/worksheetData');
const { screenshotPass, screenshotFail, FOLDERS } = require('../../../utils/screenshot');
const { loginAndGoToDashboard }                   = require('../../../utils/authHelper');

// ─── helper: screenshot at each step ────────────────────────────────────────
const fs = require('fs');
async function snap(page, id, label) {
  try {
    const dir = FOLDERS.tc11;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ts   = Date.now();
    const file = path.join(dir, `${id}_${label}_${ts}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  📸 ${path.basename(file)}`);
  } catch (_) {}
}

// ═════════════════════════════════════════════════════════════════════════════
// TC11 — Data-driven Create Worksheet (WS01–WS05)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC11 - Data-driven Create Worksheet', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await screenshotFail(page, 'tc11', testInfo.title);
    }
  });

  for (const data of worksheetData) {
    test(
      `TC11-${data.id} - [${data.subject} | ${data.chapter} | ${data.complexity} | ${data.blooms.join('+')}]`,
      async ({ page }) => {
        test.setTimeout(600_000);   // 10 min — allow for login + up to 3 wizard retries
        const id = data.id;
        console.log(`\n▶  ${id}: ${data.description}`);

        // ── PRE-BROWSER ASSERTIONS ──────────────────────────────────────────
        expect(data.submissionDate, `[${id}] Submission Date must not be blank`).toBeTruthy();
        expect(data.evaluationDate, `[${id}] Evaluation Date must not be blank`).toBeTruthy();
        expect(data.resultDate,     `[${id}] Result Date must not be blank`).toBeTruthy();

        const subDate  = new Date(data.submissionDate);
        const evalDate = new Date(data.evaluationDate);
        const resDate  = new Date(data.resultDate);

        expect(subDate.getTime(),
          `[${id}] Submission Date (${data.submissionDate}) must be < Evaluation Date (${data.evaluationDate})`
        ).toBeLessThan(evalDate.getTime());

        expect(evalDate.getTime(),
          `[${id}] Evaluation Date (${data.evaluationDate}) must be < Result Date (${data.resultDate})`
        ).toBeLessThan(resDate.getTime());

        console.log(`  ✓ Pre-browser assertions passed`);

        // ── STEP 1: Login ────────────────────────────────────────────────────
        await loginAndGoToDashboard(page);
        expect(page.url()).toContain(':5110');
        console.log(`  ✓ Logged in: ${page.url()}`);

        // ── STEP 2: Navigate to Worksheet list ──────────────────────────────
        const worksheet = new WorksheetPage(page);
        await worksheet.navigate();
        expect(page.url()).toContain('assignment');
        await snap(page, id, '01_list');

        // ── STEP 3: Click "WORKSHEET BY" button ─────────────────────────────
        await worksheet.clickCreateWorksheet();
        await snap(page, id, '02_wizard_open');

        // ── STEPS 4-13: Run all 10 wizard steps with auto-retry on no-data ──
        // If the Subject campus dropdown (Step 3) loads empty, the wizard is
        // abandoned, the page is refreshed, and the full wizard is restarted
        // (up to 3 attempts total). User instruction: "if it comes no data
        // refresh and start fresh".
        await worksheet.runWizardWithRetry({
          type:         data.type,
          preference:   data.preference,
          subject:      data.subject,
          chapter:      data.chapter,
          topic:        data.topic,
          method:       data.method,
          questionType: data.questionType,
          complexity:   data.complexity,
          blooms:       data.blooms,
          numQuestions: data.numQuestions,
        });
        await snap(page, id, '12_step10_generate');

        // ── STEP 14: Fill post-generate form ─────────────────────────────────
        await worksheet.fillPostGenerateForm({
          evaluation:     data.evaluation,
          submissionDate: data.submissionDate,
          evaluationDate: data.evaluationDate,
          resultDate:     data.resultDate,
        });
        await snap(page, id, '13_postgenerate_form');

        // ── STEP 15: Save → Finalize ──────────────────────────────────────────
        await worksheet.clickSave();
        await snap(page, id, '14_after_save');

        await worksheet.clickFinalizeWorksheet();
        await snap(page, id, '15_after_finalize');

        // ── POST-FINALIZE: verify back on worksheet list ───────────────────────
        for (let i = 0; i < 20; i++) {
          if (page.url().includes('assignment')) break;
          await page.waitForTimeout(500);
        }

        const finalUrl = page.url();
        console.log(`  ✓ Final URL: ${finalUrl}`);
        expect(finalUrl,
          `[${id}] After Finalize must return to worksheet list (/assignment)`
        ).toContain('assignment');

        console.log(`  ✅ ${id} — Worksheet created and finalized`);
        await screenshotPass(page, 'tc11', `TC11_${id}`);
      }
    );
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TC12 — S1: Full happy path — wizard → generate → save → verify list row
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC12 - S1: Full Happy Path', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc12Create', testInfo.title);
  });

  test('TC12 - Complete worksheet wizard and confirm it appears in the list', async ({ page }) => {
    test.setTimeout(600_000);
    const data = getWorksheetById('WS03');
    console.log(`\n▶  TC12: ${data.description}`);

    await loginAndGoToDashboard(page);
    expect(page.url()).toContain(':5110');

    const worksheet = new WorksheetPage(page);
    await worksheet.navigate();
    expect(page.url()).toContain('assignment');
    await snap(page, 'TC12', '01_list');

    // ── Create ─────────────────────────────────────────────────────────────
    await worksheet.clickCreateWorksheet();
    await worksheet.runWizardWithRetry({
      type:         data.type,
      preference:   data.preference,
      subject:      data.subject,
      chapter:      data.chapter,
      topic:        data.topic,
      method:       data.method,
      questionType: data.questionType,
      complexity:   data.complexity,
      blooms:       data.blooms,
      numQuestions: data.numQuestions,
    });
    await snap(page, 'TC12', '02_generated');
    await screenshotPass(page, 'tc12Create', 'TC12-generated');

    await worksheet.fillPostGenerateForm({
      evaluation:     data.evaluation,
      submissionDate: data.submissionDate,
      evaluationDate: data.evaluationDate,
      resultDate:     data.resultDate,
    });
    await snap(page, 'TC12', '03_form_filled');

    await worksheet.clickSave();
    await worksheet.clickFinalizeWorksheet();
    await snap(page, 'TC12', '04_finalized');

    // ── Verify list ────────────────────────────────────────────────────────
    for (let i = 0; i < 20; i++) {
      if (page.url().includes('assignment')) break;
      await page.waitForTimeout(500);
    }
    expect(page.url(), 'TC12: must redirect to /assignment after finalize').toContain('assignment');

    // Search for the new worksheet
    await worksheet.applyFilters({ subject: data.subject });
    const row = page.locator('table tbody tr, .worksheet-row').first();
    const rowVisible = await row.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`  Worksheet row visible in list: ${rowVisible}`);

    await screenshotPass(page, 'tc12Verify', 'TC12-list');
    expect(rowVisible, 'TC12: at least one worksheet row must appear after creation').toBe(true);

    await screenshotPass(page, 'tc12Verify', 'TC12');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TC13 — S2: Create then delete — row count decreases after delete
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC13 - S2: Create then Delete', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc13Create', testInfo.title);
  });

  test('TC13 - Create a worksheet, then delete it from the list', async ({ page }) => {
    test.setTimeout(600_000);
    const data = getWorksheetById('WS04');
    console.log(`\n▶  TC13: ${data.description}`);

    await loginAndGoToDashboard(page);

    const worksheet = new WorksheetPage(page);
    await worksheet.navigate();

    // ── Create ─────────────────────────────────────────────────────────────
    await worksheet.clickCreateWorksheet();
    await worksheet.runWizardWithRetry({
      type:         data.type,
      preference:   data.preference,
      subject:      data.subject,
      chapter:      data.chapter,
      topic:        data.topic,
      method:       data.method,
      questionType: data.questionType,
      complexity:   data.complexity,
      blooms:       data.blooms,
      numQuestions: data.numQuestions,
    });
    await worksheet.fillPostGenerateForm({
      evaluation:     data.evaluation,
      submissionDate: data.submissionDate,
      evaluationDate: data.evaluationDate,
      resultDate:     data.resultDate,
    });
    await worksheet.clickSave();
    await worksheet.clickFinalizeWorksheet();

    for (let i = 0; i < 20; i++) {
      if (page.url().includes('assignment')) break;
      await page.waitForTimeout(500);
    }

    await screenshotPass(page, 'tc13Create', 'TC13-created');

    // ── Count rows before delete ────────────────────────────────────────────
    await worksheet.applyFilters({ subject: data.subject });
    const rowsBefore = await page.locator('table tbody tr').count().catch(() => 0);
    console.log(`  Rows before delete: ${rowsBefore}`);
    expect(rowsBefore, 'TC13: must have at least one row before delete').toBeGreaterThan(0);

    // ── Delete by matching topic text in a row ─────────────────────────────
    // Try deleteByTitle; fall back to deleting the first row
    try {
      await worksheet.deleteByTitle(data.topic);
    } catch (_) {
      console.log('  ⚠ deleteByTitle failed — deleting first row directly');
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.hover().catch(() => {});
      const deleteIcon = firstRow.locator('span.material-symbols-outlined')
        .filter({ hasText: 'delete' }).first();
      await deleteIcon.click();
      const confirmBtn = page.locator('button:has-text("Yes"), .swal2-confirm').first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await screenshotPass(page, 'tc13Delete', 'TC13-deleted');

    // ── Count rows after delete ────────────────────────────────────────────
    await worksheet.applyFilters({ subject: data.subject });
    const rowsAfter = await page.locator('table tbody tr').count().catch(() => 0);
    console.log(`  Rows after delete: ${rowsAfter}`);

    expect(rowsAfter, 'TC13: rows must decrease after delete').toBeLessThan(rowsBefore);
    await screenshotPass(page, 'tc13Delete', 'TC13');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TC14 — S3: Edit an existing worksheet — edit form opens correctly
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC14 - S3: Edit Existing Worksheet', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc14Edit', testInfo.title);
  });

  test('TC14 - Open Edit on first worksheet — form or wizard loads', async ({ page }) => {
    test.setTimeout(600_000);
    console.log('\n▶  TC14: Edit worksheet');

    await loginAndGoToDashboard(page);

    const worksheet = new WorksheetPage(page);
    await worksheet.navigate();
    await worksheet.applyFilters({});   // load list without filters

    // If list is empty, create one first (WS05)
    const hasRows = await page.locator('table tbody tr').first()
      .isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasRows) {
      console.log('  ℹ No worksheets in list — creating one first (WS05)');
      const d = getWorksheetById('WS05');
      await worksheet.clickCreateWorksheet();
      await worksheet.runWizardWithRetry({
        type: d.type, preference: d.preference, subject: d.subject,
        chapter: d.chapter, topic: d.topic, method: d.method,
        questionType: d.questionType, complexity: d.complexity,
        blooms: d.blooms, numQuestions: d.numQuestions,
      });
      await worksheet.fillPostGenerateForm({
        evaluation: d.evaluation, submissionDate: d.submissionDate,
        evaluationDate: d.evaluationDate, resultDate: d.resultDate,
      });
      await worksheet.clickSave();
      await worksheet.clickFinalizeWorksheet();
      for (let i = 0; i < 20; i++) {
        if (page.url().includes('assignment')) break;
        await page.waitForTimeout(500);
      }
      await worksheet.applyFilters({});
    }

    // ── Get title of the first row for later verification ─────────────────
    const firstRowText = await page.locator('table tbody tr').first()
      .innerText().catch(() => '');
    console.log(`  Editing row: "${firstRowText.substring(0, 60)}"`);

    // Click Edit on the first row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.hover().catch(() => {});
    await page.waitForTimeout(300);

    const editIcon = firstRow.locator('span.material-symbols-outlined')
      .filter({ hasText: 'edit' }).first();
    const editVisible = await editIcon.isVisible({ timeout: 5000 }).catch(() => false);

    if (editVisible) {
      await editIcon.click();
    } else {
      // Fallback: any Edit button / link in the row
      const editBtn = firstRow.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      await editBtn.click();
    }

    await page.waitForTimeout(3000);
    console.log('  Edit URL:', page.url());
    await screenshotPass(page, 'tc14Edit', 'TC14-edit-open');

    // Edit form or wizard should be visible — accept any of these indicators
    const editFormVisible = await page.locator([
      'button:has-text("Save")',
      'button:has-text("SAVE")',
      'button:has-text("Update")',
      'button:has-text("Next")',
      '[data-name="Subject"]',
      'input[type="date"]',
    ].join(', ')).first().isVisible({ timeout: 8000 }).catch(() => false);

    console.log('  Edit form visible:', editFormVisible);
    expect(page.url(), 'TC14: must stay on :5110 after clicking Edit').toContain(':5110');
    expect(editFormVisible, 'TC14: edit form must open with Save/Next/date inputs').toBe(true);

    await screenshotPass(page, 'tc14Edit', 'TC14');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TC15 — S4: Step-by-step wizard — screenshot at every step
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC15 - S4: Step-by-step Wizard Verification', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') await screenshotFail(page, 'tc15Wizard', testInfo.title);
  });

  test('TC15 - Walk through all 10 wizard steps individually with a screenshot each', async ({ page }) => {
    test.setTimeout(600_000);
    const data = getWorksheetById('WS01');
    console.log(`\n▶  TC15: Step-by-step wizard — ${data.description}`);

    await loginAndGoToDashboard(page);

    const worksheet = new WorksheetPage(page);
    await worksheet.navigate();
    await worksheet.clickCreateWorksheet();
    await snap(page, 'TC15', '00_wizard_open');

    // ── Step 1: Type ─────────────────────────────────────────────────────────
    await worksheet.wizardStep1_selectType(data.type);
    await snap(page, 'TC15', '01_type');

    // ── Step 2: Preference ────────────────────────────────────────────────────
    await worksheet.wizardStep2_selectPreference(data.preference);
    await snap(page, 'TC15', '02_preference');

    // ── Step 3: Subject ───────────────────────────────────────────────────────
    await worksheet.wizardStep3_selectSubject(data.subject);
    await snap(page, 'TC15', '03_subject');

    // ── Step 4: Chapter ───────────────────────────────────────────────────────
    await worksheet.wizardStep4_selectChapter(data.chapter);
    await snap(page, 'TC15', '04_chapter');

    // ── Step 5: Topic ─────────────────────────────────────────────────────────
    await worksheet.wizardStep5_selectTopic(data.topic);
    await snap(page, 'TC15', '05_topic');

    // ── Step 6: Method ────────────────────────────────────────────────────────
    await worksheet.wizardStep6_selectGenerationMethod(data.method);
    await snap(page, 'TC15', '06_method');

    // ── Step 7: Question type ─────────────────────────────────────────────────
    await worksheet.wizardStep7_selectQuestionType(data.questionType);
    await snap(page, 'TC15', '07_question_type');

    // ── Step 8: Complexity ────────────────────────────────────────────────────
    await worksheet.wizardStep8_selectComplexity(data.complexity);
    await snap(page, 'TC15', '08_complexity');

    // ── Step 9: Bloom's taxonomy ─────────────────────────────────────────────
    await worksheet.wizardStep9_selectBlooms(data.blooms);
    await snap(page, 'TC15', '09_blooms');

    // ── Step 10: Number of questions + Generate ───────────────────────────────
    await worksheet.wizardStep10_enterQuestionsAndGenerate(data.numQuestions);
    await snap(page, 'TC15', '10_generated');

    // Post-generate form must appear
    const postFormVisible = await page.locator([
      'input[name*="submission" i]',
      'input[id*="submission" i]',
      'button:has-text("Save")',
      'button:has-text("SAVE")',
    ].join(', ')).first().isVisible({ timeout: 15000 }).catch(() => false);

    expect(postFormVisible, 'TC15: post-generate form must appear after wizard Step 10').toBe(true);
    await snap(page, 'TC15', '11_post_generate_form');

    // ── Fill post-generate form + save ─────────────────────────────────────
    await worksheet.fillPostGenerateForm({
      evaluation:     data.evaluation,
      submissionDate: data.submissionDate,
      evaluationDate: data.evaluationDate,
      resultDate:     data.resultDate,
    });

    await worksheet.clickSave();
    await worksheet.clickFinalizeWorksheet();
    await snap(page, 'TC15', '12_finalized');

    for (let i = 0; i < 20; i++) {
      if (page.url().includes('assignment')) break;
      await page.waitForTimeout(500);
    }
    expect(page.url(), 'TC15: must return to /assignment after finalize').toContain('assignment');

    console.log('  ✅ TC15 — All 10 wizard steps verified');
    await screenshotPass(page, 'tc15Wizard', 'TC15');
  });
});
