class MboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Top header ────────────────────────────────────────────────────────
    this.backButton      = page.locator('button:has-text("arrow_back"), .arrow_back').first();
    this.goLiveButton    = page.locator('button.live-btn-in-todo, button:has-text("GO LIVE"), button:has-text("Go Live")').first();
    this.completedButton = page.locator('button:has-text("Completed"), button:has-text("COMPLETED")').first();
    this.attendanceButton = page.locator('button:has-text("Attendance"), button:has-text("ATTENDANCE")').first();

    // ── M-Board sidebar tabs ──────────────────────────────────────────────
    this.recapTab        = page.locator('.sidebarinTodoInnerBtn').filter({ hasText: 'Recap' }).first();
    this.eContentTab     = page.locator('.sidebarinTodoInnerBtn').filter({ hasText: 'e-Content' }).first();
    this.eResourceTab    = page.locator('.sidebarinTodoInnerBtn').filter({ hasText: 'e-Resource' }).first();
    this.quizTab         = page.locator('.sidebarinTodoInnerBtn').filter({ hasText: 'Quiz' }).first();
    this.faqTab          = page.locator('.sidebarinTodoInnerBtn').filter({ hasText: 'FAQ' }).first();

    // ── e-Content popover ─────────────────────────────────────────────────
    this.eContentPopover   = page.locator('div.popover').first();
    this.youtubeIcon       = page.locator('svg[data-testid="YouTubeIcon"]').first();
    this.arIcon            = page.locator('span.playiconInpopovertab:has-text("view_in_ar")').first();
    this.moreVideoButton   = page.locator('button.video-load-more-econtent-btn').first();

    // ── YouTube video iframe ──────────────────────────────────────────────
    this.youtubeIframe     = page.locator('iframe[src*="youtube.com/embed"]').first();
  }

  /**
   * Wait for the M-Board canvas to be visible
   */
  async waitForLoad(timeout = 20000) {
    await this.eContentTab.waitFor({ state: 'visible', timeout });
  }

  /**
   * Click the e-Content sidebar tab to open the popover
   */
  async openEContent() {
    await this.eContentTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.eContentTab.click();
    await this.eContentPopover.waitFor({ state: 'visible', timeout: 8000 });
  }

  /**
   * Click the YouTube icon inside the e-Content popover
   */
  async clickYoutubeIcon() {
    await this.youtubeIcon.waitFor({ state: 'visible', timeout: 8000 });
    await this.youtubeIcon.click();
  }

  /**
   * Wait until the YouTube iframe is embedded in the page (video is playing)
   */
  async waitForYoutubeVideo(timeout = 15000) {
    await this.youtubeIframe.waitFor({ state: 'visible', timeout });
  }

  async isYoutubeVideoPlaying() {
    return await this.youtubeIframe.isVisible();
  }

  async getYoutubeVideoSrc() {
    return await this.youtubeIframe.getAttribute('src');
  }
}

module.exports = { MboardPage };
