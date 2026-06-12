/**
 * tests/lesson/collaboration/collaboration.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC16  Create Collaboration (COL01)
 *
 * Run all:        npx playwright test collaboration --headed
 * Run one entry:  npx playwright test collaboration --grep "TC16-COL01" --headed
 */

const path = require('path');
const { test, expect } = require('@playwright/test');
const { CollaborationPage }     = require('../../../pages/lesson/collaboration/CollaborationPage');
const { collaborationData }     = require('../../../test-data/collaborationData');
const { screenshotPass, screenshotFail, FOLDERS } = require('../../../utils/screenshot');
const { loginAndGoToDashboard } = require('../../../utils/authHelper');

// ── Step-level screenshot helper ─────────────────────────────────────────────
const fs = require('fs');

/**
 * Take a step screenshot and save it to the TC16 folder.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} id     Data entry id  (e.g. 'COL01')
 * @param {string} label  Step label     (e.g. '01_list')
 */
async function snap(page, id, label) {
  try {
    const dir = FOLDERS.tc16;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ts   = Date.now();
    const file = path.join(dir, `${id}_${label}_${ts}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  📸 ${path.basename(file)}`);
  } catch (_) {}
}

// ═════════════════════════════════════════════════════════════════════════════
// TC16 — Create Collaboration
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC16 - Create Collaboration', () => {

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await screenshotFail(page, 'tc16', testInfo.title);
    }
  });

  for (const data of collaborationData) {
    // Build a readable test title that reflects the user selection mode
    const userLabel = data.userSelection === 'All' ? 'All Users' : `User: ${data.userSelection}`;
    test(
      `TC16-${data.id} - [${data.subject} | ${data.chapter} | ${userLabel}]`,
      async ({ page }) => {
        test.setTimeout(300_000);   // 5 minutes
        const id = data.id;
        console.log(`\n▶  ${id}: ${data.description}`);

        // ── PRE-BROWSER ASSERTIONS ──────────────────────────────────────────
        // Mandatory field presence checks (all fields marked * in the UI)
        expect(data.date,            `[${id}] Date (*) must not be blank`).toBeTruthy();
        expect(data.time,            `[${id}] Time (*) must not be blank`).toBeTruthy();
        expect(data.institution,     `[${id}] Institution (*) must not be blank`).toBeTruthy();
        expect(data.grade,           `[${id}] Grade (*) must not be blank`).toBeTruthy();
        expect(data.section,         `[${id}] Section (*) must not be blank`).toBeTruthy();
        expect(data.subject,         `[${id}] Subject (*) must not be blank`).toBeTruthy();
        expect(data.chapter,         `[${id}] Chapter (*) must not be blank`).toBeTruthy();
        expect(data.topic,           `[${id}] Topic (*) must not be blank`).toBeTruthy();
        expect(data.userSelection,   `[${id}] User (*) must not be blank`).toBeTruthy();
        expect(data.collaborationUrl,`[${id}] Collaboration URL (*) must not be blank`).toBeTruthy();
        expect(data.notes,           `[${id}] Description (*) must not be blank`).toBeTruthy();

        // Collaboration URL must be a valid URL
        expect(data.collaborationUrl,
          `[${id}] Collaboration URL must start with http:// or https://`
        ).toMatch(/^https?:\/\//);

        // Date must be in YYYY-MM-DD format (what the input stores internally)
        expect(data.date,
          `[${id}] Date must be in YYYY-MM-DD format`
        ).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Time must be in HH:mm format
        expect(data.time,
          `[${id}] Time must be in HH:mm format`
        ).toMatch(/^\d{2}:\d{2}$/);

        // User selection assertion (pre-browser): value must be 'All' or a non-empty name
        if (data.userSelection === 'All') {
          console.log(`  ✓ User assertion rule: "All" selected → ALL users will be mapped`);
        } else {
          expect(data.userSelection.trim()).toBeTruthy();
          console.log(`  ✓ User assertion rule: "${data.userSelection}" selected → only that user will be mapped`);
        }

        console.log('  ✓ Pre-browser assertions passed');

        // ── STEP 1: Login ────────────────────────────────────────────────────
        await loginAndGoToDashboard(page);
        console.log(`  ✓ Logged in: ${page.url()}`);

        // ── STEP 2: Navigate to Collaboration list ───────────────────────────
        const collab = new CollaborationPage(page);
        await collab.navigate();
        expect(page.url()).toContain('collaboration');
        await snap(page, id, '01_list');

        // ── STEP 3: Click "+" button to open creation panel ──────────────────
        await collab.clickAddCollaboration();
        await snap(page, id, '02_form_open');

        // ── STEP 4: Fill the creation form ───────────────────────────────────
        await collab.fillForm({
          date:              data.date,
          time:              data.time,
          institution:       data.institution,
          grade:             data.grade,
          section:           data.section,
          subject:           data.subject,
          chapter:           data.chapter,
          topic:             data.topic,
          userSelection:     data.userSelection,
          collaborationUrl:  data.collaborationUrl,
          collaborationName: data.collaborationName,
          notes:             data.notes,
        });
        await snap(page, id, '03_form_filled');

        // ── STEP 5: Submit ────────────────────────────────────────────────────
        await collab.clickSubmit();
        await snap(page, id, '04_after_submit');

        // ── STEP 6: Verify entry appears in listing ───────────────────────────
        await collab.verifyInListing();
        await snap(page, id, '05_listing');

        console.log(`  ✅ ${id} — Collaboration created successfully`);
        await screenshotPass(page, 'tc16', `TC16_${id}`);
      }
    );
  }
});
