const path = require('path');
const fs   = require('fs');

// ── Folder map (mirrors pages/ structure) ─────────────────────────────────────
const BASE = path.join(__dirname, '..', 'screenshots');

const FOLDERS = {
  login:          path.join(BASE, 'auth', 'login'),
  forgotPassword: path.join(BASE, 'auth', 'forgot-password'),
  dashboard:      path.join(BASE, 'home', 'dashboard'),
  todo:           path.join(BASE, 'home', 'todo'),
  mboard:         path.join(BASE, 'home', 'mboard'),
  lesson:         path.join(BASE, 'home', 'lesson'),
  addClassTest:   path.join(BASE, 'home', 'add-class-test'),
  // Single folder for all TC07 steps (lesson + add-class-test combined)
  tc07:           path.join(BASE, 'TC07'),
  // TC08 — four sub-steps each get their own folder
  tc08Form:       path.join(BASE, 'TC08', '01-add-class-test-form'),
  tc08Questions:  path.join(BASE, 'TC08', '02-select-questions'),
  tc08Submit:     path.join(BASE, 'TC08', '03-submit'),
  tc08Finalize:   path.join(BASE, 'TC08', '04-finalize'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
}

/**
 * Delete all old screenshots in a folder whose name starts with a given prefix.
 * Used to wipe previous FAILED__ shots before a fresh run.
 */
function clearOldScreenshots(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir)
    .filter(f => f.endsWith('.png') && (prefix === '' || f.startsWith(prefix)))
    .forEach(f => fs.unlinkSync(path.join(dir, f)));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call once at the START of each test (beforeEach) to wipe stale screenshots
 * for that test so the folder always reflects only the latest run.
 * @param {string} testName - e.g. 'TC01'  (prefix to match files)
 */
function clearTestScreenshots(testName) {
  const prefix = sanitize(testName);
  Object.values(FOLDERS).forEach(dir => clearOldScreenshots(dir, prefix));
  // also clear any FAILED__ shots for this test
  Object.values(FOLDERS).forEach(dir => clearOldScreenshots(dir, `FAILED__${prefix}`));
}

/**
 * Take a step screenshot — overwrites any previous file with the same name.
 * Fixed filename = no duplicates across runs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} folder   - key from FOLDERS (e.g. 'login') OR absolute path
 * @param {string} stepName - unique label per step, e.g. 'TC01_step1_login_page_opened'
 */
async function screenshotStep(page, folder, stepName) {
  const dir  = FOLDERS[folder] ?? folder;
  ensureDir(dir);
  const file = path.join(dir, `${sanitize(stepName)}.png`);   // ← fixed name, no timestamp
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 [PASS]  ${path.basename(file)}`);
}

/**
 * Take a failure screenshot — fixed name per test, overwrites previous failure.
 * Called automatically from test.afterEach when status === 'failed'.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} folder     - key from FOLDERS or absolute path
 * @param {string} testTitle  - test name  (used as filename)
 */
async function screenshotFail(page, folder, testTitle) {
  const dir  = FOLDERS[folder] ?? folder;
  ensureDir(dir);
  const file = path.join(dir, `FAILED__${sanitize(testTitle)}.png`); // ← fixed name
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ❌ [FAIL]  ${path.basename(file)}`);
}

module.exports = { screenshotStep, screenshotFail, clearTestScreenshots, FOLDERS };
