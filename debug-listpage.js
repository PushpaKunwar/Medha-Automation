/**
 * debug-listpage.js  v5
 * Capture the FULL POST request body + response for getClassTestV1
 * and any delete endpoint triggered when manually deleting a test.
 * Run:  node debug-listpage.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const SS_DIR = path.join(__dirname, 'screenshots', 'debug-list');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function setDropdown(page, dataName, optionText) {
  const trigger = page.locator(`[data-name="${dataName}"]`).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.waitFor({ state: 'visible', timeout: 8000 });
  await trigger.click({ force: true });
  const optList = page.locator('ul.filterOptionsListCustomSelectCampus');
  await optList.waitFor({ state: 'visible', timeout: 8000 });
  const sb = page.locator('.filterInputHolder input').first();
  if (await sb.isVisible().catch(() => false)) {
    await sb.fill(optionText.substring(0, 15));
    await page.waitForTimeout(300);
  }
  const option = page.locator('ul.filterOptionsListCustomSelectCampus li')
    .filter({ hasText: optionText }).first();
  await option.waitFor({ state: 'visible', timeout: 6000 });
  await option.click();
  await optList.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  console.log(`    ✓ ${dataName} = "${optionText}"`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  const log = [];

  // Capture ALL requests + responses with BODIES
  page.on('request', async req => {
    if (req.url().includes('webapigateway')) {
      const entry = {
        dir: 'REQUEST',
        method: req.method(),
        url: req.url().split('/webapigateway/')[1] || req.url(),
        body: null,
      };
      try { entry.body = JSON.parse(req.postData() || '{}'); } catch(e) {}
      log.push(entry);
      if (req.method() === 'POST') {
        console.log(`  → POST ${entry.url}`);
        if (entry.body && Object.keys(entry.body).length)
          console.log(`    body: ${JSON.stringify(entry.body).substring(0, 200)}`);
      }
    }
  });

  page.on('response', async res => {
    if (res.url().includes('webapigateway')) {
      const entry = {
        dir: 'RESPONSE',
        status: res.status(),
        url: res.url().split('/webapigateway/')[1] || res.url(),
        body: null,
      };
      try { entry.body = await res.json(); } catch(e) {}
      log.push(entry);
      if (res.request().method() === 'POST') {
        const msg = entry.body?.message || '';
        const dataLen = Array.isArray(entry.body?.data) ? entry.body.data.length
                      : (entry.body?.data ? 'object' : 'null');
        console.log(`  ← ${res.status()} ${entry.url} | msg="${msg}" | data=${dataLen}`);
        if (Array.isArray(entry.body?.data) && entry.body.data.length > 0) {
          console.log(`    First item: ${JSON.stringify(entry.body.data[0]).substring(0, 200)}`);
        }
      }
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

    // ── Navigate to list ────────────────────────────────────────────────────────
    console.log('\n[2] Navigate to /classtest…');
    await page.goto('https://live.mafatlaleducation.com:5110/classtest', { waitUntil: 'commit' });
    await page.waitForTimeout(3000);
    await shot(page, '01_list_initial');

    // ── Set Subject=Science + Status=Paper Created-No Questions Selected ────────
    console.log('\n[3] Set filters: Science + Paper Created-No Questions Selected…');
    await setDropdown(page, 'Subject', 'Science');
    await setDropdown(page, 'status', 'Paper Created-No Questions Selected');
    console.log('\n  Clicking Search…');
    await page.locator('button.multipleFIlterSearchBtn').first().click();
    await page.waitForTimeout(3000);
    await shot(page, '02_science_no_questions');

    // ── Try ALL statuses to find where the test is ──────────────────────────────
    const statuses = [
      'Paper Created-Questions Selected',
      'Paper Finalized',
      'Upcoming Class Test',
      'Test Conducted',
    ];
    for (const st of statuses) {
      console.log(`\n[4] Trying status: "${st}"…`);
      await setDropdown(page, 'status', st);
      await page.locator('button.multipleFIlterSearchBtn').first().click();
      await page.waitForTimeout(2500);
      const txt = await page.evaluate(() => document.body.innerText);
      const found = txt.includes('Sound Chapter Test');
      console.log(`    Found: ${found}`);
      if (found) {
        await shot(page, `found_${st.replace(/\W/g,'_')}`);
        const html = await page.evaluate(() => document.body.innerHTML);
        fs.writeFileSync(path.join(SS_DIR, `found_${st.replace(/\W/g,'_')}.html`), html);
        console.log('    Saved HTML. Now looking for delete icon…');
        const icons = await page.locator('span.material-symbols-outlined').allInnerTexts();
        console.log('    Icons:', icons.join(' | '));
        break;
      }
    }

    // ── Save full API log ───────────────────────────────────────────────────────
    fs.writeFileSync(path.join(SS_DIR, 'api-log.json'), JSON.stringify(log, null, 2));
    console.log('\n[5] Saved full API log to api-log.json');

    // ── Show summary of all POST bodies sent ────────────────────────────────────
    console.log('\n[6] POST request bodies summary:');
    log.filter(e => e.dir === 'REQUEST' && e.method === 'POST')
       .forEach(e => console.log(`  ${e.url}\n    body: ${JSON.stringify(e.body).substring(0,300)}`));

  } catch (err) {
    await shot(page, 'ERROR');
    console.error('[ERROR]', err.message.substring(0, 400));
  } finally {
    console.log('\n\nDone — closing in 30s (check browser for manual inspection)…');
    await page.waitForTimeout(30000);
    await browser.close();
  }
})();
