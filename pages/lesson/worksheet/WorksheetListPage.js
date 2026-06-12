/**
 * WorksheetListPage — Worksheet list page actions and filters.
 * URL: /assignment
 *
 * The "WORKSHEET BY" button (top-right, with logo icon) opens the creation wizard.
 */

const { URLS } = require('../../../utils/urls');
const { selectCampusDropdown } = require('../../../utils/selectDropdown');

const WORKSHEET_URL = URLS.worksheet;

class WorksheetListPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── "WORKSHEET BY" / Create Worksheet button (top-right of list page) ──
    // The actual UI shows a button labelled "WORKSHEET BY" with an icon.
    // Multiple selectors are tried so the test survives minor text changes.
    this.createWorksheetBtn = page.locator([
      'button:has-text("WORKSHEET BY")',
      'button:has-text("Worksheet By")',
      'button:has-text("worksheet by")',
      'button:has-text("Create Worksheet")',
      'button:has-text("Create")',
      'button:has-text("+ Create")',
      'button:has-text("Add Worksheet")',
      'button.btn-add',
      'button.btn-square.btn-add',
      'a:has-text("WORKSHEET BY")',
      'a:has-text("Create Worksheet")',
    ].join(', ')).first();

    // Search button on list-page filters
    this.searchBtn = page.locator([
      'button.multipleFIlterSearchBtn',
      'button:has-text("Search")',
    ].join(', ')).first();
  }

  async navigate() {
    await this.page.goto(WORKSHEET_URL, { waitUntil: 'commit' });
    await this.page.waitForTimeout(3000);
    console.log('  ✓ On Worksheet list:', this.page.url().split('?')[0]);
  }

  /**
   * Apply filter dropdowns on the list page and click Search.
   * @param {{ school?, session?, grade?, section?, subject?, status? }} filters
   */
  async applyFilters(filters = {}) {
    if (filters.school)   await selectCampusDropdown(this.page, 'School',   filters.school);
    if (filters.session)  await selectCampusDropdown(this.page, 'Session',  filters.session);
    if (filters.grade)    await selectCampusDropdown(this.page, 'Grade',    filters.grade);
    if (filters.section)  await selectCampusDropdown(this.page, 'Section',  filters.section);
    if (filters.subject)  await selectCampusDropdown(this.page, 'Subject',  filters.subject);
    if (filters.status)   await selectCampusDropdown(this.page, 'status',   filters.status);

    const searchVisible = await this.searchBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (searchVisible) {
      await this.searchBtn.click();
      await this.page.waitForTimeout(2500);
    }
    console.log('    ✓ Filters applied');
  }

  /**
   * Click the "WORKSHEET BY" button to open the worksheet creation wizard.
   */
  async clickCreateWorksheet() {
    await this.createWorksheetBtn.waitFor({ state: 'visible', timeout: 12000 });
    await this.createWorksheetBtn.scrollIntoViewIfNeeded();
    await this.createWorksheetBtn.click();
    await this.page.waitForTimeout(2000);
    console.log('  ✓ Clicked "WORKSHEET BY" — wizard opened');
  }

  /** @param {string} worksheetTitle partial or full title to match */
  async clickEditByTitle(worksheetTitle) {
    const row = this.page.locator('tr').filter({ hasText: worksheetTitle }).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.hover().catch(() => {});
    await this.page.waitForTimeout(300);

    const editIcon = row.locator('span.material-symbols-outlined')
      .filter({ hasText: 'edit' }).first();
    await editIcon.waitFor({ state: 'visible', timeout: 6000 });
    await editIcon.click();
    console.log(`  ✓ Clicked Edit for "${worksheetTitle}"`);
    await this.page.waitForTimeout(1500);
  }

  /** @param {string} worksheetTitle partial or full title to match */
  async deleteByTitle(worksheetTitle) {
    const row = this.page.locator('tr').filter({ hasText: worksheetTitle }).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.hover().catch(() => {});
    await this.page.waitForTimeout(300);

    const deleteIcon = row.locator('span.material-symbols-outlined')
      .filter({ hasText: 'delete' }).first();
    await deleteIcon.waitFor({ state: 'visible', timeout: 6000 });
    await deleteIcon.click();
    await this.page.waitForTimeout(800);

    const confirmBtn = this.page.locator([
      'button:has-text("Yes")',
      '.swal2-confirm',
      'button:has-text("Yes, delete")',
      'button:has-text("OK")',
      'button:has-text("Confirm")',
      'button:has-text("Delete")',
    ].join(', ')).first();

    const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasConfirm) {
      await confirmBtn.click();
      console.log(`  ✓ Deleted "${worksheetTitle}"`);
      await this.page.waitForTimeout(2000);
    } else {
      console.log(`  ⚠ Confirm dialog not found for delete "${worksheetTitle}"`);
    }
  }
}

module.exports = { WorksheetListPage, WORKSHEET_URL };
