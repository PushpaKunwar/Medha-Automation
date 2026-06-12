const path = require('path');
const fs   = require('fs');

// ── Folder map ────────────────────────────────────────────────────────────────
const BASE = path.join(__dirname, '..', 'screenshots');

const FOLDERS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login:          path.join(BASE, 'auth', 'login'),
  forgotPassword: path.join(BASE, 'auth', 'forgot-password'),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard:      path.join(BASE, 'dashboard'),

  // ── TO-DO module ──────────────────────────────────────────────────────────
  todo:           path.join(BASE, 'todo'),
  mboard:         path.join(BASE, 'todo', 'mboard'),

  // ── Lesson → Worksheet ───────────────────────────────────────────────────
  worksheetList:   path.join(BASE, 'lesson', 'worksheet', 'list'),
  worksheetCreate: path.join(BASE, 'lesson', 'worksheet', 'create'),

  // TC11 — data-driven worksheet creation
  tc11:            path.join(BASE, 'lesson', 'worksheet', 'TC11'),

  // TC12 — Scenario 1: Full Happy Path
  tc12Create:      path.join(BASE, 'lesson', 'worksheet', 'TC12', 'S1-01-create'),
  tc12Verify:      path.join(BASE, 'lesson', 'worksheet', 'TC12', 'S1-02-verify'),

  // TC13 — Scenario 2: Create then Delete
  tc13Create:      path.join(BASE, 'lesson', 'worksheet', 'TC13', 'S2-01-create'),
  tc13Delete:      path.join(BASE, 'lesson', 'worksheet', 'TC13', 'S2-02-delete'),

  // TC14 — Scenario 3: Edit an existing worksheet
  tc14Edit:        path.join(BASE, 'lesson', 'worksheet', 'TC14', 'S3-01-edit'),

  // TC15 — Scenario 4: Full wizard step-by-step
  tc15Wizard:      path.join(BASE, 'lesson', 'worksheet', 'TC15'),

  // ── Lesson → Collaboration ────────────────────────────────────────────────
  // TC16 — Create Collaboration
  tc16:            path.join(BASE, 'lesson', 'collaboration', 'TC16'),

  // ── Lesson → Class Test ───────────────────────────────────────────────────
  tc07:           path.join(BASE, 'lesson', 'classtest', 'TC07'),

  tc08Form:       path.join(BASE, 'lesson', 'classtest', 'TC08', 'S1-01-form'),
  tc08Questions:  path.join(BASE, 'lesson', 'classtest', 'TC08', 'S1-02-questions'),
  tc08Submit:     path.join(BASE, 'lesson', 'classtest', 'TC08', 'S1-03-submit'),
  tc08Finalize:   path.join(BASE, 'lesson', 'classtest', 'TC08', 'S1-04-finalize'),

  tc09SkipQ:      path.join(BASE, 'lesson', 'classtest', 'TC09', 'S2-01-skip-questions'),
  tc09EditQ:      path.join(BASE, 'lesson', 'classtest', 'TC09', 'S2-02-edit-add-questions'),

  tc10Conflict:   path.join(BASE, 'lesson', 'classtest', 'TC10', 'S3-conflict-handling'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Take a PASS screenshot — called once at the end of a test that passes.
 * Filename is fixed (no timestamp) so each run overwrites the previous one.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} folder   - key from FOLDERS (e.g. 'login') or absolute path
 * @param {string} testName - e.g. 'TC01_passed'
 */
async function screenshotPass(page, folder, testName) {
  const dir  = FOLDERS[folder] ?? folder;
  ensureDir(dir);
  const file = path.join(dir, `PASS__${sanitize(testName)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ✅ [PASS screenshot]  ${path.basename(file)}`);
}

/**
 * Take a FAIL screenshot — called from afterEach when the test fails.
 * Filename is fixed so each run overwrites the previous failure shot.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} folder    - key from FOLDERS or absolute path
 * @param {string} testTitle - test name used as filename
 */
async function screenshotFail(page, folder, testTitle) {
  const dir  = FOLDERS[folder] ?? folder;
  ensureDir(dir);
  const file = path.join(dir, `FAIL__${sanitize(testTitle)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ❌ [FAIL screenshot]  ${path.basename(file)}`);
}

module.exports = { screenshotPass, screenshotFail, FOLDERS };
