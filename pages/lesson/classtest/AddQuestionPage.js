/**
 * AddQuestionPage — Add Question page
 * ─────────────────────────────────────────────────────────────────────────────
 * Navigation: Dashboard → Lesson → Class Test → Add New → Save & Next
 * URL:        /classtest/AddQuestion
 *
 * Confirmed selectors (from DOM debug runs):
 *  Filter dropdowns:  [data-name="Select Chapter / Topics / Question Type / Complexity / Bloom's Taxonomy"]
 *  Add-arrow:         span.qt-move-arrow-color[aria-label="Move to Selected"]
 *  Right panel:       div.aq-selected-que-row
 *  Expand arrow:      span:has-text("keyboard_arrow_down") inside .aq-selected-que-row
 *  Search button:     button.multipleFIlterSearchBtn
 */

const { selectCampusDropdown } = require('../../../utils/selectDropdown');

class AddQuestionPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Filter dropdowns ──────────────────────────────────────────────────
    this.chapterDropdown      = page.locator('[data-name="Select Chapter"]').first();
    this.topicsDropdown       = page.locator('[data-name="Select Topics"]').first();
    this.questionTypeDropdown = page.locator('[data-name="Select Question Type"]').first();
    this.complexityDropdown   = page.locator('[data-name="Select Complexity"]').first();
    this.bloomsDropdown       = page.locator('[data-name="Select Bloom\'s Taxonomy"]').first();

    // ── Search ────────────────────────────────────────────────────────────
    this.searchBtn = page.locator('button.multipleFIlterSearchBtn, button.btn-search').first();

    // ── Question list ─────────────────────────────────────────────────────
    this.addArrows    = page.locator('span.qt-move-arrow-color[aria-label="Move to Selected"]');
    this.questionRows = page.locator('tbody tr.css-1nj9rt');

    // ── Right panel (selected questions summary) ──────────────────────────
    this.selectedPanel     = page.locator('.aq-selected-que-row').first();
    this.maxTimeLabel      = page.locator('.aq-selected-que-row').getByText('Max Time').first();
    this.selectedTimeLabel = page.locator('.aq-selected-que-row').getByText('Selected Time').first();

    // Expand arrow to open the selected-questions detail list
    this.expandPanelBtn = page.locator(
      '.aq-selected-que-row span.material-symbols-outlined, .aq-selected-que-row .material-symbols-outlined'
    ).filter({ hasText: 'keyboard_arrow_down' }).first();

    // ── Action buttons ────────────────────────────────────────────────────
    this.adjustByAiBtn = page.locator([
      'button:has-text("Adjust by AI")',
      'button:has-text("ADJUST BY AI")',
      'button:has-text("Adjust By AI")',
    ].join(', ')).first();

    this.submitBtn = page.locator([
      'button:has-text("Submit")',
      'button:has-text("SUBMIT")',
      'button.btn-submit-qt',
      'button.submitQtBtn',
    ].join(', ')).last();  // last() avoids the form's own Save button

    // ── Finalize popup ─────────────────────────────────────────────────────
    // The app shows a custom popup with div buttons (class "common-confirm-button").
    // "Finalize" is the first button; "See Later" is the second.
    this.finalizeOnlyBtn   = page.locator('[class*="common-confirm-button"]').filter({ hasText: /^Finalize/i }).last();
    this.cancelFinalizeBtn = page.locator('[class*="common-confirm-button"]').filter({ hasText: /^See Later/i }).first();
  }

  async selectDropdown(dataName, optionText) {
    await selectCampusDropdown(this.page, dataName, optionText);
  }

  /**
   * Fill all filter dropdowns then click Search.
   * @param {{ chapter, topics, questionType, complexity, blooms }} filters
   */
  async applyFilters({ chapter, topics, questionType, complexity, blooms }) {
    if (chapter)      await this.selectDropdown('Select Chapter',          chapter);
    if (topics)       await this.selectDropdown('Select Topics',           topics);
    if (questionType) await this.selectDropdown('Select Question Type',    questionType);
    if (complexity)   await this.selectDropdown('Select Complexity',       complexity);
    if (blooms)       await this.selectDropdown("Select Bloom's Taxonomy", blooms);

    await this.searchBtn.waitFor({ state: 'visible', timeout: 8000 });
    await this.searchBtn.click();
    console.log('  ✓ Search clicked');

    await this.addArrows.first().waitFor({ state: 'visible', timeout: 20000 });
    const cnt = await this.addArrows.count();
    console.log(`  ✓ ${cnt} questions listed`);
  }

  /**
   * Add the first N questions by clicking their move-to-selected arrows.
   * Always clicks the FIRST visible arrow — each click removes that arrow
   * from the list so the next becomes first, avoiding stale-index skips.
   * @param {number} count number of questions to add (default 5)
   */
  async addTopNQuestions(count = 5) {
    const total = await this.addArrows.count();
    const toAdd = Math.min(count, total);
    console.log(`  Adding ${toAdd} of ${total} available questions…`);

    for (let i = 0; i < toAdd; i++) {
      const firstArrow = this.addArrows.first();
      await firstArrow.waitFor({ state: 'visible', timeout: 8000 });
      await firstArrow.click();
      await this.page.waitForTimeout(600);
      console.log(`    → Added question ${i + 1}`);
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify the right panel shows Max Time and Selected Time labels.
   * @returns {{ panelText, maxTimeVisible, selectedTimeVisible }}
   */
  async verifyRightPanel() {
    await this.selectedPanel.waitFor({ state: 'visible', timeout: 10000 });
    const panelText = await this.selectedPanel.innerText();
    console.log('  Right panel:\n   ', panelText.replace(/\n/g, '  |  ').substring(0, 200));

    const maxTimeVisible      = await this.maxTimeLabel.isVisible().catch(() => false);
    const selectedTimeVisible = await this.selectedTimeLabel.isVisible().catch(() => false);
    console.log(`  ✓ Max Time visible: ${maxTimeVisible}`);
    console.log(`  ✓ Selected Time visible: ${selectedTimeVisible}`);

    return { panelText, maxTimeVisible, selectedTimeVisible };
  }

  /** Expand the selected-questions list (keyboard_arrow_down button) */
  async expandSelectedQuestions() {
    await this.expandPanelBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.expandPanelBtn.click();
    await this.page.waitForTimeout(1500);
    console.log('  ✓ Expanded selected questions panel');
  }

  /**
   * Read the numeric values from the yellow summary panel.
   * Returns { maxQuestion, selectedQuestion, maxMarks, selectedMarks, maxTime, selectedTime }
   * where time values are in minutes (number).
   */
  async readPanelValues() {
    await this.selectedPanel.waitFor({ state: 'visible', timeout: 10000 });
    const text = await this.selectedPanel.innerText();
    console.log('  Panel text:', text.replace(/\n/g, ' | '));

    const num = (label) => {
      const m = text.match(new RegExp(label + '[^\\d]*(\\d+)'));
      return m ? parseInt(m[1], 10) : null;
    };

    return {
      maxQuestion:      num('Max Question'),
      selectedQuestion: num('Selected Question'),
      maxMarks:         num('Max Marks'),
      selectedMarks:    num('Selected Marks'),
      maxTime:          num('Max Time'),
      selectedTime:     num('Selected Time'),
    };
  }

  /** Click "Adjust by AI" button */
  async clickAdjustByAi() {
    await this.adjustByAiBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.adjustByAiBtn.scrollIntoViewIfNeeded();
    await this.adjustByAiBtn.click();
    console.log('  ✓ Clicked Adjust by AI');
    await this.page.waitForTimeout(2000);
  }

  /** Click the Submit button */
  async clickSubmit() {
    await this.submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitBtn.scrollIntoViewIfNeeded();
    await this.submitBtn.click();
    console.log('  ✓ Clicked Submit');
    await this.page.waitForTimeout(2000);
  }

  /** Wait for the Finalize popup and click "Finalize" */
  async clickFinalizeOnly() {
    // Wait for the popup confirm button (class contains "common-confirm-button")
    const anyConfirmBtn = this.page.locator('[class*="common-confirm-button"]').first();
    await anyConfirmBtn.waitFor({ state: 'visible', timeout: 20000 });
    console.log('  ✓ Finalize popup appeared');

    // Click the "Finalize" button (first confirm button in popup)
    const finalizeBtn = this.page.locator('[class*="common-confirm-button"]')
      .filter({ hasText: /^Finalize/i })
      .last();
    await finalizeBtn.click({ force: true });
    console.log('  ✓ Clicked Finalize');
    await this.page.waitForTimeout(3000);
  }
}

module.exports = { AddQuestionPage };
