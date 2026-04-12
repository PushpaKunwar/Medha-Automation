const { URLS } = require('../../utils/urls');

class LessonPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Lesson / ClassTest listing page
    this.lessonMenuLink   = page.locator('a[href*="/classtest"], a:has-text("Lesson"), nav a:has-text("Class Test")').first();
    this.addClassTestBtn  = page.locator('button.btn-square.btn-add, button[title*="Add"], button:has-text("+")').first();
    this.classTestTable   = page.locator('table, .classtest-list, .class-test-container').first();
  }

  /**
   * Navigate directly to the classtest list page
   */
  async navigate() {
    await this.page.goto(`${URLS.dashboard}classtest`, { waitUntil: 'commit' });
    await this.page.waitForTimeout(3000);
  }

  /**
   * Click the "+" / Add New Class Test button
   */
  async clickAddClassTest() {
    await this.addClassTestBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addClassTestBtn.click();
    await this.page.waitForTimeout(1500);
  }
}

module.exports = { LessonPage };
