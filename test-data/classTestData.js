/**
 * classTestData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test data for the "Add New Class Test" form.
 *
 * All 5 entries: Mafatlal Academy / Grade IX / Section A / Science / Sound.
 * Fixed across all: date 02-05-2026, duration 30 min, start 15:00,
 *                   mode Online, notify No.
 * Varied across entries: exam name and number of questions.
 *
 * RUN_TAG — a short DDHHMI string appended to every examName so each test run
 * creates fresh records and avoids the app's "already exists" duplicate error.
 *
 * Fields map to:
 *  school       → data-name="School"             (visible: "Mafatlal Academy")
 *  session      → data-name="Session"            (visible: "2025-2026")
 *  grade        → data-name="Grade"              (visible: "IX")
 *  section      → data-name="Section"            (visible: "A")
 *  subject      → data-name="Subject"            (visible: "Science")
 *  chapter      → data-name="Select Chapters"    (visible: "Sound")
 *  examName     → input[name="exam_name"]
 *  numQuestions → input[name="number_of_questions"]   (min 5)
 *  totalMarks   → input[name="total_marks"]           (min = numQuestions)
 *  examDate     → input[name="exam_date"]             (YYYY-MM-DD)
 *  examDuration → input[name="exam_duration"]         (minutes)
 *  startTime    → input[name="start_time"]            (HH:MM 24-hr)
 *  examMode     → 'online' | 'offline'
 *  notify       → 'yes' | 'no'
 *
 * Note: End Time and Result Declaration Date/Time are auto-calculated
 * by the app (greyed-out disabled fields) — not included here.
 */

// Short run tag: DDHHMI  e.g. "110934"  (day=11, hour=09, minute=34)
function runTag() {
  const n = new Date();
  const dd = String(n.getDate()).padStart(2, '0');
  const hh = String(n.getHours()).padStart(2, '0');
  const mi = String(n.getMinutes()).padStart(2, '0');
  return `${dd}${hh}${mi}`;
}

// Tomorrow's date — tests are always scheduled for the next day.
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const TAG       = runTag();
const EXAM_DATE = tomorrow();

const classTestData = [
  // ── CT01 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT01',
    description:  'Science > Sound — 5Q online class test',
    school:       'Mafatlal Academy',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     `Sound Chapter Test ${TAG}`,
    numQuestions: 5,
    totalMarks:   5,
    examDate:     EXAM_DATE,
    examDuration: 30,
    startTime:    '16:00',
    resultTime:   '18:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT02 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT02',
    description:  'Science > Sound — 8Q online class test',
    school:       'Mafatlal Academy',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     `Sound Unit Test ${TAG}`,
    numQuestions: 8,
    totalMarks:   8,
    examDate:     EXAM_DATE,
    examDuration: 30,
    startTime:    '19:00',
    resultTime:   '21:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT03 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT03',
    description:  'Science > Sound — 10Q online class test',
    school:       'Mafatlal Academy',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     `Sound Mid Term ${TAG}`,
    numQuestions: 10,
    totalMarks:   10,
    examDate:     EXAM_DATE,
    examDuration: 30,
    startTime:    '20:00',
    resultTime:   '22:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT04 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT04',
    description:  'Science > Sound — 9Q online class test',
    school:       'Mafatlal Academy',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     `Sound Practice Exam ${TAG}`,
    numQuestions: 9,
    totalMarks:   9,
    examDate:     EXAM_DATE,
    examDuration: 30,
    startTime:    '22:00',
    resultTime:   '23:59',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT05 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT05',
    description:  'Science > Sound — 7Q online class test',
    school:       'Mafatlal Academy',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     `Sound Revision Test ${TAG}`,
    numQuestions: 7,
    totalMarks:   7,
    examDate:     EXAM_DATE,
    examDuration: 30,
    startTime:    '23:00',
    resultTime:   '23:59',
    examMode:     'online',
    notify:       'no',
  },
];

/**
 * Get a single entry by id
 * @param {string} id  e.g. 'CT01'
 */
function getClassTestById(id) {
  const entry = classTestData.find(d => d.id === id);
  if (!entry) throw new Error(`Class test data not found for id: ${id}`);
  return entry;
}

/**
 * Get all entries for a given exam mode
 * @param {string} mode  'online' | 'offline'
 */
function getClassTestsByMode(mode) {
  return classTestData.filter(d => d.examMode === mode);
}

/**
 * Returns a slice of classTestData based on the DATA_COUNT env var.
 *
 * Usage:
 *   Run 1 entry only:   DATA_COUNT=1 npx playwright test ...
 *   Run first 3:        DATA_COUNT=3 npx playwright test ...
 *   Run all (default):  npx playwright test ...
 *
 * In tests, use activeClassTestData instead of classTestData:
 *   const { activeClassTestData } = require('../../test-data/classTestData');
 *   for (const data of activeClassTestData) { ... }
 */
const _count = parseInt(process.env.DATA_COUNT, 10);
const activeClassTestData = (!isNaN(_count) && _count > 0)
  ? classTestData.slice(0, _count)
  : classTestData;

module.exports = {
  classTestData,
  activeClassTestData,
  getClassTestById,
  getClassTestsByMode,
};
