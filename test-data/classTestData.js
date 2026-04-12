/**
 * classTestData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test data for the "Add New Class Test" form.
 *
 * All 11 entries use Grade IX / Section A / Science or Mathematics —
 * the combinations confirmed to exist in the Mafatlal Academy database.
 * Exam name, date, duration, questions, marks, mode and notify are varied
 * across entries to create 11 distinct class tests per run.
 *
 * Fields map to:
 *  school       → data-name="School"
 *  session      → data-name="Session"
 *  grade        → data-name="Grade"
 *  section      → data-name="Section"
 *  subject      → data-name="Subject"
 *  chapter      → data-name="Select Chapters"
 *  examName     → input[name="exam_name"]
 *  numQuestions → input[name="number_of_questions"]   (min 5)
 *  totalMarks   → input[name="total_marks"]
 *  examDate     → input[name="exam_date"]             (YYYY-MM-DD)
 *  examDuration → input[name="exam_duration"]         (minutes)
 *  startTime    → input[name="start_time"]            (HH:MM 24hr)
 *  examMode     → 'online' | 'offline'
 *  notify       → 'yes' | 'no'
 */

const classTestData = [
  // ── CT01 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT01',
    description:  'Sound – quick 5Q online quiz',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     'Sound Chapter Test',
    numQuestions: 5,
    totalMarks:   10,
    examDate:     '2026-04-20',   // must be future date; app rejects today or past dates
    examDuration: 10,
    startTime:    '09:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT02 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT02',
    description:  'Sound – 10Q detailed test, offline',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     'Sound Detailed Test',
    numQuestions: 10,
    totalMarks:   20,
    examDate:     '2026-04-15',
    examDuration: 20,
    startTime:    '10:00',
    examMode:     'offline',
    notify:       'no',
  },

  // ── CT03 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT03',
    description:  'Polynomials – 10Q online test, notify yes',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Mathematics',
    chapter:      'Polynomials',
    examName:     'Polynomials Unit Test',
    numQuestions: 10,
    totalMarks:   10,
    examDate:     '2026-04-18',
    examDuration: 30,
    startTime:    '11:00',
    examMode:     'online',
    notify:       'yes',
  },

  // ── CT04 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT04',
    description:  'Sound – mid-term 15Q online test',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     'Sound Mid Term',
    numQuestions: 15,
    totalMarks:   30,
    examDate:     '2026-04-20',
    examDuration: 35,
    startTime:    '14:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT05 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT05',
    description:  'Polynomials – offline 10Q test, notify yes',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Mathematics',
    chapter:      'Polynomials',
    examName:     'Polynomials Practice Test',
    numQuestions: 10,
    totalMarks:   20,
    examDate:     '2026-04-22',
    examDuration: 25,
    startTime:    '08:30',
    examMode:     'offline',
    notify:       'yes',
  },

  // ── CT06 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT06',
    description:  'Sound – evening 8Q online test',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     'Sound Evening Quiz',
    numQuestions: 8,
    totalMarks:   16,
    examDate:     '2026-04-25',
    examDuration: 20,
    startTime:    '17:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT07 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT07',
    description:  'Polynomials – 5Q short online test',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Mathematics',
    chapter:      'Polynomials',
    examName:     'Polynomials Quick Test',
    numQuestions: 5,
    totalMarks:   10,
    examDate:     '2026-04-28',
    examDuration: 15,
    startTime:    '13:00',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT08 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT08',
    description:  'Sound – 10Q offline test, notify yes',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     'Sound Offline Exam',
    numQuestions: 10,
    totalMarks:   20,
    examDate:     '2026-05-02',
    examDuration: 20,
    startTime:    '10:30',
    examMode:     'offline',
    notify:       'yes',
  },

  // ── CT09 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT09',
    description:  'Polynomials – 15Q comprehensive test',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Mathematics',
    chapter:      'Polynomials',
    examName:     'Polynomials Final Test',
    numQuestions: 15,
    totalMarks:   30,
    examDate:     '2026-05-05',
    examDuration: 40,
    startTime:    '11:30',
    examMode:     'online',
    notify:       'no',
  },

  // ── CT10 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT10',
    description:  'Sound – 10Q revision test, notify yes',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Science',
    chapter:      'Sound',
    examName:     'Sound Revision Test',
    numQuestions: 10,
    totalMarks:   20,
    examDate:     '2026-05-08',
    examDuration: 25,
    startTime:    '09:00',
    examMode:     'online',
    notify:       'yes',
  },

  // ── CT11 ──────────────────────────────────────────────────────────────────
  {
    id:           'CT11',
    description:  'Polynomials – offline 8Q test',
    school:       'Mafatlal',
    session:      '2025-2026',
    grade:        'IX',
    section:      'A',
    subject:      'Mathematics',
    chapter:      'Polynomials',
    examName:     'Polynomials Offline Test',
    numQuestions: 8,
    totalMarks:   16,
    examDate:     '2026-05-10',
    examDuration: 20,
    startTime:    '15:00',
    examMode:     'offline',
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
 * Get all entries for a subject
 * @param {string} subject  e.g. 'Science' | 'Mathematics'
 */
function getClassTestsBySubject(subject) {
  return classTestData.filter(d => d.subject === subject);
}

/**
 * Get all entries for a given exam mode
 * @param {string} mode  'online' | 'offline'
 */
function getClassTestsByMode(mode) {
  return classTestData.filter(d => d.examMode === mode);
}

module.exports = {
  classTestData,
  getClassTestById,
  getClassTestsBySubject,
  getClassTestsByMode,
};
