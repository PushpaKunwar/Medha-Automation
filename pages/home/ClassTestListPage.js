/**
 * ClassTestListPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for:  https://live.mafatlaleducation.com:5110/classtest
 *
 * Filter panel uses the SAME custom filterOptionsListCustomSelectCampus dropdowns
 * as the Add form.  Confirmed data-name values:
 *   "School"      "session"     "Grade"     "Section"
 *   "Subject"     "Test Mode"   "status"   (note: status is lowercase)
 *
 * Table rows appear ONLY AFTER clicking Search (button.multipleFIlterSearchBtn).
 * Row structure: <tr> … <td> Test Info (contains exam name) … <td> Actions
 * Delete icon:   span.material-symbols-outlined with text "delete" (inside <tr>)
 *
 * Status values relevant for cleanup:
 *   "Paper Created-No Questions Selected"  (test created, no questions added)
 *   "Paper Created-Questions Selected"     (questions added, not finalised)
 *   "Paper Finalized"                       (finalised — TC08-4 complete)
 *
 * Usage:
 *   const listPage = new ClassTestListPage(page);
 *   await listPage.deleteAllByName('Sound Chapter Test CT01', 'Science');
 */

const { URLS } = require('../../utils/urls');

const LIST_URL = `${URLS.dashboard}classtest`;

/** Statuses to check during cleanup (covers all TC08 completion levels) */
const CLEANUP_STATUSES = [
  'Paper Created-No Questions Selected',
  'Paper Created-Questions Selected',
  'Paper Finalized',
];

class ClassTestListPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ── Navigate ────────────────────────────────────────────────────────────────
  async navigate() {
    await this.page.goto(LIST_URL, { waitUntil: 'commit' });
    await this.page.waitForTimeout(2500);
    // Ensure filter panel is visible (it usually opens by default)
    await this.page.locator('[data-name="Subject"]').first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(async () => {
        // Panel might be collapsed — click Filter toggle
        await this.page.locator('button.btn-filter, button[title*="Filter"]').first()
          .click().catch(() => {});
        await this.page.waitForTimeout(800);
      });
    console.log('  ✓ On Class Test list:', this.page.url().split('?')[0]);
  }

  // ── Custom dropdown select (same pattern as AddClassTestPage) ──────────────
  async _selectDropdown(dataName, optionText) {
    const trigger = this.page.locator(`[data-name="${dataName}"]`).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click({ force: true });

    const optList = this.page.locator('ul.filterOptionsListCustomSelectCampus');
    await optList.waitFor({ state: 'visible', timeout: 8000 });

    // Use search box to narrow long option lists
    const sb = this.page.locator('.filterInputHolder input, .filterOptionsListAndInputContainerSelectCampus input').first();
    if (await sb.isVisible({ timeout: 800 }).catch(() => false)) {
      await sb.fill(optionText.substring(0, 15));
      await this.page.waitForTimeout(300);
    }

    const option = this.page.locator('ul.filterOptionsListCustomSelectCampus li')
      .filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 8000 });
    await option.click();
    await optList.waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {});
    console.log(`    ✓ [${dataName}] = "${optionText}"`);
  }

  // ── Set Subject + Status filters and click Search ─────────────────────────
  async _applyFilterAndSearch(subject, status) {
    await this._selectDropdown('Subject', subject);
    await this._selectDropdown('status', status);
    await this.page.locator('button.multipleFIlterSearchBtn').first().click();
    await this.page.waitForTimeout(2500);
    console.log(`    Searched: Subject="${subject}" | Status="${status}"`);
  }

  // ── Delete all rows matching examName under a given status ─────────────────
  async _deleteByStatus(examName, subject, status) {
    let deleted = 0;

    for (let attempt = 0; attempt < 20; attempt++) {
      // Apply filter for this status and search
      await this._applyFilterAndSearch(subject, status);

      // Table rows appear inside <tr> elements after search
      const matchingRow = this.page.locator('tr').filter({ hasText: examName }).first();
      const rowVisible  = await matchingRow.isVisible({ timeout: 2000 }).catch(() => false);

      if (!rowVisible) {
        console.log(`    No rows for status="${status}"`);
        break;
      }

      console.log(`    Found row with "${examName}" (status=${status}) — deleting…`);

      // Hover to reveal action icons if they're hidden
      await matchingRow.hover().catch(() => {});
      await this.page.waitForTimeout(300);

      // Delete icon inside this row
      const deleteIcon = matchingRow
        .locator('span.material-symbols-outlined')
        .filter({ hasText: 'delete' })
        .first();

      const iconVisible = await deleteIcon.isVisible({ timeout: 3000 }).catch(() => false);
      if (!iconVisible) {
        console.log(`    ⚠ Delete icon not visible in row — stopping`);
        break;
      }

      await deleteIcon.click();
      await this.page.waitForTimeout(600);

      // Handle confirmation popup (swal2 or similar)
      const confirmBtn = this.page.locator(
        '.swal2-confirm, button:has-text("Yes"), button:has-text("Yes, delete"), button:has-text("OK")'
      ).first();
      const hasConfirm = await confirmBtn.isVisible({ timeout: 2500 }).catch(() => false);
      if (hasConfirm) {
        await confirmBtn.click();
        console.log('    ✓ Confirmed deletion');
      }

      await this.page.waitForTimeout(1500);
      deleted++;
    }

    return deleted;
  }

  // ── PUBLIC: delete ALL tests matching examName across all relevant statuses ─
  /**
   * Before creating a class test:
   *  1. Checks "Paper Created-No Questions Selected" (test just created, no questions)
   *  2. Checks "Paper Created-Questions Selected"   (questions added but not finalised)
   *  3. Checks "Paper Finalized"                     (fully finalised test)
   * Deletes every matching row so the next create doesn't get a conflict error.
   *
   * @param {string} examName  – partial or exact exam name to match
   * @param {string} subject   – Subject dropdown value, default 'Science'
   */
  async deleteAllByName(examName, subject = 'Science') {
    console.log(`\n  🧹 Cleaning up: "${examName}" (subject: ${subject})`);
    await this.navigate();

    let totalDeleted = 0;
    for (const status of CLEANUP_STATUSES) {
      const count = await this._deleteByStatus(examName, subject, status);
      totalDeleted += count;
    }

    console.log(`  🗑  Total deleted: ${totalDeleted} test(s) named "${examName}"`);
    return totalDeleted;
  }

  // ── PUBLIC: navigate to AddQuestion via Edit button ────────────────────────
  /**
   * For Scenario B: test was created but questions not yet added.
   * Finds the test in the list (using status "Paper Created-No Questions Selected"),
   * clicks Edit, and waits for the AddQuestion page.
   *
   * @param {string} examName – partial or full exam name
   * @param {string} subject  – Subject filter value
   */
  async clickEditByName(examName, subject = 'Science') {
    console.log(`\n  📝 Opening "${examName}" via Edit…`);
    await this.navigate();
    await this._applyFilterAndSearch(subject, 'Paper Created-No Questions Selected');

    const row = this.page.locator('tr').filter({ hasText: examName }).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    await row.hover().catch(() => {});
    await this.page.waitForTimeout(300);

    const editIcon = row
      .locator('span.material-symbols-outlined')
      .filter({ hasText: 'edit' })
      .first();
    await editIcon.waitFor({ state: 'visible', timeout: 6000 });
    await editIcon.click();
    console.log(`  ✓ Clicked Edit for "${examName}"`);

    // Poll for AddQuestion URL (SPA routing)
    for (let i = 0; i < 30; i++) {
      if (this.page.url().includes('AddQuestion')) break;
      await this.page.waitForTimeout(1000);
    }
    if (!this.page.url().includes('AddQuestion')) {
      throw new Error(`Edit did NOT navigate to AddQuestion. URL: ${this.page.url()}`);
    }

    await this.page.waitForTimeout(2000);
    console.log('  ✓ On AddQuestion via Edit:', this.page.url());
  }
}

module.exports = { ClassTestListPage, LIST_URL, CLEANUP_STATUSES };
