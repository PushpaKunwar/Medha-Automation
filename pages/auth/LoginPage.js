const { URLS } = require('../../utils/urls');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Locators
    // Login input is type="text" (not email) — placeholder contains "Email"
    this.emailInput         = page.locator('input[placeholder*="email" i], input[placeholder*="UserID" i], input[name="name"], input[type="email"]').first();
    this.passwordInput      = page.locator('input[type="password"]').first();
    this.loginButton        = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
    this.errorMessage       = page.locator('.error, .alert-danger, [class*="error"], [class*="alert"]').first();
    this.forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("forgot"), a:has-text("Reset"), a[href*="forgot"], a[href*="reset"]').first();
  }

  async navigate() {
    await this.page.goto(URLS.login);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillEmail(email) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginButton.click();
  }

  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.forgotPasswordLink.click();
  }

  async getErrorMessage() {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async isLoginPageVisible() {
    return await this.passwordInput.isVisible();
  }
}

module.exports = { LoginPage };
