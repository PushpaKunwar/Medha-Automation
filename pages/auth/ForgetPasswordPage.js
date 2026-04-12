class ForgetPasswordPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Form fields ────────────────────────────────────────────
    this.emailInput   = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[id*="email" i]').first();
    this.submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Reset"), button:has-text("Submit")').first();

    // ── Messages ───────────────────────────────────────────────
    this.successMessage = page.locator('[class*="success"], [class*="alert-success"], .message').first();
    this.errorMessage   = page.locator('.error, .alert-danger, [class*="error"], [class*="alert-danger"]').first();

    // ── Navigation ─────────────────────────────────────────────
    this.backToLoginLink = page.locator('a:has-text("Back"), a:has-text("Login"), a[href*="login"]').first();
  }

  async fillEmail(email) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async clickSubmit() {
    await this.submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitButton.click();
  }

  async requestPasswordReset(email) {
    await this.fillEmail(email);
    await this.clickSubmit();
  }

  async getSuccessMessage() {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.successMessage.textContent();
    } catch {
      return null;
    }
  }

  async getErrorMessage() {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async clickBackToLogin() {
    await this.backToLoginLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.backToLoginLink.click();
  }

  async isPageVisible() {
    return await this.emailInput.isVisible();
  }
}

module.exports = { ForgetPasswordPage };
