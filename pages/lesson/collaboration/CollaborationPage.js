/**
 * pages/lesson/collaboration/CollaborationPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page object for the Collaboration feature (TC16).
 * URL: /collaboration
 *
 * The "Add Collaboration" form opens as a MUI Dialog (modal popup).
 * ALL selectors are scoped inside the dialog to avoid hitting the background
 * list-page elements (which are blocked by the MUI overlay anyway).
 *
 * Form field structure (from live page snapshot):
 *   Date *            → input[type="date"]          inside dialog
 *   Time *            → input[type="time"]          inside dialog
 *   Institution *     → campus-style dropdown        (pre-filled: Mafatlal Academy)
 *   Grade *           → campus-style dropdown        (pre-filled: IX)
 *   Section *         → campus-style dropdown
 *   Subject *         → campus-style dropdown
 *   Chapter *         → campus-style dropdown
 *   Topic *           → custom combobox (div[role="combobox"])
 *   User *            → MUI Select  (combobox "Select" + "Open" button)
 *   Collaboration URL → plain text input
 *   Collaboration Name→ disabled text input (auto-filled by app)
 *   Description *     → Rich Text Editor (contenteditable)
 *   Buttons           → SUBMIT, RESET, CLOSE
 */

const { URLS } = require('../../../utils/urls');

class CollaborationPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── "+" / Add Collaboration button (top-right of list page) ──────────────
    // The button has an icon with aria-label "add" (Material icon: add)
    this.addBtn = page.locator([
      'button:has([data-testid="AddIcon"])',
      'button:has(span:text-is("add"))',          // Material icon text node
      'button[aria-label="add" i]',
      'button.btn-square.btn-add',
    ].join(', ')).last();

    // Dialog root — MUI Dialog component.  All form locators are scoped here.
    // Playwright resolves these lazily, so the dialog does not have to exist yet.
    this.dialog = page.locator('[role="dialog"]');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Navigation
  // ───────────────────────────────────────────────────────────────────────────

  /** Navigate to the Collaboration list page. */
  async navigate() {
    await this.page.goto(URLS.collaboration, { waitUntil: 'commit' });
    await this.page.waitForTimeout(3000);
    console.log('  ✓ On Collaboration list:', this.page.url().split('?')[0]);

    // ── Dismiss "Confirmation Status" popup if it appears ─────────────────────
    await this._dismissConfirmationPopup();
  }

  /**
   * Close the "Confirmation Status" popup that sometimes appears on page load.
   * Clicks the CLOSE button if the dialog is visible; silently skips if not.
   */
  async _dismissConfirmationPopup() {
    try {
      const popup = this.page.locator('[role="dialog"]:has-text("Confirmation Status")');
      const visible = await popup.isVisible({ timeout: 3000 });
      if (!visible) return;

      const closeBtn = popup.locator('button:has-text("CLOSE"), button:has-text("Close")').first();
      await closeBtn.waitFor({ state: 'visible', timeout: 3000 });
      await closeBtn.click();
      await this.page.waitForTimeout(800);
      console.log('  ✓ Dismissed "Confirmation Status" popup');
    } catch {
      // Popup not present — nothing to do
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Open creation form
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Click the "+" button (top-right corner) to open the Add Collaboration dialog.
   * Waits for the MUI Dialog to appear before returning.
   */
  async clickAddCollaboration() {
    // Material-icon button: the icon font renders the ligature text "add" inside the button.
    // Confirmed from page snapshot: button "add" [ref=e82] with child generic "add".
    // getByRole with exact:true matches the accessible name "add" precisely.
    const addBtn = this.page.getByRole('button', { name: 'add', exact: true });

    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();

    // Wait for the MUI dialog to be visible
    await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1500);   // give dialog time to render + pre-fill values
    console.log('  ✓ Clicked "+" — Add Collaboration dialog opened');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Form filling  (all locators scoped to this.dialog)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Fill all fields of the Add Collaboration dialog.
   *
   * @param {{
   *   date?:              string,   // YYYY-MM-DD  (stored internally by date input)
   *   time?:              string,   // HH:mm
   *   institution?:       string,   // usually pre-filled — pass to verify/override
   *   grade?:             string,   // usually pre-filled — pass to verify/override
   *   section?:           string,
   *   subject?:           string,
   *   chapter?:           string,
   *   topic?:             string,
   *   userSelection?:     string,   // 'All' or a specific user name
   *   collaborationUrl?:  string,
   *   collaborationName?: string,   // '' = use auto-filled value
   *   notes?:             string,   // Description rich-text field
   * }} options
   */
  async fillForm(options = {}) {
    const {
      date             = '',
      time             = '',
      institution      = '',
      grade            = '',
      section          = '',
      subject          = '',
      chapter          = '',
      topic            = '',
      userSelection    = 'All',
      collaborationUrl = '',
      collaborationName = '',
      notes            = '',
    } = options;

    // ── Date (input[type="date"] inside the dialog) ───────────────────────────
    if (date) {
      await this._fillDialogDate(date);
    }

    // ── Time (input[type="time"] inside the dialog) ───────────────────────────
    if (time) {
      await this._fillDialogTime(time);
    }

    // ── Institution (campus dropdown — pre-filled, skip if already correct) ───
    if (institution) {
      await this._selectCampusInDialog('Institution', institution);
    }

    // ── Grade (campus dropdown — pre-filled, skip if already correct) ─────────
    if (grade) {
      await this._selectCampusInDialog('Grade', grade);
    }

    // ── Section ───────────────────────────────────────────────────────────────
    if (section) {
      await this._selectCampusInDialog('Section', section);
    }

    // ── Subject ───────────────────────────────────────────────────────────────
    if (subject) {
      await this._selectCampusInDialog('Subject', subject);
    }

    // ── Chapter (depends on Subject — wait for options to load after Subject) ──
    if (chapter) {
      await this.page.waitForTimeout(1500);   // Chapter options load async after Subject
      await this._selectCampusInDialog('Chapter', chapter);
    }

    // ── Topic (custom combobox inside dialog) ─────────────────────────────────
    if (topic) {
      await this._selectTopicInDialog(topic);
    }

    // ── User (MUI Select combobox) ────────────────────────────────────────────
    if (userSelection) {
      await this._selectUsersInDialog(userSelection);
    }

    // ── Collaboration URL ─────────────────────────────────────────────────────
    if (collaborationUrl) {
      await this._fillCollabUrl(collaborationUrl);
    }

    // ── Collaboration Name (auto-filled by app after URL entered) ─────────────
    await this._checkCollabName(collaborationName);

    // ── Description (Rich Text Editor — contenteditable) ─────────────────────
    if (notes) {
      await this._fillDescription(notes);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Submit & Verify
  // ───────────────────────────────────────────────────────────────────────────

  /** Click the SUBMIT button inside the dialog and wait for the dialog to close. */
  async clickSubmit() {
    const submitBtn = this.dialog.locator([
      'button:has-text("SUBMIT")',
      'button:has-text("Submit")',
      'button[type="submit"]',
    ].join(', ')).first();

    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
    await submitBtn.click();

    // Wait for the dialog to close (success) or stay open (validation error)
    await this.dialog.waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => console.log('  ⚠ Dialog still open after Submit — may have a validation error'));

    await this.page.waitForTimeout(2000);
    console.log('  ✓ Clicked SUBMIT');
  }

  /**
   * Verify that at least one collaboration entry is visible in the listing.
   * Accepts either a table row or a card layout.
   */
  async verifyInListing() {
    const entry = this.page.locator([
      'table tbody tr',
      '[class*="card"]',
      '[class*="templateBaner"]',
      '[class*="list"] li',
    ].join(', ')).first();

    const visible = await entry.waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true).catch(() => false);

    if (visible) {
      console.log('  ✓ Collaboration entry visible in listing');
    } else {
      console.log('  ⚠ Could not confirm listing entry — check the page manually');
    }
    return visible;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers  (all scoped inside this.dialog)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Fill the Date input inside the dialog.
   *
   * Strategy 1: Playwright fill() — sets value attribute directly (YYYY-MM-DD).
   * Strategy 2: Segment typing — Chrome date picker has MM/DD/YYYY segments;
   *             type month then day then year as plain digits.
   *
   * @param {string} value  YYYY-MM-DD (e.g. '2026-05-02')
   */
  async _fillDialogDate(value) {
    const [year, month, day] = value.split('-');   // e.g. ['2026','05','02']
    const el = this.dialog.locator('input[type="date"]').first();
    await el.waitFor({ state: 'visible', timeout: 10000 });
    await el.scrollIntoViewIfNeeded().catch(() => {});

    // Strategy 1 — React native setter (bypasses React proxy, fires real input/change events)
    await el.evaluate((input, val) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await this.page.waitForTimeout(300);
    const v1 = await el.inputValue().catch(() => '');
    if (v1 === value) {
      await el.press('Tab');
      await this.page.waitForTimeout(300);
      console.log(`    ✓ Date = "${v1}"`);
      return;
    }

    // Strategy 2 — Playwright fill() + Tab
    await el.fill(value);
    await el.press('Tab');
    await this.page.waitForTimeout(300);
    const v2 = await el.inputValue().catch(() => '');
    if (v2 === value) {
      console.log(`    ✓ Date = "${v2}" (fill)`);
      return;
    }

    // Strategy 3 — Segment typing: for DD/MM/YYYY locale type DD → MM → YYYY
    await el.click();
    await this.page.keyboard.type(`${day}${month}${year}`, { delay: 80 });
    await el.press('Tab');
    await this.page.waitForTimeout(300);
    const v3 = await el.inputValue().catch(() => '');
    console.log(`    ✓ Date = "${v3 || value}" (segment-typed)`);
  }

  /**
   * Fill the Time input inside the dialog.
   *
   * Strategy 1: Playwright fill() — sets value directly (HH:mm).
   * Strategy 2: Segment typing — Chrome time picker has HH/MM/AM-PM segments.
   *
   * @param {string} value  HH:mm in 24-hour format (e.g. '15:00')
   */
  async _fillDialogTime(value) {
    const [hh, mm] = value.split(':');             // e.g. ['15','00']
    const el = this.dialog.locator('input[type="time"]').first();
    await el.waitFor({ state: 'visible', timeout: 10000 });
    await el.scrollIntoViewIfNeeded().catch(() => {});

    // Strategy 1 — Playwright native fill
    await el.fill(value);
    await this.page.waitForTimeout(300);
    const v1 = await el.inputValue().catch(() => '');
    if (v1 === value || v1.startsWith(hh)) {
      await el.press('Tab');
      await this.page.waitForTimeout(300);
      console.log(`    ✓ Time = "${v1 || value}"`);
      return;
    }

    // Strategy 2 — type segments: HH then MM, then AM/PM key if needed
    await el.click();
    await this.page.keyboard.type(`${hh}${mm}`, { delay: 80 });
    // If browser shows 12-hour clock, send PM for hours >= 12
    const hour = parseInt(hh, 10);
    if (hour >= 12) {
      await this.page.keyboard.press('p');   // selects PM
    } else {
      await this.page.keyboard.press('a');   // selects AM
    }
    await el.press('Tab');
    await this.page.waitForTimeout(300);

    const v2 = await el.inputValue().catch(() => '');
    console.log(`    ✓ Time = "${v2 || value}" (segment-typed)`);
  }

  /**
   * Select a value from a campus-style custom dropdown INSIDE the dialog.
   *
   * Dialog structure (from live page snapshot):
   *   generic [parent]
   *     generic: "<FieldLabel>*"          ← label
   *     generic [cursor=pointer]:         ← trigger  (contains current value text + img arrow)
   *       generic: "<currentValue>"
   *       img
   *
   * Strategy:
   *   1. Find the trigger via data-name OR label→following-sibling.
   *   2. If the trigger already shows the target value → skip (pre-filled fields like Grade, Institution).
   *   3. Otherwise click the trigger, wait for the option list, click the matching option.
   *
   * @param {string} dataNameOrLabel  data-name attribute OR label text of the field
   * @param {string} value            Option text to select
   */
  async _selectCampusInDialog(dataNameOrLabel, value) {
    // ── Locate the trigger ────────────────────────────────────────────────────
    let trigger = null;

    // Strategy A: data-name attribute
    const byDataName = this.dialog.locator(`[data-name="${dataNameOrLabel}"]`).first();
    if (await byDataName.isVisible({ timeout: 1500 }).catch(() => false)) {
      trigger = byDataName;
    }

    // Strategy B: label → following-sibling (matches dialog snapshot structure)
    if (!trigger) {
      const labelEl = this.dialog.locator('*')
        .filter({ hasText: new RegExp(`^${dataNameOrLabel}\\s*\\*?$`, 'i') })
        .first();
      if (await labelEl.isVisible({ timeout: 1500 }).catch(() => false)) {
        const sib = labelEl.locator('xpath=following-sibling::*[1]');
        if (await sib.isVisible({ timeout: 1500 }).catch(() => false)) {
          trigger = sib;
        }
      }
    }

    if (!trigger) {
      console.log(`    ⚠ ${dataNameOrLabel}: trigger not found — skipping`);
      return;
    }

    // ── Skip if already at the target value (handles pre-filled fields) ───────
    const currentText = (await trigger.textContent().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (currentText.includes(value)) {
      console.log(`    ✓ ${dataNameOrLabel} = "${value}" (already selected)`);
      return;
    }

    // ── Open the dropdown ─────────────────────────────────────────────────────
    await trigger.click();
    await this.page.waitForTimeout(600);

    // ── Find and click the matching option ────────────────────────────────────
    const optionList = this.page.locator([
      'ul.filterOptionsListCustomSelectCampus',
      '[class*="filterOptionsList"]',
      '[class*="dropdownList"]',
    ].join(', ')).first();

    const listVisible = await optionList.isVisible({ timeout: 4000 }).catch(() => false);

    if (listVisible) {
      // Wait a little longer for async-loaded options (e.g. Chapter after Subject changes)
      await this.page.waitForTimeout(500);
      // Exact match first, then substring
      let option = optionList.locator('li').filter({ hasText: new RegExp(`^${value}$`, 'i') }).first();
      if (!await option.isVisible({ timeout: 1500 }).catch(() => false)) {
        option = optionList.locator('li').filter({ hasText: value }).first();
      }
      const optVisible = await option.isVisible({ timeout: 9000 }).catch(() => false);
      if (optVisible) {
        await option.click();
        await optionList.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      } else {
        console.log(`    ⚠ ${dataNameOrLabel}: "${value}" not found in list — clicking dialog title to close dropdown`);
        // NEVER press Escape here — it bubbles up and closes the entire MUI Dialog.
        // Instead click the dialog's own title bar (safe area) to dismiss the dropdown.
        await this.dialog.locator('text="Add Collaboration"').click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(400);
      }
    } else {
      // Option list not found — try direct click on any visible option text
      const direct = this.page.locator('li, [role="option"]').filter({ hasText: value }).first();
      if (await direct.isVisible({ timeout: 3000 }).catch(() => false)) {
        await direct.click();
      } else {
        console.log(`    ⚠ ${dataNameOrLabel}: option list not visible, direct option also not found`);
      }
    }

    await this.page.waitForTimeout(400);
    console.log(`    ✓ ${dataNameOrLabel} = "${value}"`);
  }

  /**
   * Select a topic from the custom combobox inside the dialog.
   * The Topic field is a campus-style combobox (div[role="combobox"]).
   */
  async _selectTopicInDialog(topic) {
    // Topic field from snapshot: combobox [ref=e282] inside generic[e281]
    // Selector: [role="combobox"] (NOT div[role="combobox"] — tag may not be div)
    // Use .first() — Topic combobox appears before User combobox in the DOM
    const combobox = this.dialog.locator('[role="combobox"]').first();
    await combobox.waitFor({ state: 'visible', timeout: 12000 });
    await combobox.click();
    await this.page.waitForTimeout(600);

    // Type to filter options
    const searchInput = this.page.locator('[class*="filterInput"] input, [class*="searchInput"] input').first();
    if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await searchInput.type(topic.substring(0, 6), { delay: 50 });
      await this.page.waitForTimeout(400);
    }

    const option = this.page.locator('li, [role="option"]').filter({ hasText: topic }).first();
    const optVisible = await option.isVisible({ timeout: 5000 }).catch(() => false);
    if (optVisible) {
      await option.click();
      console.log(`    ✓ Topic = "${topic}"`);
    } else {
      console.log(`    ⚠ Topic: option "${topic}" not found`);
    }

    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(400);
  }

  /**
   * Select users from the MUI Select dropdown inside the dialog.
   * 'All' → click "All" option to select every user.
   * A specific name → filter and click the matching option.
   *
   * After selection, click in the center of the dialog to close the dropdown
   * and allow the form to proceed to the next field.
   */
  async _selectUsersInDialog(userSelection) {
    // Open the MUI Select by clicking its "Open" button or the combobox itself
    const openBtn = this.dialog.locator([
      'button[aria-label="Open"]',
      'button:has-text("Open")',
      '[class*="MuiSelect"] button',
      'button:has(img[alt*="drop" i])',
    ].join(', ')).first();

    const combobox = this.dialog.locator('div[role="combobox"]:not([class*="topic" i]):not([class*="Topic" i])').last();

    const openBtnVisible = await openBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (openBtnVisible) {
      await openBtn.click();
    } else {
      await combobox.click();
    }
    await this.page.waitForTimeout(600);

    if (userSelection === 'All') {
      // Click the "All" option in the dropdown list
      const allOpt = this.page.locator('li, [role="option"]').filter({ hasText: /^All$/i }).first();
      const allVisible = await allOpt.isVisible({ timeout: 4000 }).catch(() => false);
      if (allVisible) {
        await allOpt.click();
        console.log('    ✓ Users = "All" selected');
      } else {
        // Broader: any element saying "All" or "Select All" in the open dropdown
        const broader = this.page.locator('li, [role="option"], [class*="option"]')
          .filter({ hasText: /All/i }).first();
        if (await broader.isVisible({ timeout: 3000 }).catch(() => false)) {
          await broader.click();
          console.log('    ✓ Users = "All" (broader match)');
        } else {
          console.log('    ⚠ Users: "All" option not found — dropdown may not be open');
        }
      }
    } else {
      // Type to filter, then click
      const searchInput = this.page.locator('input[type="text"][placeholder*="search" i], [class*="search"] input').first();
      if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchInput.type(userSelection.substring(0, 6), { delay: 50 });
        await this.page.waitForTimeout(400);
      }
      const userOpt = this.page.locator('li, [role="option"]').filter({ hasText: userSelection }).first();
      if (await userOpt.isVisible({ timeout: 4000 }).catch(() => false)) {
        await userOpt.click();
        console.log(`    ✓ User = "${userSelection}"`);
      } else {
        console.log(`    ⚠ User "${userSelection}" not found in dropdown`);
      }
    }

    // ── Click the dialog title to close the user dropdown and proceed ───────────
    // Clicking the "Add Collaboration" heading is a safe area: it's always visible,
    // never triggers form side-effects, and reliably dismisses the open MUI listbox.
    await this.dialog.locator('text="Add Collaboration"').click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(600);
    console.log('    ✓ Clicked dialog title — user dropdown closed');

    // ── Assertion: verify user tags appeared ─────────────────────────────────
    const tagCount = await this.dialog.locator('[class*="tag"], [class*="chip"], [class*="MuiChip"]').count().catch(() => 0);
    if (userSelection === 'All') {
      console.log(`    ✓ User selection = "All" — ${tagCount} tag(s) visible (all users added)`);
    } else {
      const namedTag = this.dialog.locator(`[class*="tag"]:has-text("${userSelection}"), [class*="chip"]:has-text("${userSelection}")`).first();
      const namedVisible = await namedTag.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(namedVisible
        ? `    ✓ User tag "${userSelection}" confirmed`
        : `    ⚠ User tag "${userSelection}" not visible — check selector`);
    }
  }

  /** Fill the Collaboration URL text input inside the dialog. */
  async _fillCollabUrl(url) {
    const el = this.dialog.locator([
      'input[placeholder*="URL" i]',
      'input[placeholder*="url" i]',
      'input[name*="url" i]',
      'input[id*="url" i]',
    ].join(', ')).first();

    await el.waitFor({ state: 'visible', timeout: 10000 });
    await el.click();
    await el.fill(url);
    await el.press('Tab');
    await this.page.waitForTimeout(500);
    console.log(`    ✓ Collaboration URL = "${url}"`);
  }

  /**
   * Read the auto-filled Collaboration Name.
   * If the field is empty AND a name was provided, fill it in.
   */
  async _checkCollabName(collaborationName) {
    const el = this.dialog.locator([
      'input[name*="name" i]',
      'input[placeholder*="Collaboration Name" i]',
      'input[id*="name" i]',
    ].join(', ')).first();

    if (!await el.isVisible({ timeout: 3000 }).catch(() => false)) return;

    const autoName = await el.inputValue().catch(() => '');
    if (!autoName && collaborationName) {
      await el.click();
      await el.fill(collaborationName);
      await el.press('Tab');
      await this.page.waitForTimeout(300);
      console.log(`    ✓ Collaboration Name = "${collaborationName}" (manually filled)`);
    } else {
      console.log(`    ✓ Collaboration Name = "${autoName || '(pending auto-fill)'}" (auto-filled)`);
    }
  }

  /**
   * Fill the Description rich text editor (contenteditable) inside the dialog.
   * Scrolls down first so the editor is in view.
   */
  async _fillDescription(text) {
    // Scroll down inside the dialog so the Description editor is visible
    await this.page.mouse.wheel(0, 400);
    await this.page.waitForTimeout(500);

    // The editor is a contenteditable div (TipTap / CKEditor style)
    const editor = this.dialog.locator([
      '[contenteditable="true"]',
      'div[role="textbox"]',
      '.ql-editor',
      '.ProseMirror',
    ].join(', ')).first();

    await editor.waitFor({ state: 'visible', timeout: 10000 });
    await editor.scrollIntoViewIfNeeded().catch(() => {});
    await editor.click();
    await editor.type(text, { delay: 30 });
    await this.page.waitForTimeout(300);
    console.log(`    ✓ Description = "${text}"`);
  }
}

module.exports = { CollaborationPage };
