const { URLS } = require('../../utils/urls');

class TodoPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Navigation ─────────────────────────────────────────────────────────
    this.todoNavLink      = page.locator('a:has-text("TO-DO"), a[href*="todo"]').first();

    // ── Today's class card ─────────────────────────────────────────────────
    this.startClassButton = page.locator('button.start-class-btn-todo').first();

    // ── Ongoing class dialog (appears when a class is already in progress) ─
    this.ongoingClassDialog = page.locator('[role="dialog"]').first();
    this.endClassButton     = page.locator('button.startClassPopupBtnToDo:has-text("End Class")');
    this.continueClassButton = page.locator('button.startClassPopupBtnToDo:has-text("Continue")');
    this.closeDialogButton  = page.locator('button.btn-round.btn-edit:has-text("close")');
  }

  async navigate() {
    await this.page.goto(`${URLS.dashboard}todo`, { waitUntil: 'commit' });
    await this.startClassButton.waitFor({ state: 'visible', timeout: 20000 });
  }

  async clickStartClass() {
    await this.startClassButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.startClassButton.click();
  }

  /**
   * Handle the "ongoing class" popup:
   * - If dialog appears → click "End Class" to end previous and start fresh
   * - If no dialog → class starts directly
   */
  async handleOngoingClassDialog(action = 'end') {
    const endVisible = await this.endClassButton.isVisible({ timeout: 4000 }).catch(() => false);
    if (endVisible) {
      if (action === 'end') {
        await this.endClassButton.click();
      } else {
        await this.continueClassButton.click();
      }
      console.log(`  Ongoing class dialog → clicked "${action === 'end' ? 'End Class' : 'Continue'}"`);
    } else {
      console.log('  No ongoing class dialog — class started directly');
    }
  }

  async isMboardLoaded() {
    // After start class the URL changes to /todoin/...
    await this.page.waitForURL('**/todoin/**', { timeout: 20000 });
    return this.page.url().includes('/todoin/');
  }
}

module.exports = { TodoPage };
