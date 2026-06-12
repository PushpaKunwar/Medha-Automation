const { URLS } = require('../../utils/urls');

/**
 * LessonPage — Lesson module landing page
 * ─────────────────────────────────────────────────────────────────────────────
 * Navigation: Dashboard → Lesson (sidebar module)
 *
 * The Lesson module is the entry point for lesson-related features.
 * Sub-menu items inside Lesson:
 *   • Class Test  → /classtest
 *   • Worksheet   → /assignment
 */
class LessonPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Lesson sidebar module link ─────────────────────────────────────────
    this.lessonModuleLink  = page.locator('a[href*="lesson"], a:has-text("Lesson")').first();

    // ── Class Test sub-menu link (inside Lesson module) ───────────────────
    this.classTestMenuLink = page.locator('a[href*="/classtest"], a:has-text("Class Test")').first();

    // ── Worksheet sub-menu link (inside Lesson module) ────────────────────
    // href may be "/assignment", "assignment", "/lesson/assignment", etc.
    this.worksheetMenuLink = page.locator([
      'a[href*="assignment"]',
      'a:has-text("Worksheet")',
      'a:has-text("Work Sheet")',
      'li:has-text("Worksheet") > a',
      'li:has-text("Work Sheet") > a',
    ].join(', ')).first();

    // ── Class Test list page elements ──────────────────────────────────────
    this.addClassTestBtn   = page.locator('button.btn-square.btn-add, button[title*="Add"], button:has-text("+")').first();
    this.classTestTable    = page.locator('table, .classtest-list, .class-test-container').first();
  }

  /**
   * Navigate directly to the Class Test list page.
   * (Class Test is a sub-menu of the Lesson module, URL: /classtest)
   */
  async navigateToClassTest() {
    await this.page.goto(`${URLS.dashboard}classtest`, { waitUntil: 'commit' });
    await this.page.waitForTimeout(3000);
  }

  /**
   * Navigate directly to the Worksheet list page.
   * (Worksheet is a sub-menu of the Lesson module, URL: /assignment)
   */
  async navigateToWorksheet() {
    await this.page.goto(URLS.worksheet, { waitUntil: 'commit' });
    await this.page.waitForTimeout(3000);
  }

  /**
   * @deprecated Use navigateToClassTest() instead.
   */
  async navigate() {
    return this.navigateToClassTest();
  }

  /** Click the Class Test sub-menu item inside the Lesson module sidebar */
  async clickClassTestMenu() {
    await this.classTestMenuLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.classTestMenuLink.click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Click the Worksheet sub-menu item inside the Lesson module sidebar.
   * If the submenu is not yet visible (collapsed), expands the Lesson module first.
   */
  async clickWorksheetMenu() {
    // If submenu is not visible yet, the Lesson accordion may need expanding
    const alreadyVisible = await this.worksheetMenuLink
      .isVisible({ timeout: 2000 }).catch(() => false);

    if (!alreadyVisible) {
      await this.lessonModuleLink.click().catch(() => {});
      await this.page.waitForTimeout(2000);   // wait for accordion animation
    }

    await this.worksheetMenuLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.worksheetMenuLink.click();
    await this.page.waitForTimeout(1500);
  }

  /** Click the "+" / Add New Class Test button on the list page */
  async clickAddClassTest() {
    await this.addClassTestBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addClassTestBtn.click();
    await this.page.waitForTimeout(1500);
  }
}

module.exports = { LessonPage };
