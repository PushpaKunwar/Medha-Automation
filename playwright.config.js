// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://live.mafatlaleducation.com:5020/',
    headless: false,
    viewport: { width: 1280, height: 720 },
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
