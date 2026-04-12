/**
 * debug-saveandnext.js  v3
 * Fill the class test form, capture:
 *   1. addClassTest POST request body + response (to get class_test_id)
 *   2. getClassTestV1?classParams=classTest response (details of created test)
 * Then manually click Delete in the UI to capture the delete endpoint.
 * Run:  node debug-saveandnext.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const SS_DIR = path.join(__dirname, 'screenshots', 'debug-save');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function sel(page, dataName, optionText) {
  const trigger = page.locator(`[data-name="${dataName}"]`).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ force: true });
  const optList = page.locator('ul.filterOptionsListCustomSelectCampus');
  await optList.waitFor({ state: 'visible', timeout: 10000 });
  const sb = page.locator('.filterInputHolder input').first();
  if (await sb.isVisible().catch(() => false)) {
    await sb.fill(optionText.substring(0, 15));
    await page.waitForTimeout(400);
  }
  await page.locator('ul.filterOptionsListCustomSelectCampus li').filter({ hasText: optionText }).first().click();
  await optList.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  console.log(`  ✓ ${dataName} = "${optionText}"`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const captured = {};

  // Capture ALL POST requests + responses
  page.on('request', async req => {
    if (req.method() === 'POST' && req.url().includes('webapigateway')) {
      try {
        const body = JSON.parse(req.postData() || '{}');
        const key = req.url().split('/').slice(-2).join('/');
        if (!captured[key]) captured[key] = { requests: [], responses: [] };
        captured[key].requests.push(body);
      } catch(e) {}
    }
  });

  page.on('response', async res => {
    if (res.request().method() === 'POST' && res.url().includes('webapigateway')) {
      try {
        const body = await res.json();
        const key = res.url().split('/').slice(-2).join('/');
        if (!captured[key]) captured[key] = { requests: [], responses: [] };
        captured[key].responses.push(body);

        const url = res.url();
        if (url.includes('addClassTest')) {
          console.log(`\n  🎯 addClassTest response:`);
          console.log(`     ${JSON.stringify(body).substring(0, 400)}`);
        }
        if (url.includes('getClassTestV1') && url.includes('classParams=classTest')) {
          console.log(`\n  🎯 getClassTestV1?classParams=classTest response:`);
          console.log(`     ${JSON.stringify(body).substring(0, 600)}`);
        }
        if (url.includes('deleteClassTest') || url.includes('delete')) {
          console.log(`\n  🗑  DELETE response: ${JSON.stringify(body).substring(0, 400)}`);
        }
      } catch(e) {}
    }
  });

  try {
    // ── Login ──────────────────────────────────────────────────────────────────
    console.log('[1] Login…');
    await page.goto('https://live.mafatlaleducation.com:5020/', { waitUntil: 'commit' });
    await page.locator('input[placeholder*="email" i], input[placeholder*="UserID" i]').first().fill('teacherdemo@gmail.com');
    await page.fill('input[type="password"]', 'Teacher@01');
    await page.locator('button:has-text("Login")').first().click();
    await page.locator('.profileSectionInHeader').waitFor({ state: 'visible', timeout: 30000 });
    console.log('  ✓ Logged in');

    // ── Open form ──────────────────────────────────────────────────────────────
    console.log('\n[2] Open Add Class Test form…');
    await page.goto('https://live.mafatlaleducation.com:5110/classtest/AddNewClassTest', { waitUntil: 'commit' });
    await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 20000 });

    // ── Fill form ──────────────────────────────────────────────────────────────
    console.log('\n[3] Fill form…');
    await sel(page, 'School',          'Mafatlal');
    await sel(page, 'Session',         '2025-2026');
    await sel(page, 'Grade',           'IX');
    await sel(page, 'Section',         'A');
    await sel(page, 'Subject',         'Science');
    await sel(page, 'Select Chapters', 'Sound');

    // Compute a future date (today + 45 days) to avoid any existing conflicts
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const examDate = futureDate.toISOString().split('T')[0];
    console.log(`  Using exam date: ${examDate}`);

    await page.fill('input[name="exam_name"]',          'Sound Chapter Test DEBUG');
    await page.fill('input[name="number_of_questions"]', '5');
    await page.fill('input[name="total_marks"]',         '10');
    await page.locator('input[name="exam_date"]').fill(examDate);
    await page.locator('input[name="exam_date"]').press('Tab');
    await page.fill('input[name="exam_duration"]', '10');
    await page.locator('input[name="start_time"]').fill('22:00');
    await page.locator('input[name="start_time"]').press('Tab');
    await page.locator('input#online').evaluate(el => el.click());
    await page.locator('input#notsend').evaluate(el => el.click());

    // Touch instructions
    const instr = page.locator('.ck-content, [contenteditable="true"]').first();
    if (await instr.isVisible().catch(() => false)) {
      await instr.click();
      await page.keyboard.press('End');
      await page.keyboard.press('Tab');
    }

    await shot(page, '01_form_filled');

    // ── Click Save & Next ──────────────────────────────────────────────────────
    console.log('\n[4] Clicking Save & Next…');
    await page.locator('button:has-text("SAVE & NEXT")').first().scrollIntoViewIfNeeded();
    await page.locator('button:has-text("SAVE & NEXT")').first().click({ force: true });

    // Wait for AddQuestion
    for (let i = 0; i < 30; i++) {
      if (page.url().includes('AddQuestion')) break;
      await page.waitForTimeout(1000);
    }
    console.log('  URL:', page.url());
    await page.waitForTimeout(3000); // let AddQuestion page load and fire its API calls
    await shot(page, '02_addquestion_page');

    // ── Save captured data ─────────────────────────────────────────────────────
    fs.writeFileSync(path.join(SS_DIR, 'api-captured.json'), JSON.stringify(captured, null, 2));
    console.log('\n[5] Saved api-captured.json');

    // ── Show key data ──────────────────────────────────────────────────────────
    console.log('\n[6] Key captured data:');
    const addCtReq  = (captured['module_ms/addClassTest']?.requests  || [])[0];
    const addCtRes  = (captured['module_ms/addClassTest']?.responses || [])[0];
    const getCtRes  = (captured['module_ms/getClassTestV1?classParams=classTest']?.responses || [])[0];

    if (addCtReq) {
      console.log('\n  addClassTest REQUEST body:');
      console.log('  ', JSON.stringify(addCtReq).substring(0, 500));
      console.log('  sub_id in request:', addCtReq.sub_id, '| subject_id:', addCtReq.subject_id);
    }
    if (addCtRes) {
      console.log('\n  addClassTest RESPONSE:');
      console.log('  ', JSON.stringify(addCtRes).substring(0, 500));
    }
    if (getCtRes) {
      console.log('\n  getClassTestV1?classParams=classTest RESPONSE:');
      console.log('  ', JSON.stringify(getCtRes).substring(0, 800));
    }

    // ── Now go back to list and try to find the test ───────────────────────────
    console.log('\n[7] Going to class test list to find the test…');
    await page.goto('https://live.mafatlaleducation.com:5110/classtest', { waitUntil: 'commit' });
    await page.waitForTimeout(3000);

    // Set Subject=Science + Status=Paper Created-No Questions Selected
    await sel(page, 'Subject', 'Science');
    await sel(page, 'status', 'Paper Created-No Questions Selected');
    await page.locator('button.multipleFIlterSearchBtn').first().click();
    await page.waitForTimeout(3000);
    await shot(page, '03_list_after_create');

    const pageText = await page.evaluate(() => document.body.innerText);
    const found = pageText.includes('Sound Chapter Test DEBUG');
    console.log(`  "Sound Chapter Test DEBUG" found in list: ${found}`);
    console.log('  Page text snippet:', pageText.substring(0, 400));

    if (found) {
      // Dump row structure
      const all = await page.locator('*').filter({ hasText: 'Sound Chapter Test DEBUG' }).all();
      for (const el of all.slice(0, 6)) {
        const tag = await el.evaluate(e => e.tagName);
        const cls = await el.evaluate(e => e.className.substring(0, 80));
        const t   = await el.innerText().catch(() => '');
        console.log(`  <${tag}> class="${cls}" | "${t.substring(0, 100)}"`);
      }
      const icons = await page.locator('span.material-symbols-outlined').allInnerTexts();
      console.log('  Icons:', icons.join(' | '));

      await shot(page, '04_test_found_in_list');

      // Try to hover and click delete
      const testRows = await page.locator('*').filter({ hasText: 'Sound Chapter Test DEBUG' }).all();
      for (const row of testRows) {
        const tag = await row.evaluate(e => e.tagName);
        if (['TR', 'LI', 'DIV'].includes(tag)) {
          await row.hover().catch(() => {});
          await page.waitForTimeout(400);
          const deleteIcon = row.locator('span.material-symbols-outlined:has-text("delete")').first();
          if (await deleteIcon.isVisible().catch(() => false)) {
            console.log('\n  Found delete icon! Clicking…');
            await deleteIcon.click();
            await page.waitForTimeout(1000);
            await shot(page, '05_delete_clicked');
            // Confirm
            const confirmBtn = page.locator('.swal2-confirm, button:has-text("Yes")').first();
            if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await confirmBtn.click();
              console.log('  ✓ Confirmed deletion');
            }
            await page.waitForTimeout(2000);
            await shot(page, '06_after_delete');
            break;
          }
        }
      }
    } else {
      console.log('  Not found - saving full HTML');
      const html = await page.evaluate(() => document.body.innerHTML);
      fs.writeFileSync(path.join(SS_DIR, 'list-after-create.html'), html);
    }

  } catch (err) {
    await shot(page, 'ERROR');
    console.error('[ERROR]', err.message.substring(0, 500));
  } finally {
    fs.writeFileSync(
      path.join(SS_DIR, 'api-captured.json'),
      JSON.stringify(captured, null, 2)
    );
    console.log('\nDone — closing in 30s…');
    await page.waitForTimeout(30000);
    await browser.close();
  }
})();
