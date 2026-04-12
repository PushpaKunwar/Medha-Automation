const { URLS } = require('../../utils/urls');

class AddClassTestPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Custom dropdown triggers ──────────────────────────────────────────
    // NOTE: Chapter is data-name="Select Chapters" (with a space)
    this.schoolDropdown   = page.locator('[data-name="School"]').first();
    this.sessionDropdown  = page.locator('[data-name="Session"]').first();
    this.gradeDropdown    = page.locator('[data-name="Grade"]').first();
    this.sectionDropdown  = page.locator('[data-name="Section"]').first();
    this.subjectDropdown  = page.locator('[data-name="Subject"]').first();
    this.chapterDropdown  = page.locator('[data-name="Select Chapters"]').first();

    // ── Text / number / date / time inputs (exact name attributes from DOM) ──
    this.examNameInput       = page.locator('input[name="exam_name"]').first();
    this.numQuestionsInput   = page.locator('input[name="number_of_questions"]').first();
    this.totalMarksInput     = page.locator('input[name="total_marks"]').first();
    this.examDateInput       = page.locator('input[name="exam_date"]').first();
    this.examDurationInput   = page.locator('input[name="exam_duration"]').first();
    this.startTimeInput      = page.locator('input[name="start_time"]').first();
    this.endTimeInput        = page.locator('input[name="end_time"]').first();
    this.resultDateInput     = page.locator('input[name="result_date"]').first();
    this.resultTimeInput     = page.locator('input[name="result_time"]').first();

    // ── Exam Mode radio — NOTE: Offline id has capital O ("Offline") ─────
    this.examModeOnline  = page.locator('input#online').first();
    this.examModeOffline = page.locator('input#Offline').first();

    // ── Notify students radios ────────────────────────────────────────────
    this.notifyNo        = page.locator('input#notsend').first();
    this.notifyYes       = page.locator('input#send').first();

    // ── Exam Instructions rich-text editor (CKEditor, REQUIRED * field) ─────
    // The app uses CKEditor 5.  Default content is pre-filled.
    // We must CLICK the editor so the field is "touched" and passes validation.
    // Selector covers CKEditor (.ck-content), Quill (.ql-editor), ProseMirror,
    // TipTap (.tiptap), and any generic [contenteditable].
    this.examInstructionsEditor = page.locator(
      '.ck-content, .ck-editor__editable, [contenteditable="true"], .ProseMirror, .ql-editor, div[class*="tiptap"]'
    ).first();

    // ── Save & Next button ────────────────────────────────────────────────
    this.saveAndNextBtn  = page.locator([
      'button.btn-square.btn-submit',
      'button:has-text("Save & Next")',
      'button:has-text("SAVE & NEXT")',
      'button:has-text("Save and Next")',
    ].join(', ')).first();
  }

  /** Navigate directly to the Add New Class Test form */
  async navigate() {
    await this.page.goto(`${URLS.dashboard}classtest/AddNewClassTest`, { waitUntil: 'commit' });
    await this.page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Select an option from a custom campus-style dropdown.
   * @param {string} dataName   - [data-name] attribute value on the trigger div
   * @param {string} optionText - visible text of the option to pick
   */
  async selectDropdown(dataName, optionText) {
    const trigger = this.page.locator(`[data-name="${dataName}"]`).first();
    const optList = this.page.locator('ul.filterOptionsListCustomSelectCampus');

    await trigger.scrollIntoViewIfNeeded();
    await trigger.waitFor({ state: 'visible', timeout: 15000 });

    // Force click bypasses any inner element interception
    await trigger.click({ force: true });
    await optList.waitFor({ state: 'visible', timeout: 10000 });

    // Type into the search box inside the dropdown to filter long lists
    const searchBox = this.page.locator('.filterInputHolder input, .filterOptionsListAndInputContainerSelectCampus input').first();
    const hasSearch = await searchBox.isVisible().catch(() => false);
    if (hasSearch) {
      await searchBox.fill(optionText.substring(0, 15)); // first 15 chars enough to narrow
      await this.page.waitForTimeout(400);               // brief wait for filter to apply
    }

    // Click the matching option (exact or partial match)
    const option = this.page
      .locator('ul.filterOptionsListCustomSelectCampus li')
      .filter({ hasText: optionText })
      .first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();

    // Wait for list to close (confirms selection registered)
    await optList.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});

    console.log(`  ✓ ${dataName} = "${optionText}"`);
  }

  /**
   * Fill a single input: clears then fills.
   */
  async fillInput(locator, value, label) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.clear();
    await locator.fill(String(value));
    console.log(`  ✓ ${label} = "${value}"`);
  }

  /**
   * Fill all form text/date/time inputs.
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
      // end_time is auto-calculated (disabled) — the app fills it from start_time + duration
      // Just verify the value was set automatically
      const isDisabled = await this.endTimeInput.isDisabled().catch(() => false);
      if (isDisabled) {
        const autoVal = await this.endTimeInput.inputValue().catch(() => '');
        console.log(`  ✓ End Time = "${autoVal}" (auto-calculated, field is disabled)`);
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
   * Touch the Exam Instructions rich-text editor so it passes required validation.
   * The app pre-fills default content; we just need to click and blur the field.
   */
  async touchInstructions() {
    const editor = this.examInstructionsEditor;
    const visible = await editor.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) {
      await editor.scrollIntoViewIfNeeded();
      await editor.click();
      // Press End to move cursor to a known position, then Tab to blur
      await this.page.keyboard.press('End');
      await this.page.keyboard.press('Tab');
      console.log('  ✓ Touched Exam Instructions editor');
    } else {
      console.log('  ⚠ Exam Instructions editor not found — skipping touch');
    }
  }

  /** Click "Save & Next" */
  async clickSaveAndNext() {
    await this.saveAndNextBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveAndNextBtn.scrollIntoViewIfNeeded();
    // Use force:true to bypass any overlay that might intercept the click
    await this.saveAndNextBtn.click({ force: true });
    console.log('  ✓ Clicked Save & Next');
  }
}

module.exports = { AddClassTestPage };
