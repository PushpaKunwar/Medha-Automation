const { expect } = require('@playwright/test');

/**
 * Wait for navigation to complete after an action
 * @param {import('@playwright/test').Page} page
 */
async function waitForNavigation(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}

/**
 * Take a screenshot with a descriptive name
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function takeScreenshot(page, name) {
  await page.screenshot({ path: `screenshots/${name}-${Date.now()}.png`, fullPage: true });
}

/**
 * Assert that the current URL contains a given path segment
 * @param {import('@playwright/test').Page} page
 * @param {string} pathSegment
 */
async function assertUrlContains(page, pathSegment) {
  await expect(page).toHaveURL(new RegExp(pathSegment));
}

module.exports = { waitForNavigation, takeScreenshot, assertUrlContains };
