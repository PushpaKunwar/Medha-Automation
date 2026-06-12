/**
 * worksheetData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test data for the "Create Worksheet" wizard (Lesson → Worksheet → /assignment).
 *
 * All 5 entries: Grade IX / Section A / Science / Sound chapter.
 * Each worksheet uses a DIFFERENT topic from the Sound chapter.
 *
 * Wizard selections (10 steps):
 *  Step 1  type           → 'Individual'
 *  Step 2  preference     → 'Assignment'
 *  Step 3  subject        → 'Science'   (School/Grade/Section are pre-filled)
 *  Step 4  chapter        → 'Sound'
 *  Step 5  topic          → varies per worksheet (different topic each time)
 *  Step 6  method         → 'AI'
 *  Step 7  questionType   → 'Descriptive Question'
 *  Step 8  complexity     → 'Easy' | 'Moderate' | 'Advanced' | 'Highly advance'
 *  Step 9  blooms         → array of Bloom's labels
 *  Step 10 numQuestions   → number string  e.g. '1'
 *
 * Post-generate form fields (filled after GENERATE WORKSHEET):
 *  evaluation      → 'No'   (Evaluate worksheet? Yes / No)
 *  submissionDate  → 'YYYY-MM-DD'  (Submission Date — must be today or earlier than evalDate)
 *  evaluationDate  → 'YYYY-MM-DD'  (Evaluation Date — must be > submissionDate)
 *  resultDate      → 'YYYY-MM-DD'  (Result Declaration Date — must be > evaluationDate)
 *
 * Assertions enforced in the test (pre-browser, JS-level):
 *   submissionDate < evaluationDate
 *   evaluationDate < resultDate
 *   all three date fields non-blank
 *
 * Topics used (all from Sound chapter, Grade IX Science):
 *  WS01 → Reflection of Sound
 *  WS02 → Production of Sound
 *  WS03 → Propagation of Sound
 *  WS04 → Range of Hearing
 *  WS05 → Applications of Ultrasound
 */

function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const worksheetData = [
  // ── WS01 ──────────────────────────────────────────────────────────────────
  {
    id:             'WS01',
    description:    'Sound – Reflection of Sound – Easy, Remembering + Understanding',
    grade:          'IX',
    section:        'A',
    subject:        'Science',
    chapter:        'Sound',
    topic:          'Reflection of Sound',
    type:           'Individual',
    preference:     'Assignment',
    method:         'AI',
    questionType:   'Descriptive Question',
    complexity:     'Easy',
    blooms:         ['Remembering', 'Understanding'],
    numQuestions:   '1',
    // Post-generate form
    evaluation:     'No',
    submissionDate: futureDate(2),
    evaluationDate: futureDate(3),
    resultDate:     futureDate(4),
  },

  // ── WS02 ──────────────────────────────────────────────────────────────────
  {
    id:             'WS02',
    description:    'Sound – Production of Sound – Moderate, Applying',
    grade:          'IX',
    section:        'A',
    subject:        'Science',
    chapter:        'Sound',
    topic:          'Production of Sound',
    type:           'Individual',
    preference:     'Assignment',
    method:         'AI',
    questionType:   'Descriptive Question',
    complexity:     'Moderate',
    blooms:         ['Applying'],
    numQuestions:   '1',
    // Post-generate form
    evaluation:     'No',
    submissionDate: futureDate(2),
    evaluationDate: futureDate(3),
    resultDate:     futureDate(4),
  },

  // ── WS03 ──────────────────────────────────────────────────────────────────
  {
    id:             'WS03',
    description:    'Sound – Propagation of Sound – Advanced, Analysing',
    grade:          'IX',
    section:        'A',
    subject:        'Science',
    chapter:        'Sound',
    topic:          'Propagation of Sound',
    type:           'Individual',
    preference:     'Assignment',
    method:         'AI',
    questionType:   'Descriptive Question',
    complexity:     'Advanced',
    blooms:         ['Analysing'],
    numQuestions:   '1',
    // Post-generate form
    evaluation:     'No',
    submissionDate: futureDate(2),
    evaluationDate: futureDate(3),
    resultDate:     futureDate(4),
  },

  // ── WS04 ──────────────────────────────────────────────────────────────────
  {
    id:             'WS04',
    description:    'Sound – Range of Hearing – Easy, Remembering',
    grade:          'IX',
    section:        'A',
    subject:        'Science',
    chapter:        'Sound',
    topic:          'Range of Hearing',
    type:           'Individual',
    preference:     'Assignment',
    method:         'AI',
    questionType:   'Descriptive Question',
    complexity:     'Easy',
    blooms:         ['Remembering'],
    numQuestions:   '1',
    // Post-generate form
    evaluation:     'No',
    submissionDate: futureDate(2),
    evaluationDate: futureDate(3),
    resultDate:     futureDate(4),
  },

  // ── WS05 ──────────────────────────────────────────────────────────────────
  // Complexity → Bloom's mapping confirmed from live app debug:
  //   Easy     → [Remembering, Understanding]
  //   Moderate → [Applying]          ← only this one option exposed
  //   Advanced → [Analyzing]
  // So Moderate only exposes "Applying" — cannot combine with Remembering/Understanding.
  {
    id:             'WS05',
    description:    'Sound – Applications of Ultrasound – Moderate, Applying',
    grade:          'IX',
    section:        'A',
    subject:        'Science',
    chapter:        'Sound',
    topic:          'Applications of Ultrasound',
    type:           'Individual',
    preference:     'Assignment',
    method:         'AI',
    questionType:   'Descriptive Question',
    complexity:     'Moderate',
    blooms:         ['Applying'],
    numQuestions:   '2',
    // Post-generate form
    evaluation:     'No',
    submissionDate: futureDate(2),
    evaluationDate: futureDate(3),
    resultDate:     futureDate(4),
  },
];

/**
 * Get a single worksheet data entry by id (e.g. 'WS01').
 * @param {string} id
 */
function getWorksheetById(id) {
  const entry = worksheetData.find(d => d.id === id);
  if (!entry) throw new Error(`worksheetData: no entry found for id="${id}"`);
  return entry;
}

/**
 * Get all worksheet entries for a given subject.
 * @param {string} subject
 */
function getWorksheetsBySubject(subject) {
  return worksheetData.filter(d => d.subject === subject);
}

const _countWs = parseInt(process.env.DATA_COUNT, 10);
const activeWorksheetData = (!isNaN(_countWs) && _countWs > 0)
  ? worksheetData.slice(0, _countWs)
  : worksheetData;

module.exports = { worksheetData, activeWorksheetData, getWorksheetById, getWorksheetsBySubject };
