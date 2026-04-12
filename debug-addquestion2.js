/**
 * debug-addquestion2.js
 * Phase 2 — with correct data-names, select all filters, click Search,
 * then dump question rows, add-arrow selectors, right panel, submit/finalize.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--use-fake-ui-for-media-stream'] });
  const ctx  = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  async function selectDrop(dataName, optionText) {
    const trigger = page.locator(`[data-name="${dataName}"]`).first();
    await trigger.waitFor({ state: 'visible', timeout: 15000 });
    await trigger.click({ force: true });
    const optList = page.locator('ul.filterOptionsListCustomSelectCampus');
    await optList.waitFor({ state: 'visible', timeout: 10000 });
    const sb = page.locator('.filterInputHolder input').first();
    if (await sb.isVisible().catch(() => false)) {
      await sb.fill(optionText.substring(0, 15));
      await page.waitForTimeout(500);
    }
    const opt = page.locator('ul.filterOptionsListCustomSelectCampus li')
      .filter({ hasText: optionText }).first();
    await opt.waitFor({ state: 'visible', timeout: 10000 });
    await opt.click();
    await optList.waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {});
    console.log(`  ✓ ${dataName} = "${optionText}"`);
  }

  async function dumpRows(label) {
    console.log(`\n${'═'.repeat(60)}\n${label}\n${'═'.repeat(60)}`);
    // Find every row in the question table
    const rows = await page.evaluate(() => {
      const allRows = [...document.querySelectorAll('tr, [class*="questionRow"], [class*="question-row"], [class*="tableRow"]')]
        .filter(el => el.offsetParent)
        .slice(0, 20);
      return allRows.map(el => ({
        tag: el.tagName,
        class: el.className?.substring?.(0, 80) ?? '',
        text: el.innerText?.trim().substring(0, 100),
      }));
    });
    console.log('\nQuestion rows (tr / questionRow):');
    rows.forEach(r => console.log(`  <${r.tag}> class="${r.class}"  text="${r.text}"`));

    // Find arrow buttons / count columns
    const arrows = await page.evaluate(() => {
      const selectors = [
        '[class*="addArrow"]', '[class*="add-arrow"]', '[class*="counter"]',
        '[class*="count"]', '[class*="increment"]', 'td button', 'td svg',
        '[class*="arrowBtn"]', '[class*="arrow-btn"]',
        'button[class*="add"]', 'span[class*="arrow"]',
      ];
      const found = [];
      selectors.forEach(sel => {
        try {
          [...document.querySelectorAll(sel)]
            .filter(el => el.offsetParent)
            .forEach(el => found.push({
              sel,
              tag: el.tagName,
              class: el.className?.substring?.(0, 80) ?? el.className?.baseVal?.substring(0, 80) ?? '',
              text: el.innerText?.trim().substring(0, 40) ?? '',
              parentTag: el.parentElement?.tagName,
              parentClass: el.parentElement?.className?.substring(0, 60) ?? '',
            }));
        } catch {}
      });
      return found.slice(0, 40);
    });
    console.log('\nArrow/add/counter elements:');
    arrows.forEach(a => console.log(`  [${a.sel}] <${a.tag}> class="${a.class}" text="${a.text}" parent=<${a.parentTag}> "${a.parentClass}"`));

    // Right panel elements
    const rightPanel = await page.evaluate(() => {
      const panel = document.querySelector('[class*="rightPanel"], [class*="right-panel"], [class*="selectedQuestions"], [class*="sidebar"]');
      if (!panel) return 'NOT FOUND';
      return {
        class: panel.className?.substring(0, 80),
        text: panel.innerText?.trim().substring(0, 300),
        children: [...panel.querySelectorAll('button, [class*="arrow"], [class*="adjust"], [class*="Adjust"]')]
          .filter(el => el.offsetParent)
          .map(el => ({ tag: el.tagName, class: el.className?.substring(0, 60), text: el.innerText?.trim().substring(0, 40) })),
      };
    });
    console.log('\nRight panel:', JSON.stringify(rightPanel, null, 2));

    // All buttons
    const btns = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter(el => el.offsetParent)
        .map(el => ({ text: el.innerText?.trim().substring(0, 60), class: el.className?.substring(0, 80), id: el.id }))
    );
    console.log('\nAll visible buttons:');
    btns.forEach(b => console.log(`  "${b.text}"  class="${b.class}"  id="${b.id}"`));
  }

  try {
    // Login
    await page.goto('https://live.mafatlaleducation.com:5020/', { waitUntil: 'commit' });
    const em = page.locator('input[placeholder*="email" i], input[placeholder*="UserID" i]').first();
    await em.waitFor({ state: 'visible', timeout: 30000 });
    await em.fill('teacherdemo@gmail.com');
    await page.fill('input[type="password"]', 'Teacher@01');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();
    await page.locator('.profileSectionInHeader').waitFor({ state: 'visible', timeout: 30000 });
    console.log('✔ Logged in');

    // Fill CT01 form
    await page.goto('https://live.mafatlaleducation.com:5110/classtest/AddNewClassTest', { waitUntil: 'commit' });
    await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 20000 });

    for (const [dn, val] of [
      ['School','Mafatlal'], ['Session','2025-2026'], ['Grade','IX'],
      ['Section','A'], ['Subject','Science'], ['Select Chapters','Sound'],
    ]) await selectDrop(dn, val);

    await page.locator('input[name="exam_name"]').fill('Debug CT01 Q2');
    await page.locator('input[name="number_of_questions"]').fill('5');
    await page.locator('input[name="total_marks"]').fill('10');
    await page.locator('input[name="exam_date"]').fill('2026-04-13');
    await page.locator('input[name="exam_duration"]').fill('10');
    await page.locator('input[name="start_time"]').fill('09:00');
    await page.locator('input#online').evaluate(el => el.click());
    await page.locator('input#notsend').evaluate(el => el.click());

    await page.locator('button:has-text("Save & Next"), button.btn-submit').first().click();
    await page.waitForURL('**/classtest/AddQuestion**', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('✔ On AddQuestion page:', page.url());

    // ── Now select filters ───────────────────────────────────────────────────
    await selectDrop('Select Chapter', 'Sound');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'debug-aq-after-chapter.png', fullPage: true });

    // Check Topics options after Chapter
    const topicsOptions = await page.evaluate(() => {
      const ul = document.querySelector('ul.filterOptionsListCustomSelectCampus');
      return ul ? [...ul.querySelectorAll('li')].map(li => li.innerText?.trim()) : [];
    });
    console.log('Topics options visible:', topicsOptions);

    await selectDrop('Select Topics', 'Reflection of Sound');
    await page.waitForTimeout(1000);

    await selectDrop('Select Question Type', 'Multiple Choice (Single Answer)');
    await page.waitForTimeout(800);

    await selectDrop('Select Complexity', 'Easy');
    await page.waitForTimeout(800);

    await selectDrop("Select Bloom's Taxonomy", 'Remembering');
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'debug-aq-filters-set.png', fullPage: true });

    // Click Search
    console.log('\nClicking Search…');
    await page.locator('button.multipleFIlterSearchBtn, button.btn-search').first().click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'debug-aq-after-search.png', fullPage: true });

    await dumpRows('AFTER SEARCH — questions listed');

    // Try to find the # column / add arrow more specifically
    const tableHTML = await page.evaluate(() => {
      const table = document.querySelector('table, [class*="questionTable"], [class*="question-table"]');
      return table ? table.outerHTML.substring(0, 3000) : 'NO TABLE FOUND';
    });
    console.log('\nTable HTML (first 3000 chars):\n', tableHTML);

    await page.screenshot({ path: 'debug-aq-final.png', fullPage: true });
    console.log('\n✔ Done — check debug-aq-*.png screenshots');

  } catch (err) {
    console.error('\nERROR:', err.message);
    await page.screenshot({ path: 'debug-aq-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
