/**
 * debug-addquestion.js
 * Navigates through the CT01 flow (fill form → Save & Next) then
 * dumps ALL interactive elements on the AddQuestion page so we can
 * build exact locators for AddQuestionPage.js
 *
 * Run: node debug-addquestion.js
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--use-fake-ui-for-media-stream'] });
  const ctx  = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // ── helpers ──────────────────────────────────────────────────────────────
  async function selectDropdown(dataName, optionText) {
    const trigger = page.locator(`[data-name="${dataName}"]`).first();
    await trigger.waitFor({ state: 'visible', timeout: 15000 });
    await trigger.click({ force: true });

    const optList = page.locator('ul.filterOptionsListCustomSelectCampus');
    await optList.waitFor({ state: 'visible', timeout: 10000 });

    // type in search box if present
    const sb = page.locator('.filterInputHolder input').first();
    if (await sb.isVisible().catch(() => false)) {
      await sb.fill(optionText.substring(0, 12));
      await page.waitForTimeout(400);
    }

    await page.locator('ul.filterOptionsListCustomSelectCampus li')
      .filter({ hasText: optionText }).first()
      .click();
    await optList.waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {});
    console.log(`  ✓ ${dataName} = "${optionText}"`);
  }

  async function dump(label) {
    console.log(`\n${'═'.repeat(60)}\n${label}\n${'═'.repeat(60)}`);

    // All [data-name] dropdowns
    const dns = await page.evaluate(() =>
      [...document.querySelectorAll('[data-name]')]
        .filter(el => el.offsetParent)
        .map(el => ({ dataName: el.getAttribute('data-name'), text: el.innerText?.trim().substring(0, 50) }))
    );
    if (dns.length) {
      console.log('\n[data-name] dropdowns:');
      dns.forEach(d => console.log(`  data-name="${d.dataName}"  text="${d.text}"`));
    }

    // All visible buttons
    const btns = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter(el => el.offsetParent)
        .map(el => ({
          text: el.innerText?.trim().substring(0, 60),
          class: el.className?.substring(0, 80),
          id: el.id,
          type: el.type,
        }))
    );
    if (btns.length) {
      console.log('\nVisible buttons:');
      btns.forEach(b => console.log(`  [${b.type}] "${b.text}"  id="${b.id}"  class="${b.class}"`));
    }

    // Interesting divs / icons (arrows, counts etc.)
    const arrows = await page.evaluate(() =>
      [...document.querySelectorAll('[class*="arrow"], [class*="Arrow"], [class*="count"], [class*="Count"], [class*="add"], [class*="Add"], svg')]
        .filter(el => el.offsetParent)
        .slice(0, 30)
        .map(el => ({
          tag: el.tagName,
          class: el.className?.substring?.(0, 80) ?? el.className?.baseVal?.substring(0, 80) ?? '',
          text: el.innerText?.trim().substring(0, 30) ?? '',
          parentClass: el.parentElement?.className?.substring?.(0, 60) ?? '',
        }))
    );
    if (arrows.length) {
      console.log('\nArrow / count / add elements:');
      arrows.forEach(a => console.log(`  <${a.tag}> class="${a.class}" text="${a.text}"  parentClass="${a.parentClass}"`));
    }

    // All visible inputs
    const inputs = await page.evaluate(() =>
      [...document.querySelectorAll('input,textarea,select')]
        .filter(el => el.offsetParent)
        .map(el => ({ tag: el.tagName, type: el.type, name: el.name, id: el.id, placeholder: el.placeholder, class: el.className?.substring(0, 60) }))
    );
    if (inputs.length) {
      console.log('\nVisible inputs:');
      inputs.forEach(i => console.log(`  <${i.tag}> type="${i.type}" name="${i.name}" id="${i.id}" placeholder="${i.placeholder}"`));
    }

    // Text that mentions "time", "max", "selected", "adjust", "finalize"
    const bodyText = await page.evaluate(() => document.body.innerText);
    const keywords = ['Max Time', 'Selected Time', 'Adjust', 'Finalize', 'Submit', 'ADJUST', 'FINALIZE'];
    const found = keywords.filter(k => bodyText.includes(k));
    if (found.length) console.log(`\nKeywords on page: ${found.join(', ')}`);
  }

  try {
    // ── 1. Login ─────────────────────────────────────────────────────────────
    console.log('Logging in…');
    await page.goto('https://live.mafatlaleducation.com:5020/', { waitUntil: 'commit' });
    const emailInput = page.locator('input[placeholder*="email" i], input[placeholder*="UserID" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await emailInput.fill('teacherdemo@gmail.com');
    await page.fill('input[type="password"]', 'Teacher@01');
    await page.locator('button[type="submit"], button:has-text("Login")').first().click();
    await page.locator('.profileSectionInHeader').waitFor({ state: 'visible', timeout: 30000 });
    console.log('✔ Logged in');

    // ── 2. Fill CT01 form ────────────────────────────────────────────────────
    await page.goto('https://live.mafatlaleducation.com:5110/classtest/AddNewClassTest', { waitUntil: 'commit' });
    await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 20000 });

    await selectDropdown('School',          'Mafatlal');
    await selectDropdown('Session',         '2025-2026');
    await selectDropdown('Grade',           'IX');
    await selectDropdown('Section',         'A');
    await selectDropdown('Subject',         'Science');
    await selectDropdown('Select Chapters', 'Sound');

    await page.locator('input[name="exam_name"]').fill('Debug CT01 Test');
    await page.locator('input[name="number_of_questions"]').fill('5');
    await page.locator('input[name="total_marks"]').fill('10');
    await page.locator('input[name="exam_date"]').fill('2026-04-12');
    await page.locator('input[name="exam_duration"]').fill('10');
    await page.locator('input[name="start_time"]').fill('09:00');
    await page.locator('input#online').evaluate(el => el.click());
    await page.locator('input#notsend').evaluate(el => el.click());

    // ── 3. Save & Next ───────────────────────────────────────────────────────
    console.log('\nClicking Save & Next…');
    await page.locator('button:has-text("Save & Next"), button.btn-submit').first().click();
    await page.waitForURL('**/classtest/AddQuestion**', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000); // let the page fully render

    console.log('Current URL:', page.url());
    await dump('ADD QUESTION PAGE — INITIAL STATE');

    // ── 4. Try the filter dropdowns ──────────────────────────────────────────
    console.log('\n─── Trying Chapter dropdown ───');
    const chapterDDs = await page.evaluate(() =>
      [...document.querySelectorAll('[data-name]')]
        .filter(el => el.offsetParent)
        .map(el => el.getAttribute('data-name'))
    );
    console.log('Visible data-name values:', chapterDDs);

    // Take a screenshot for visual reference
    await page.screenshot({ path: 'debug-addquestion.png', fullPage: true });
    console.log('\nScreenshot saved: debug-addquestion.png');

    // ── 5. Select Chapter = Sound ────────────────────────────────────────────
    if (chapterDDs.includes('Chapter')) {
      await selectDropdown('Chapter', 'Sound');
      await dump('AFTER Chapter = Sound');
    } else if (chapterDDs.includes('Select Chapters')) {
      await selectDropdown('Select Chapters', 'Sound');
      await dump('AFTER Chapter (Select Chapters) = Sound');
    } else {
      console.log('Chapter dropdown not found with known data-names, dumping all again…');
    }

    await page.screenshot({ path: 'debug-addquestion-2.png', fullPage: true });

    // ── 6. Check for Topics dropdown after Chapter selected ──────────────────
    await page.waitForTimeout(1500);
    const afterChapter = await page.evaluate(() =>
      [...document.querySelectorAll('[data-name]')]
        .filter(el => el.offsetParent)
        .map(el => ({ dn: el.getAttribute('data-name'), txt: el.innerText?.trim().substring(0, 30) }))
    );
    console.log('\ndata-name dropdowns after Chapter select:', afterChapter);

    // ── 7. Select Topics ─────────────────────────────────────────────────────
    const topicDN = afterChapter.find(d => /topic/i.test(d.dn));
    if (topicDN) {
      await selectDropdown(topicDN.dn, 'Reflection of Sound');
      await dump('AFTER Topics = Reflection of Sound');
    }

    await page.screenshot({ path: 'debug-addquestion-3.png', fullPage: true });

    // ── 8. Dump everything fully ─────────────────────────────────────────────
    await dump('FINAL STATE — all filters filled');

    console.log('\n─── Done. Check screenshots debug-addquestion*.png ───');

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: 'debug-addquestion-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
