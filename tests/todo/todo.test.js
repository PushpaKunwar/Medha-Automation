/**
 * tests/todo/todo.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TO-DO module tests
 *
 *  TC06  TO-DO → Start Class → e-Content → YouTube video plays
 *
 *  Screenshots:
 *    PASS__TC06.png — taken once at the end when test passes
 *    FAIL__TC06.png — taken automatically when test fails
 *
 *  Run all:  npx playwright test tests/todo/todo.test.js --headed
 *  Run one:  npx playwright test tests/todo/todo.test.js --grep "TC06" --headed
 */

const { test, expect }  = require('@playwright/test');
const { TodoPage }      = require('../../pages/todo/TodoPage');
const { MboardPage }    = require('../../pages/todo/MboardPage');
const { screenshotPass, screenshotFail } = require('../../utils/screenshot');
const { loginAndGoToDashboard } = require('../../utils/authHelper');

// ── afterEach: screenshot on failure only ─────────────────────────────────────
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    const title  = testInfo.title.toLowerCase();
    const folder = title.includes('youtube') || title.includes('mboard') || title.includes('e-content')
      ? 'mboard'
      : 'todo';
    await screenshotFail(page, folder, testInfo.title);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('TO-DO Module Tests', () => {

  // ── TC06 ───────────────────────────────────────────────────────────────────
  test('TC06 - TODO → Start Class → e-Content → YouTube video plays', async ({ page }) => {
    const todoPage   = new TodoPage(page);
    const mboardPage = new MboardPage(page);

    // Login → Dashboard
    const dashboardPage = await loginAndGoToDashboard(page);
    expect(page.url()).toContain(':5110');
    console.log('Dashboard URL:', page.url());

    // Navigate to TO-DO module
    await todoPage.navigate();
    expect(page.url()).toContain('/todo');
    console.log('TODO URL:', page.url());

    // Click "Start Class"
    await todoPage.clickStartClass();
    await page.waitForTimeout(2000);

    // Handle "ongoing class" popup if it appears
    await todoPage.handleOngoingClassDialog('end');

    // M-Board loads (URL → /todoin/...)
    await mboardPage.waitForLoad(20000);
    expect(page.url()).toContain('/todoin/');
    console.log('Mboard URL:', page.url());

    // Click "e-Content" sidebar tab → popover opens
    await mboardPage.openEContent();
    await expect(mboardPage.eContentPopover).toBeVisible({ timeout: 8000 });

    // Click YouTube icon inside e-Content popover
    await mboardPage.clickYoutubeIcon();

    // YouTube iframe embeds — video is playing
    await mboardPage.waitForYoutubeVideo(15000);
    const ytSrc = await mboardPage.getYoutubeVideoSrc();
    console.log('YouTube iframe src:', ytSrc?.substring(0, 80));

    expect(ytSrc).toContain('youtube.com/embed');
    await expect(mboardPage.youtubeIframe).toBeVisible({ timeout: 5000 });

    // ── Pass screenshot ───────────────────────────────────────────────────────
    await screenshotPass(page, 'mboard', 'TC06');
  });

});
