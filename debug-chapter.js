/**
 * debug-chapter.js
 * Discovers the exact data-name / selector for the Chapter dropdown
 * after filling School → Session → Grade → Section → Subject = Science
 *
 * Run: node debug-chapter.js
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--use-fake-ui-for-media-stream'],
  });

  const ctx  = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // ── helpers ────────────────────────────────────────────────────────────────
  async function selectDropdown(dataName, optionText) {
    const trigger = page.locator(`[data-name="${dataName}"]`).first();
    await trigger.waitFor({ state: 'visible', timeout: 15000 });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const optionList = page.locator('ul.filterOptionsListCustomSelectCampus');
    await optionList.waitFor({ state: 'visible', timeout: 10000 });

    const option = page.locator('ul.filterOptionsListCustomSelectCampus li')
      .filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();

    await optionList.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    console.log(`  ✓ ${dataName} = "${optionText}"`);
  }

  async function dumpDropdowns(label) {
    console.log(`\n──────── ${label} ────────`);

    // All [data-name] elements
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('[data-name]')].map(el => ({
        tag:      el.tagName,
        dataName: el.getAttribute('data-name'),
        text:     el.innerText?.trim().substring(0, 60),
        class:    el.className?.substring(0, 60),
        visible:  el.offsetParent !== null,
      }))
    );
    console.log('[data-name] elements:');
    names.forEach(n => console.log(`  ${n.visible ? '👁 ' : '🚫 '} data-name="${n.dataName}"  text="${n.text}"  class="${n.class}"`));

    // Any element containing "chapter" in label/placeholder/name/id/class
    const chapterEls = await page.evaluate(() =>
      [...document.querySelectorAll('*')].filter(el => {
        const str = (
          el.getAttribute?.('data-name') +
          el.getAttribute?.('placeholder') +
          el.getAttribute?.('name') +
          el.getAttribute?.('id') +
          el.className +
          el.innerText
        ).toLowerCase();
        return str.includes('chapter');
      }).map(el => ({
        tag:      el.tagName,
        id:       el.id,
        name:     el.getAttribute('name'),
        dataName: el.getAttribute('data-name'),
        placeholder: el.getAttribute('placeholder'),
        class:    el.className?.substring(0, 80),
        text:     el.innerText?.trim().substring(0, 60),
        visible:  el.offsetParent !== null,
      }))
    );
    console.log('\nElements mentioning "chapter":');
    if (chapterEls.length === 0) {
      console.log('  ⚠️  None found yet');
    } else {
      chapterEls.forEach(el =>
        console.log(`  ${el.visible ? '👁 ' : '🚫 '} <${el.tag}> id="${el.id}" name="${el.name}" data-name="${el.dataName}" placeholder="${el.placeholder}" text="${el.text}"`)
      );
    }
  }

  // ── main ───────────────────────────────────────────────────────────────────
  try {
    // 1. Login
    console.log('Navigating to login…');
    await page.goto('https://live.mafatlaleducation.com:5020/', { waitUntil: 'commit' });

    // Wait for login form inputs to appear
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[id*="email" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });

    // Dump all inputs to understand the login form structure
    const inputs = await page.evaluate(() =>
      [...document.querySelectorAll('input')].map(el => ({
        type: el.type, name: el.name, id: el.id,
        placeholder: el.placeholder, class: el.className
      }))
    );
    console.log('Login form inputs:', JSON.stringify(inputs, null, 2));

    await emailInput.fill('teacherdemo@gmail.com');
    await page.fill('input[type="password"]', 'Teacher@01');
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();

    // Wait for dashboard
    await page.locator('.profileSectionInHeader').waitFor({ state: 'visible', timeout: 30000 });
    console.log('✔ Logged in, dashboard visible');

    // 2. Go to AddNewClassTest form
    await page.goto('https://live.mafatlaleducation.com:5110/classtest/AddNewClassTest', { waitUntil: 'commit' });
    await page.locator('[data-name="School"]').first().waitFor({ state: 'visible', timeout: 20000 });
    console.log('✔ Form loaded');

    await dumpDropdowns('INITIAL FORM STATE');

    // 3. Fill School
    await selectDropdown('School', 'Mafatlal');
    await dumpDropdowns('AFTER School');

    // 4. Session
    await selectDropdown('Session', '2025-2026');
    await dumpDropdowns('AFTER Session');

    // 5. Grade
    await selectDropdown('Grade', 'IX');
    await dumpDropdowns('AFTER Grade');

    // 6. Section
    await selectDropdown('Section', 'A');
    await dumpDropdowns('AFTER Section');

    // 7. Subject
    await selectDropdown('Subject', 'Science');

    // Wait 3s for Chapter to potentially appear
    await page.waitForTimeout(3000);
    await dumpDropdowns('AFTER Subject (waiting for Chapter)');

    // Extra wait and re-check
    await page.waitForTimeout(3000);
    await dumpDropdowns('AFTER Subject + 6s total');

    console.log('\n─── DONE — check the output above for Chapter data-name ───');

  } catch (err) {
    console.error('ERROR:', err.message);
    await page.screenshot({ path: 'debug-chapter-error.png', fullPage: true });
    console.log('Screenshot saved: debug-chapter-error.png');
  } finally {
    await browser.close();
  }
})();
