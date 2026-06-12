/**
 * WorksheetPage — backward-compatible entry point.
 * Combines list-page actions (WorksheetListPage) and wizard actions (WorksheetWizardPage).
 * Import this class in tests; import the sub-classes directly when you only need one half.
 */

const { WorksheetWizardPage } = require('./WorksheetWizardPage');
const { WORKSHEET_URL } = require('./WorksheetListPage');

class WorksheetPage extends WorksheetWizardPage {}

module.exports = { WorksheetPage, WORKSHEET_URL };
