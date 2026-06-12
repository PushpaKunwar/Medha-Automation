const fs   = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/** Recursively delete all .png files inside a directory */
function clearPngs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      clearPngs(full);
    } else if (entry.endsWith('.png')) {
      fs.unlinkSync(full);
    }
  }
}

module.exports = async function globalSetup() {
  console.log('\n🧹 Clearing all old screenshots before test run...');
  clearPngs(SCREENSHOTS_DIR);
  console.log('✅ Screenshots folder cleared.');
  console.log('   PASS__<TC>.png  saved at end of each passing test.');
  console.log('   FAIL__<TC>.png  saved automatically on test failure.\n');
};
