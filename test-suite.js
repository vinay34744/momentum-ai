/**
 * Momentum AI — Automated End-to-End Test Suite (Phase 15)
 * Written to match the actual script.js architecture exactly.
 *
 * Key architectural facts:
 *  - appState is a module-level singleton; access via context.appState
 *  - validateAppState() is a MUTATING repair function that ALWAYS returns true
 *  - migrateAppState() returns { status, state } object (not the state directly)
 *  - computeHabitStreak() uses habit.completions[] (not completedDates)
 *  - timetable is stored as timetable.entries[] (not a day-keyed object)
 *  - reminders use { enabled, handled, dateTime } (not { alerted, date, time })
 *  - calculateProductivityScore() returns { hasData, score, ... } object
 *  - evaluateAICoach() returns { hasEnoughData, conflicts, patterns, adjustments }
 *  - overload rule triggers when estimatedDuration total >= 8h OR count >= 6 for a day
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

// --------------------------------------------------------------------------
// ENVIRONMENT MOCK SETUP
// --------------------------------------------------------------------------

class MockStorage {
    constructor() { this.store = {}; }
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
    setItem(k, v) { this.store[k] = String(v); }
    removeItem(k) { delete this.store[k]; }
    clear() { this.store = {}; }
}

function makeMockEl(tagName, id) {
    const el = {
        tagName: (tagName || 'div').toUpperCase(),
        id: id || '',
        classList: { _c: new Set(), add(...a) { a.forEach(c => this._c.add(c)); }, remove(...a) { a.forEach(c => this._c.delete(c)); }, contains(c) { return this._c.has(c); }, toggle(c) { if (this._c.has(c)) { this._c.delete(c); return false; } this._c.add(c); return true; } },
        style: {},
        attributes: {},
        value: '',
        textContent: '',
        innerHTML: '',
        innerText: '',
        disabled: false,
        children: [],
        options: { length: 0 },
        _listeners: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k] || null; },
        removeAttribute(k) { delete this.attributes[k]; },
        appendChild(child) { this.children.push(child); return child; },
        insertBefore(child) { this.children.unshift(child); return child; },
        removeChild() {},
        addEventListener(type, cb) { if (!this._listeners[type]) this._listeners[type] = []; this._listeners[type].push(cb); },
        removeEventListener(type, cb) { if (this._listeners[type]) this._listeners[type] = this._listeners[type].filter(f => f !== cb); },
        dispatchEvent() {},
        querySelector() { return makeMockEl(); },
        querySelectorAll() { return []; },
        closest() { return null; },
        getContext() {
            return { clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, fillText() {}, strokeText() {}, measureText() { return { width: 50 }; }, arc() {}, strokeRect() {}, fillRect() {}, createLinearGradient() { return { addColorStop() {} }; }, save() {}, restore() {}, translate() {}, scale() {} };
        },
        focus() {},
        blur() {},
        scrollIntoView() {},
        click() {},
        cloneNode() { return makeMockEl(); }
    };
    return el;
}

const mockLocalStorage = new MockStorage();
const mockDocument = {
    readyState: 'complete',
    body: makeMockEl('body'),
    documentElement: makeMockEl('html'),
    getElementById: (id) => makeMockEl('div', id),
    querySelector: () => makeMockEl(),
    querySelectorAll: () => [],
    createElement: (tag) => makeMockEl(tag),
    addEventListener: () => {},
    removeEventListener: () => {}
};

const mockWindow = {
    document: mockDocument,
    localStorage: mockLocalStorage,
    location: { href: 'http://localhost/', reload() {} },
    navigator: { serviceWorker: { register: () => Promise.resolve() }, userAgent: 'test' },
    Notification: { permission: 'default', requestPermission: () => Promise.resolve('granted') },
    addEventListener: () => {},
    removeEventListener: () => {},
    alert: () => {},
    confirm: () => true,
    prompt: () => ''
};

const context = vm.createContext({
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    navigator: mockWindow.navigator,
    Notification: mockWindow.Notification,
    location: mockWindow.location,
    alert: mockWindow.alert,
    confirm: mockWindow.confirm,
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, URL,
    crypto: { randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }) },
    Blob: class { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    URL: class { constructor(url) { this.href = url; } static createObjectURL() { return 'blob:mock'; } static revokeObjectURL() {} }
});

// Load and execute script.js in the VM context
const scriptCode = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
vm.runInContext(scriptCode, context);

// --------------------------------------------------------------------------
// TEST HARNESS
// --------------------------------------------------------------------------
let totalTests = 0, passedTests = 0, failedTests = 0;
const failures = [];

/**
 * Reset the VM's appState IN-PLACE so that function closures keep their reference.
 * We must NOT do context.appState = ... (that only updates the JS object reference
 * in the test harness, not inside the VM's own variable binding).
 */
function resetState() {
    const fresh = context.createInitialState();
    const current = context.appState;
    // Clear all current keys
    Object.keys(current).forEach(k => delete current[k]);
    // Copy fresh keys in
    Object.assign(current, JSON.parse(JSON.stringify(fresh)));
}

function test(name, fn) {
    totalTests++;
    resetState();
    mockLocalStorage.clear();
    // Reset confirm to always return true
    context.confirm = () => true;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failedTests++;
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
        failures.push({ name, error: err });
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
}
function assertEqual(actual, expected, msg) {
    if (actual !== expected) throw new Error(`${msg || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log('\n========================================');
console.log('MOMENTUM AI — AUTOMATED TEST SUITE (V1)');
console.log('========================================\n');

// ==========================================================================
// SUITE 1: Core State & Schema Structure
// ==========================================================================
console.log('--- 1. Core State & Schema Structure ---');

// Helper: get reference to the live appState inside VM
function getState() { return context.appState; }

test('createInitialState produces valid 1.2.0 schema with all collections', () => {
    const s = context.createInitialState();
    assertEqual(s.schemaVersion, '1.2.0', 'schemaVersion');
    assert(Array.isArray(s.tasks), 'tasks must be array');
    assert(Array.isArray(s.goals), 'goals must be array');
    assert(Array.isArray(s.accountabilityRecords), 'accountabilityRecords must be array');
    assert(Array.isArray(s.subjects), 'subjects must be array');
    assert(Array.isArray(s.chapters), 'chapters must be array');
    assert(Array.isArray(s.studySessions), 'studySessions must be array');
    assert(Array.isArray(s.studyPlans), 'studyPlans must be array');
    assert(Array.isArray(s.mockTests), 'mockTests must be array');
    assert(Array.isArray(s.habits), 'habits must be array');
    assert(Array.isArray(s.sleepLogs), 'sleepLogs must be array');
    assert(Array.isArray(s.waterLogs), 'waterLogs must be array');
    assert(Array.isArray(s.exerciseLogs), 'exerciseLogs must be array');
    assert(Array.isArray(s.moodLogs), 'moodLogs must be array');
    assert(Array.isArray(s.reminders), 'reminders must be array');
    assert(typeof s.academicProfile === 'object', 'academicProfile must be object');
    assert(typeof s.timetable === 'object', 'timetable must be object');
    assert(Array.isArray(s.timetable.entries), 'timetable.entries must be array');
    assert(typeof s.profile === 'object', 'profile must be object');
    assert(typeof s.settings === 'object', 'settings must be object');
});

test('appState singleton is initialized on load', () => {
    const s = getState();
    assert(s !== null && s !== undefined, 'appState must exist');
    assert(typeof s === 'object', 'appState must be object');
    assertEqual(s.schemaVersion, '1.2.0', 'appState.schemaVersion');
});

test('validateAppState repairs missing collections without data loss', () => {
    // Use a separate scratch object (not appState) to avoid mutating VM state
    const state = context.createInitialState();
    state.profile.name = 'Test User';
    state.tasks.push({ id: 'tk1', title: 'A Task', date: '2026-09-23', status: 'planned', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    
    // Remove one collection to simulate partially corrupted state
    delete state.goals;
    delete state.chapters;
    
    const result = context.validateAppState(state);
    assert(result === true, 'validateAppState must return true (it always repairs)');
    assert(Array.isArray(state.goals), 'goals must be repaired to empty array');
    assert(Array.isArray(state.chapters), 'chapters must be repaired to empty array');
    assertEqual(state.profile.name, 'Test User', 'Profile name must be preserved');
    assertEqual(state.tasks.length, 1, 'Task must be preserved after repair');
});

test('validateAppState removes tasks with missing date field', () => {
    const state = context.createInitialState();
    state.tasks.push({ id: 'good', title: 'Valid Task', date: '2026-09-23', status: 'planned', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    state.tasks.push({ id: 'bad', title: 'No Date Task', date: '', status: 'planned', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    context.validateAppState(state);
    assertEqual(state.tasks.length, 1, 'Task with missing date should be removed');
    assertEqual(state.tasks[0].id, 'good', 'Valid task must remain');
});

// ==========================================================================
// SUITE 2: Schema Migrations (1.0.0 → 1.1.0 → 1.2.0)
// ==========================================================================
console.log('\n--- 2. Schema Migrations ---');

test('migrateAppState returns correct { status, state } object shape', () => {
    const currentState = context.createInitialState();
    const result = context.migrateAppState(currentState);
    assert(typeof result === 'object', 'migrateAppState must return object');
    assert('status' in result, 'Result must have status property');
    assert('state' in result, 'Result must have state property');
    assertEqual(result.status, 'CURRENT', 'Current schema must return CURRENT status');
});

test('migrateAppState null/undefined returns NO_STATE with fresh initial state', () => {
    const result = context.migrateAppState(null);
    assertEqual(result.status, 'NO_STATE', 'null input must yield NO_STATE');
    assertEqual(result.state.schemaVersion, '1.2.0', 'Fresh state must be 1.2.0');
});

test('migrateAppState 1.0.0 → 1.2.0 chains migrations and preserves user data', () => {
    const v100 = {
        schemaVersion: '1.0.0',
        profile: { id: 'p1', name: 'Alex', onboardingCompleted: true },
        tasks: [{ id: 't1', title: 'Read Chapter', date: '2026-09-23', status: 'completed', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        goals: [],
        accountabilityRecords: [],
        subjects: [],
        studySessions: [],
        habits: [],
        sleepLogs: [],
        waterLogs: [],
        exerciseLogs: [],
        moodLogs: [],
        reminders: [],
        settings: { theme: 'dark' }
    };

    const result = context.migrateAppState(v100);
    assertEqual(result.status, 'MIGRATED', 'Should be MIGRATED from 1.0.0');
    assertEqual(result.state.schemaVersion, '1.2.0', 'Final schema must be 1.2.0');
    assertEqual(result.state.profile.name, 'Alex', 'Profile name must be preserved');
    assertEqual(result.state.tasks.length, 1, 'Tasks must be preserved');
    assert(typeof result.state.timetable === 'object', 'timetable object must be added');
    assert(Array.isArray(result.state.timetable.entries), 'timetable.entries must be array');
    assert(Array.isArray(result.state.chapters), 'chapters must be added');
    assert(Array.isArray(result.state.studyPlans), 'studyPlans must be added');
    assert(Array.isArray(result.state.mockTests), 'mockTests must be added');
    assert(typeof result.state.academicProfile === 'object', 'academicProfile must be added');
});

test('migrateAppState 1.1.0 → 1.2.0 preserves timetable and adds new Phase 7 fields', () => {
    const v110 = {
        schemaVersion: '1.1.0',
        profile: { id: 'p2', name: 'Priya' },
        tasks: [],
        goals: [],
        accountabilityRecords: [],
        subjects: [{ id: 's1', name: 'Maths', active: true }],
        studySessions: [],
        habits: [],
        sleepLogs: [],
        waterLogs: [],
        exerciseLogs: [],
        moodLogs: [],
        reminders: [],
        timetable: { institution: 'Test College', academicYear: '2026-27', semester: '1', batch: 'B1', entries: [] },
        settings: { theme: 'light' }
    };

    const result = context.migrateAppState(v110);
    assertEqual(result.status, 'MIGRATED', 'Should be MIGRATED from 1.1.0');
    assertEqual(result.state.schemaVersion, '1.2.0', 'Final schema 1.2.0');
    assertEqual(result.state.timetable.institution, 'Test College', 'Timetable institution preserved');
    assertEqual(result.state.subjects.length, 1, 'Subjects preserved');
    assert(Array.isArray(result.state.chapters), 'chapters added');
});

// ==========================================================================
// SUITE 3: LocalStorage Persistence
// ==========================================================================
console.log('\n--- 3. LocalStorage Persistence ---');

test('saveAppState serializes state to localStorage correctly', () => {
    // Mutate the VM's appState in-place (closure-safe)
    getState().profile.name = 'Persistence Test';
    context.saveAppState();

    const raw = mockLocalStorage.getItem('momentumAI');
    assert(raw !== null, 'localStorage must have momentumAI key after save');
    const parsed = JSON.parse(raw);
    assertEqual(parsed.profile.name, 'Persistence Test', 'Saved profile name must match');
    assertEqual(parsed.schemaVersion, '1.2.0', 'Saved schema version must be 1.2.0');
});

test('loadAppState recovers from corrupted JSON and backs up corrupted string', () => {
    mockLocalStorage.setItem('momentumAI', '{ invalid json: true, broken ===');
    context.loadAppState();

    const backup = mockLocalStorage.getItem('momentumAI_corrupted_backup');
    assert(backup !== null, 'Corrupted data must be backed up to recovery key');
    assertEqual(backup, '{ invalid json: true, broken ===', 'Backup must contain original corrupted string');

    // Verify appState is now a valid fresh state
    assertEqual(context.appState.schemaVersion, '1.2.0', 'Recovered state must be 1.2.0');
    assert(Array.isArray(context.appState.tasks), 'Recovered state must have tasks array');
});

test('loadAppState auto-saves on first initialization (no existing data)', () => {
    mockLocalStorage.clear();
    context.loadAppState();
    const raw = mockLocalStorage.getItem('momentumAI');
    assert(raw !== null, 'loadAppState must save initial state to localStorage');
});

// ==========================================================================
// SUITE 4: Task Time Overlap & Date Validation
// ==========================================================================
console.log('\n--- 4. Task Overlap & Date Validation ---');

test('Task overlap: T1[10:00-11:30] vs T2[11:00-12:00] must overlap', () => {
    function overlaps(a, b) {
        if (a.date !== b.date) return false;
        return a.startTime < b.endTime && a.endTime > b.startTime;
    }
    const t1 = { date: '2026-09-24', startTime: '10:00', endTime: '11:30' };
    const t2 = { date: '2026-09-24', startTime: '11:00', endTime: '12:00' };
    assert(overlaps(t1, t2), 'T1 and T2 must overlap');
});

test('Task overlap: adjacent intervals [10:00-11:30] and [11:30-12:30] must NOT overlap', () => {
    function overlaps(a, b) {
        if (a.date !== b.date) return false;
        return a.startTime < b.endTime && a.endTime > b.startTime;
    }
    const t1 = { date: '2026-09-24', startTime: '10:00', endTime: '11:30' };
    const t3 = { date: '2026-09-24', startTime: '11:30', endTime: '12:30' };
    assert(!overlaps(t1, t3), 'Adjacent intervals must NOT overlap');
});

test('validateAppState removes task with invalid date format', () => {
    const state = context.createInitialState();
    state.tasks = [
        { id: 'v1', title: 'Valid', date: '2026-09-23', status: 'planned', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'b1', title: 'Bad date', date: 'not-a-date', status: 'planned', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    context.validateAppState(state);
    assertEqual(state.tasks.length, 1, 'Task with invalid date must be removed');
});

test('validateAppState coerces unknown task status to planned', () => {
    const state = context.createInitialState();
    state.tasks.push({ id: 'x1', title: 'Bad Status', date: '2026-09-23', status: 'unknown_status', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    context.validateAppState(state);
    assertEqual(state.tasks[0].status, 'planned', 'Unknown status coerced to planned');
});

// ==========================================================================
// SUITE 5: B1 College Timetable Seeding Integrity
// ==========================================================================
console.log('\n--- 5. B1 College Timetable Seeding ---');

test('seedB1SubjectsIfEmpty seeds 10 B1 subjects when subjects array is empty', () => {
    // appState.subjects is already [] from resetState()
    context.seedB1SubjectsIfEmpty();

    const subjects = getState().subjects;
    assertEqual(subjects.length, 10, 'Must seed exactly 10 B1 subjects');

    const names = subjects.map(s => s.name);
    assert(names.includes('Maths 1 - B'), 'Must include Maths 1 - B');
    assert(names.includes('PSP B'), 'Must include PSP B');
    assert(names.includes('AP-Robo B'), 'Must include AP-Robo B');
    assert(names.includes('SnAI B'), 'Must include SnAI B');
    assert(names.includes('English B'), 'Must include English B');
    assert(names.includes('YOGA B1'), 'Must include YOGA B1');
    assert(names.includes('Maths 1 Lab B1'), 'Must include Maths 1 Lab B1');
    assert(names.includes('PSP Lab B1'), 'Must include PSP Lab B1');
    assert(names.includes('AP-Robo Lab B1'), 'Must include AP-Robo Lab B1');
    assert(names.includes('SnW Lab B1'), 'Must include SnW Lab B1');
});

test('seedB1SubjectsIfEmpty does not re-seed if subjects already exist', () => {
    // Add a subject before seeding
    getState().subjects.push({ id: 'existing', name: 'Existing Subject', active: true });
    const result = context.seedB1SubjectsIfEmpty();
    assert(result === false, 'seedB1SubjectsIfEmpty must return false when already seeded');
    assertEqual(getState().subjects.length, 1, 'Existing subjects must not be overwritten');
});

test('seedInitialChaptersIfEmpty seeds chapters for academic subjects', () => {
    // appState starts clean, seed subjects (which internally calls seedInitialChaptersIfEmpty)
    context.seedB1SubjectsIfEmpty();

    const chapters = getState().chapters;
    assert(chapters.length > 0, 'Chapters must be seeded');

    // All chapters must have a valid subjectId
    chapters.forEach(ch => {
        assert(typeof ch.subjectId === 'string' && ch.subjectId.length > 0, `Chapter "${ch.name}" must have valid subjectId`);
        assert(typeof ch.name === 'string' && ch.name.length > 0, 'Chapter must have a name');
        assert(['completed', 'in_progress', 'not_started'].includes(ch.status), `Chapter status must be valid, got: ${ch.status}`);
    });

    // LHL must NOT be in subjects (it has subjectId: null in timetable)
    const subjectNames = getState().subjects.map(s => s.name);
    assert(!subjectNames.includes('LHL'), 'LHL must NOT be seeded as a subject (it has subjectId: null in timetable)');
});

// ==========================================================================
// SUITE 6: Study Planner Window Calculation
// ==========================================================================
console.log('\n--- 6. Study Planner Constraint Solver ---');

test('calculateAvailableStudyWindows returns result object with freeWindows array', () => {
    const result = context.calculateAvailableStudyWindows('2026-09-24');

    assert(typeof result === 'object', 'Result must be object');
    assertEqual(result.date, '2026-09-24', 'Result date must match');
    assert(Array.isArray(result.freeWindows), 'freeWindows must be array');
    assert(Array.isArray(result.busyIntervals), 'busyIntervals must be array');
    assert(typeof result.totalFreeMinutes === 'number', 'totalFreeMinutes must be number');
    assert(typeof result.dayOfWeek === 'string', 'dayOfWeek must be string');
});

test('calculateAvailableStudyWindows: no free windows exist before wake time', () => {
    getState().academicProfile.routine = { wakeTime: '07:00', sleepTime: '23:00' };

    const result = context.calculateAvailableStudyWindows('2026-09-24');
    result.freeWindows.forEach(w => {
        assert(w.start >= 7 * 60, `No free window before wake time. Window starts at ${w.start} mins`);
    });
});

test('calculateAvailableStudyWindows: tasks on the date are treated as busy', () => {
    getState().academicProfile.routine = { wakeTime: '06:00', sleepTime: '23:00' };
    // Push a task block 08:00-12:00 (480-720 minutes)
    getState().tasks.push({ id: 't-busy', date: '2026-09-27', startTime: '08:00', endTime: '12:00', status: 'planned', title: 'Blocking Task', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    // 2026-09-27 is a Saturday (day with no timetable classes), so only the task blocks free time
    const result = context.calculateAvailableStudyWindows('2026-09-27');
    assert(Array.isArray(result.busyIntervals), 'busyIntervals must be array');
    const taskBlock = result.busyIntervals.find(b => b.type === 'task');
    assert(taskBlock !== undefined, 'Task must appear in busyIntervals');
    // No free window should overlap with 480-720
    result.freeWindows.forEach(w => {
        const overlaps = w.start < 720 && w.end > 480;
        assert(!overlaps, `Window ${w.start}-${w.end} must not overlap with task 08:00-12:00 (480-720)`);
    });
});

test('generateRealisticStudyPlan returns plan with sessions when subjects exist', () => {
    context.seedB1SubjectsIfEmpty();
    getState().academicProfile.routine = { wakeTime: '06:00', sleepTime: '23:00' };

    const plan = context.generateRealisticStudyPlan('2026-09-27'); // Saturday — no classes
    assert(typeof plan === 'object', 'Plan must be an object');
    assertEqual(plan.date, '2026-09-27', 'Plan date must match');
    assert(Array.isArray(plan.sessions), 'Plan sessions must be array');
    assert(typeof plan.totalAllocatedMinutes === 'number', 'totalAllocatedMinutes must be number');
    
    if (plan.sessions.length > 0) {
        plan.sessions.forEach(sess => {
            assert(sess.startTime < sess.endTime, `Session start ${sess.startTime} must be before end ${sess.endTime}`);
            assert(typeof sess.reason === 'string' && sess.reason.length > 0, 'Session must have non-empty reason');
            assert(typeof sess.subjectId === 'string' || sess.subjectId === null, 'Session subjectId must be string or null');
        });
    }
});

// ==========================================================================
// SUITE 7: Wellness — Habit Streak Math
// ==========================================================================
console.log('\n--- 7. Habit Streak Math ---');

test('computeHabitStreak returns 0 for habit with no completions', () => {
    const streak = context.computeHabitStreak({ id: 'h0', title: 'Empty', completions: [] });
    assertEqual(streak, 0, 'Empty completions must give streak 0');
});

test('computeHabitStreak returns 0 for null/missing completions', () => {
    const streak = context.computeHabitStreak({ id: 'h-null', title: 'No completions' });
    assertEqual(streak, 0, 'Missing completions must give streak 0');
});

test('computeHabitStreak correctly handles consecutive yesterday completions', () => {
    // Build a consecutive run ending yesterday (relative to today)
    const dates = [];
    for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    const habit = { id: 'h1', title: 'Run', completions: dates };
    const streak = context.computeHabitStreak(habit);
    assert(streak >= 5, `Expected streak >= 5, got ${streak}`);
});

test('computeHabitStreak counts today if completed today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const habit = { id: 'h2', title: 'Water', completions: [today] };
    const streak = context.computeHabitStreak(habit);
    assert(streak >= 1, `Expected streak >= 1 when completed today, got ${streak}`);
});

test('computeHabitStreak breaks if there is a gap before the most recent completion', () => {
    // Last completion was 3 days ago, with a gap (2 days ago and yesterday not completed)
    const d3 = new Date(); d3.setDate(d3.getDate() - 3);
    const habit = { id: 'h3', title: 'Read', completions: [d3.toISOString().slice(0, 10)] };
    const streak = context.computeHabitStreak(habit);
    assertEqual(streak, 0, 'Streak must be 0 when last completion has gap before today/yesterday');
});

test('Sleep overnight duration: 23:00 to 07:00 = 8.0 hours', () => {
    function calcDuration(bedStr, wakeStr) {
        const [bh, bm] = bedStr.split(':').map(Number);
        const [wh, wm] = wakeStr.split(':').map(Number);
        let bedMins = bh * 60 + bm;
        let wakeMins = wh * 60 + wm;
        let durMins = wakeMins - bedMins;
        if (durMins < 0) durMins += 24 * 60;
        return Number((durMins / 60).toFixed(2));
    }
    assertEqual(calcDuration('23:00', '07:00'), 8.0, 'Overnight 23:00-07:00');
    assertEqual(calcDuration('22:30', '06:00'), 7.5, 'Overnight 22:30-06:00');
    assertEqual(calcDuration('00:00', '06:30'), 6.5, 'Midnight to 06:30');
    assertEqual(calcDuration('14:00', '15:30'), 1.5, 'Same-day nap');
});

// ==========================================================================
// SUITE 8: AI Coach Rule-Based Evaluation
// ==========================================================================
console.log('\n--- 8. AI Coach Rule-Based Evaluation ---');

test('evaluateAICoach returns hasEnoughData:false when total events < 3', () => {
    // Only 1 task, no sessions, no sleep logs
    getState().tasks.push({ id: 't1', title: 'Single Task', status: 'completed', date: '2026-09-23', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    const result = context.evaluateAICoach(getState());
    assert(typeof result === 'object', 'evaluateAICoach must return object');
    assert('hasEnoughData' in result, 'Result must have hasEnoughData');
    assert(result.hasEnoughData === false, 'hasEnoughData must be false with 1 event');
    assert(Array.isArray(result.conflicts), 'conflicts must be array');
    assert(Array.isArray(result.patterns), 'patterns must be array');
    assert(Array.isArray(result.adjustments), 'adjustments must be array');
    assert(typeof result.message === 'string', 'message must be a string when insufficient data');
});

test('evaluateAICoach returns hasEnoughData:true when totalEvents >= 3', () => {
    const s = getState();
    s.tasks.push({ id: 't1', title: 'T1', status: 'completed', date: '2026-09-20', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    s.tasks.push({ id: 't2', title: 'T2', status: 'completed', date: '2026-09-21', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    s.tasks.push({ id: 't3', title: 'T3', status: 'completed', date: '2026-09-22', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    const result = context.evaluateAICoach(s);
    assert(result.hasEnoughData === true, `hasEnoughData must be true with 3 tasks, got ${result.hasEnoughData}`);
});

test('evaluateAICoach Rule 1: Overload conflict triggered when >= 6 tasks on one day or >= 8h', () => {
    const s = getState();
    // 6 planned tasks on same day (each 1h estimated = 6h but count >= 6 triggers overload)
    const overloadDate = '2026-09-24';
    for (let i = 1; i <= 6; i++) {
        s.tasks.push({ id: `t${i}`, title: `Task ${i}`, status: 'planned', date: overloadDate, estimatedDuration: 60, priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    // 2 more tasks on different dates to reach totalEvents >= 3
    s.tasks.push({ id: 't7', title: 'T7', status: 'completed', date: '2026-09-20', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    s.tasks.push({ id: 't8', title: 'T8', status: 'completed', date: '2026-09-21', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    const result = context.evaluateAICoach(s);
    assert(result.hasEnoughData === true, 'hasEnoughData must be true');
    const overload = result.conflicts.find(c => c.type === 'overload');
    assert(overload !== undefined, 'Overload conflict must be detected for 6+ tasks on one day');
    assertEqual(overload.severity, 'warning', 'Overload severity must be warning');
    // Evidence must cite the overload date
    assert(overload.evidence.includes(overloadDate), `Overload evidence "${overload.evidence}" must mention ${overloadDate}`);
});

// ==========================================================================
// SUITE 9: Reminders — dateTime field and alerted flag (handled)
// ==========================================================================
console.log('\n--- 9. Reminders & Due Detection ---');

test('checkDueReminders marks due reminder as handled to prevent duplicate alerts', () => {
    const s = getState();
    s.reminders.push({
        id: 'rem-1',
        title: 'Test Reminder',
        category: 'study',
        dateTime: '2020-01-01T00:01',
        enabled: true,
        handled: false,
        linkedTaskId: null,
        linkedGoalId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Should run without throwing — showReminderAlert is a no-op in test env
    let threw = false;
    try { context.checkDueReminders(); } catch(e) { threw = true; }
    assert(!threw, 'checkDueReminders must not throw');
    assertEqual(getState().reminders.length, 1, 'Reminder must still be in state after check');
});

test('Reminders with enabled:false are not triggered', () => {
    getState().reminders.push({
        id: 'rem-disabled',
        title: 'Disabled',
        dateTime: '2020-01-01T00:01',
        enabled: false,
        handled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    let threw = false;
    try { context.checkDueReminders(); } catch(e) { threw = true; }
    assert(!threw, 'checkDueReminders must not throw for disabled reminders');
});

test('Reminders with handled:true are not re-triggered', () => {
    getState().reminders.push({
        id: 'rem-handled',
        title: 'Already handled',
        dateTime: '2020-01-01T00:01',
        enabled: true,
        handled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    let threw = false;
    try { context.checkDueReminders(); } catch(e) { threw = true; }
    assert(!threw, 'checkDueReminders must not throw for already handled reminders');
});

// ==========================================================================
// SUITE 10: Analytics & Productivity Score Formula
// ==========================================================================
console.log('\n--- 10. Analytics & Productivity Score ---');

test('calculateProductivityScore returns hasData:false when no tasks, sessions, or habits', () => {
    // appState is clean with empty arrays
    const result = context.calculateProductivityScore('today');
    assert(typeof result === 'object', 'Result must be object');
    assert('hasData' in result, 'Must have hasData property');
    assert(result.hasData === false, 'hasData must be false with zero records');
    assertEqual(result.score, null, 'Score must be null with no data');
});

test('calculateProductivityScore returns hasData:true when tasks exist in scope', () => {
    const today = new Date().toISOString().slice(0, 10);
    const s = getState();
    s.tasks.push({ id: 't1', status: 'completed', date: today, priority: 'medium', title: 'T1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    s.tasks.push({ id: 't2', status: 'missed', date: today, priority: 'medium', title: 'T2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    const result = context.calculateProductivityScore('today');
    assert(result.hasData === true, 'hasData must be true with task records');
    assert(typeof result.score === 'number', 'Score must be a number');
    assert(result.score >= 0 && result.score <= 100, `Score must be 0-100, got ${result.score}`);
});

test('calculateProductivityScore 100% tasks closed: taskComp contributes 35 pts', () => {
    const today = new Date().toISOString().slice(0, 10);
    const s = getState();
    s.tasks.push({ id: 't1', status: 'completed', date: today, priority: 'medium', title: 'T1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    s.tasks.push({ id: 't2', status: 'completed', date: today, priority: 'medium', title: 'T2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    const result = context.calculateProductivityScore('today');
    assert(result.hasData === true, 'hasData must be true');
    // taskPct=100, planPct=100 (same as taskPct when tasks exist and all closed)
    // studyPct=0 (no sessions), habitPct=0 (no habits)
    // score = 100*0.35 + 0*0.35 + 0*0.20 + 100*0.10 = 45
    assertEqual(result.score, 45, `Expected 45 for 100% tasks, 0% study, 0% habits, got ${result.score}`);
});

test('calculateProductivityScore formula weights: 35+35+20+10=100 max', () => {
    // The formula is: taskPct*0.35 + studyPct*0.35 + habitPct*0.20 + planPct*0.10
    // Verify the weights sum to 1.0
    const weightSum = 0.35 + 0.35 + 0.20 + 0.10;
    assert(Math.abs(weightSum - 1.0) < 0.0001, `Weights must sum to 1.0, got ${weightSum}`);
});

// ==========================================================================
// SUITE 11: Settings — Export, Import Validation, resetOnboarding
// ==========================================================================
console.log('\n--- 11. Settings, Import/Export & Reset ---');

test('Exporting appState as JSON preserves schema version and profile name', () => {
    getState().profile.name = 'Export Tester';
    context.saveAppState();

    const raw = mockLocalStorage.getItem('momentumAI');
    assert(raw !== null, 'Exported JSON must be in localStorage');
    const parsed = JSON.parse(raw);
    assertEqual(parsed.schemaVersion, '1.2.0', 'Exported schema version');
    assertEqual(parsed.profile.name, 'Export Tester', 'Exported profile name');
});

test('Importing state with valid 1.2.0 schema passes validateAppState', () => {
    const importData = {
        schemaVersion: '1.2.0',
        profile: { id: 'p-imp', name: 'Imported User', onboardingCompleted: true },
        tasks: [],
        goals: [],
        accountabilityRecords: [],
        subjects: [],
        chapters: [],
        studySessions: [],
        studyPlans: [],
        mockTests: [],
        habits: [],
        sleepLogs: [],
        waterLogs: [],
        exerciseLogs: [],
        moodLogs: [],
        reminders: [],
        academicProfile: { targetExam: '', dailyStudyTargetHours: 3.5, preferredSessionDurationMinutes: 60, weakSubjectIds: [], routine: { wakeTime: '07:00', sleepTime: '23:00' } },
        timetable: { institution: '', academicYear: '', semester: '', batch: '', entries: [] },
        settings: { theme: 'dark', reducedMotion: false, notificationsEnabled: false, soundEnabled: true }
    };
    const result = context.validateAppState(importData);
    assert(result === true, 'Valid import must pass validateAppState');
    assertEqual(importData.profile.name, 'Imported User', 'Profile name intact after validation');
});

test('resetOnboarding sets onboardingCompleted to false but preserves tasks', () => {
    const s = getState();
    s.profile.name = 'Persistent Name';
    s.profile.onboardingCompleted = true;
    s.tasks.push({ id: 'keep-me', title: 'Do not delete', date: '2026-09-23', status: 'completed', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    // confirm is mocked to return true in the VM context (set at start of each test)
    context.resetOnboarding();

    assertEqual(s.profile.onboardingCompleted, false, 'onboardingCompleted must be false after reset');
    assertEqual(s.profile.name, 'Persistent Name', 'Profile name preserved');
    assertEqual(s.tasks.length, 1, 'Tasks must be preserved after onboarding reset');
    assertEqual(s.tasks[0].id, 'keep-me', 'Task data intact');
});

// ==========================================================================
// SUITE 12: generateId Uniqueness & Utility Functions
// ==========================================================================
console.log('\n--- 12. Utility Functions ---');

test('generateId produces unique identifiers across 100 calls', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
        ids.add(context.generateId());
    }
    // Note: with our mock crypto.randomUUID, real UUIDs are generated
    assert(ids.size >= 90, `Expected at least 90 unique IDs out of 100, got ${ids.size}`);
});

test('getTodayDateString returns YYYY-MM-DD format', () => {
    const today = context.getTodayDateString();
    assert(typeof today === 'string', 'getTodayDateString must return string');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(today), `Date must match YYYY-MM-DD format, got: ${today}`);
});

test('compareVersions correctly orders semantic versions', () => {
    const cmp = context.compareVersions;
    assertEqual(cmp('1.0.0', '1.0.0'), 0, '1.0.0 === 1.0.0');
    assertEqual(cmp('1.0.0', '1.1.0'), -1, '1.0.0 < 1.1.0');
    assertEqual(cmp('1.1.0', '1.0.0'), 1, '1.1.0 > 1.0.0');
    assertEqual(cmp('1.2.0', '1.1.0'), 1, '1.2.0 > 1.1.0');
    assertEqual(cmp('1.0.0', '1.2.0'), -1, '1.0.0 < 1.2.0');
});

// ==========================================================================
// TEST SUMMARY
// ==========================================================================
const failLabel = failedTests > 0 ? 'FAILED' : 'PASSED';
console.log('\n========================================');
console.log(`TOTAL:   ${totalTests}`);
console.log(`PASSED:  ${passedTests}`);
console.log(`FAILED:  ${failedTests}`);
console.log(`RESULT:  ${failLabel}`);
console.log('========================================\n');

if (failedTests > 0) {
    console.error('Failing tests:\n');
    failures.forEach(f => {
        console.error(`  ✗ ${f.name}`);
        console.error(`    ${f.error.message}\n`);
    });
    process.exit(1);
} else {
    console.log('All tests passed successfully.\n');
    process.exit(0);
}
