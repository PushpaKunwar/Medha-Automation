/**
 * fixtures/baseFixture.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Playwright fixture + hook file.
 *
 * All tests import { test, expect } from here instead of '@playwright/test'.
 * Every page object is injected as a named fixture, and the auto-hooks
 * (beforeEach / afterEach) fire for every test automatically.
 *
 * HOOKS wired here (auto: true  → run for every test, no explicit usage):
 *   ┌─ beforeEach ──────────────────────────────────────────────────────────┐
 *   │  • Log test title + timestamp to console                              │
 *   │  • Capture browser console errors during the test                     │
 *   └───────────────────────────────────────────────────────────────────────┘
 *   ┌─ afterEach ───────────────────────────────────────────────────────────┐
 *   │  • On FAILURE → full-page FAIL screenshot saved to screenshots/       │
 *   │  • On PASS    → full-page PASS screenshot saved to screenshots/       │
 *   │  • Log test result + duration to console                              │
 *   └───────────────────────────────────────────────────────────────────────┘
 *
 * Usage in any test file:
 *   const { test, expect } = require('../../fixtures/baseFixture');
 *   test('TC01', async ({ loginPage, dashboardPage }) => { ... });
 */

const path = require('path');
const fs   = require('fs');
const { test: base } = require('@playwright/test');

// ── Page objects ──────────────────────────────────────────────────────────────
const { LoginPage }          = require('../pages/auth/LoginPage');
const { ForgetPasswordPage } = require('../pages/auth/ForgetPasswordPage');
const { DashboardPage }      = require('../pages/dashboard/DashboardPage');
const { LessonPage }         = require('../pages/lesson/LessonPage');
const { ClassTestListPage }  = require('../pages/lesson/classtest/ClassTestListPage');
const { AddClassTestPage }   = require('../pages/lesson/classtest/AddClassTestPage');
const { AddQuestionPage }    = require('../pages/lesson/classtest/AddQuestionPage');
const { WorksheetListPage }  = require('../pages/lesson/worksheet/WorksheetListPage');
const { WorksheetWizardPage }= require('../pages/lesson/worksheet/WorksheetWizardPage');
const { WorksheetPage }      = require('../pages/lesson/worksheet/WorksheetPage');
const { CollaborationPage }  = require('../pages/lesson/collaboration/CollaborationPage');
const { TodoPage }           = require('../pages/todo/TodoPage');
const { MboardPage }         = require('../pages/todo/MboardPage');

// ── Helpers ───────────────────────────────────────────────────────────────────
const { loginAndGoToDashboard } = require('../utils/authHelper');
const { credentials }           = require('../test-data/credentials');
const { URLS }                  = require('../utils/urls');

// ── Screenshot helpers ────────────────────────────────────────────────────────
const SCREENSHOT_BASE = path.join(__dirname, '..', 'screenshots');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeTitle(title) {
  return title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
}

async function saveScreenshot(page, status, title) {
  const dir  = path.join(SCREENSHOT_BASE, 'hooks');
  ensureDir(dir);
  const file = path.join(dir, `${status}__${sanitizeTitle(title)}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  console.log(`  ${status === 'PASS' ? '✅' : '❌'} [${status} screenshot]  ${path.basename(file)}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// EXTENDED TEST with fixtures + auto hooks
// ═════════════════════════════════════════════════════════════════════════════
const test = base.extend({

  // ── AUTO HOOK: beforeEach ─────────────────────────────────────────────────
  // Runs before every test automatically (no need to list in test args).
  _beforeEachHook: [async ({ page }, use, testInfo) => {
    const startTime = Date.now();

    // 1. Log test start
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`▶  ${testInfo.title}`);
    console.log(`   File : ${path.relative(process.cwd(), testInfo.file)}`);
    console.log(`   Start: ${new Date().toLocaleTimeString()}`);
    console.log(`${'─'.repeat(70)}`);

    // 2. Collect browser console errors — stored on page so tests can inspect them
    page._consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        page._consoleErrors.push(msg.text());
      }
    });

    // 3. Collect uncaught page exceptions
    page._pageErrors = [];
    page.on('pageerror', err => {
      page._pageErrors.push(err.message);
    });

    await use(); // ← test body runs here

    // Expose duration for afterEach
    page._testDurationMs = Date.now() - startTime;
  }, { auto: true }],

  // ── AUTO HOOK: afterEach ──────────────────────────────────────────────────
  // Runs after every test automatically.
  _afterEachHook: [async ({ page }, use, testInfo) => {
    await use(); // ← test body runs here (hooks wrap, not replace)

    const status   = testInfo.status;   // 'passed' | 'failed' | 'skipped' | 'timedOut'
    const duration = page._testDurationMs
      ? `${(page._testDurationMs / 1000).toFixed(1)}s`
      : '–';

    // 1. Screenshot on pass or fail
    if (status === 'failed' || status === 'timedOut') {
      await saveScreenshot(page, 'FAIL', testInfo.title);
    } else if (status === 'passed') {
      await saveScreenshot(page, 'PASS', testInfo.title);
    }

    // 2. Log browser console errors (warnings in output, not failures)
    if (page._consoleErrors?.length) {
      console.log(`  ⚠  Browser console errors during test (${page._consoleErrors.length}):`);
      page._consoleErrors.slice(0, 3).forEach(e => console.log(`     • ${e.substring(0, 120)}`));
    }

    // 3. Log result summary
    const icon = { passed: '✅', failed: '❌', skipped: '⏭', timedOut: '⏱' }[status] ?? '•';
    console.log(`\n${icon}  ${status.toUpperCase()}  ${testInfo.title}  (${duration})`);
    console.log(`${'─'.repeat(70)}\n`);
  }, { auto: true }],

  // ── Page fixtures (one per page class) ───────────────────────────────────

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgetPasswordPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  lessonPage: async ({ page }, use) => {
    await use(new LessonPage(page));
  },

  classTestListPage: async ({ page }, use) => {
    await use(new ClassTestListPage(page));
  },

  addClassTestPage: async ({ page }, use) => {
    await use(new AddClassTestPage(page));
  },

  addQuestionPage: async ({ page }, use) => {
    await use(new AddQuestionPage(page));
  },

  worksheetListPage: async ({ page }, use) => {
    await use(new WorksheetListPage(page));
  },

  worksheetWizardPage: async ({ page }, use) => {
    await use(new WorksheetWizardPage(page));
  },

  worksheetPage: async ({ page }, use) => {
    await use(new WorksheetPage(page));
  },

  collaborationPage: async ({ page }, use) => {
    await use(new CollaborationPage(page));
  },

  todoPage: async ({ page }, use) => {
    await use(new TodoPage(page));
  },

  mboardPage: async ({ page }, use) => {
    await use(new MboardPage(page));
  },

  // ── Authenticated page ────────────────────────────────────────────────────
  // Use this fixture when a test must start already logged in to the dashboard.
  // The login is performed once before use(); no need to call loginAndGoToDashboard()
  // inside the test body.
  //
  // Usage:  test('my test', async ({ authenticatedPage }) => { ... })
  authenticatedPage: async ({ page }, use) => {
    await loginAndGoToDashboard(page);
    await use(page);
  },
});

const { expect } = base;

module.exports = { test, expect, URLS, credentials };
