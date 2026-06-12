/**
 * AddClassTestPage — Add New Class Test form
 * ─────────────────────────────────────────────────────────────────────────────
 * Navigation: Dashboard → Lesson (module) → Class Test (menu) → Add New
 * URL:        /classtest/AddNewClassTest
 *
 * All dropdowns use the custom campus-style component:
 *   Trigger: [data-name="<label>"]
 *   Options: ul.filterOptionsListCustomSelectCampus > li
 *   Search:  .filterInputHolder input  (narrows long lists)
 *
 * After filling the form and clicking "Save & Next", the app navigates
 * to the AddQuestion page (/classtest/AddQuestion) via SPA routing.
 */

const { URLS } = require('../../../utils/urls');
const { selectCampusDropdown } = require('../../../utils/selectDropdown');

class AddClassTestPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Cascade dropdown triggers ──────────────────────────────────────────
    this.schoolDropdown   = page.locator('[data-name="School"]').first();
    this.sessionDropdown  = page.locator('[data-name="Session"]').first();
    this.gradeDropdown    = page.locator('[data-name="Grade"]').first();
    this.sectionDropdown  = page.locator('[data-name="Section"]').first();
    this.subjectDropdown  = page.locator('[data-name="Subject"]').first();
    this.chapterDropdown  = page.locator('[data-name="Select Chapters"]').first();

    // ── Text / number / date / time inputs ─────────────────────────────────
    this.examNameInput      = page.locator('input[name="exam_name"]').first();
    this.numQuestionsInput  = page.locator('input[name="number_of_questions"]').first();
    this.totalMarksInput    = page.locator('input[name="total_marks"]').first();
    this.examDateInput      = page.locator('input[name="exam_date"]').first();
    this.examDurationInput  = page.locator('input[name="exam_duration"]').first();
    this.startTimeInput     = page.locator('input[name="start_time"]').first();
    this.endTimeInput       = page.locator('input[name="end_time"]').first();
    this.resultDateInput    = page.locator('input[name="result_date"]').first();
    this.resultTimeInput    = page.locator('input[name="result_time"]').first();

    // ── Exam Mode radios  (Offline id has capital O) ───────────────────────
    this.examModeOnline  = page.locator('input#online').first();
    this.examModeOffline = page.locator('input#Offline').first();

    // ── Notify students radios ────────────────────────────────────────────
    this.notifyNo  = page.locator('input#notsend').first();
    this.notifyYes = page.locator('input#send').first();

    // ── Exam Instructions rich-text editor (CKEditor 5, REQUIRED field) ───
    this.examInstructionsEditor = page.locator(
      '.ck-content, .ck-editor__editable, [contenteditable="true"], .ProseMirror, .ql-editor, div[class*="tiptap"]'
    ).first();

    // ── Save & Next button ────────────────────────────────────────────────
    this.saveAndNextBtn = page.locator([
      'button.btn-square.btn-submit',
      'button:has-text("Save & Next")',
      'button:has-text("SAVE & NEXT")',
      'button:has-text("Save and Next")',
    ].join(', ')).first();
  }

  /** Navigate directly to the Add New Class Test form */
  async navigate() {
    await this.page.goto(`${URLS.dashboard}classtest/AddNewClassTest`, { waitUntil: 'commit' });
    await this.page.locator('[data-name="School"]').first()
      .waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Select an option from a custom campus-style dropdown.
   * @param {string} dataName   [data-name] attribute on the trigger div
   * @param {string} optionText visible text of the option to select
   */
  async selectDropdown(dataName, optionText) {
    await selectCampusDropdown(this.page, dataName, optionText);
  }

  /** Clear and fill a single input field */
  async fillInput(locator, value, label) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.clear();
    await locator.fill(String(value));
    console.log(`  ✓ ${label} = "${value}"`);
  }

  /**
   * Fill all form text / date / time inputs.
   * All params are optional — pass only what you need.
   */
  async fillTextFields({
    examName,
    numQuestions,
    totalMarks,
    examDate,
    examDuration,
    startTime,
    endTime,
    resultDate,
    resultTime,
  } = {}) {
    if (examName)     await this.fillInput(this.examNameInput,     examName,     'Exam Name');
    if (numQuestions) await this.fillInput(this.numQuestionsInput, numQuestions, 'Number of Questions');
    if (totalMarks)   await this.fillInput(this.totalMarksInput,   totalMarks,   'Total Marks');

    if (examDate) {
      await this.examDateInput.waitFor({ state: 'visible', timeout: 8000 });
      await this.examDateInput.fill(examDate);
      await this.examDateInput.press('Tab');
      console.log(`  ✓ Exam Date = "${examDate}"`);
    }

    if (examDuration) await this.fillInput(this.examDurationInput, examDuration, 'Exam Duration');

    if (startTime) {
      await this.startTimeInput.waitFor({ state: 'visible', timeout: 8000 });
      await this.startTimeInput.fill(startTime);
      await this.startTimeInput.press('Tab');
      console.log(`  ✓ Start Time = "${startTime}"`);
    }

    if (endTime) {
      // end_time is auto-calculated (disabled) — app fills it from start_time + duration
      const isDisabled = await this.endTimeInput.isDisabled().catch(() => false);
      if (isDisabled) {
        const autoVal = await this.endTimeInput.inputValue().catch(() => '');
        console.log(`  ✓ End Time = "${autoVal}" (auto-calculated)`);
      } else {
        await this.endTimeInput.waitFor({ state: 'visible', timeout: 8000 });
        await this.endTimeInput.fill(endTime);
        await this.endTimeInput.press('Tab');
        console.log(`  ✓ End Time = "${endTime}"`);
      }
    }

    if (resultDate) {
      await this.resultDateInput.waitFor({ state: 'visible', timeout: 8000 });
      await this.resultDateInput.fill(resultDate);
      await this.resultDateInput.press('Tab');
      console.log(`  ✓ Result Date = "${resultDate}"`);
    }

    if (resultTime) {
      await this.resultTimeInput.waitFor({ state: 'visible', timeout: 8000 });
      await this.resultTimeInput.fill(resultTime);
      await this.resultTimeInput.press('Tab');
      console.log(`  ✓ Result Time = "${resultTime}"`);
    }
  }

  /** Select Exam Mode: 'online' | 'offline' */
  async selectExamMode(mode = 'online') {
    const radio = mode === 'online' ? this.examModeOnline : this.examModeOffline;
    await radio.waitFor({ state: 'attached', timeout: 8000 });
    await radio.evaluate(el => el.click());
    console.log(`  ✓ Exam Mode = ${mode}`);
  }

  /** Select Notify students: 'yes' | 'no' */
  async selectNotify(value = 'no') {
    const radio = value === 'yes' ? this.notifyYes : this.notifyNo;
    await radio.waitFor({ state: 'attached', timeout: 8000 });
    await radio.evaluate(el => el.click());
    console.log(`  ✓ Notify students = ${value}`);
  }

  /**
   * Touch the Exam Instructions rich-text editor so React's internal state is
   * updated. The app pre-fills DOM content but React's controlled state stays
   * empty until an actual keystroke fires the CKEditor onChange handler.
   * We type a space then delete it — this triggers onChange without altering
   * the existing pre-filled instructions text.
   */
  async touchInstructions() {
    const editor  = this.examInstructionsEditor;
    const visible = await editor.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) {
      await editor.scrollIntoViewIfNeeded();
      await editor.click();
      await this.page.keyboard.press('Control+End'); // move to very end of content
      await this.page.keyboard.type(' ');            // triggers CKEditor onChange → React state update
      await this.page.keyboard.press('Backspace');   // clean up the trailing space
      await this.page.waitForTimeout(300);           // let React process the state change
      console.log('  ✓ Touched Exam Instructions editor (React state updated)');
    } else {
      console.log('  ⚠ Exam Instructions editor not found — skipping touch');
    }
  }

  /** Click "Save & Next" to submit the form */
  async clickSaveAndNext() {
    // Wait 1.5 s for React state to settle after last field interaction
    await this.page.waitForTimeout(1500);

    await this.saveAndNextBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveAndNextBtn.scrollIntoViewIfNeeded();

    // Try normal click first (fires React's synthetic events properly).
    // Fall back to dispatchEvent via JS if the button still has pointer-events blocked.
    let clicked = false;
    try {
      await this.saveAndNextBtn.click({ timeout: 5000 });
      clicked = true;
    } catch (_) {}

    if (!clicked) {
      // JS fallback — find the button by its text and dispatch a native click
      await this.page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          b => /SAVE.*NEXT|Save.*Next/i.test(b.innerText)
        );
        if (btn) {
          btn.scrollIntoView({ block: 'center' });
          btn.click();
        }
      });
    }

    console.log('  ✓ Clicked Save & Next');
  }
}

module.exports = { AddClassTestPage };
