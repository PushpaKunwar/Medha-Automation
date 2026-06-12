/**
 * WorksheetWizardPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Extends WorksheetListPage to add:
 *   • 10-step scrollable wizard (all on one page)
 *   • Post-generate form filling (Evaluation, Submission Date, Evaluation Date, Result Date)
 *   • Save button + Finalize popup
 *
 * Wizard steps (all visible on the single scrollable wizard page):
 *  Step 1  type           → Individual       (checkbox / radio tile)
 *  Step 2  preference     → Assignment       (checkbox / radio tile)
 *  Step 3  subject        → Science          (campus custom dropdown, School/Grade/Section pre-filled)
 *  Step 4  chapter        → Sound            (campus custom dropdown)
 *  Step 5  topic          → Reflection of Sound (campus custom dropdown)
 *  Step 6  method         → AI               (checkbox / radio tile)
 *  Step 7  questionType   → Descriptive Question (checkbox / radio tile)
 *  Step 8  complexity     → Easy             (checkbox / radio tile)
 *  Step 9  blooms         → ['Remembering']  (one or more checkboxes)
 *  Step 10 numQuestions   → '1'              (number input) → click GENERATE WORKSHEET
 *
 * Post-generate form (shown after GENERATE WORKSHEET):
 *   • Evaluation   → No
 *   • Submission Date, Evaluation Date, Result Date → YYYY-MM-DD
 *   • File upload  → optional (skipped)
 *   → Click Save → Finalize popup → click Finalize
 */

const { WorksheetListPage } = require('./WorksheetListPage');
const { selectCampusDropdown } = require('../../../utils/selectDropdown');

class WorksheetWizardPage extends WorksheetListPage {
  constructor(page) {
    super(page);

    // ── Post-generate form ────────────────────────────────────────────────────
    // Evaluation radio/select (Yes / No)
    this.evaluationNoBtn = page.locator([
      'input[type="radio"][value="no"]',
      'input[type="radio"][value="No"]',
      'input[type="radio"][value="0"]',
      'label:has-text("No") input[type="radio"]',
      'label:has-text("No") input[type="checkbox"]',
    ].join(', ')).first();

    // Submission Date input
    this.submissionDateInput = page.locator([
      'input[name*="submission" i]',
      'input[placeholder*="submission" i]',
      'input[id*="submission" i]',
    ].join(', ')).first();

    // Evaluation Date input
    this.evaluationDateInput = page.locator([
      'input[name*="evaluation" i]',
      'input[placeholder*="evaluation" i]',
      'input[id*="evaluation" i]',
    ].join(', ')).first();

    // Result Declaration Date input
    this.resultDateInput = page.locator([
      'input[name*="result" i]',
      'input[placeholder*="result" i]',
      'input[id*="result" i]',
    ].join(', ')).first();

    // Save button (on the post-generate form)
    this.saveBtn = page.locator([
      'button:has-text("Save")',
      'button:has-text("SAVE")',
      'button.btn-save',
    ].join(', ')).first();

    // Finalize popup confirm button
    this.finalizeBtn = page.locator([
      '[class*="common-confirm-button"]:has-text("Finalize")',
      'button:has-text("Finalize")',
      'button:has-text("FINALIZE")',
    ].join(', ')).last();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  /**
   * Optionally wait for a heading text to appear (soft — only warns on timeout).
   * The wizard is a single scrollable page, so all steps may already be visible.
   */
  async _waitForStep(headingText, timeout = 8000) {
    const selector = [
      `h1:has-text("${headingText}")`,
      `h2:has-text("${headingText}")`,
      `h3:has-text("${headingText}")`,
      `p:has-text("${headingText}")`,
      `div:has-text("${headingText}")`,
      `span:has-text("${headingText}")`,
    ].join(', ');

    await this.page.locator(selector).first()
      .waitFor({ state: 'visible', timeout })
      .catch(() => console.log(`  ⚠ Step heading "${headingText}" not found — continuing`));
  }

  /**
   * Click a checkbox/radio option tile in the wizard by its visible label text.
   * Tries: exact text element, label > input, partial text fallback.
   */
  /**
   * Click a wizard checkbox/radio option by its visible label text.
   *
   * Strategy (in order):
   *  1. <label> containing ONLY that text → check its inner input  (most precise)
   *  2. Exact-text element (div/span tile with no children text)
   *  3. Checkbox/radio whose adjacent text matches exactly
   *  4. Scroll-into-view + partial-text fallback (last resort)
   */
  async _clickWizardOption(labelText) {
    const lc = labelText.toLowerCase();

    // ── Strategy 1: JS TreeWalker — find text node, click nearest interactive el ─
    // Wrapped in Promise.race with a 5 s ceiling so it can't hang forever when the
    // page JS thread is frozen (e.g. immediately after a complexity tile is clicked).
    const jsClicked = await Promise.race([
      this.page.evaluate((text) => {
        const lc = text.toLowerCase();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.trim().toLowerCase() !== lc) continue;
          const el = node.parentElement;
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;  // hidden/collapsed
          // Must be within the visible viewport (not scrolled off-screen)
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
          if (rect.right  < 0 || rect.left > window.innerWidth)  continue;

          // If el is a label, click it (browser fires associated input)
          if (el.tagName === 'LABEL') {
            el.scrollIntoView({ block: 'center' });
            el.click();
            return 'label';
          }
          // Look for an input inside the parent container
          const parent = el.parentElement;
          if (parent) {
            const inp = parent.querySelector('input[type="checkbox"], input[type="radio"]');
            if (inp) { inp.click(); return 'parent-input'; }
            // Look at previous sibling (checkbox before text)
            const prev = el.previousElementSibling;
            if (prev && prev.tagName === 'INPUT') { prev.click(); return 'prev-sibling'; }
            // Click the parent container if it looks like a tile
            const tag = parent.tagName;
            if (!['HTML','BODY','DIV'].includes(tag) || parent.onclick) {
              parent.scrollIntoView({ block: 'center' });
              parent.click();
              return 'parent-click';
            }
          }
          // Fallback: click the text element itself
          el.scrollIntoView({ block: 'center' });
          el.click();
          return 'el-click';
        }
        return false;
      }, labelText),
      new Promise(resolve => setTimeout(() => resolve(false), 5000)),
    ]).catch(() => false);

    if (jsClicked) {
      await this.page.waitForTimeout(500);
      console.log(`    ✓ Clicked via JS text walker (${jsClicked}): "${labelText}"`);
      return;
    }

    // ── Strategy 2: checkbox/radio whose ancestor text matches (via evaluate) ──
    // Also guarded with a per-element Promise.race so a frozen page JS doesn't stall.
    const inputs = this.page.locator('input[type="checkbox"], input[type="radio"]');
    const count  = await inputs.count();
    for (let i = 0; i < count; i++) {
      const inp = inputs.nth(i);
      if (!await inp.isVisible({ timeout: 300 }).catch(() => false)) continue;

      const match = await Promise.race([
        inp.evaluate((el, label) => {
          let node = el.parentElement;
          for (let depth = 0; depth < 3 && node; depth++) {
            if ((node.innerText || '').trim().toLowerCase() === label) return true;
            node = node.parentElement;
          }
          return false;
        }, lc),
        new Promise(resolve => setTimeout(() => resolve(false), 3000)),
      ]).catch(() => false);

      if (match) {
        await inp.scrollIntoViewIfNeeded().catch(() => {});
        await inp.click({ force: true });
        await this.page.waitForTimeout(500);
        console.log(`    ✓ Clicked tile input: "${labelText}"`);
        return;
      }
    }

    // ── Strategy 3: <label> containing the text → click the label ────────────
    const labelEl = this.page.locator('label')
      .filter({ hasText: new RegExp(`\\b${labelText}\\b`, 'i') })
      .first();
    if (await labelEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await labelEl.scrollIntoViewIfNeeded().catch(() => {});
      await labelEl.click({ force: true });
      await this.page.waitForTimeout(500);
      console.log(`    ✓ Clicked label: "${labelText}"`);
      return;
    }

    // ── Strategy 4: exact-text element ───────────────────────────────────────
    const exactEl = this.page.getByText(labelText, { exact: true }).first();
    if (await exactEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exactEl.scrollIntoViewIfNeeded().catch(() => {});
      await exactEl.click({ force: true });
      await this.page.waitForTimeout(500);
      console.log(`    ✓ Clicked exact tile: "${labelText}"`);
      return;
    }

    // ── Strategy 5: any visible element whose full text equals labelText ───────
    const fallback = this.page.locator(
      'label, span, div, p, li, button'
    ).filter({ hasText: new RegExp(`^\\s*${labelText}\\s*$`, 'i') }).first();
    await fallback.waitFor({ state: 'visible', timeout: 8000 });
    await fallback.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await fallback.click({ force: true, timeout: 10000 });
    await this.page.waitForTimeout(500);
    console.log(`    ✓ Clicked fallback: "${labelText}"`);
  }

  /**
   * Select an option from a campus-style dropdown inside the wizard.
   *
   * Strategy (in order):
   *  1. Try each known data-name variant with selectCampusDropdown
   *  2. If all fail: find the first visible campus dropdown trigger on the page
   *     (div/span that looks like a closed dropdown), click it, then pick the
   *     option from the `ul.filterOptionsListCustomSelectCampus` list.
   *  3. Last resort: click the option text directly (_clickWizardOption)
   *
   * @param {string}   optionText   The option label to select (e.g. 'Sound')
   * @param {string[]} dataNames    data-name attribute values to try in order
   */
  async _selectWizardCampusDropdown(optionText, dataNames = []) {
    // Strategy 1: try each data-name
    for (const name of dataNames) {
      const trigger = this.page.locator(`[data-name="${name}"]`).first();
      const visible = await trigger.isVisible({ timeout: 1500 }).catch(() => false);
      if (visible) {
        try {
          await selectCampusDropdown(this.page, name, optionText);
          return; // success
        } catch (_) {
          // that data-name didn't work — try next
        }
      }
    }

    // Strategy 2: find the first visible closed campus dropdown on the page
    // These dropdowns typically render as a div with a down-arrow icon and placeholder text
    const dropdownTriggers = this.page.locator([
      'div.customSelectCampusContainer',
      'div[class*="SelectCampus"]',
      'span[class*="SelectCampus"]',
      'div.filterSelectCampus',
      '[class*="customSelect"]:not([data-name="School"]):not([data-name="Grade"]):not([data-name="Section"]):not([data-name="Subject"])',
    ].join(', '));

    const count = await dropdownTriggers.count();
    for (let i = 0; i < count; i++) {
      const trigger = dropdownTriggers.nth(i);
      if (!await trigger.isVisible({ timeout: 500 }).catch(() => false)) continue;

      // Only click if the current text looks like a placeholder (doesn't already equal our option)
      const text = await trigger.innerText().catch(() => '');
      if (text.trim() === optionText) continue; // already selected

      await trigger.scrollIntoViewIfNeeded().catch(() => {});
      await trigger.click({ force: true });
      await this.page.waitForTimeout(800);

      // Check if the option list opened
      const optList = this.page.locator('ul.filterOptionsListCustomSelectCampus');
      const listVisible = await optList.isVisible({ timeout: 3000 }).catch(() => false);
      if (!listVisible) {
        // This wasn't the right trigger — press Escape and try next
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
        continue;
      }

      // Type to filter then click the matching option
      const searchBox = this.page.locator(
        '.filterInputHolder input, .filterOptionsListAndInputContainerSelectCampus input'
      ).first();
      if (await searchBox.isVisible({ timeout: 600 }).catch(() => false)) {
        await searchBox.fill(optionText.substring(0, 15));
        await this.page.waitForTimeout(400);
      }

      const option = optList.locator('li').filter({ hasText: optionText }).first();
      if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
        await option.click();
        await optList.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        console.log(`    ✓ [wizard dropdown] = "${optionText}"`);
        await this.page.waitForTimeout(500);
        return; // success
      }

      // Option not in this list — close and try next trigger
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(300);
    }

    // Strategy 3: click the text directly (tiles, checkboxes, etc.)
    console.log(`    ⚠ Campus dropdown not found for "${optionText}" — falling back to direct click`);
    await this._clickWizardOption(optionText);
  }

  /**
   * Fill a date input identified by various attribute patterns.
   * Tries name / placeholder / id patterns; clears then types value.
   * @param {string[]} selectorList  array of CSS selectors to try
   * @param {string}   value         date in YYYY-MM-DD format
   * @param {string}   label         label for logging
   */
  async _fillDateInput(selectorList, value, label) {
    for (const sel of selectorList) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.scrollIntoViewIfNeeded().catch(() => {});

        // If the input is disabled (e.g. Result Date when evaluation=No),
        // fill via JavaScript so we don't wait forever.
        const isDisabled = await el.isDisabled().catch(() => false);
        if (isDisabled) {
          const filled = await this.page.evaluate((cssSelector, val) => {
            const input = document.querySelector(cssSelector);
            if (!input) return false;
            input.removeAttribute('disabled');
            // Use the native HTMLInputElement value setter so React's synthetic
            // event picks up the change (plain `input.value = val` bypasses React)
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeSetter.call(input, val);
            input.dispatchEvent(new Event('input',  { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }, sel, value).catch(() => false);

          if (filled) {
            await this.page.waitForTimeout(300);
            console.log(`    ✓ ${label} = "${value}" (JS — was disabled)`);
            return;
          }
          console.log(`    ⚠ ${label} input is disabled and JS fill failed — skipping`);
          return;
        }

        // Use triple-click + type + Tab for React-controlled date inputs.
        // React's synthetic onChange only fires when the user types — a raw
        // fill() sets the DOM value but React's internal state stays stale,
        // meaning the old value is submitted.  Typing char-by-char + Tab
        // triggers the full React event cycle so the new date is registered.
        await el.click({ clickCount: 3 });          // select-all existing value
        await el.press('Control+a');                 // extra safety
        await el.type(value, { delay: 30 });         // type YYYY-MM-DD char by char
        await el.press('Tab');                        // trigger blur/onChange
        await this.page.waitForTimeout(300);

        // Verify the value actually landed; fall back to fill() if not
        const actual = await el.inputValue().catch(() => '');
        if (actual !== value) {
          await el.fill(value);
          await el.press('Tab');
          await this.page.waitForTimeout(300);
        }
        console.log(`    ✓ ${label} = "${value}"`);
        return;
      }
    }
    // Last resort: locate input near a label with matching text
    // Try each XPath variant separately (Playwright does not support | in xpath=)
    const containerLoc = this.page.locator(
      `label:has-text("${label}"), span:has-text("${label}"), div:has-text("${label}")`
    ).first();
    if (await containerLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
      const xpathVariants = [
        'xpath=following-sibling::input',
        'xpath=following-sibling::div//input',
        'xpath=../input',
        'xpath=../..//input',
      ];
      for (const xp of xpathVariants) {
        const inp = containerLoc.locator(xp).first();
        if (await inp.isVisible({ timeout: 500 }).catch(() => false)) {
          await inp.scrollIntoViewIfNeeded().catch(() => {});
          await inp.click({ clickCount: 3 });
          await inp.press('Control+a');
          await inp.type(value, { delay: 30 });
          await inp.press('Tab');
          await this.page.waitForTimeout(300);
          console.log(`    ✓ ${label} = "${value}" (label-proximity)`);
          return;
        }
      }
    }
    console.log(`    ⚠ Could not find input for "${label}" — skipping`);
  }

  // ── Wizard step methods ───────────────────────────────────────────────────

  async wizardStep1_selectType(type = 'Individual') {
    await this._waitForStep('select the type of worksheet');   // "Kindly select the type of worksheet!"
    await this.page.waitForTimeout(500);

    // The wizard shows standard checkboxes: ☐ Individual  ☐ Collaborative
    // Try multiple strategies to check the correct one.

    // 1. getByLabel — works when <label> wraps or is associated via for=
    const byLabel = this.page.getByLabel(type, { exact: true }).first();
    if (await byLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await byLabel.scrollIntoViewIfNeeded().catch(() => {});
      await byLabel.click({ force: true });
      await this.page.waitForTimeout(500);
      console.log(`  ✓ Step 1: type = "${type}" (getByLabel)`);
      return;
    }

    // 2. Find the checkbox whose adjacent text matches — via JS evaluate
    const jsChecked = await this.page.evaluate((label) => {
      const checkboxes = Array.from(
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]')
      );
      for (const cb of checkboxes) {
        // Check the label wrapping this input
        const wrapper = cb.closest('label');
        if (wrapper && wrapper.innerText.trim().toLowerCase() === label.toLowerCase()) {
          cb.click();
          return true;
        }
        // Check associated label via for=id
        if (cb.id) {
          const lbl = document.querySelector(`label[for="${cb.id}"]`);
          if (lbl && lbl.innerText.trim().toLowerCase() === label.toLowerCase()) {
            cb.click();
            return true;
          }
        }
        // Check next sibling text node
        const next = cb.nextSibling;
        if (next && next.nodeType === 3 &&
            next.textContent.trim().toLowerCase() === label.toLowerCase()) {
          cb.click();
          return true;
        }
        // Check parent's full text (for <div><input><span>Text</span></div>)
        const parent = cb.parentElement;
        if (parent && parent.innerText.trim().toLowerCase() === label.toLowerCase()) {
          cb.click();
          return true;
        }
      }
      return false;
    }, type).catch(() => false);

    if (jsChecked) {
      await this.page.waitForTimeout(500);
      console.log(`  ✓ Step 1: type = "${type}" (JS checkbox scan)`);
      return;
    }

    // 3. Click the text label next to the checkbox (text node approach)
    await this._clickWizardOption(type);
    console.log(`  ✓ Step 1: type = "${type}"`);
  }

  async wizardStep2_selectPreference(preference = 'Assignment') {
    await this.page.waitForTimeout(800);                       // wait for step 2 to animate in
    await this._waitForStep('worksheet preference');           // "Great! Kindly choose your worksheet preference"
    await this._clickWizardOption(preference);
    console.log(`  ✓ Step 2: preference = "${preference}"`);
  }

  async wizardStep3_selectSubject(subject = 'Science') {
    // School / Grade / Section are pre-filled by the app — only Subject needs selection.
    await this._waitForStep("'School'");                       // "Awesome! Please tell us the 'School' , 'Grade'…"
    await selectCampusDropdown(this.page, 'Subject', subject);
    console.log(`  ✓ Step 3: subject = "${subject}" (School/Grade/Section pre-filled)`);
  }

  async wizardStep4_selectChapter(chapter = 'Sound') {
    await this._waitForStep("please select the 'Chapter'");
    await this.page.waitForTimeout(600);

    // Find the chapter campus dropdown by data-name
    const chapterDataNames = ['Chapter', 'Select Chapter', 'Select Chapters'];
    let triggerEl = null;

    for (const name of chapterDataNames) {
      const el = this.page.locator(`[data-name="${name}"]`).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        triggerEl = el;
        console.log(`    ↳ Chapter dropdown found: data-name="${name}"`);
        break;
      }
    }

    if (!triggerEl) {
      // Graceful fallback — let _selectWizardCampusDropdown scan all visible dropdowns
      console.log(`    ⚠ Chapter trigger not found by data-name — using generic dropdown scan`);
      await this._selectWizardCampusDropdown(chapter, chapterDataNames);
      console.log(`  ✓ Step 4: chapter = "${chapter}" (fallback)`);
      return;
    }

    // Open the dropdown
    await triggerEl.scrollIntoViewIfNeeded();
    await triggerEl.click({ force: true });
    await this.page.waitForTimeout(800);

    const optList = this.page.locator('ul.filterOptionsListCustomSelectCampus');
    await optList.waitFor({ state: 'visible', timeout: 8000 });

    // Optional search box
    const searchBox = this.page.locator(
      '.filterInputHolder input, .filterOptionsListAndInputContainerSelectCampus input'
    ).first();
    if (await searchBox.isVisible({ timeout: 600 }).catch(() => false)) {
      await searchBox.fill(chapter.substring(0, 12));
      await this.page.waitForTimeout(400);
    }

    // Click the option
    const opt = optList.locator('li').filter({ hasText: chapter }).first();
    await opt.waitFor({ state: 'visible', timeout: 8000 });
    await opt.click();
    await this.page.waitForTimeout(400);

    // Close the dropdown — Escape is most reliable
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    if (await optList.isVisible({ timeout: 400 }).catch(() => false)) {
      await this.page.mouse.click(10, 10);
      await this.page.waitForTimeout(400);
    }

    console.log(`  ✓ Step 4: chapter = "${chapter}" — dropdown closed`);
  }

  async wizardStep5_selectTopic(topic = 'Reflection of Sound') {
    // After chapter selection the app fetches topics via API — wait briefly.
    await this.page.waitForTimeout(1500);

    // ── Strategy 1: role="combobox" (primary — confirmed in UI) ──────────────
    // The topic field renders as <div role="combobox">. There may be multiple
    // comboboxes on the page (e.g. chapter already selected), so we try each
    // visible one until the options listbox opens with our topic inside.
    const comboboxes = this.page.locator('div[role="combobox"]');
    const cbCount = await comboboxes.count();
    console.log(`    ↳ Found ${cbCount} combobox(es) on page`);

    for (let i = 0; i < cbCount; i++) {
      const cb = comboboxes.nth(i);
      if (!await cb.isVisible({ timeout: 500 }).catch(() => false)) continue;

      // Skip a combobox that already shows the selected value for an earlier field
      const cbText = await cb.innerText().catch(() => '');
      if (cbText.trim().toLowerCase() === topic.toLowerCase()) {
        console.log(`    ↳ Combobox[${i}] already shows "${topic}" — skipping`);
        console.log(`  ✓ Step 5: topic = "${topic}" (already selected)`);
        return;
      }

      // Click to open
      await cb.scrollIntoViewIfNeeded().catch(() => {});
      await cb.click({ force: true });
      await this.page.waitForTimeout(700);

      // Look for any options listbox that appeared
      const listbox = this.page.locator([
        'div[role="listbox"]',
        'ul[role="listbox"]',
        'ul[role="option"]',
        '.select2-results__options',
        'ul.filterOptionsListCustomSelectCampus',
      ].join(', ')).first();

      const listVisible = await listbox.isVisible({ timeout: 3000 }).catch(() => false);
      if (!listVisible) {
        // Not the right combobox — close and try next
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
        continue;
      }

      // Optional search input inside the open dropdown
      const searchBox = this.page.locator([
        'div[role="listbox"] input',
        'ul[role="listbox"] input',
        '.filterInputHolder input',
        '.filterOptionsListAndInputContainerSelectCampus input',
        'input[role="combobox"]',
        'input[aria-autocomplete]',
      ].join(', ')).first();

      if (await searchBox.isVisible({ timeout: 600 }).catch(() => false)) {
        await searchBox.fill(topic.substring(0, 15));
        await this.page.waitForTimeout(500);
      }

      // Find and click the matching option
      const opt = this.page.locator([
        `div[role="option"]:has-text("${topic}")`,
        `li[role="option"]:has-text("${topic}")`,
        `li:has-text("${topic}")`,
      ].join(', ')).first();

      const optVisible = await opt.isVisible({ timeout: 6000 }).catch(() => false);
      if (!optVisible) {
        // Option not in this listbox — close and try next combobox
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
        continue;
      }

      await opt.scrollIntoViewIfNeeded().catch(() => {});
      await opt.click({ force: true });
      await this.page.waitForTimeout(600);
      console.log(`    ✓ Selected topic via combobox[${i}]: "${topic}"`);

      // This is a multi-select combobox — it does NOT auto-close after selection.
      // Actively close the dropdown with multiple strategies.
      const isOpen = async () => await listbox.isVisible({ timeout: 300 }).catch(() => false);

      // 1. Press Escape
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(400);
      if (!await isOpen()) {
        console.log(`  ✓ Step 5: topic = "${topic}" (closed via Escape)`);
        return;
      }

      // 2. Click the combobox trigger again to toggle closed
      await cb.click({ force: true });
      await this.page.waitForTimeout(400);
      if (!await isOpen()) {
        console.log(`  ✓ Step 5: topic = "${topic}" (closed via trigger click)`);
        return;
      }

      // 3. Click outside — the wizard heading area (safe, always visible at top)
      await this.page.mouse.click(690, 121);
      await this.page.waitForTimeout(400);
      if (!await isOpen()) {
        console.log(`  ✓ Step 5: topic = "${topic}" (closed via outside click)`);
        return;
      }

      // 4. Press Tab to blur focus
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(400);
      if (!await isOpen()) {
        console.log(`  ✓ Step 5: topic = "${topic}" (closed via Tab)`);
        return;
      }

      // 5. Force close via JS blur
      await this.page.evaluate(() => {
        if (document.activeElement) document.activeElement.blur();
      });
      await this.page.waitForTimeout(400);
      console.log(`  ✓ Step 5: topic = "${topic}" (force-blur)`);
      return;
    }

    // ── Strategy 2: campus-style data-name dropdown (legacy fallback) ─────────
    console.log(`    ⚠ No combobox matched — trying campus dropdown fallback`);
    const topicDataNames = ['Topics', 'Select Topics', 'Topic', 'Select Topic'];
    let triggerEl = null;

    for (const name of topicDataNames) {
      const el = this.page.locator(`[data-name="${name}"]`).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        triggerEl = el;
        console.log(`    ↳ Topic campus dropdown found: data-name="${name}"`);
        break;
      }
    }

    if (triggerEl) {
      await triggerEl.scrollIntoViewIfNeeded();
      await triggerEl.click({ force: true });
      await this.page.waitForTimeout(800);

      const optList = this.page.locator('ul.filterOptionsListCustomSelectCampus');
      await optList.waitFor({ state: 'visible', timeout: 8000 });

      const searchBox2 = this.page.locator(
        '.filterInputHolder input, .filterOptionsListAndInputContainerSelectCampus input'
      ).first();
      if (await searchBox2.isVisible({ timeout: 600 }).catch(() => false)) {
        await searchBox2.fill(topic.substring(0, 12));
        await this.page.waitForTimeout(400);
      }

      const opt = optList.locator('li').filter({ hasText: topic }).first();
      await opt.waitFor({ state: 'visible', timeout: 8000 });
      await opt.click();
      await this.page.waitForTimeout(600);
      console.log(`    ✓ Checked campus option: "${topic}"`);

      // Close the multi-select — try strategies until list disappears
      for (const fn of [
        () => triggerEl.click({ force: true }),
        () => this.page.keyboard.press('Tab'),
        () => this.page.keyboard.press('Escape'),
        () => this.page.mouse.click(640, 40),
      ]) {
        await fn();
        await this.page.waitForTimeout(500);
        if (!await optList.isVisible({ timeout: 300 }).catch(() => false)) break;
      }
      if (await optList.isVisible({ timeout: 300 }).catch(() => false)) {
        await this.page.evaluate(() => document.activeElement?.blur());
        await this.page.waitForTimeout(400);
      }

      console.log(`  ✓ Step 5: topic = "${topic}" (campus dropdown)`);
      return;
    }

    // ── Strategy 3: generic scan ──────────────────────────────────────────────
    console.log(`    ⚠ All dropdown strategies exhausted — clicking text directly`);
    await this._selectWizardCampusDropdown(topic, topicDataNames);
    console.log(`  ✓ Step 5: topic = "${topic}" (generic scan)`);
  }

  async wizardStep6_selectGenerationMethod(method = 'AI') {
    // App heading has typos: "perferred method to genarate" — use shortest unique fragment
    await this._waitForStep('method to');
    // Scroll so step 6 enters the viewport before clicking
    await this.page.evaluate(() => window.scrollBy(0, 300));
    await this.page.waitForTimeout(400);
    await this._clickWizardOption(method);
    console.log(`  ✓ Step 6: method = "${method}"`);
  }

  async wizardStep7_selectQuestionType(questionType = 'Descriptive Question') {
    await this._waitForStep("which worksheet you'd like");     // "Great Choice! Let us know which worksheet you'd like!"
    await this.page.evaluate(() => window.scrollBy(0, 300));
    await this.page.waitForTimeout(400);
    await this._clickWizardOption(questionType);
    console.log(`  ✓ Step 7: questionType = "${questionType}"`);
  }

  async wizardStep8_selectComplexity(complexity = 'Easy') {
    await this._waitForStep('complexity level');               // "So close to the finish line! Please Choose the complexity level…"
    await this.page.mouse.wheel(0, 300);                      // CDP scroll — avoids page-JS hang
    await this.page.waitForTimeout(400);
    await this._clickWizardOption(complexity);
    // Wait for the app to re-render the Bloom's section after complexity selection.
    // Increased to 3 s — after clicking a complexity tile the app fires an API call
    // that updates the available Bloom's options; the page JS may be frozen during
    // this time, so we give it extra breathing room before Step 9 starts.
    await this.page.waitForTimeout(3000);
    console.log(`  ✓ Step 8: complexity = "${complexity}"`);
  }

  async wizardStep9_selectBlooms(bloomsLevels = ['Remembering']) {
    await this._waitForStep("Bloom");      // "Perfect! Please select the Bloom's Taxonomy"

    // Use CDP mouse-wheel scroll — avoids page-JS hang that page.evaluate() can cause
    await this.page.mouse.wheel(0, 300);
    await this.page.waitForTimeout(600);

    // ── Wait for the Bloom's section to be fully rendered ─────────────────────
    // After clicking a complexity tile the app re-renders the Bloom's list with
    // ONLY the bloom levels valid for that complexity:
    //   Easy     → Remembering, Understanding
    //   Moderate → Applying
    //   Advanced → Analyzing / Analysing
    // We wait for ANY known bloom label to appear (CDP-safe, no page.evaluate).
    console.log('    ⏳ Waiting for Bloom\'s section to render…');
    const anyBloomLabel = this.page.locator('label').filter({
      hasText: /^(Remembering|Understanding|Applying|Anal[yz]ing|Evaluating|Creating)$/i,
    }).first();
    await anyBloomLabel.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {
      console.log('    ⚠ Bloom\'s labels not visible after 20 s — proceeding anyway');
    });

    console.log(`  → Step 9: selecting Bloom's = [${bloomsLevels.join(', ')}]`);

    for (const level of bloomsLevels) {
      // Spelling variants (British vs. American English)
      const variants = [level];
      if (level === 'Analysing')  variants.push('Analyzing');
      if (level === 'Analyzing')  variants.push('Analysing');

      let clicked = false;

      for (const variant of variants) {
        // ── Strategy A: Pure Playwright CDP label scan (no page.evaluate) ─────
        // Playwright's locator.textContent() uses CDP directly — immune to page
        // JS freezes caused by post-click API calls or rendering operations.
        // The app re-renders the bloom list after each selection; we retry up to
        // 3 times with a settle-wait in between so the new DOM is ready.
        for (let scanRetry = 0; scanRetry < 3 && !clicked; scanRetry++) {
          if (scanRetry > 0) {
            console.log(`    ↳ Bloom scan retry ${scanRetry} for "${variant}"…`);
            await this.page.waitForTimeout(800); // wait for DOM re-render
          }

          const allLabels = this.page.locator('label');
          const labelCount = await allLabels.count();

          // Debug on last retry: dump all label texts so we know what's visible
          if (scanRetry === 2) {
            const debugTexts = [];
            for (let di = 0; di < Math.min(labelCount, 35); di++) {
              const t = await allLabels.nth(di).textContent().catch(() => '');
              if (t.trim()) debugTexts.push(`[${di}]:"${t.trim().substring(0, 25)}"`);
            }
            console.log(`    ⚠ Labels on page: ${debugTexts.join(', ')}`);
          }

          for (let ii = 0; ii < labelCount; ii++) {
            const labelLoc = allLabels.nth(ii);
            const labelText = await labelLoc.textContent().catch(() => '');
            if (!labelText) continue;
            const normalized = labelText.trim().toLowerCase().replace(/\s+/g, ' ');
            if (normalized !== variant.toLowerCase()) continue;

            // Matching label found — click it directly (label click toggles the checkbox)
            await labelLoc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
            await labelLoc.click({ force: true, timeout: 8000 });
            await this.page.waitForTimeout(500);
            console.log(`    ✓ Bloom's "${variant}" (CDP label scan, retry=${scanRetry}, idx=${ii})`);
            clicked = true;
            break;
          }
        }
        if (clicked) break;

        // ── Strategy B: Playwright getByLabel ────────────────────────────────
        const byLabel = this.page.getByLabel(variant, { exact: true }).first();
        if (await byLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
          await byLabel.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
          await this.page.waitForTimeout(300);
          await byLabel.click({ force: true, timeout: 8000 });
          await this.page.waitForTimeout(400);
          console.log(`    ✓ Bloom's "${variant}" (getByLabel)`);
          clicked = true;
          break;
        }

        // ── Strategy C: Playwright label filter ───────────────────────────────
        const labelEl = this.page.locator('label')
          .filter({ hasText: new RegExp(`^\\s*${variant}\\s*$`, 'i') }).first();
        if (await labelEl.isVisible({ timeout: 1500 }).catch(() => false)) {
          await labelEl.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
          await this.page.waitForTimeout(300);
          await labelEl.click({ force: true, timeout: 8000 });
          await this.page.waitForTimeout(400);
          console.log(`    ✓ Bloom's "${variant}" (label filter)`);
          clicked = true;
          break;
        }

        // ── Strategy D: getByText ─────────────────────────────────────────────
        const textEl = this.page.getByText(variant, { exact: true }).first();
        if (await textEl.isVisible({ timeout: 1000 }).catch(() => false)) {
          await textEl.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
          await this.page.waitForTimeout(300);
          await textEl.click({ force: true, timeout: 8000 });
          await this.page.waitForTimeout(400);
          console.log(`    ✓ Bloom's "${variant}" (getByText)`);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        console.log(`    ⚠ Bloom's "${level}" not found via direct strategies — using _clickWizardOption`);
        await this._clickWizardOption(level);
      }

      // Wait for the app to settle after each bloom click before looking for next
      await this.page.waitForTimeout(400);
    }

    console.log(`  ✓ Step 9: Bloom's = [${bloomsLevels.join(', ')}]`);
  }

  async wizardStep10_enterQuestionsAndGenerate(numQuestions = '1') {
    await this._waitForStep('number of questions');

    // ── STEP A: Scroll to bottom so the "Ex: 2" input enters the viewport ──────
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(800);

    // ── STEP B: Fill the number input FIRST (GENERATE button appears after) ────
    // Placeholder confirmed as "Ex: 2" from UI screenshot.
    const qInput = this.page.locator([
      'input[placeholder*="Ex:"]',
      'input[placeholder*="ex:"]',
      'input[name*="question" i]',
      'input[name*="count" i]',
      'input[placeholder*="question" i]',
      'input[placeholder*="number" i]',
      'input[type="number"]',
      'input[type="text"]',
    ].join(', ')).last();    // .last() = deepest in the wizard = step 10

    await qInput.waitFor({ state: 'visible', timeout: 10000 });
    await qInput.scrollIntoViewIfNeeded().catch(() => {});
    await qInput.click();
    await qInput.fill(String(numQuestions));
    // Trigger change events so the app registers the value
    await qInput.press('Tab');
    await this.page.waitForTimeout(600);
    console.log(`    ✓ Questions per topic = "${numQuestions}"`);

    // ── STEP C: Wait for GENERATE button to appear (it shows after input filled) ─
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);

    const generateBtn = this.page.locator([
      'button:has-text("GENERATE WORKSHEET")',
      'button:has-text("Generate Worksheet")',
      'button:has-text("GENERATE")',
      'button:has-text("Generate")',
      'button[class*="generate" i]',
    ].join(', ')).first();

    await generateBtn.waitFor({ state: 'visible', timeout: 15000 });
    await generateBtn.scrollIntoViewIfNeeded().catch(() => {});
    await generateBtn.click();
    console.log('  ✓ Step 10: clicked GENERATE WORKSHEET');

    // Wait for AI to generate content — give it up to 30 s (server-side AI call)
    // Poll until the page shows generated content (questions / rubric / save button)
    console.log('    ⏳ Waiting for AI-generated content to appear…');
    const generatedIndicators = this.page.locator([
      'input[name*="submission" i]',
      'input[id*="submission" i]',
      'button:has-text("Save")',
      'button:has-text("SAVE")',
      '[class*="generated"]',
      '[class*="rubric" i]',
      'div:has-text("Rubric")',
    ].join(', ')).first();

    await generatedIndicators.waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => {
        console.log('    ⚠ Generated content indicators not found after 30 s — proceeding anyway');
      });

    // Scroll to the bottom to ensure the post-generate form is in the DOM
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1500);
    console.log('  ✓ Step 10: generated content loaded');
  }

  // ── Post-generate form ────────────────────────────────────────────────────

  /**
   * After GENERATE WORKSHEET is clicked, the app shows the generated content
   * and a form to fill below it. This method fills that form.
   *
   * @param {{
   *   evaluation?:     'Yes'|'No',
   *   submissionDate?: string,   // YYYY-MM-DD
   *   evaluationDate?: string,   // YYYY-MM-DD
   *   resultDate?:     string,   // YYYY-MM-DD
   * }} options
   */
  async fillPostGenerateForm(options = {}) {
    const {
      evaluation     = 'No',
      submissionDate = '',
      evaluationDate = '',
      resultDate     = '',
    } = options;

    // ── Scroll to bottom — the post-generate form is below the generated questions ──
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1500);

    // Scroll down further in stages to trigger any lazy-loaded form sections
    for (let i = 0; i < 3; i++) {
      await this.page.evaluate(() => window.scrollBy(0, 600));
      await this.page.waitForTimeout(500);
    }
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);

    // Wait for at least one post-generate field to appear
    const anyFormField = this.page.locator([
      'input[type="date"]',
      'input[name*="submission" i]',
      'input[id*="submission" i]',
      'input[name*="evaluation" i]',
      'input[name*="result" i]',
      'button:has-text("Save")',
      'button:has-text("SAVE")',
    ].join(', ')).first();

    const formVisible = await anyFormField.waitFor({ state: 'visible', timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (!formVisible) {
      // Dump visible inputs for debugging
      const inputs = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll('input, button'))
          .filter(el => el.offsetParent !== null)
          .map(el => `${el.tagName}[type=${el.type}][name=${el.name}][id=${el.id}][placeholder=${el.placeholder}]`)
          .slice(0, 20)
          .join('\n')
      ).catch(() => '(eval failed)');
      console.log('  ℹ Visible inputs on page:\n', inputs);
    }

    console.log('  ✓ Generated worksheet content visible');

    // ── Evaluation: "No" is the default — no action needed ───────────────────
    console.log(`    ✓ Evaluation = "No" (default — skipped)`);

    // ── Submission Date ───────────────────────────────────────────────────
    if (submissionDate) {
      await this._fillDateInput([
        'input[name*="submission" i]',
        'input[id*="submission" i]',
        'input[placeholder*="submission" i]',
        'input[type="date"]',
      ], submissionDate, 'Submission Date');
    }

    // ── Evaluation Date ───────────────────────────────────────────────────
    if (evaluationDate) {
      // Note: use more specific selector to avoid matching submission date input
      const evalDateSelectors = [
        'input[name="evaluation_date"]',
        'input[name="evaluationDate"]',
        'input[id*="evaluationDate" i]',
        'input[placeholder*="evaluation date" i]',
        'input[name*="evaluation" i]',
        'input[id*="evaluation" i]',
      ];
      await this._fillDateInput(evalDateSelectors, evaluationDate, 'Evaluation Date');
    }

    // ── Result Declaration Date ───────────────────────────────────────────
    if (resultDate) {
      await this._fillDateInput([
        'input[name*="result" i]',
        'input[id*="result" i]',
        'input[placeholder*="result" i]',
      ], resultDate, 'Result Date');
    }

    // ── File upload: OPTIONAL — skipped ──────────────────────────────────
    console.log('    ℹ File upload is optional — skipped');
    console.log('  ✓ Post-generate form filled');
  }

  /**
   * Click the Save button on the post-generate form.
   * Waits for the Finalize popup to appear after saving.
   */
  async clickSave() {
    // Ensure the Save button is in view — it lives at the bottom of the post-generate form
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(800);

    // Try all possible Save button selectors; fall back to JS scan
    const saveLoc = this.page.locator([
      'button:has-text("Save")',
      'button:has-text("SAVE")',
      'button.btn-save',
      'button[type="submit"]:has-text("Save")',
      'input[type="submit"][value="Save"]',
      'input[type="submit"][value="SAVE"]',
      'a:has-text("Save")',
    ].join(', ')).first();

    const saveVisible = await saveLoc.waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (saveVisible) {
      await saveLoc.scrollIntoViewIfNeeded().catch(() => {});
      await saveLoc.click();
      console.log('  ✓ Clicked Save');
    } else {
      // Last resort: find any button whose text contains "save" via JS
      const clicked = await this.page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
        for (const el of els) {
          if ((el.innerText || el.value || '').trim().toLowerCase() === 'save') {
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
          }
        }
        return false;
      });
      if (clicked) {
        console.log('  ✓ Clicked Save (JS fallback)');
      } else {
        throw new Error('Save button not found on post-generate form');
      }
    }

    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for the Finalize popup and click the Finalize button.
   * The app shows a custom popup with a "Finalize" confirm button.
   */
  async clickFinalizeWorksheet() {
    // Wait for any confirm button to appear
    const anyConfirm = this.page.locator([
      '[class*="common-confirm-button"]',
      'button:has-text("Finalize")',
      'button:has-text("FINALIZE")',
      '.swal2-confirm',
    ].join(', ')).first();

    await anyConfirm.waitFor({ state: 'visible', timeout: 20000 });
    console.log('  ✓ Finalize popup appeared');

    // Click Finalize (prefer element with text "Finalize" over generic confirm)
    const finalizeEl = this.page.locator([
      '[class*="common-confirm-button"]:has-text("Finalize")',
      '[class*="common-confirm-button"]:has-text("FINALIZE")',
      'button:has-text("Finalize")',
      'button:has-text("FINALIZE")',
    ].join(', ')).last();

    const hasFinalizeText = await finalizeEl.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasFinalizeText) {
      await finalizeEl.click({ force: true });
    } else {
      await anyConfirm.click({ force: true });
    }

    console.log('  ✓ Clicked Finalize');
    await this.page.waitForTimeout(3000);
  }

  // ── Full wizard orchestrators ─────────────────────────────────────────────

  /**
   * Run all 10 wizard steps in sequence.
   * Does NOT fill the post-generate form — call fillPostGenerateForm() separately.
   *
   * @param {{
   *   type?, preference?, subject?, chapter?, topic?,
   *   method?, questionType?, complexity?, blooms?, numQuestions?
   * }} options
   */
  async runWizard(options = {}) {
    const {
      type         = 'Individual',
      preference   = 'Assignment',
      subject      = 'Science',
      chapter      = 'Sound',
      topic        = 'Reflection of Sound',
      method       = 'AI',
      questionType = 'Descriptive Question',
      complexity   = 'Easy',
      blooms       = ['Remembering'],
      numQuestions = '1',
    } = options;

    console.log('\n  ── Worksheet Wizard ───────────────────────────────────────');
    await this.wizardStep1_selectType(type);
    await this.wizardStep2_selectPreference(preference);
    await this.wizardStep3_selectSubject(subject);
    await this.wizardStep4_selectChapter(chapter);
    await this.wizardStep5_selectTopic(topic);
    await this.wizardStep6_selectGenerationMethod(method);
    await this.wizardStep7_selectQuestionType(questionType);
    await this.wizardStep8_selectComplexity(complexity);
    await this.wizardStep9_selectBlooms(Array.isArray(blooms) ? blooms : [blooms]);
    await this.wizardStep10_enterQuestionsAndGenerate(numQuestions);
    console.log('  ── Wizard complete ────────────────────────────────────────\n');
  }

  /**
   * Run the full 10-step wizard with automatic retry when a dropdown shows no data.
   *
   * On the first attempt the wizard is assumed to already be open (the test called
   * clickCreateWorksheet() before this method).  On each subsequent retry the method
   * navigates back to the Worksheet list page and re-opens the wizard so the app
   * fetches fresh data from the server.
   *
   * This handles the intermittent "no data" condition in the Subject campus dropdown
   * (Step 3) where the options list loads empty — user instruction: "if it comes
   * no data refresh and start fresh".
   *
   * @param {{
   *   type?, preference?, subject?, chapter?, topic?,
   *   method?, questionType?, complexity?, blooms?, numQuestions?
   * }} options
   * @param {number} maxAttempts  Maximum total tries (default 3)
   */
  async runWizardWithRetry(options = {}, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // From attempt 2 onwards: navigate back to list and re-open the wizard
      if (attempt > 1) {
        console.log(`\n  ♻  Wizard retry ${attempt}/${maxAttempts} — navigating to worksheet list and starting fresh…`);
        try {
          await this.navigate();          // go to /assignment
        } catch (_) {
          // If navigate itself fails, try a hard reload and continue
          await this.page.reload({ waitUntil: 'commit', timeout: 20000 }).catch(() => {});
        }
        await this.page.waitForTimeout(2000);
        await this.clickCreateWorksheet(); // re-open the wizard
        await this.page.waitForTimeout(1000);
      }

      try {
        await this.runWizard(options);
        return; // ✓ All 10 steps completed successfully
      } catch (err) {
        const msg = (err.message || String(err)).split('\n')[0];
        console.log(`  ⚠  Wizard attempt ${attempt}/${maxAttempts} failed: ${msg}`);

        if (attempt === maxAttempts) {
          // Exhausted all retries — let the error bubble up to the test
          throw err;
        }

        // Brief pause before retrying so the server has time to recover
        await this.page.waitForTimeout(2000);
      }
    }
  }
}

module.exports = { WorksheetWizardPage };
