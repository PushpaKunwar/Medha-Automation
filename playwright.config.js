// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  globalSetup: './utils/globalSetup',
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html',  { open: 'never', outputFolder: 'reports/html' }],
    ['json',  { outputFile: 'reports/results.json' }],
    ['list'],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://live.mafatlaleducation.com:5020/',
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,        // 30 s cap on every click / fill / scroll — prevents inheriting the full test timeout
    screenshot: 'off',           // screenshots handled manually per step in tests
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    // Grant microphone & camera so browser permission popups are auto-accepted
    permissions: ['microphone', 'camera'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',    // auto-accept mic/cam browser prompts
        '--use-fake-device-for-media-stream', // use virtual mic/cam device
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
