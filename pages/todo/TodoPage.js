const { URLS } = require('../../utils/urls');

/**
 * TodoPage — TO-DO module
 * ─────────────────────────────────────────────────────────────────────────────
 * Navigation: Dashboard → TO-DO (sidebar module)
 * URL:        /todo
 *
 * The TO-DO list shows today's scheduled classes.
 * Clicking "Start Class" launches the M-Board (interactive whiteboard).
 * If a class is already in progress, an "ongoing class" dialog appears first.
 */
class TodoPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Today's class card ─────────────────────────────────────────────────
    this.startClassButton     = page.locator('button.start-class-btn-todo').first();

    // ── Ongoing class dialog (appears when a class is already in progress) ─
    this.ongoingClassDialog   = page.locator('[role="dialog"]').first();
    this.endClassButton       = page.locator('button.startClassPopupBtnToDo:has-text("End Class")');
    this.continueClassButton  = page.locator('button.startClassPopupBtnToDo:has-text("Continue")');
    this.closeDialogButton    = page.locator('button.btn-round.btn-edit:has-text("close")');
  }

  /** Navigate directly to the TO-DO module */
  async navigate() {
    await this.page.goto(`${URLS.dashboard}todo`, { waitUntil: 'commit' });
    await this.startClassButton.waitFor({ state: 'visible', timeout: 20000 });
  }

  /** Click the "Start Class" button on today's class card */
  async clickStartClass() {
    await this.startClassButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.startClassButton.click();
  }

  /**
   * Handle the "ongoing class" popup that appears if a class is already active:
   *  action = 'end'      → click "End Class" to terminate the running class
   *  action = 'continue' → click "Continue" to rejoin the running class
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

  /** Returns true once the URL transitions to /todoin/... (M-Board loaded) */
  async isMboardLoaded() {
    await this.page.waitForURL('**/todoin/**', { timeout: 20000 });
    return this.page.url().includes('/todoin/');
  }
}

module.exports = { TodoPage };
