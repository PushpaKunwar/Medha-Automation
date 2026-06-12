/**
 * utils/selectDropdown.js
 * Shared helper for the custom campus-style dropdown component used throughout the app.
 *
 * Trigger:  [data-name="<label>"]
 * Options:  ul.filterOptionsListCustomSelectCampus > li
 * Search:   .filterInputHolder input  (narrows long lists)
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} dataName    value of the [data-name] attribute on the trigger
 * @param {string} optionText  visible text of the option to select
 */
async function selectCampusDropdown(page, dataName, optionText) {
  const optList = page.locator('ul.filterOptionsListCustomSelectCampus');

  // Retry the trigger click — React may re-render and detach the element
  let clicked = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const trigger = page.locator(`[data-name="${dataName}"]`).first();
    try {
      await trigger.waitFor({ state: 'visible', timeout: 8000 });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click({ force: true });
      clicked = true;
      break;
    } catch (e) {
      if (attempt === 2) throw e;
      await page.waitForTimeout(500); // wait for React re-render to settle
    }
  }

  if (!clicked) throw new Error(`Could not click dropdown trigger [data-name="${dataName}"]`);

  // If option list doesn't appear after the click, re-click the trigger and retry
  const optListVisible = await optList.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  if (!optListVisible) {
    // Dismiss any accidental open dropdown first, then re-click
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const trigger2 = page.locator(`[data-name="${dataName}"]`).first();
    await trigger2.scrollIntoViewIfNeeded();
    await trigger2.click({ force: true });
    await optList.waitFor({ state: 'visible', timeout: 10000 });
  }

  const searchBox = page.locator(
    '.filterInputHolder input, .filterOptionsListAndInputContainerSelectCampus input'
  ).first();
  if (await searchBox.isVisible({ timeout: 800 }).catch(() => false)) {
    await searchBox.fill(optionText.substring(0, 15));
    await page.waitForTimeout(300);
  }

  // Give dependent dropdowns (e.g. Chapters loaded after Subject API call) extra time
  await page.waitForTimeout(500);

  const option = page.locator('ul.filterOptionsListCustomSelectCampus li')
    .filter({ hasText: optionText })
    .first();
  await option.waitFor({ state: 'visible', timeout: 20000 });
  await option.click();
  await optList.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  console.log(`  ✓ [${dataName}] = "${optionText}"`);
}

module.exports = { selectCampusDropdown };
