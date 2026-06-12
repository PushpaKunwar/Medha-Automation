/**
 * ClassTestListPage — Class Test list page
 * ─────────────────────────────────────────────────────────────────────────────
 * Navigation: Dashboard → Lesson (module) → Class Test (menu) → List
 * URL:        /classtest
 *
 * Filter panel uses the SAME custom filterOptionsListCustomSelectCampus dropdowns
 * as the Add form.  Confirmed data-name values:
 *   "School"  "session"  "Grade"  "Section"  "Subject"  "Test Mode"  "status"
 *   (note: "status" is lowercase)
 *
 * Table rows appear ONLY AFTER clicking Search (button.multipleFIlterSearchBtn).
 * Delete icon: span.material-symbols-outlined with text "delete" (inside <tr>)
 *
 * Status values used during cleanup:
 *   "Paper Created-No Questions Selected"
 *   "Paper Created-Questions Selected"
 *   "Paper Finalized"
 */

const { URLS } = require('../../../utils/urls');
const { selectCampusDropdown } = require('../../../utils/selectDropdown');

const LIST_URL = `${URLS.dashboard}classtest`;

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
    await this.page.locator('[data-name="Subject"]').first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(async () => {
        await this.page.locator('button.btn-filter, button[title*="Filter"]').first()
          .click().catch(() => {});
        await this.page.waitForTimeout(800);
      });
    console.log('  ✓ On Class Test list:', this.page.url().split('?')[0]);
  }

  // ── Custom dropdown ───────────────────────────────────────────────────────
  async _selectDropdown(dataName, optionText) {
    await selectCampusDropdown(this.page, dataName, optionText);
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
      await this._applyFilterAndSearch(subject, status);

      const matchingRow = this.page.locator('tr').filter({ hasText: examName }).first();
      const rowVisible  = await matchingRow.isVisible({ timeout: 2000 }).catch(() => false);

      if (!rowVisible) {
        console.log(`    No rows for status="${status}"`);
        break;
      }

      console.log(`    Found row with "${examName}" (status=${status}) — deleting…`);

      await matchingRow.hover().catch(() => {});
      await this.page.waitForTimeout(300);

      const deleteBtn = matchingRow.locator(
        'button.btn-delete, button.btn-round.btn-delete'
      ).first();
      const deleteBtnOk = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);

      const deleteIcon = matchingRow
        .locator('span.material-symbols-outlined')
        .filter({ hasText: 'delete' })
        .first();

      const deleteTarget = deleteBtnOk ? deleteBtn : deleteIcon;
      const targetVis    = await deleteTarget.isVisible({ timeout: 3000 }).catch(() => false);
      if (!targetVis) {
        console.log(`    ⚠ Delete button/icon not visible — stopping`);
        break;
      }

      await deleteTarget.click();
      console.log('    ✓ Clicked delete');
      await this.page.waitForTimeout(800);

      // The app uses class="common-confirm-dialog-wrapper" for delete confirmations.
      // The confirm (Yes) button uses class containing "common-confirm-button".
      const confirmBtn = this.page.locator(
        '[class*="common-confirm-button"], .swal2-confirm'
      ).first();

      const hasConfirm = await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasConfirm) {
        await confirmBtn.click({ force: true });
        console.log('    ✓ Confirmed deletion');
        await this.page.waitForTimeout(2000);
      } else {
        console.log('    ⚠ Confirm button not found — skipping');
        await this.page.waitForTimeout(1000);
      }

      // Navigate away and back — more reliable than waiting for DOM mutation
      // The app re-renders the whole table on navigation so stale rows won't reappear
      await this.navigate();
      await this._applyFilterAndSearch(subject, status);

      const stillPresent = await this.page.locator('tr')
        .filter({ hasText: examName })
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (stillPresent) {
        console.log('    ⚠ Row still present after delete + reload — stopping loop.');
        break;
      }
      console.log('    ✓ Row removed successfully');
      deleted++;

      await this.navigate();
    }

    return deleted;
  }

  // ── PUBLIC: delete ALL tests matching examName across all relevant statuses ─
  /**
   * Checks all cleanup statuses and deletes every row matching examName.
   * Call this before creating a class test to prevent conflict errors.
   *
   * @param {string} examName  partial or exact exam name to match
   * @param {string} subject   Subject dropdown value (default 'Science')
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

  // ── PUBLIC: delete ALL Science tests on a given date (time-slot safety) ──────
  /**
   * Deletes every Science test on the given date across all statuses.
   * Searches using multiple date display formats (YYYY-MM-DD, "Jun 12, 2026", etc.)
   * so it catches tests created in any previous run regardless of their name/tag.
   *
   * @param {string} examDate  YYYY-MM-DD — the date to clear
   * @param {string} subject   Subject filter (default 'Science')
   */
  async deleteAllByDate(examDate, subject = 'Science') {
    console.log(`\n  🧹 Clearing ALL "${subject}" tests on ${examDate}…`);

    // Build alternate date representations the app may render in the table
    const [yyyy, mm, dd] = examDate.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthName  = monthNames[parseInt(mm, 10) - 1];
    const dayNum     = parseInt(dd, 10);
    const dateVariants = [
      examDate,                          // 2026-06-12
      `${monthName} ${dayNum}, ${yyyy}`, // Jun 12, 2026
      `${dd}/${mm}/${yyyy}`,             // 12/06/2026
      `${mm}/${dd}/${yyyy}`,             // 06/12/2026
      `${dd}-${mm}-${yyyy}`,             // 12-06-2026
    ];

    let grandTotal = 0;

    for (const status of CLEANUP_STATUSES) {
      let deleted = 0;
      for (let attempt = 0; attempt < 30; attempt++) {
        await this.navigate();
        await this._selectDropdown('Subject', subject);
        await this._selectDropdown('status', status);
        await this.page.locator('button.multipleFIlterSearchBtn').first().click();
        await this.page.waitForTimeout(2500);

        // Try each date format variant until we find a matching row
        let matchingRow = null;
        for (const variant of dateVariants) {
          const candidate = this.page.locator('tr').filter({ hasText: variant }).first();
          if (await candidate.isVisible({ timeout: 1000 }).catch(() => false)) {
            matchingRow = candidate;
            break;
          }
        }

        if (!matchingRow) {
          if (attempt === 0) console.log(`    No rows for status="${status}" on ${examDate}`);
          break;
        }

        const rowText = await matchingRow.textContent().catch(() => '');
        console.log(`    Found row on ${examDate} (status=${status}): "${rowText.trim().substring(0, 60)}…"`);

        await matchingRow.hover().catch(() => {});
        await this.page.waitForTimeout(300);

        const deleteBtn  = matchingRow.locator('button.btn-delete, button.btn-round.btn-delete').first();
        const deleteIcon = matchingRow.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first();
        const deleteTarget = (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) ? deleteBtn : deleteIcon;

        if (!(await deleteTarget.isVisible({ timeout: 3000 }).catch(() => false))) {
          console.log('    ⚠ Delete icon not visible — stopping this status');
          break;
        }

        await deleteTarget.click();
        await this.page.waitForTimeout(800);

        const confirmBtn = this.page.locator('[class*="common-confirm-button"], .swal2-confirm').first();
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await confirmBtn.click({ force: true });
          await this.page.waitForTimeout(2000);
        }

        const rowGone = await matchingRow.waitFor({ state: 'hidden', timeout: 5000 })
          .then(() => true).catch(() => false);
        if (!rowGone) { console.log('    ⚠ Row still visible — stopping loop'); break; }

        console.log('    ✓ Deleted');
        deleted++;
      }
      grandTotal += deleted;
    }

    console.log(`  🗑  Cleared ${grandTotal} test(s) on ${examDate}`);
    return grandTotal;
  }

  // ── PUBLIC: navigate to AddQuestion via Edit button ────────────────────────
  /**
   * Finds the test in the list (status "Paper Created-No Questions Selected"),
   * clicks Edit, and waits for the AddQuestion page.
   *
   * @param {string} examName partial or full exam name
   * @param {string} subject  Subject filter value
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

    // Wait for either AddQuestion (direct) or AddNewClassTest (form edit first)
    for (let i = 0; i < 30; i++) {
      const url = this.page.url();
      if (url.includes('AddQuestion') || url.includes('AddNewClassTest')) break;
      await this.page.waitForTimeout(1000);
    }

    // If the app opened the form editor first, click Save & Next to reach AddQuestion
    if (this.page.url().includes('AddNewClassTest')) {
      console.log('  ℹ  Edit opened form editor — clicking Save & Next to reach AddQuestion…');
      const saveBtn = this.page.locator([
        'button.btn-square.btn-submit',
        'button:has-text("Save & Next")',
        'button:has-text("SAVE & NEXT")',
      ].join(', ')).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click();

      for (let i = 0; i < 30; i++) {
        if (this.page.url().includes('AddQuestion')) break;
        await this.page.waitForTimeout(1000);
      }
    }

    if (!this.page.url().includes('AddQuestion')) {
      throw new Error(`Edit did NOT navigate to AddQuestion. URL: ${this.page.url()}`);
    }

    await this.page.waitForTimeout(2000);
    console.log('  ✓ On AddQuestion via Edit:', this.page.url());
  }
}

module.exports = { ClassTestListPage, LIST_URL, CLEANUP_STATUSES };
