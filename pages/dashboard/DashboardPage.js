const { URLS } = require('../../utils/urls');

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Top-right profile section ──────────────────────────────
    this.profileButton      = page.locator('.profileSectionInHeader').first();

    // ── Dropdown (visible after clicking profile button) ───────
    this.profileDropdown    = page.locator('.dropdown-item').first();
    this.profileName        = page.locator('.ttitttleCardStylesinPopup').first();
    this.changePasswordLink = page.locator('p.userChnagePassword').first();
    this.logoutLink         = page.locator('.userProfileModalPop a:has-text("Logout")').first();

    // ── Dashboard body ─────────────────────────────────────────
    this.sideNav            = page.locator('.dashBoardWholeContainer').first();

    // ── Sidebar module links ───────────────────────────────────
    this.todoModuleLink     = page.locator('a[href*="todo"], a:has-text("TO-DO")').first();
    this.lessonModuleLink   = page.locator('a[href*="lesson"], a:has-text("Lesson")').first();
  }

  /**
   * Wait until the SPA dashboard has fully mounted.
   * Tries the profile header first; falls back to sidebar/nav elements
   * because the dashboard continuously polls multiple microservices and
   * the profile section can be slow to render.
   */
  async waitForLoad(timeout = 30000) {
    const profileLoaded = await this.profileButton
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);

    if (!profileLoaded) {
      console.log('  ⚠ .profileSectionInHeader not found — falling back to sidebar/nav');
      const fallback = this.page.locator([
        '.dashBoardWholeContainer',
        'a[href*="lesson"]',
        'a:has-text("Lesson")',
        'a:has-text("Dashboard")',
        '.sidenav',
        'nav',
      ].join(', ')).first();
      await fallback.waitFor({ state: 'visible', timeout: 15000 });
    }

    console.log(`  ✓ Dashboard loaded: ${this.page.url()}`);
  }

  async isLoaded() {
    try {
      await this.waitForLoad();
      const passwordVisible = await this.page.locator('input[type="password"]').isVisible();
      return !passwordVisible;
    } catch {
      return false;
    }
  }

  /** Click the profile avatar button in the top-right header */
  async clickProfileButton() {
    await this.profileButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.profileButton.click();
  }

  /** Wait for the profile dropdown to appear after clicking the button */
  async waitForDropdown() {
    await this.profileDropdown.waitFor({ state: 'visible', timeout: 8000 });
  }

  /** Full logout flow: click profile → click Logout */
  async logout() {
    await this.clickProfileButton();
    await this.waitForDropdown();
    await this.logoutLink.waitFor({ state: 'visible', timeout: 8000 });
    await this.logoutLink.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }

  async getCurrentUrl() {
    return this.page.url();
  }
}

module.exports = { DashboardPage };
