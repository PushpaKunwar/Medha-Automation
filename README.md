# LMS Medha — Playwright Automation

End-to-end test suite for the Mafatlal Education LMS, covering auth, class tests, worksheets, and the TO-DO/M-Board flow.

---

## Quick Start

```bash
npm install
npx playwright install chromium

# Copy and fill in environment variables
cp .env.example .env

# Run all tests (headed)
npm run test:headed

# Run a single suite
npx playwright test tests/auth/login.test.js --headed
npx playwright test tests/lesson/classtest/classtest.test.js --headed
npx playwright test tests/lesson/worksheet/worksheet.test.js --headed
npx playwright test tests/todo/todo.test.js --headed

# Run by TC number
npx playwright test --grep "TC08" --headed

# View HTML report
npm run report
```

---

## Environment Setup

Playwright auto-loads `.env` from the project root. Copy `.env.example` to `.env` and fill in your values:

| Variable        | Description                  | Default                                    |
|-----------------|------------------------------|--------------------------------------------|
| `BASE_URL`      | Login shell URL (port 5020)  | `https://live.mafatlaleducation.com:5020/` |
| `TEST_EMAIL`    | Test account email           | `teacherdemo@gmail.com`                    |
| `TEST_PASSWORD` | Test account password        | `Teacher@01`                               |

> `.env` is gitignored — never commit real credentials.

---

## Test Coverage

| Suite | Test IDs | Description |
|-------|----------|-------------|
| Auth | TC01–TC05 | Login, invalid creds, UI elements, forgot password, logout |
| TO-DO | TC06 | Dashboard → TO-DO → Start Class → M-Board → e-Content → YouTube |
| Class Test | TC07 | Data-driven (CT01–CT11): fill form → Save & Next |
| Class Test | TC08 | Full happy path: form → questions → AI adjust → Submit → Finalize |
| Class Test | TC09 | Add questions later via Edit |
| Class Test | TC10 | Conflict handling: duplicate time → popup → delete → recreate |
| Worksheet | TC11 | Data-driven (WS01–WS05): full 10-step wizard |
| Worksheet | TC12 | Happy path: wizard → verify in list |
| Worksheet | TC13 | Create then delete |
| Worksheet | TC14 | Create → find in list → click Edit |
| Worksheet | TC15 | Step-by-step wizard with screenshot per step |

---

## Project Structure

```
├── pages/
│   ├── auth/
│   │   ├── LoginPage.js
│   │   └── ForgetPasswordPage.js
│   ├── dashboard/
│   │   └── DashboardPage.js
│   ├── lesson/
│   │   ├── LessonPage.js
│   │   ├── classtest/
│   │   │   ├── ClassTestListPage.js
│   │   │   ├── AddClassTestPage.js
│   │   │   └── AddQuestionPage.js
│   │   └── worksheet/
│   │       ├── WorksheetListPage.js    ← list, filters, CRUD
│   │       ├── WorksheetWizardPage.js  ← 10-step wizard
│   │       └── WorksheetPage.js        ← combined (extends WizardPage)
│   └── todo/
│       ├── TodoPage.js
│       └── MboardPage.js
├── tests/
│   ├── auth/login.test.js
│   ├── lesson/
│   │   ├── classtest/classtest.test.js
│   │   └── worksheet/worksheet.test.js
│   └── todo/todo.test.js
├── utils/
│   ├── authHelper.js        ← loginAndGoToDashboard, login
│   ├── globalSetup.js       ← clears screenshots before each run
│   ├── screenshot.js        ← screenshotPass / screenshotFail with folder map
│   ├── selectDropdown.js    ← shared campus dropdown helper
│   └── urls.js              ← URL constants
├── test-data/
│   ├── credentials.js       ← reads TEST_EMAIL / TEST_PASSWORD from .env
│   ├── classTestData.js     ← CT01–CT11 datasets
│   └── worksheetData.js     ← WS01–WS05 datasets
├── debug-delete.js          ← standalone delete-flow diagnostic script
├── .env.example
├── playwright.config.js
└── package.json
```

---

## Key Design Decisions

**Page Object Model** — All selectors and actions live in `pages/`. Tests contain only assertions and high-level orchestration.

**Shared dropdown utility** — `utils/selectDropdown.js` (`selectCampusDropdown`) handles the app's custom campus-style dropdown used in every form and filter panel.

**Serial test execution** — `workers: 1` in config and `.serial` on scenario suites (TC08–TC15) prevent race conditions on shared test data.

**Cleanup before create** — `ClassTestListPage.deleteAllByName()` removes leftovers before each class-test scenario, preventing "duplicate" API errors.

**Fallback locators** — Critical elements use multi-strategy selectors (placeholder, data-name, text content) so tests survive minor UI changes.

**Screenshots** — `utils/screenshot.js` writes `PASS__*.png` / `FAIL__*.png` into named folders under `screenshots/`. `globalSetup.js` clears them before each run.

---

## Assumptions

Tests assume the following data exists in the database:
- School: **Mafatlal**
- Grade: **IX**, Section: **A**
- Subject: **Science** (chapter: Sound) and **Mathematics** (chapter: Polynomials)
- Teacher account configured in `.env`

---

## Debugging

```bash
# Run a single failing test with Playwright inspector
npx playwright test --grep "TC08-1" --headed --debug

# Run the delete-flow diagnostic script
node debug-delete.js

# Show last HTML report
npm run report
```
