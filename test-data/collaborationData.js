/**
 * test-data/collaborationData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test data for TC16 — Create Collaboration.
 *
 * Fields:
 *   id                — unique entry identifier
 *   description       — human-readable description of the test scenario
 *   date              — collaboration date  (YYYY-MM-DD, for <input type="date">)
 *   time              — collaboration time  (HH:mm, 24h — must be unique per date
 *                       to avoid the app's duplicate-schedule validation error)
 *   institution       — campus / school dropdown value
 *   grade             — grade dropdown value
 *   section           — section dropdown value
 *   subject           — subject dropdown value
 *   chapter           — chapter dropdown value
 *   topic             — topic (multi-select combobox) value
 *   userSelection     — 'All'  → select-all users; a name → filter and pick one
 *   collaborationUrl  — meeting URL pasted into the URL field
 *   collaborationName — leave '' to accept the app's auto-filled name;
 *                       supply a string to override it
 *   notes             — textarea / description field
 */

// Generate today's date in YYYY-MM-DD and a base hour so every run is unique.
// Times are offset by entry index to avoid the app's duplicate-schedule error.
function todayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Base hour = current hour + 1, capped to 23, formatted HH:mm.
// Each entry adds its index so times are always unique within a run.
function slotTime(offsetIndex) {
  const base = Math.min(new Date().getHours() + 1, 23);
  const hour = Math.min(base + offsetIndex, 23);
  return `${String(hour).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
}

const TODAY = todayDate();

const collaborationData = [

  // ── COL01 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL01',
    description:       'Create Collaboration – Science / Sound / Reflection of Sound',
    date:              TODAY,
    time:              slotTime(0),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Sound',
    topic:             'Reflection of Sound',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/zwn-xtvs-nzp?hs=197&hs=187&authuser=0&ijlm=1777711339876&adhoc=1',
    collaborationName: '',
    notes:             'Testing collaboration for Reflection of Sound topic.',
  },

  // ── COL02 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL02',
    description:       'Create Collaboration – Science / Sound / Production of Sound',
    date:              TODAY,
    time:              slotTime(1),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Sound',
    topic:             'Production of Sound',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/zwn-xtvs-nzp?hs=197&hs=187&authuser=0&ijlm=1777711339876&adhoc=1',
    collaborationName: '',
    notes:             'Testing collaboration for Production of Sound topic.',
  },

  // ── COL03 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL03',
    description:       'Create Collaboration – Science / Sound / Reflection of Sound (different URL)',
    date:              TODAY,
    time:              slotTime(2),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Sound',
    topic:             'Reflection of Sound',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/landing?hs=197&authuser=0',
    collaborationName: '',
    notes:             'Testing collaboration with alternate meeting URL.',
  },

  // ── COL04 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL04',
    description:       'Create Collaboration – Science / Motion / Distance and Displacement',
    date:              TODAY,
    time:              slotTime(3),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Motion',
    topic:             'Uniform Circular Motion',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/abc-wxyz-def',
    collaborationName: '',
    notes:             'Dummy description for Motion chapter collaboration.',
  },

  // ── COL05 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL05',
    description:       'Create Collaboration – Science / Gravitation / Universal Law of Gravitation',
    date:              TODAY,
    time:              slotTime(4),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Gravitation',
    topic:             'Free Fall',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/pqr-stuv-wxy',
    collaborationName: '',
    notes:             'Dummy description for Gravitation chapter collaboration.',
  },

  // ── COL06 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL06',
    description:       'Create Collaboration – Science / The Fundamental Unit of Life / Cell',
    date:              TODAY,
    time:              slotTime(5),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'The Fundamental Unit of Life',
    topic:             'Cell',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/lmn-opqr-stu',
    collaborationName: '',
    notes:             'Dummy description for Cell topic collaboration.',
  },

  // ── COL07 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL07',
    description:       'Create Collaboration – Science / Tissues / Plant Tissues',
    date:              TODAY,
    time:              slotTime(6),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Tissues',
    topic:             'Plant Tissues',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/vwx-yzab-cde',
    collaborationName: '',
    notes:             'Dummy description for Plant Tissues topic collaboration.',
  },

  // ── COL08 ──────────────────────────────────────────────────────────────────
  {
    id:                'COL08',
    description:       'Create Collaboration – Science / Work and Energy / Work Done',
    date:              TODAY,
    time:              slotTime(7),
    institution:       'Mafatlal Academy',
    grade:             'IX',
    section:           'A',
    subject:           'Science',
    chapter:           'Work and Energy',
    topic:             'Work',
    userSelection:     'All',
    collaborationUrl:  'https://meet.google.com/fgh-ijkl-mno',
    collaborationName: '',
    notes:             'Dummy description for Work Done topic collaboration.',
  },

];

const _countCol = parseInt(process.env.DATA_COUNT, 10);
const activeCollaborationData = (!isNaN(_countCol) && _countCol > 0)
  ? collaborationData.slice(0, _countCol)
  : collaborationData;

module.exports = { collaborationData, activeCollaborationData };
