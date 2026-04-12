/**
 * AddQuestionPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for:  /classtest/AddQuestion
 *
 * Confirmed selectors (from DOM debug runs):
 *  - Filter dropdowns:  [data-name="Select Chapter / Topics / Question Type / Complexity / Bloom's Taxonomy"]
 *  - Add-arrow:         span.qt-move-arrow-color[aria-label="Move to Selected"]
 *  - Right panel:       div.aq-selected-que-row
 *  - Expand arrow:      span:has-text("keyboard_arrow_down") inside .aq-selected-que-row
 *  - Search button:     button.multipleFIlterSearchBtn
 */

class AddQuestionPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Filter dropdowns (all use same customSelectValueAndArrowContainerCampus pattern) ──
    this.chapterDropdown      = page.locator('[data-name="Select Chapter"]').first();
    this.topicsDropdown       = page.locator('[data-name="Select Topics"]').first();
    this.questionTypeDropdown = page.locator('[data-name="Select Question Type"]').first();
    this.complexityDropdown   = page.locator('[data-name="Select Complexity"]').first();
    this.bloomsDropdown       = page.locator('[data-name="Select Bloom\'s Taxonomy"]').first();

    // ── Search ────────────────────────────────────────────────────────────────
    this.searchBtn = page.locator('button.multipleFIlterSearchBtn, button.btn-search').first();

    // ── Question list ─────────────────────────────────────────────────────────
    // Each question row has a "navigation" span as the add-to-selected arrow
    this.addArrows    = page.locator('span.qt-move-arrow-color[aria-label="Move to Selected"]');
    this.questionRows = page.locator('tbody tr.css-1nj9rt');

    // ── Right panel (aq-selected-que-row) ─────────────────────────────────────
    this.selectedPanel     = page.locator('.aq-selected-que-row').first();
    this.maxTimeLabel      = page.locator('.aq-selected-que-row').getByText('Max Time').first();
    this.selectedTimeLabel = page.locator('.aq-selected-que-row').getByText('Selected Time').first();

    // The "keyboard_arrow_down" span opens the selected-questions list
    this.expandPanelBtn = page.locator(
      '.aq-selected-que-row span.material-symbols-outlined, .aq-selected-que-row .material-symbols-outlined'
    ).filter({ hasText: 'keyboard_arrow_down' }).first();

    // ── After expand: Adjust by AI + Submit ───────────────────────────────────
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

    // ── Finalize popup ────────────────────────────────────────────────────────
    this.finalizePopup = page.locator(
      '.swal2-popup, [class*="modal-content"], [class*="popupContainer"], [class*="swal"]'
    ).first();

    this.finalizeOnlyBtn = page.locator([
      'button:has-text("Finalize only")',
      'button:has-text("Finalize Only")',
      'button:has-text("FINALIZE ONLY")',
      'button:has-text("Finalize")',
      '.swal2-confirm',
    ].join(', ')).first();

    this.cancelFinalizeBtn = page.locator([
      'button:has-text("Cancel")',
      '.swal2-cancel',
    ].join(', ')).first();
  }

  /**
   * Select an option from a custom campus dropdown.
   * Same pattern as AddClassTestPage — reused here.
   */
  async selectDropdown(dataName, optionText) {
    const trigger = this.page.locator(`[data-name="${dataName}"]`).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.waitFor({ state: 'visible', timeout: 15000 });
    await trigger.click({ force: true });

    const optList = this.page.locator('ul.filterOptionsListCustomSelectCampus');
    await optList.waitFor({ state: 'visible', timeout: 10000 });

    // Use search box to narrow long lists
    const sb = this.page.locator('.filterInputHolder input').first();
    if (await sb.isVisible().catch(() => false)) {
      await sb.fill(optionText.substring(0, 15));
      await this.page.waitForTimeout(400);
    }

    const option = this.page
      .locator('ul.filterOptionsListCustomSelectCampus li')
      .filter({ hasText: optionText })
      .first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await optList.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});

    console.log(`  ✓ ${dataName} = "${optionText}"`);
  }

  /**
   * Fill all filter dropdowns and click Search.
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

    // Wait for question rows to appear
    await this.addArrows.first().waitFor({ state: 'visible', timeout: 20000 });
    const cnt = await this.addArrows.count();
    console.log(`  ✓ ${cnt} questions listed`);
  }

  /**
   * Add the first N questions by clicking their navigation arrows.
   * @param {number} count  number of questions to add (default 5)
   */
  async addTopNQuestions(count = 5) {
    const total = await this.addArrows.count();
    const toAdd = Math.min(count, total);
    console.log(`  Adding ${toAdd} of ${total} available questions…`);

    for (let i = 0; i < toAdd; i++) {
      await this.addArrows.nth(i).waitFor({ state: 'visible', timeout: 8000 });
      await this.addArrows.nth(i).click();
      // Brief pause so the app registers each click
      await this.page.waitForTimeout(500);
      console.log(`    → Added question ${i + 1}`);
    }
    // Let the right panel update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify the right panel shows Max Time and Selected Time.
   * @returns {{ maxTime: string, selectedTime: string }}
   */
  async verifyRightPanel() {
    await this.selectedPanel.waitFor({ state: 'visible', timeout: 10000 });
    const panelText = await this.selectedPanel.innerText();
    console.log('  Right panel:\n   ', panelText.replace(/\n/g, '  |  ').substring(0, 200));

    const maxTimeVisible     = await this.maxTimeLabel.isVisible().catch(() => false);
    const selectedTimeVisible = await this.selectedTimeLabel.isVisible().catch(() => false);
    console.log(`  ✓ Max Time visible: ${maxTimeVisible}`);
    console.log(`  ✓ Selected Time visible: ${selectedTimeVisible}`);

    return { panelText, maxTimeVisible, selectedTimeVisible };
  }

  /**
   * Expand the selected-questions list (click keyboard_arrow_down).
   */
  async expandSelectedQuestions() {
    await this.expandPanelBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.expandPanelBtn.click();
    await this.page.waitForTimeout(1500);
    console.log('  ✓ Expanded selected questions panel');
  }

  /**
   * Click "Adjust by AI" button.
   */
  async clickAdjustByAi() {
    await this.adjustByAiBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.adjustByAiBtn.scrollIntoViewIfNeeded();
    await this.adjustByAiBtn.click();
    console.log('  ✓ Clicked Adjust by AI');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click the Submit button.
   */
  async clickSubmit() {
    await this.submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitBtn.scrollIntoViewIfNeeded();
    await this.submitBtn.click();
    console.log('  ✓ Clicked Submit');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for the Finalize popup and click "Finalize only".
   */
  async clickFinalizeOnly() {
    await this.finalizePopup.waitFor({ state: 'visible', timeout: 15000 });
    console.log('  ✓ Finalize popup appeared');

    // Dump popup text to help debug if selector is wrong
    const popupText = await this.finalizePopup.innerText();
    console.log('  Popup text:', popupText.substring(0, 200));

    await this.finalizeOnlyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.finalizeOnlyBtn.click();
    console.log('  ✓ Clicked Finalize only');
    await this.page.waitForTimeout(2000);
  }
}

module.exports = { AddQuestionPage };
