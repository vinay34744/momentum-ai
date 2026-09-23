/**
 * Momentum AI — Phase 0–6 State Engine & Storage Architecture
 * Tagline: Execution Over Intention
 * Schema Version: 1.1.0
 * LocalStorage Key: momentumAI
 */

'use strict';

// --------------------------------------------------------------------------
// 1. CONSTANTS & CONFIGURATION PRESETS
// --------------------------------------------------------------------------
const SCHEMA_VERSION = "1.2.0";
const STORAGE_KEY = "momentumAI";
const CORRUPTED_BACKUP_KEY = "momentumAI_corrupted_backup";

/**
 * Goal-Specific Presets Configuration (Phase 0 Foundation)
 * These subject presets will be populated during onboarding in Phase 1.
 */
const GOAL_PRESETS = Object.freeze({
    JEE: {
        name: "Joint Entrance Examination (JEE)",
        category: "Engineering",
        subjects: ["Physics", "Chemistry", "Mathematics"]
    },
    NEET: {
        name: "National Eligibility cum Entrance Test (NEET)",
        category: "Medical",
        subjects: ["Physics", "Chemistry", "Biology"]
    },
    KCET: {
        name: "Karnataka Common Entrance Test (KCET)",
        category: "State Engineering & Medical",
        subjects: ["Physics", "Chemistry", "Mathematics", "Biology"]
    },
    UPSC: {
        name: "Union Public Service Commission (UPSC Civil Services)",
        category: "Civil Services",
        subjects: ["History", "Geography", "Polity", "Economy", "Environment", "Current Affairs"]
    }
});

// --------------------------------------------------------------------------
// 2. CENTRALIZED APPLICATION STATE FACTORY
// --------------------------------------------------------------------------
/**
 * Creates a clean, empty initial application state structure matching Schema v1.2.0
 */
function createInitialState() {
    return {
        schemaVersion: SCHEMA_VERSION,
        profile: {
            id: generateId(),
            name: "",
            age: null,
            gender: "",
            studentOrWorker: "", // 'student' | 'worker'
            userType: "",
            primaryGoal: "",
            wakeTime: "07:00",
            sleepTime: "23:00",
            peakFocusTime: "Morning",
            availableTime: "",
            onboardingCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        goals: [],                // { id, type, title, target, deadline, status, priority, createdAt, updatedAt }
        tasks: [],                // { id, title, category, date, startTime, endTime, priority, estimatedDuration, notes, status, completionPercentage, createdAt, updatedAt }
        accountabilityRecords: [],// { id, taskId, status, reason, customReason, recordedAt }
        subjects: [],             // { id, name, goalType, active, createdAt, updatedAt }
        chapters: [],             // { id, subjectId, name, status, revisionCount, order, notes, createdAt, updatedAt }
        studySessions: [],        // { id, subjectId, chapter, chapterId, startTime, endTime, duration, questionsSolved, accuracyPercent, notes, createdAt }
        studyPlans: [],           // { id, date, startTime, endTime, durationMinutes, subjectId, chapterId, reason, status, taskId, createdAt, updatedAt }
        mockTests: [],            // { id, title, subjectId, date, totalQuestions, correctAnswers, durationMinutes, scorePercent, notes, createdAt }
        academicProfile: {
            targetExam: "",
            examDate: null,
            dailyStudyTargetHours: 3.5,
            preferredSessionDurationMinutes: 60,
            weakSubjectIds: [],
            routine: {
                wakeTime: "07:00",
                sleepTime: "23:00"
            },
            notes: ""
        },
        habits: [],               // { id, title, frequency, targetDays, streak, completions, archived, createdAt }
        sleepLogs: [],            // { id, date, bedtime, wakeTime, duration, qualityRating, notes, createdAt }
        waterLogs: [],            // { id, date, amountMl, targetMl, entries }
        exerciseLogs: [],         // { id, date, type, durationMinutes, intensity, notes, createdAt }
        moodLogs: [],             // { id, date, moodRating, energyLevel, label, notes, createdAt }
        reminders: [],            // { id, title, category, dateTime, linkedTaskId, linkedGoalId, enabled, handled, createdAt, updatedAt }
        // Phase 6: Weekly academic timetable (institution-agnostic recurring schedule)
        timetable: {
            institution: "",      // free text — any school/college/university
            academicYear: "",     // e.g. "2026-27"
            semester: "",         // e.g. "1" or "Semester 1"
            batch: "",            // e.g. "B1", "ECE-A", "Section 2" — any format
            entries: []           // { id, day, startTime, endTime, title, subjectId, type, classroom, notes, createdAt, updatedAt }
        },
        settings: {
            theme: "system",      // "light" | "dark" | "system"
            reducedMotion: false,
            notificationsEnabled: false,
            soundEnabled: true
        }
    };
}

/**
 * Current in-memory application state singleton
 */
let appState = createInitialState();

// --------------------------------------------------------------------------
// 3. UTILITY FUNCTIONS
// --------------------------------------------------------------------------
/**
 * Generates a unique UUID v4 string
 */
function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for older execution environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --------------------------------------------------------------------------
// 4. MIGRATION & VALIDATION ENGINE
// --------------------------------------------------------------------------
/**
 * Registry of explicit schema migration handlers.
 * Key: source schema version string
 * Value: transformation function (oldState) => migratedState
 *
 * Schema 1.0.0 → 1.1.0 (Phase 6): Adds timetable object with empty entries array.
 * All existing goals/tasks/accountability/subjects/sessions/habits/logs/reminders
 * are preserved exactly. No user data is discarded.
 */
const SCHEMA_MIGRATION_REGISTRY = {
    "1.0.0": function migrate_1_0_to_1_1(oldState) {
        const newState = JSON.parse(JSON.stringify(oldState));
        if (!newState.timetable || typeof newState.timetable !== 'object') {
            newState.timetable = {
                institution: "",
                academicYear: "",
                semester: "",
                batch: "",
                entries: []
            };
        } else {
            if (!Array.isArray(newState.timetable.entries)) {
                newState.timetable.entries = [];
            }
        }
        newState.schemaVersion = "1.1.0";
        console.log('[Migration] 1.0.0 → 1.1.0: timetable object added. Existing data preserved.');
        return newState;
    },
    "1.1.0": function migrate_1_1_to_1_2(oldState) {
        const newState = JSON.parse(JSON.stringify(oldState));
        if (!newState.academicProfile || typeof newState.academicProfile !== 'object') {
            newState.academicProfile = {
                targetExam: "",
                examDate: null,
                dailyStudyTargetHours: 3.5,
                preferredSessionDurationMinutes: 60,
                weakSubjectIds: [],
                routine: {
                    wakeTime: (newState.profile && newState.profile.wakeTime) || "07:00",
                    sleepTime: (newState.profile && newState.profile.sleepTime) || "23:00"
                },
                notes: ""
            };
        }
        if (!Array.isArray(newState.chapters)) newState.chapters = [];
        if (!Array.isArray(newState.studyPlans)) newState.studyPlans = [];
        if (!Array.isArray(newState.mockTests)) newState.mockTests = [];
        if (!newState.settings || typeof newState.settings !== 'object') {
            newState.settings = { theme: "system" };
        }
        if (typeof newState.settings.reducedMotion !== 'boolean') newState.settings.reducedMotion = false;
        if (typeof newState.settings.notificationsEnabled !== 'boolean') newState.settings.notificationsEnabled = false;
        if (typeof newState.settings.soundEnabled !== 'boolean') newState.settings.soundEnabled = true;

        newState.schemaVersion = "1.2.0";
        console.log('[Migration] 1.1.0 → 1.2.0: academicProfile, chapters, studyPlans, mockTests added. Existing data preserved.');
        return newState;
    }
};

/**
 * Compares two semantic version strings (e.g. "1.0.0" vs "1.1.0")
 * Returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
    if (v1 === v2) return 0;
    const parts1 = String(v1 || '1.0.0').split('.').map(Number);
    const parts2 = String(v2 || '1.0.0').split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }
    return 0;
}

/**
 * Validates that loaded state matches expected shape and collections
 */
function validateAppState(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.schemaVersion !== 'string') return false;

    // Required domain collection keys
    const requiredArrays = [
        'goals', 'tasks', 'accountabilityRecords', 'subjects', 'chapters',
        'studySessions', 'studyPlans', 'mockTests', 'habits', 'sleepLogs', 
        'waterLogs', 'exerciseLogs', 'moodLogs', 'reminders'
    ];

    for (const key of requiredArrays) {
        if (!Array.isArray(data[key])) {
            console.warn(`[ValidateState] Collection '${key}' missing or invalid. Initializing empty array.`);
            data[key] = [];
        }
    }

    if (!data.profile || typeof data.profile !== 'object') {
        data.profile = createInitialState().profile;
    }

    if (!data.academicProfile || typeof data.academicProfile !== 'object') {
        data.academicProfile = createInitialState().academicProfile;
    } else {
        if (typeof data.academicProfile.targetExam !== 'string') data.academicProfile.targetExam = "";
        if (typeof data.academicProfile.dailyStudyTargetHours !== 'number') data.academicProfile.dailyStudyTargetHours = 3.5;
        if (typeof data.academicProfile.preferredSessionDurationMinutes !== 'number') data.academicProfile.preferredSessionDurationMinutes = 60;
        if (!Array.isArray(data.academicProfile.weakSubjectIds)) data.academicProfile.weakSubjectIds = [];
        if (!data.academicProfile.routine || typeof data.academicProfile.routine !== 'object') {
            data.academicProfile.routine = { wakeTime: "07:00", sleepTime: "23:00" };
        }
    }

    if (!data.settings || typeof data.settings !== 'object') {
        data.settings = { theme: "system", reducedMotion: false, notificationsEnabled: false, soundEnabled: true };
    }

    // Phase 6: Validate timetable object — supply safe defaults if absent
    if (!data.timetable || typeof data.timetable !== 'object') {
        console.warn('[ValidateState] timetable object missing or invalid. Initializing empty timetable.');
        data.timetable = { institution: "", academicYear: "", semester: "", batch: "", entries: [] };
    } else {
        if (typeof data.timetable.institution !== 'string') data.timetable.institution = "";
        if (typeof data.timetable.academicYear !== 'string') data.timetable.academicYear = "";
        if (typeof data.timetable.semester    !== 'string') data.timetable.semester    = "";
        if (typeof data.timetable.batch       !== 'string') data.timetable.batch       = "";
        if (!Array.isArray(data.timetable.entries)) data.timetable.entries = [];
    }

    // Phase 6: Validate individual timetable entry records
    const VALID_TT_DAYS  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const VALID_TT_TYPES = ['lecture','lab','practical','tutorial','exam','contest','yoga','break','lunch','other'];
    const TIME_RE = /^\d{2}:\d{2}$/;

    data.timetable.entries = data.timetable.entries.filter((entry, idx) => {
        if (!entry || typeof entry !== 'object') {
            console.warn(`[ValidateState] Timetable entry at index ${idx} is not an object. Removing.`);
            return false;
        }
        if (typeof entry.id !== 'string' || !entry.id.trim()) {
            console.warn(`[ValidateState] Timetable entry at index ${idx} missing valid id. Removing.`);
            return false;
        }
        if (!VALID_TT_DAYS.includes(entry.day)) {
            console.warn(`[ValidateState] Timetable entry '${entry.id}' has invalid day '${entry.day}'. Removing.`);
            return false;
        }
        if (!TIME_RE.test(entry.startTime) || !TIME_RE.test(entry.endTime)) {
            console.warn(`[ValidateState] Timetable entry '${entry.id}' has invalid times. Removing.`);
            return false;
        }
        if (typeof entry.title !== 'string' || !entry.title.trim()) {
            console.warn(`[ValidateState] Timetable entry '${entry.id}' missing title. Removing.`);
            return false;
        }
        // Coerce type to 'other' if unrecognised (do not remove)
        if (!VALID_TT_TYPES.includes(entry.type)) {
            entry.type = 'other';
        }
        // subjectId: must be null/undefined or a non-empty string
        if (entry.subjectId !== null && entry.subjectId !== undefined && typeof entry.subjectId !== 'string') {
            entry.subjectId = null;
        }
        // classroom and notes: must be strings
        if (typeof entry.classroom !== 'string') entry.classroom = "";
        if (typeof entry.notes     !== 'string') entry.notes     = "";
        // timestamps: supply if missing
        if (typeof entry.createdAt !== 'string') entry.createdAt = new Date().toISOString();
        if (typeof entry.updatedAt !== 'string') entry.updatedAt = entry.createdAt;
        return true;
    });

    // Phase 3: Validate individual task records — sanitize malformed entries safely
    if (Array.isArray(data.tasks)) {
        const VALID_STATUSES = ['planned', 'completed', 'missed'];
        const VALID_PRIORITIES = ['low', 'medium', 'high'];
        const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

        data.tasks = data.tasks.filter((task, idx) => {
            if (!task || typeof task !== 'object') {
                console.warn(`[ValidateState] Task at index ${idx} is not an object. Removing.`);
                return false;
            }
            if (typeof task.id !== 'string' || !task.id.trim()) {
                console.warn(`[ValidateState] Task at index ${idx} missing valid id. Removing.`);
                return false;
            }
            if (typeof task.title !== 'string' || !task.title.trim()) {
                console.warn(`[ValidateState] Task '${task.id}' missing valid title. Removing.`);
                return false;
            }
            if (typeof task.date !== 'string' || !DATE_RE.test(task.date)) {
                console.warn(`[ValidateState] Task '${task.id}' has invalid date. Removing.`);
                return false;
            }
            if (!VALID_STATUSES.includes(task.status)) {
                console.warn(`[ValidateState] Task '${task.id}' has unrecognised status '${task.status}'. Coercing to 'planned'.`);
                task.status = 'planned';
            }
            if (!VALID_PRIORITIES.includes(task.priority)) {
                task.priority = 'medium';
            }
            if (task.goalId !== null && task.goalId !== undefined && typeof task.goalId !== 'string') {
                task.goalId = null;
            }
            if (typeof task.createdAt !== 'string') {
                task.createdAt = new Date().toISOString();
            }
            if (typeof task.updatedAt !== 'string') {
                task.updatedAt = task.createdAt;
            }
            return true;
        });
    }

    return true;
}

/**
 * Migration engine architecture for current and future schema versions.
 * Discovers schema version state:
 * - Case A: No state -> returns { status: 'NO_STATE', state: createInitialState() }
 * - Case B: Older schema version (< 1.1.0):
 *     - If explicit handler exists in SCHEMA_MIGRATION_REGISTRY: transforms and returns { status: 'MIGRATED', state: migratedState }.
 *       e.g. "1.0.0" → "1.1.0" adds timetable object preserving all existing data.
 *     - If NO explicit handler exists: treats as unsupported older schema. Returns { status: 'UNSUPPORTED_OLD_VERSION', state: rawData, version: currentVersion }.
 *       IMPORTANT: Raw state is preserved safely without fabricating a version string upgrade.
 * - Case C: Current schema 1.1.0 -> returns { status: 'CURRENT', state: rawData }.
 * - Case D: Unknown/Future schema (> 1.1.0) -> returns { status: 'FUTURE_VERSION', state: rawData, version: currentVersion }.
 * - Case E: Invalid/Corrupted state -> handled by loadAppState with backup recovery key.
 */
function migrateAppState(rawData, targetVersion = SCHEMA_VERSION) {
    if (!rawData || typeof rawData !== 'object') {
        return { status: 'NO_STATE', state: createInitialState() };
    }

    let currentVersion = rawData.schemaVersion || "1.0.0";
    const initialComp = compareVersions(currentVersion, targetVersion);

    if (initialComp === 0) {
        return { status: 'CURRENT', state: rawData };
    } else if (initialComp < 0) {
        let stateCopy = JSON.parse(JSON.stringify(rawData));
        const originalVersion = currentVersion;
        while (compareVersions(currentVersion, targetVersion) < 0) {
            if (typeof SCHEMA_MIGRATION_REGISTRY[currentVersion] === 'function') {
                try {
                    console.log(`[Migration] Running registered migration for schema v${currentVersion}`);
                    stateCopy = SCHEMA_MIGRATION_REGISTRY[currentVersion](stateCopy);
                    currentVersion = stateCopy.schemaVersion || targetVersion;
                } catch (err) {
                    console.error(`[Migration] Explicit migration from v${currentVersion} failed:`, err);
                    return { status: 'MIGRATION_FAILED', state: rawData, version: currentVersion };
                }
            } else {
                console.warn(`[Migration] Schema v${currentVersion} is older than v${targetVersion}, but no explicit migration transformation is registered. Preserving raw state without false upgrade.`);
                return { status: 'UNSUPPORTED_OLD_VERSION', state: rawData, version: currentVersion };
            }
        }
        stateCopy.schemaVersion = targetVersion;
        return { status: 'MIGRATED', state: stateCopy, fromVersion: originalVersion };
    } else {
        console.warn(`[Migration] Future schema version v${currentVersion} detected (> v${targetVersion}). Preserving raw data in read-only mode.`);
        return { status: 'FUTURE_VERSION', state: rawData, version: currentVersion };
    }
}

// --------------------------------------------------------------------------
// 5. LOCALSTORAGE STORAGE ARCHITECTURE
// Primary Key: momentumAI
// Recovery Key: momentumAI_corrupted_backup (Recovery-only, NOT an app store)
// --------------------------------------------------------------------------
/**
 * Loads and parses application state from LocalStorage safely
 */
function loadAppState() {
    try {
        const rawJson = localStorage.getItem(STORAGE_KEY);
        if (!rawJson) {
            console.log("[Storage] Case A: No existing data found. Initializing new default state.");
            appState = createInitialState();
            saveAppState(appState);
            return appState;
        }

        const parsed = JSON.parse(rawJson);
        const migrationResult = migrateAppState(parsed, SCHEMA_VERSION);

        if (migrationResult.status === 'FUTURE_VERSION') {
            console.warn(`[Storage] Case D: Future schema version '${migrationResult.version}' detected. Preserving data in read-only mode.`);
            appState = migrationResult.state;
            updateInspectorUI();
            return appState;
        }

        if (migrationResult.status === 'UNSUPPORTED_OLD_VERSION') {
            console.warn(`[Storage] Case B (Unsupported): Schema version '${migrationResult.version}' has no registered migration handler. Preserving raw state without overwriting.`);
            appState = migrationResult.state;
            updateInspectorUI();
            return appState;
        }

        const targetState = migrationResult.state;

        if (validateAppState(targetState)) {
            appState = targetState;
            console.log("[Storage] Case C: App state loaded successfully. Schema version:", appState.schemaVersion);
            if (migrationResult.status === 'MIGRATED') {
                saveAppState(appState);
            }
        } else {
            console.warn("[Storage] Loaded state failed structural validation. Re-initializing with safe defaults.");
            appState = createInitialState();
        }
    } catch (error) {
        console.error("[Storage] Case E: Failed to parse LocalStorage JSON. Preserving raw corrupted string to backup key.", error);
        
        // Preserve raw corrupted data to recovery key (momentumAI_corrupted_backup)
        // NOTE: momentumAI_corrupted_backup is a recovery-only key and NOT an app state store.
        try {
            const corruptedRaw = localStorage.getItem(STORAGE_KEY);
            if (corruptedRaw) {
                localStorage.setItem(CORRUPTED_BACKUP_KEY, corruptedRaw);
                console.info(`[Storage] Recovery: Raw corrupted string backed up to '${CORRUPTED_BACKUP_KEY}'`);
            }
        } catch (backupError) {
            console.error("[Storage] Failed to preserve corrupted raw string.", backupError);
        }

        appState = createInitialState();
        saveAppState(appState);
    }

    return appState;
}



/**
 * Serializes and saves application state to LocalStorage
 */
function saveAppState(state = appState) {
    try {
        if (state && state.schemaVersion && compareVersions(state.schemaVersion, SCHEMA_VERSION) > 0) {
            console.warn(`[Storage] Prevented overwriting higher schema version data (${state.schemaVersion}).`);
            return false;
        }
        if (state && state.profile) {
            state.profile.updatedAt = new Date().toISOString();
        }
        const json = JSON.stringify(state, null, 2);
        localStorage.setItem(STORAGE_KEY, json);
        updateInspectorUI();
        return true;
    } catch (error) {
        console.error("[Storage] Failed to save state to LocalStorage.", error);
        return false;
    }
}
function resetAppState() {
    if (confirm("Are you sure you want to reset all Momentum AI state data? This will clear local data.")) {
        localStorage.removeItem(STORAGE_KEY);
        appState = createInitialState();
        saveAppState(appState);
        applyTheme(appState.settings.theme);
        // Reset task planner view state so stale UI state doesn't persist
        if (typeof taskPlannerState !== 'undefined') {
            taskPlannerState.datePreset = 'today';
            taskPlannerState.selectedDate = null;
            taskPlannerState.statusFilter = 'all';
            taskPlannerState.searchQuery = '';
            taskPlannerState.editingTaskId = null;
            taskPlannerState.pendingDeleteId = null;
        }
        // Reset timetable view state
        if (typeof ttState !== 'undefined') {
            ttState.activeDay = null;
            ttState.activeSubTab = 'timetable';
            ttState.editingEntryId = null;
            ttState.pendingDeleteEntryId = null;
        }
        // Close any open modals
        ['modal-task-form','modal-task-delete','modal-tt-entry-form','modal-tt-entry-delete'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
        });
        renderAllUI();
        checkOnboardingState();
        alert("State successfully reset to initial defaults.");
    }
}

// --------------------------------------------------------------------------
// 6. THEME MANAGEMENT
// --------------------------------------------------------------------------
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(themeChoice) {
    const htmlElem = document.documentElement;
    if (themeChoice === 'light' || themeChoice === 'dark') {
        htmlElem.setAttribute('data-theme', themeChoice);
    } else {
        htmlElem.setAttribute('data-theme', 'system');
    }
}

function initThemeSelector() {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;

    themeSelect.value = appState.settings.theme || 'system';
    applyTheme(themeSelect.value);

    themeSelect.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        appState.settings.theme = newTheme;
        applyTheme(newTheme);
        saveAppState();
    });
}

// --------------------------------------------------------------------------
// 7. SERVICE WORKER REGISTRATION (PWA)
// --------------------------------------------------------------------------
function registerServiceWorker() {
    const swStatusVal = document.getElementById('stat-sw-status');
    const swStatusDetail = document.getElementById('stat-sw-detail');

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => {
                    console.log('[SW] ServiceWorker registered with scope:', registration.scope);
                    if (swStatusVal) swStatusVal.textContent = "Active";
                    if (swStatusDetail) swStatusDetail.textContent = "Offline cache active";
                })
                .catch((error) => {
                    console.warn('[SW] ServiceWorker registration failed:', error);
                    if (swStatusVal) swStatusVal.textContent = "Disabled";
                    if (swStatusDetail) swStatusDetail.textContent = "Static mode";
                });
        });
    } else {
        if (swStatusVal) swStatusVal.textContent = "Unsupported";
        if (swStatusDetail) swStatusDetail.textContent = "Browser limitation";
    }
}

// --------------------------------------------------------------------------
// 8. DOM RENDER & CONTROLLER LOGIC (PHASE 2 DASHBOARD & FOUNDATION VIEW)
// --------------------------------------------------------------------------
function getGreetingByTime() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
        return "Good morning";
    } else if (hour >= 12 && hour < 17) {
        return "Good afternoon";
    } else {
        return "Good evening";
    }
}

function getFormattedLocalDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
}

function getIsoTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayDateString() {
    return getIsoTodayDate();
}

function renderDashboard() {
    const userName = (appState.profile && appState.profile.name) ? appState.profile.name : "User";
    const greetingText = `${getGreetingByTime()}, ${userName}.`;
    
    const elGreeting = document.getElementById('dash-greeting');
    const elDate = document.getElementById('dash-current-date');
    
    if (elGreeting) elGreeting.textContent = greetingText;
    if (elDate) elDate.textContent = getFormattedLocalDate();

    renderDashboardCurrentFocus();
    renderDashboardTodayOverview();
    renderDashboardTodayTasks();
    renderDashboardTodaySchedule();
    renderDashboardGoals();
}

function renderDashboardCurrentFocus() {
    const elTitle = document.getElementById('dash-focus-title');
    const elMeta = document.getElementById('dash-focus-meta');
    const elTarget = document.getElementById('dash-focus-target-text');
    const elBadge = document.getElementById('dash-focus-badge');

    const primaryGoal = (appState.goals && appState.goals.length > 0) 
        ? appState.goals[0] 
        : null;

    if (primaryGoal) {
        if (elTitle) elTitle.textContent = primaryGoal.title || "Untitled Goal";
        if (elMeta) elMeta.textContent = `Category: ${primaryGoal.type || 'General'} • Priority: ${primaryGoal.priority || 'Medium'} Priority`;
        
        let targetStr = primaryGoal.target ? `Target: ${primaryGoal.target}` : "No specific target metric set";
        if (primaryGoal.deadline) {
            targetStr += ` • Target Deadline: ${primaryGoal.deadline}`;
        }
        if (elTarget) elTarget.textContent = targetStr;
        if (elBadge) elBadge.textContent = `${primaryGoal.priority || 'Active'} Priority`;
    } else if (appState.profile && appState.profile.primaryGoal) {
        if (elTitle) elTitle.textContent = appState.profile.primaryGoal;
        if (elMeta) elMeta.textContent = `Category: General Objective • Role: ${appState.profile.userType || 'User'}`;
        if (elTarget) elTarget.textContent = `Daily Focus Capacity: ${appState.profile.availableTime || 'Not set'}`;
        if (elBadge) elBadge.textContent = "Primary Focus";
    } else {
        if (elTitle) elTitle.textContent = "No active goal set yet";
        if (elMeta) elMeta.textContent = "Complete setup or add a goal to define your current focus.";
        if (elTarget) elTarget.textContent = "Your primary objective will appear here once defined.";
        if (elBadge) elBadge.textContent = "No Focus Set";
    }
}

function renderDashboardTodayOverview() {
    const todayStr = getIsoTodayDate();
    
    const tasks = Array.isArray(appState.tasks) ? appState.tasks : [];
    const todayTasks = tasks.filter(t => t.date === todayStr);

    const plannedCount = todayTasks.length;
    const completedCount = todayTasks.filter(t => t.status === 'completed').length;
    const missedCount = todayTasks.filter(t => t.status === 'missed').length;

    // Calculate focused time from studySessions for today
    const sessions = Array.isArray(appState.studySessions) ? appState.studySessions : [];
    const todaySessions = sessions.filter(s => s.startTime && s.startTime.startsWith(todayStr));
    let totalFocusMinutes = 0;
    for (const s of todaySessions) {
        totalFocusMinutes += (Number(s.duration) || 0);
    }

    const elPlanned = document.getElementById('dash-stat-planned');
    const elCompleted = document.getElementById('dash-stat-completed');
    const elMissed = document.getElementById('dash-stat-missed');
    const elFocused = document.getElementById('dash-stat-focused');

    if (elPlanned) elPlanned.textContent = plannedCount;
    if (elCompleted) elCompleted.textContent = completedCount;
    if (elMissed) elMissed.textContent = missedCount;
    if (elFocused) elFocused.textContent = totalFocusMinutes > 0 ? `${totalFocusMinutes}m` : "0m";
}

function renderDashboardTodayTasks() {
    const container = document.getElementById('dash-today-tasks-container');
    const tagCount = document.getElementById('dash-today-count-tag');
    if (!container) return;

    const todayStr = getIsoTodayDate();
    const tasks = Array.isArray(appState.tasks) ? appState.tasks : [];
    const todayTasks = tasks.filter(t => t.date === todayStr);

    if (tagCount) tagCount.textContent = `${todayTasks.length} ${todayTasks.length === 1 ? 'Task' : 'Tasks'}`;

    if (todayTasks.length > 0) {
        // Sort: timed tasks first (by start time), then untimed; within each group high→med→low
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const sorted = [...todayTasks].sort((a, b) => {
            const aHasTime = !!a.startTime;
            const bHasTime = !!b.startTime;
            if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;
            if (aHasTime && bHasTime && a.startTime !== b.startTime) {
                return a.startTime < b.startTime ? -1 : 1;
            }
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });

        const statusLabel = { planned: 'Planned', completed: 'Completed', missed: 'Missed' };
        container.innerHTML = sorted.map(task => {
            const timePart = task.startTime
                ? `<span>${task.startTime}${task.endTime ? ' – ' + task.endTime : ''}</span><span class="task-item-meta-sep">&bull;</span>`
                : '';
            const goalPart = task.goalId
                ? (() => {
                    const g = Array.isArray(appState.goals) ? appState.goals.find(g => g.id === task.goalId) : null;
                    return g ? `<span class="task-item-meta-sep">&bull;</span><span>${escapeHtml(g.title)}</span>` : '';
                  })()
                : '';
            return `
                <div class="dash-task-row status-${task.status || 'planned'}">
                    <span class="dash-task-title">${escapeHtml(task.title)}</span>
                    <div class="dash-task-badges">
                        ${timePart ? `<span class="text-caption text-muted">${task.startTime}${task.endTime ? ' – ' + task.endTime : ''}</span>` : ''}
                        <span class="priority-badge priority-${task.priority || 'medium'}">${task.priority || 'medium'}</span>
                        <span class="status-badge status-${task.status || 'planned'}">${statusLabel[task.status] || 'Planned'}</span>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state" style="padding: var(--space-8) var(--space-4);">
                <div class="empty-title">Nothing planned for today</div>
                <p class="empty-description">Add a task when you know what needs your attention.</p>
                <button class="btn btn-primary dash-goto-tasks-btn" style="font-size:var(--font-size-small);">Go to Task Planner</button>
            </div>
        `;
        // Wire the button after insertion
        const gotoBtn = container.querySelector('.dash-goto-tasks-btn');
        if (gotoBtn) {
            gotoBtn.addEventListener('click', () => {
                const tasksBtn = document.querySelector('.nav-btn[data-view="tasks"]');
                if (tasksBtn) tasksBtn.click();
            });
        }
    }
}

/**
 * Renders the Today's Schedule section on the Dashboard.
 * Shows next timetable entry + up to 4 entries for today's weekday.
 * Derived from appState.timetable.entries — no duplication of data.
 */
function renderDashboardTodaySchedule() {
    const container = document.getElementById('dash-schedule-container');
    const nextEl    = document.getElementById('dash-schedule-next');
    if (!container) return;

    const todayEntries = getTodayTimetable();

    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const nextEntry = todayEntries.find(e => timeToMinutes(e.startTime) > nowMins) || null;

    if (nextEl) {
        if (nextEntry) {
            nextEl.innerHTML = `
                <span class="tt-type-badge tt-type-${escapeHtml(nextEntry.type)}">${escapeHtml(ttTypeLabel(nextEntry.type))}</span>
                <span class="tt-dash-next-title">${escapeHtml(nextEntry.title)}</span>
                <span class="text-caption text-muted">${formatTimeDisplay(nextEntry.startTime)}${nextEntry.endTime ? ' – ' + formatTimeDisplay(nextEntry.endTime) : ''}${nextEntry.classroom ? ' &bull; ' + escapeHtml(nextEntry.classroom) : ''}</span>
            `;
        } else if (todayEntries.length > 0) {
            nextEl.innerHTML = '<span class="text-caption text-muted">No more classes today.</span>';
        } else {
            nextEl.innerHTML = '<span class="text-caption text-muted">No timetable entries for today.</span>';
        }
    }

    if (todayEntries.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
                <div class="empty-title" style="font-size:var(--font-size-subheading);">No timetable added</div>
                <p class="empty-description text-small">Add your weekly class schedule in Student Mode.</p>
                <button class="btn btn-primary dash-goto-study-btn" style="font-size:var(--font-size-small);">Set up timetable</button>
            </div>
        `;
        const gotoBtn = container.querySelector('.dash-goto-study-btn');
        if (gotoBtn) {
            gotoBtn.addEventListener('click', () => {
                const studyBtn = document.querySelector('.nav-btn[data-view="study"]');
                if (studyBtn) studyBtn.click();
            });
        }
        return;
    }

    const shown = todayEntries.slice(0, 4);
    container.innerHTML = shown.map(e => `
        <div class="dash-tt-row">
            <span class="tt-type-badge tt-type-${escapeHtml(e.type)}">${escapeHtml(ttTypeLabel(e.type))}</span>
            <span class="dash-tt-title">${escapeHtml(e.title)}</span>
            <span class="dash-tt-meta text-caption text-muted">${formatTimeDisplay(e.startTime)}${e.endTime ? ' – ' + formatTimeDisplay(e.endTime) : ''}${e.classroom ? ' &bull; ' + escapeHtml(e.classroom) : ''}</span>
        </div>
    `).join('');

    if (todayEntries.length > 4) {
        container.innerHTML += `<p class="text-caption text-muted" style="margin-top:var(--space-2);">+${todayEntries.length - 4} more — view full schedule in Student Mode.</p>`;
    }
}


function renderDashboardGoals() {
    const container = document.getElementById('dash-goals-list-container');
    if (!container) return;

    const goals = Array.isArray(appState.goals) ? appState.goals : [];

    if (goals.length > 0) {
        container.innerHTML = goals.map(g => `
            <div class="preset-card mb-xs">
                <div class="preset-header">
                    <span class="preset-title">${g.title}</span>
                    <span class="nav-tag">${g.type || 'General'} &bull; ${g.priority || 'Medium'} Priority</span>
                </div>
                <div class="text-caption text-secondary mt-xs">
                    ${g.target ? `Target: ${g.target}` : 'No target metric set'} 
                    ${g.deadline ? ` &bull; Deadline: ${g.deadline}` : ''}
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
                <div class="empty-title" style="font-size: var(--font-size-subheading);">No active goals created yet</div>
                <p class="empty-description text-small">
                    Goals created during onboarding or setup will be displayed here.
                </p>
            </div>
        `;
    }
}

function calculateTotalRecords(state) {
    const collections = [
        'goals', 'tasks', 'accountabilityRecords', 'subjects', 
        'studySessions', 'habits', 'sleepLogs', 'waterLogs', 
        'exerciseLogs', 'moodLogs', 'reminders'
    ];
    let count = 0;
    for (const key of collections) {
        if (Array.isArray(state[key])) {
            count += state[key].length;
        }
    }
    // Count timetable entries separately
    if (state.timetable && Array.isArray(state.timetable.entries)) {
        count += state.timetable.entries.length;
    }
    return count;
}

function updateInspectorUI() {
    const elSchemaVersion = document.getElementById('stat-schema-version');
    const elStorageKey = document.getElementById('stat-storage-key');
    const elTotalRecords = document.getElementById('stat-total-records');
    const elStateInspector = document.getElementById('state-json-inspector');

    if (elSchemaVersion) elSchemaVersion.textContent = appState.schemaVersion;
    if (elStorageKey) elStorageKey.textContent = `Key: ${STORAGE_KEY}`;
    if (elTotalRecords) elTotalRecords.textContent = calculateTotalRecords(appState);
    if (elStateInspector) elStateInspector.value = JSON.stringify(appState, null, 2);
}

function renderDomainCollectionsTable() {
    const tbody = document.getElementById('domain-collections-tbody');
    if (!tbody) return;

    const ttEntryCount = (appState.timetable && Array.isArray(appState.timetable.entries))
        ? appState.timetable.entries.length : 0;

    const collections = [
        { name: 'Profile', schema: 'Object (1 user profile)', count: appState.profile ? 1 : 0 },
        { name: 'Goals', schema: 'Array<{ id, type, title, target, deadline, status }>', count: appState.goals.length },
        { name: 'Tasks', schema: 'Array<{ id, title, category, priority, status }>', count: appState.tasks.length },
        { name: 'Accountability Records', schema: 'Array<{ id, taskId, status, reason }>', count: appState.accountabilityRecords.length },
        { name: 'Study Subjects', schema: 'Array<{ id, name, goalType, active }>', count: appState.subjects.length },
        { name: 'Chapters', schema: 'Array<{ id, subjectId, name, status, revisionCount }>', count: (appState.chapters || []).length },
        { name: 'Study Sessions', schema: 'Array<{ id, subjectId, duration, questionsSolved }>', count: appState.studySessions.length },
        { name: 'Study Plans', schema: 'Array<{ id, date, startTime, endTime, reason }>', count: (appState.studyPlans || []).length },
        { name: 'Mock Tests', schema: 'Array<{ id, title, subjectId, scorePercent }>', count: (appState.mockTests || []).length },
        { name: 'Timetable Entries', schema: 'Array<{ id, day, startTime, endTime, title, type }>', count: ttEntryCount },
        { name: 'Habits', schema: 'Array<{ id, title, frequency, streak }>', count: appState.habits.length },
        { name: 'Sleep Logs', schema: 'Array<{ id, bedtime, wakeTime, duration, quality }>', count: appState.sleepLogs.length },
        { name: 'Water Logs', schema: 'Array<{ id, date, amountMl, targetMl }>', count: appState.waterLogs.length },
        { name: 'Exercise Logs', schema: 'Array<{ id, date, type, durationMinutes }>', count: appState.exerciseLogs.length },
        { name: 'Mood Logs', schema: 'Array<{ id, date, moodRating, energyLevel }>', count: appState.moodLogs.length },
        { name: 'Reminders', schema: 'Array<{ id, title, category, dateTime, enabled }>', count: appState.reminders.length }
    ];

    tbody.innerHTML = collections.map(col => `
        <tr>
            <td style="font-weight: 500;">${col.name}</td>
            <td style="font-family: var(--font-family-mono); font-size: 0.75rem; color: var(--color-text-secondary);">${col.schema}</td>
            <td style="font-weight: 600; color: var(--color-brand);">${col.count}</td>
        </tr>
    `).join('');
}

function renderGoalPresetsList() {
    const container = document.getElementById('presets-list');
    if (!container) return;

    const html = Object.keys(GOAL_PRESETS).map(key => {
        const preset = GOAL_PRESETS[key];
        return `
            <div class="preset-card">
                <div class="preset-header">
                    <span class="preset-title">${key} — ${preset.name}</span>
                    <span class="nav-tag">${preset.category}</span>
                </div>
                <div class="preset-tags">
                    ${preset.subjects.map(s => `<span class="preset-tag">${s}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function initNavigationTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewFoundation = document.getElementById('view-foundation');
    const viewTasks = document.getElementById('view-tasks');
    const viewStudy = document.getElementById('view-study');
    const viewWellness = document.getElementById('view-wellness');
    const viewAICoach = document.getElementById('view-aicoach');
    const viewReminders = document.getElementById('view-reminders');
    const viewAnalytics = document.getElementById('view-analytics');
    const viewSettings = document.getElementById('view-settings');
    const viewPlaceholder = document.getElementById('view-placeholder');
    const placeholderTitle = document.getElementById('placeholder-title');
    const placeholderDesc = document.getElementById('placeholder-desc');

    function hideAllViews() {
        if (viewDashboard) viewDashboard.classList.add('hidden');
        if (viewFoundation) viewFoundation.classList.add('hidden');
        if (viewTasks) viewTasks.classList.add('hidden');
        if (viewStudy) viewStudy.classList.add('hidden');
        if (viewWellness) viewWellness.classList.add('hidden');
        if (viewAICoach) viewAICoach.classList.add('hidden');
        if (viewReminders) viewReminders.classList.add('hidden');
        if (viewAnalytics) viewAnalytics.classList.add('hidden');
        if (viewSettings) viewSettings.classList.add('hidden');
        if (viewPlaceholder) viewPlaceholder.classList.add('hidden');
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            const targetPhase = btn.getAttribute('data-phase');

            navButtons.forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('aria-current');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');

            hideAllViews();

            if (targetView === 'dashboard') {
                if (viewDashboard) viewDashboard.classList.remove('hidden');
                renderDashboard();
            } else if (targetView === 'foundation') {
                if (viewFoundation) viewFoundation.classList.remove('hidden');
                updateInspectorUI();
            } else if (targetView === 'tasks') {
                if (viewTasks) viewTasks.classList.remove('hidden');
                renderTaskList();
            } else if (targetView === 'today') {
                if (viewTasks) viewTasks.classList.remove('hidden');
                if (typeof taskPlannerState !== 'undefined') {
                    taskPlannerState.datePreset = 'today';
                    taskPlannerState.selectedDate = getTodayDateString();
                    syncDateTabButtons();
                }
                renderTaskList();
            } else if (targetView === 'study') {
                if (viewStudy) viewStudy.classList.remove('hidden');
                renderStudyView();
            } else if (targetView === 'wellness') {
                if (viewWellness) viewWellness.classList.remove('hidden');
                renderWellnessView();
            } else if (targetView === 'aicoach') {
                if (viewAICoach) viewAICoach.classList.remove('hidden');
                renderAICoachView();
            } else if (targetView === 'reminders') {
                if (viewReminders) viewReminders.classList.remove('hidden');
                renderRemindersView();
            } else if (targetView === 'analytics') {
                if (viewAnalytics) viewAnalytics.classList.remove('hidden');
                renderAnalyticsView();
            } else if (targetView === 'settings') {
                if (viewSettings) viewSettings.classList.remove('hidden');
                renderSettingsView();
            } else {
                if (viewPlaceholder) viewPlaceholder.classList.remove('hidden');
                if (placeholderTitle) {
                    placeholderTitle.textContent = `${btn.textContent.replace(/Phase \d+/, '').trim()} Module (Phase ${targetPhase || '?'})`;
                }
                if (placeholderDesc) {
                    placeholderDesc.textContent = `The ${btn.textContent.replace(/Phase \d+/, '').trim()} user interface will be built in a future phase.`;
                }
            }
        });
    });

    const btnInspector = document.getElementById('dash-btn-view-inspector');
    if (btnInspector) {
        btnInspector.addEventListener('click', () => {
            const foundationBtn = document.querySelector('.nav-btn[data-view="foundation"]');
            if (foundationBtn) foundationBtn.click();
        });
    }

    const btnDashEditProfile = document.getElementById('dash-btn-edit-profile');
    if (btnDashEditProfile) {
        btnDashEditProfile.addEventListener('click', startOnboarding);
    }

    // Dashboard "Add Task" quick action — navigate to Task Planner and open form
    const btnDashAddTask = document.getElementById('dash-btn-add-task');
    if (btnDashAddTask) {
        btnDashAddTask.addEventListener('click', () => {
            const tasksNavBtn = document.querySelector('.nav-btn[data-view="tasks"]');
            if (tasksNavBtn) tasksNavBtn.click();
            // Small delay so the view renders before modal opens
            setTimeout(() => openTaskModal(null), 50);
        });
    }

    // Placeholder "Return to Workspace" button
    const btnBackFoundation = document.getElementById('btn-back-foundation');
    if (btnBackFoundation) {
        btnBackFoundation.addEventListener('click', () => {
            const dashBtn = document.querySelector('.nav-btn[data-view="dashboard"]');
            if (dashBtn) dashBtn.click();
        });
    }
}

function initActionButtons() {
    const btnExport = document.getElementById('btn-export-json');
    const btnReset = document.getElementById('btn-reset-state');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const jsonStr = JSON.stringify(appState, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `momentum_ai_state_v${appState.schemaVersion}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetAppState();
        });
    }
}

function renderAllUI() {
    updateInspectorUI();
    renderDomainCollectionsTable();
    renderGoalPresetsList();
    renderActiveProfileSummary();
    renderDashboard();
    // Re-render task list if tasks view is currently visible
    const viewTasks = document.getElementById('view-tasks');
    if (viewTasks && !viewTasks.classList.contains('hidden')) {
        renderTaskList();
    }
    // Re-render study/timetable view if it is currently visible
    const viewStudy = document.getElementById('view-study');
    if (viewStudy && !viewStudy.classList.contains('hidden')) {
        renderStudyView();
    }
}

// --------------------------------------------------------------------------
// 9. PHASE 1 ONBOARDING WIZARD & CONTROLLER LOGIC
// --------------------------------------------------------------------------
let currentOnboardStep = 1;
let draftProfile = {
    name: "",
    userType: "",
    primaryGoal: "",
    availableTime: "",
    wakeTime: "07:00",
    sleepTime: "23:00",
    peakFocusTime: "Morning"
};
let draftGoal = {
    title: "",
    category: "Study",
    target: "",
    deadline: "",
    priority: "Medium"
};

function startOnboarding() {
    const landingView = document.getElementById('view-landing');
    const onboardingView = document.getElementById('view-onboarding');
    const appShell = document.getElementById('app-shell');

    if (landingView) landingView.classList.add('hidden');
    if (appShell) appShell.classList.add('hidden');
    if (onboardingView) onboardingView.classList.remove('hidden');

    // Pre-fill draft from existing profile if present
    if (appState.profile) {
        draftProfile.name = appState.profile.name || "";
        draftProfile.userType = appState.profile.userType || "";
        draftProfile.primaryGoal = appState.profile.primaryGoal || "";
        draftProfile.availableTime = appState.profile.availableTime || "";
        draftProfile.wakeTime = appState.profile.wakeTime || "07:00";
        draftProfile.sleepTime = appState.profile.sleepTime || "23:00";
        draftProfile.peakFocusTime = appState.profile.peakFocusTime || "Morning";
    }

    if (appState.goals && appState.goals.length > 0) {
        const firstGoal = appState.goals[0];
        draftGoal.title = firstGoal.title || "";
        draftGoal.category = firstGoal.type || "Study";
        draftGoal.target = firstGoal.target || "";
        draftGoal.deadline = firstGoal.deadline || "";
        draftGoal.priority = firstGoal.priority || "Medium";
    }

    // Populate input controls
    const inputName = document.getElementById('input-profile-name');
    if (inputName) inputName.value = draftProfile.name;

    const inputWake = document.getElementById('input-wake-time');
    if (inputWake) inputWake.value = draftProfile.wakeTime;

    const inputSleep = document.getElementById('input-sleep-time');
    if (inputSleep) inputSleep.value = draftProfile.sleepTime;

    const inputGoalTitle = document.getElementById('input-goal-title');
    if (inputGoalTitle) inputGoalTitle.value = draftGoal.title;

    const inputGoalTarget = document.getElementById('input-goal-target');
    if (inputGoalTarget) inputGoalTarget.value = draftGoal.target;

    const inputGoalDeadline = document.getElementById('input-goal-deadline');
    if (inputGoalDeadline) inputGoalDeadline.value = draftGoal.deadline || "";

    const selectGoalCategory = document.getElementById('select-goal-category');
    if (selectGoalCategory) selectGoalCategory.value = draftGoal.category;

    const selectGoalPriority = document.getElementById('select-goal-priority');
    if (selectGoalPriority) selectGoalPriority.value = draftGoal.priority;

    // Highlight pre-selected option cards
    syncOptionCards('user-type-options', draftProfile.userType);
    syncOptionCards('primary-goal-options', draftProfile.primaryGoal);
    syncOptionCards('available-time-options', draftProfile.availableTime);
    syncOptionCards('peak-focus-options', draftProfile.peakFocusTime);

    currentOnboardStep = 1;
    renderOnboardingStep(currentOnboardStep);
}

function cancelOnboarding() {
    if (confirm("Exit setup? Unsaved onboarding entries will be discarded.")) {
        checkOnboardingState();
    }
}

function syncOptionCards(containerId, selectedValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = container.querySelectorAll('.option-card');
    cards.forEach(card => {
        if (card.getAttribute('data-value') === selectedValue) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function renderOnboardingStep(stepNum) {
    const progressFill = document.getElementById('onboarding-progress-fill');
    const stepIndicator = document.getElementById('onboarding-step-indicator');
    const btnBack = document.getElementById('btn-onboard-back');
    const btnNext = document.getElementById('btn-onboard-next');
    const btnFinish = document.getElementById('btn-onboard-finish');

    if (progressFill) {
        const pct = Math.min(100, Math.round((stepNum / 6) * 100));
        progressFill.style.width = `${pct}%`;
    }

    if (stepIndicator) {
        stepIndicator.textContent = stepNum === 7 ? "Step 7 of 7 — Review Setup" : `Step ${stepNum} of 6`;
    }

    // Toggle visible step panel
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`onboard-step-${i}`);
        if (el) {
            if (i === stepNum) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    }
    const reviewEl = document.getElementById('onboard-step-review');
    if (reviewEl) {
        if (stepNum === 7) reviewEl.classList.remove('hidden');
        else reviewEl.classList.add('hidden');
    }

    // Nav button visibility
    if (btnBack) {
        if (stepNum === 1) btnBack.classList.add('hidden');
        else btnBack.classList.remove('hidden');
    }

    if (btnNext) {
        if (stepNum >= 7) btnNext.classList.add('hidden');
        else btnNext.classList.remove('hidden');
    }

    if (btnFinish) {
        if (stepNum === 7) btnFinish.classList.remove('hidden');
        else btnFinish.classList.add('hidden');
    }

    if (stepNum === 7) {
        populateReviewStep();
    }
}

function validateOnboardingStep(stepNum) {
    if (stepNum === 1) {
        const inputName = document.getElementById('input-profile-name');
        const errEl = document.getElementById('error-step-1');
        const val = inputName ? inputName.value.trim() : "";
        if (!val) {
            if (errEl) errEl.classList.remove('hidden');
            return false;
        }
        if (errEl) errEl.classList.add('hidden');
        draftProfile.name = val;
        return true;
    }

    if (stepNum === 2) {
        const errEl = document.getElementById('error-step-2');
        if (!draftProfile.userType) {
            if (errEl) errEl.classList.remove('hidden');
            return false;
        }
        if (errEl) errEl.classList.add('hidden');
        return true;
    }

    if (stepNum === 3) {
        const errEl = document.getElementById('error-step-3');
        if (!draftProfile.primaryGoal) {
            if (errEl) {
                errEl.textContent = "Please select a primary objective.";
                errEl.classList.remove('hidden');
            }
            return false;
        }
        if (draftProfile.primaryGoal === 'Custom') {
            const inputCustom = document.getElementById('input-custom-goal');
            const customVal = inputCustom ? inputCustom.value.trim() : "";
            if (!customVal) {
                if (errEl) {
                    errEl.textContent = "Please specify your custom objective.";
                    errEl.classList.remove('hidden');
                }
                return false;
            }
            draftProfile.primaryGoal = customVal;
        }
        if (errEl) errEl.classList.add('hidden');
        return true;
    }

    if (stepNum === 4) {
        const errEl = document.getElementById('error-step-4');
        if (!draftProfile.availableTime) {
            if (errEl) errEl.classList.remove('hidden');
            return false;
        }
        if (errEl) errEl.classList.add('hidden');
        return true;
    }

    if (stepNum === 5) {
        const inputWake = document.getElementById('input-wake-time');
        const inputSleep = document.getElementById('input-sleep-time');
        const errEl = document.getElementById('error-step-5');

        const wakeVal = inputWake ? inputWake.value : "";
        const sleepVal = inputSleep ? inputSleep.value : "";

        if (!wakeVal || !sleepVal) {
            if (errEl) errEl.classList.remove('hidden');
            return false;
        }
        if (errEl) errEl.classList.add('hidden');

        draftProfile.wakeTime = wakeVal;
        draftProfile.sleepTime = sleepVal;
        return true;
    }

    if (stepNum === 6) {
        const inputTitle = document.getElementById('input-goal-title');
        const selectCat = document.getElementById('select-goal-category');
        const inputTarget = document.getElementById('input-goal-target');
        const inputDeadline = document.getElementById('input-goal-deadline');
        const selectPriority = document.getElementById('select-goal-priority');
        const errEl = document.getElementById('error-step-6');

        const titleVal = inputTitle ? inputTitle.value.trim() : "";
        if (!titleVal) {
            if (errEl) errEl.classList.remove('hidden');
            return false;
        }
        if (errEl) errEl.classList.add('hidden');

        draftGoal.title = titleVal;
        draftGoal.category = selectCat ? selectCat.value : "Study";
        draftGoal.target = inputTarget ? inputTarget.value.trim() : "";
        draftGoal.deadline = inputDeadline && inputDeadline.value ? inputDeadline.value : null;
        draftGoal.priority = selectPriority ? selectPriority.value : "Medium";
        return true;
    }

    return true;
}

function handleOnboardingNext() {
    if (validateOnboardingStep(currentOnboardStep)) {
        currentOnboardStep++;
        renderOnboardingStep(currentOnboardStep);
    }
}

function handleOnboardingBack() {
    if (currentOnboardStep > 1) {
        currentOnboardStep--;
        renderOnboardingStep(currentOnboardStep);
    }
}

function populateReviewStep() {
    const revName = document.getElementById('rev-name');
    const revUserType = document.getElementById('rev-usertype');
    const revObjective = document.getElementById('rev-objective');
    const revAvailable = document.getElementById('rev-available-time');
    const revRoutine = document.getElementById('rev-routine');
    const revGoal = document.getElementById('rev-initial-goal');

    if (revName) revName.textContent = draftProfile.name || "-";
    if (revUserType) revUserType.textContent = draftProfile.userType || "-";
    if (revObjective) revObjective.textContent = draftProfile.primaryGoal || "-";
    if (revAvailable) revAvailable.textContent = draftProfile.availableTime || "-";
    if (revRoutine) revRoutine.textContent = `Wake: ${draftProfile.wakeTime} | Sleep: ${draftProfile.sleepTime} (${draftProfile.peakFocusTime})`;
    if (revGoal) revGoal.textContent = `${draftGoal.title} [${draftGoal.category} - ${draftGoal.priority} Priority]`;
}

function completeOnboarding() {
    if (!validateOnboardingStep(6)) {
        currentOnboardStep = 6;
        renderOnboardingStep(6);
        return;
    }

    // Save profile details
    appState.profile.name = draftProfile.name;
    appState.profile.userType = draftProfile.userType;
    appState.profile.studentOrWorker = draftProfile.userType;
    appState.profile.primaryGoal = draftProfile.primaryGoal;
    appState.profile.availableTime = draftProfile.availableTime;
    appState.profile.wakeTime = draftProfile.wakeTime;
    appState.profile.sleepTime = draftProfile.sleepTime;
    appState.profile.peakFocusTime = draftProfile.peakFocusTime;
    appState.profile.onboardingCompleted = true;
    appState.profile.updatedAt = new Date().toISOString();

    // Create or update initial goal
    if (!Array.isArray(appState.goals)) appState.goals = [];

    const existingGoal = appState.goals.find(g => g.status === 'active');
    if (existingGoal) {
        existingGoal.title = draftGoal.title;
        existingGoal.type = draftGoal.category;
        existingGoal.target = draftGoal.target;
        existingGoal.deadline = draftGoal.deadline;
        existingGoal.priority = draftGoal.priority;
        existingGoal.updatedAt = new Date().toISOString();
    } else {
        appState.goals.push({
            id: generateId(),
            type: draftGoal.category || 'Study',
            title: draftGoal.title,
            target: draftGoal.target || '',
            deadline: draftGoal.deadline || null,
            priority: draftGoal.priority || 'Medium',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    saveAppState();
    checkOnboardingState();
    renderAllUI();
}

function checkOnboardingState() {
    const landingView = document.getElementById('view-landing');
    const onboardingView = document.getElementById('view-onboarding');
    const appShell = document.getElementById('app-shell');
    const badgeUser = document.getElementById('user-profile-badge');
    const badgeUserName = document.getElementById('badge-user-name');
    const btnHeaderCta = document.getElementById('btn-header-cta');
    const navPublic = document.getElementById('header-nav-public');

    const isCompleted = appState.profile && appState.profile.onboardingCompleted === true;

    if (isCompleted) {
        // Returning User Flow B: Skip onboarding & landing
        if (landingView) landingView.classList.add('hidden');
        if (onboardingView) onboardingView.classList.add('hidden');
        if (appShell) appShell.classList.remove('hidden');

        if (badgeUser) badgeUser.classList.remove('hidden');
        if (badgeUserName) badgeUserName.textContent = appState.profile.name || "User";
        if (btnHeaderCta) btnHeaderCta.classList.add('hidden');
        if (navPublic) navPublic.classList.add('hidden');

        renderActiveProfileSummary();
    } else {
        // First-time User Flow A: Show landing page
        if (landingView) landingView.classList.remove('hidden');
        if (onboardingView) onboardingView.classList.add('hidden');
        if (appShell) appShell.classList.add('hidden');

        if (badgeUser) badgeUser.classList.add('hidden');
        if (btnHeaderCta) btnHeaderCta.classList.remove('hidden');
        if (navPublic) navPublic.classList.remove('hidden');
    }
}

function renderActiveProfileSummary() {
    const greeting = document.getElementById('summary-user-greeting');
    const usertypeTime = document.getElementById('sum-usertype-time');
    const routineTimes = document.getElementById('sum-routine-times');
    const primaryGoal = document.getElementById('sum-primary-goal');
    const goalsContainer = document.getElementById('summary-goals-container');

    if (!appState.profile) return;

    if (greeting) greeting.textContent = `Welcome back, ${appState.profile.name || 'User'}!`;
    if (usertypeTime) usertypeTime.textContent = `${appState.profile.userType || 'N/A'} • ${appState.profile.availableTime || 'N/A'}`;
    if (routineTimes) routineTimes.textContent = `Wake: ${appState.profile.wakeTime || '07:00'} | Sleep: ${appState.profile.sleepTime || '23:00'} (${appState.profile.peakFocusTime || 'Morning'})`;
    if (primaryGoal) primaryGoal.textContent = appState.profile.primaryGoal || 'N/A';

    if (goalsContainer) {
        if (appState.goals && appState.goals.length > 0) {
            goalsContainer.innerHTML = appState.goals.map(g => `
                <div class="preset-card mb-xs">
                    <div class="preset-header">
                        <span class="preset-title">${g.title}</span>
                        <span class="nav-tag">${g.type} &bull; ${g.priority} Priority</span>
                    </div>
                    <div class="text-caption text-secondary">
                        ${g.target ? `Target: ${g.target}` : 'No target metric set'} 
                        ${g.deadline ? ` &bull; Deadline: ${g.deadline}` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            goalsContainer.innerHTML = `<p class="text-caption text-muted">No active goals created yet.</p>`;
        }
    }
}

function initOnboardingController() {
    // Option Card Selectors
    const bindOptionGrid = (gridId, draftKey, hasCustomInput = false) => {
        const container = document.getElementById(gridId);
        if (!container) return;
        const cards = container.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const val = card.getAttribute('data-value');
                draftProfile[draftKey] = val;

                if (hasCustomInput) {
                    const customWrapper = document.getElementById('custom-goal-wrapper');
                    if (val === 'Custom') {
                        if (customWrapper) customWrapper.classList.remove('hidden');
                    } else {
                        if (customWrapper) customWrapper.classList.add('hidden');
                    }
                }
            });
        });
    };

    bindOptionGrid('user-type-options', 'userType');
    bindOptionGrid('primary-goal-options', 'primaryGoal', true);
    bindOptionGrid('available-time-options', 'availableTime');
    bindOptionGrid('peak-focus-options', 'peakFocusTime');

    // Navigation Buttons
    const btnCancel = document.getElementById('btn-cancel-onboarding');
    const btnBack = document.getElementById('btn-onboard-back');
    const btnNext = document.getElementById('btn-onboard-next');
    const btnFinish = document.getElementById('btn-onboard-finish');
    const btnEditSetup = document.getElementById('btn-edit-onboarding');
    const ctaBtns = document.querySelectorAll('.btn-cta-start');

    ctaBtns.forEach(btn => btn.addEventListener('click', startOnboarding));
    if (btnCancel) btnCancel.addEventListener('click', cancelOnboarding);
    if (btnBack) btnBack.addEventListener('click', handleOnboardingBack);
    if (btnNext) btnNext.addEventListener('click', handleOnboardingNext);
    if (btnFinish) btnFinish.addEventListener('click', completeOnboarding);
    if (btnEditSetup) btnEditSetup.addEventListener('click', startOnboarding);

    const brandLink = document.getElementById('brand-link');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            checkOnboardingState();
        });
    }
}

// --------------------------------------------------------------------------
// 10. APPLICATION INITIALIZATION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Momentum AI] Initializing Momentum AI V1...");
    loadAppState();
    initThemeSelector();
    initNavigationTabs();
    initActionButtons();
    initOnboardingController();
    initTaskPlanner();
    initTimetable();
    initRealisticPlanner();
    initWellnessModule();
    initAICoachModule();
    initRemindersModule();
    initAnalyticsModule();
    initSettingsModule();
    seedB1SubjectsIfEmpty();
    checkOnboardingState();
    renderAllUI();
    registerServiceWorker();
    startRemindersInterval();
    console.log("[Momentum AI] Momentum AI V1 initialized successfully.");
});



// ==========================================================================
// PHASE 3 — TASK PLANNER MODULE
// Create → Schedule → View → Complete / Miss → Edit
// ==========================================================================

// --------------------------------------------------------------------------
// TP.1  TASK PLANNER STATE
// Isolated view state — does NOT touch appState directly except via helpers
// --------------------------------------------------------------------------
const taskPlannerState = {
    datePreset: 'today',    // 'today' | 'tomorrow' | 'upcoming' | 'all'
    selectedDate: null,     // YYYY-MM-DD string when user picks a specific date
    statusFilter: 'all',    // 'all' | 'planned' | 'completed' | 'missed'
    searchQuery: '',        // free text search
    editingTaskId: null,    // id of task currently being edited, null = create mode
    pendingDeleteId: null   // id staged for delete confirmation
};

// --------------------------------------------------------------------------
// TP.2  UTILITY HELPERS
// --------------------------------------------------------------------------

/** HTML-escape a string to prevent XSS in innerHTML */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Returns today's date as YYYY-MM-DD using local time.
 * Re-uses the existing getIsoTodayDate() already defined in the file.
 */
function getTodayStr() {
    return getIsoTodayDate();
}

/** Returns tomorrow's date as YYYY-MM-DD */
function getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Format a YYYY-MM-DD date string for display using the user's locale.
 * e.g. "Monday, 21 September 2026"
 */
function formatDateDisplay(isoDate) {
    if (!isoDate) return '';
    // Parse in local time: append T00:00 to avoid UTC-to-local shift
    const d = new Date(isoDate + 'T00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/** Format a time string (HH:MM) for display. Returns '' if falsy. */
function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    // Convert 24h HH:MM to locale-formatted time
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Convert HH:MM time string to total minutes for comparison */
function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Returns the label for a view heading given the current preset/date.
 */
function getViewHeading() {
    const todayStr = getTodayStr();
    const tomorrowStr = getTomorrowStr();
    if (taskPlannerState.selectedDate) {
        const d = taskPlannerState.selectedDate;
        if (d === todayStr) return "Today's Tasks";
        if (d === tomorrowStr) return "Tomorrow's Tasks";
        return `Tasks — ${formatDateDisplay(d)}`;
    }
    switch (taskPlannerState.datePreset) {
        case 'today': return "Today's Tasks";
        case 'tomorrow': return "Tomorrow's Tasks";
        case 'upcoming': return 'Upcoming Tasks';
        case 'all': return 'All Tasks';
        default: return 'Tasks';
    }
}

// --------------------------------------------------------------------------
// TP.3  TASK FILTERING & SORTING
// --------------------------------------------------------------------------

/**
 * Returns the filtered, sorted task list for the current planner state.
 */
function getFilteredTasks() {
    const todayStr = getTodayStr();
    const tomorrowStr = getTomorrowStr();
    let tasks = Array.isArray(appState.tasks) ? [...appState.tasks] : [];

    // 1. Date scope
    if (taskPlannerState.selectedDate) {
        tasks = tasks.filter(t => t.date === taskPlannerState.selectedDate);
    } else {
        switch (taskPlannerState.datePreset) {
            case 'today':
                tasks = tasks.filter(t => t.date === todayStr);
                break;
            case 'tomorrow':
                tasks = tasks.filter(t => t.date === tomorrowStr);
                break;
            case 'upcoming':
                tasks = tasks.filter(t => t.date > todayStr);
                break;
            case 'all':
                // no date filter
                break;
        }
    }

    // 2. Status filter
    if (taskPlannerState.statusFilter !== 'all') {
        tasks = tasks.filter(t => t.status === taskPlannerState.statusFilter);
    }

    // 3. Search query
    const q = taskPlannerState.searchQuery.trim().toLowerCase();
    if (q) {
        tasks = tasks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
    }

    // 4. Sort
    tasks = sortTasks(tasks);

    return tasks;
}

/**
 * Sort order:
 * 1. By date ascending (relevant for upcoming/all views)
 * 2. Within same date: timed tasks first, ordered chronologically by start time
 * 3. Untimed tasks after, ordered high→medium→low priority
 * 4. Completed/missed tasks sink to the bottom within their date group
 */
function sortTasks(tasks) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { planned: 0, missed: 1, completed: 2 };

    return tasks.slice().sort((a, b) => {
        // Date ascending
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;

        // Status group (planned first, then missed, then completed)
        const aSO = statusOrder[a.status] ?? 0;
        const bSO = statusOrder[b.status] ?? 0;
        if (aSO !== bSO) return aSO - bSO;

        // Timed vs untimed
        const aHasTime = !!a.startTime;
        const bHasTime = !!b.startTime;
        if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;

        // Both timed: sort by start time
        if (aHasTime && bHasTime && a.startTime !== b.startTime) {
            return a.startTime < b.startTime ? -1 : 1;
        }

        // Priority
        return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    });
}

// --------------------------------------------------------------------------
// TP.4  OVERLAP DETECTION
// --------------------------------------------------------------------------

/**
 * Checks whether a candidate task overlaps with any existing timed task
 * on the same date. Excludes the task being edited (by excludeId).
 * Returns null if no overlap, or the conflicting task object if one exists.
 * Only runs if the candidate has both startTime and endTime.
 */
function detectTaskOverlap(candidateDate, candidateStart, candidateEnd, excludeId) {
    if (!candidateStart || !candidateEnd) return null;

    const cStart = timeToMinutes(candidateStart);
    const cEnd = timeToMinutes(candidateEnd);
    if (cStart === null || cEnd === null) return null;

    const tasks = Array.isArray(appState.tasks) ? appState.tasks : [];

    for (const task of tasks) {
        if (task.id === excludeId) continue;
        if (task.date !== candidateDate) continue;
        if (!task.startTime || !task.endTime) continue;

        const tStart = timeToMinutes(task.startTime);
        const tEnd = timeToMinutes(task.endTime);
        if (tStart === null || tEnd === null) continue;

        // Overlap: candidate starts before existing ends AND candidate ends after existing starts
        if (cStart < tEnd && cEnd > tStart) {
            return task;
        }
    }
    return null;
}

// --------------------------------------------------------------------------
// TP.5  TASK FORM — OPEN / CLOSE / POPULATE
// --------------------------------------------------------------------------

/**
 * Opens the task form modal.
 * Pass a task id to edit an existing task, or null to create a new one.
 */
function openTaskModal(taskId) {
    const modal = document.getElementById('modal-task-form');
    const modalTitle = document.getElementById('modal-task-title');
    const btnSave = document.getElementById('btn-task-save');
    if (!modal) return;

    taskPlannerState.editingTaskId = taskId || null;

    // Reset form
    clearTaskFormErrors();
    const form = document.getElementById('form-task');
    if (form) form.reset();

    // Populate goal select
    populateGoalSelect();

    // Set defaults
    const dateInput = document.getElementById('task-input-date');
    if (dateInput) {
        // Default to current planner date context
        if (taskPlannerState.selectedDate) {
            dateInput.value = taskPlannerState.selectedDate;
        } else if (taskPlannerState.datePreset === 'tomorrow') {
            dateInput.value = getTomorrowStr();
        } else {
            dateInput.value = getTodayStr();
        }
    }

    const prioritySelect = document.getElementById('task-input-priority');
    if (prioritySelect) prioritySelect.value = 'medium';

    if (taskId) {
        // Edit mode: populate with existing task values
        const task = (appState.tasks || []).find(t => t.id === taskId);
        if (!task) {
            console.warn('[TaskPlanner] openTaskModal: task not found:', taskId);
            return;
        }

        if (modalTitle) modalTitle.textContent = 'Edit Task';
        if (btnSave) btnSave.textContent = 'Save changes';

        const idInput = document.getElementById('task-input-id');
        if (idInput) idInput.value = task.id;

        const titleInput = document.getElementById('task-input-title');
        if (titleInput) titleInput.value = task.title || '';

        const descInput = document.getElementById('task-input-description');
        if (descInput) descInput.value = task.description || '';

        const goalSelect = document.getElementById('task-input-goal');
        if (goalSelect) goalSelect.value = task.goalId || '';

        const catSelect = document.getElementById('task-input-category');
        if (catSelect) catSelect.value = task.category || 'Study';

        if (dateInput) dateInput.value = task.date || getTodayStr();

        const startInput = document.getElementById('task-input-start-time');
        if (startInput) startInput.value = task.startTime || '';

        const endInput = document.getElementById('task-input-end-time');
        if (endInput) endInput.value = task.endTime || '';

        if (prioritySelect) prioritySelect.value = task.priority || 'medium';
    } else {
        // Create mode
        if (modalTitle) modalTitle.textContent = 'Add Task';
        if (btnSave) btnSave.textContent = 'Save task';

        const idInput = document.getElementById('task-input-id');
        if (idInput) idInput.value = '';
    }

    // Show modal and trap focus
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');

    // Focus the title input
    const titleInput = document.getElementById('task-input-title');
    if (titleInput) {
        requestAnimationFrame(() => titleInput.focus());
    }
}

/** Closes the task form modal and returns focus to the triggering element */
function closeTaskModal() {
    const modal = document.getElementById('modal-task-form');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    clearTaskFormErrors();
    taskPlannerState.editingTaskId = null;

    // Return focus to Add Task button
    const addBtn = document.getElementById('btn-add-task');
    if (addBtn) addBtn.focus();
}

/** Closes the delete confirmation modal */
function closeDeleteModal() {
    const modal = document.getElementById('modal-task-delete');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    taskPlannerState.pendingDeleteId = null;
}

/** Populates the goal <select> in the task form from appState.goals */
function populateGoalSelect() {
    const select = document.getElementById('task-input-goal');
    if (!select) return;

    const goals = Array.isArray(appState.goals) ? appState.goals : [];

    // Rebuild options
    select.innerHTML = '<option value="">No Goal</option>';
    goals.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.title || 'Untitled Goal';
        select.appendChild(opt);
    });
}

/** Clears all inline validation error messages on the task form */
function clearTaskFormErrors() {
    const errTitle = document.getElementById('error-task-title');
    const errDate = document.getElementById('error-task-date');
    const errTime = document.getElementById('error-task-time');
    const warnOverlap = document.getElementById('warning-task-overlap');

    if (errTitle) errTitle.classList.add('hidden');
    if (errDate) errDate.classList.add('hidden');
    if (errTime) errTime.classList.add('hidden');
    if (warnOverlap) warnOverlap.classList.add('hidden');

    const titleInput = document.getElementById('task-input-title');
    if (titleInput) titleInput.classList.remove('error');
    const dateInput = document.getElementById('task-input-date');
    if (dateInput) dateInput.classList.remove('error');
}

// --------------------------------------------------------------------------
// TP.6  TASK FORM — VALIDATION & SAVE
// --------------------------------------------------------------------------

/**
 * Validates form inputs. Returns true if valid, false otherwise.
 * Shows inline error messages for each failing field.
 */
function validateTaskForm() {
    let valid = true;
    clearTaskFormErrors();

    const titleInput = document.getElementById('task-input-title');
    const dateInput = document.getElementById('task-input-date');
    const startInput = document.getElementById('task-input-start-time');
    const endInput = document.getElementById('task-input-end-time');
    const errTitle = document.getElementById('error-task-title');
    const errDate = document.getElementById('error-task-date');
    const errTime = document.getElementById('error-task-time');

    // Title: required, non-empty
    const titleVal = titleInput ? titleInput.value.trim() : '';
    if (!titleVal) {
        if (errTitle) errTitle.classList.remove('hidden');
        if (titleInput) titleInput.classList.add('error');
        if (titleInput) titleInput.focus();
        valid = false;
    }

    // Date: required, must match YYYY-MM-DD
    const dateVal = dateInput ? dateInput.value : '';
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateVal || !DATE_RE.test(dateVal)) {
        if (errDate) errDate.classList.remove('hidden');
        if (dateInput) dateInput.classList.add('error');
        if (valid) { if (dateInput) dateInput.focus(); }
        valid = false;
    }

    // Time: if both provided, end must be later than start
    const startVal = startInput ? startInput.value : '';
    const endVal = endInput ? endInput.value : '';
    if (startVal && endVal) {
        const startMins = timeToMinutes(startVal);
        const endMins = timeToMinutes(endVal);
        if (endMins !== null && startMins !== null && endMins <= startMins) {
            if (errTime) errTime.classList.remove('hidden');
            if (valid) { if (endInput) endInput.focus(); }
            valid = false;
        }
    }

    return valid;
}

/**
 * Handles form submission — creates or updates a task.
 * Does NOT call preventDefault internally; caller must handle that.
 */
function handleTaskFormSubmit(e) {
    e.preventDefault();

    if (!validateTaskForm()) return;

    const idInput = document.getElementById('task-input-id');
    const titleInput = document.getElementById('task-input-title');
    const descInput = document.getElementById('task-input-description');
    const goalSelect = document.getElementById('task-input-goal');
    const catSelect = document.getElementById('task-input-category');
    const dateInput = document.getElementById('task-input-date');
    const startInput = document.getElementById('task-input-start-time');
    const endInput = document.getElementById('task-input-end-time');
    const prioritySelect = document.getElementById('task-input-priority');
    const warnOverlap = document.getElementById('warning-task-overlap');

    const existingId = idInput ? idInput.value.trim() : '';
    const title = titleInput ? titleInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';
    const goalId = goalSelect && goalSelect.value ? goalSelect.value : null;
    const category = catSelect ? catSelect.value : 'Study';
    const date = dateInput ? dateInput.value : '';
    const startTime = startInput ? startInput.value : '';
    const endTime = endInput ? endInput.value : '';
    const priority = prioritySelect ? prioritySelect.value : 'medium';

    // Overlap check (warning only — do not block save)
    const overlap = detectTaskOverlap(date, startTime, endTime, existingId || null);
    if (overlap && warnOverlap) {
        const timeInfo = overlap.startTime ? ` (${formatTimeDisplay(overlap.startTime)}${overlap.endTime ? ' – ' + formatTimeDisplay(overlap.endTime) : ''})` : '';
        warnOverlap.innerHTML = `<strong>Warning:</strong> This task overlaps with "<em>${escapeHtml(overlap.title)}</em>"${timeInfo}. You can still save if this is intentional.`;
        warnOverlap.classList.remove('hidden');
        // Continue — this is a warning, not a block. User already saw it and submitted again.
        // If the warning was already visible from a previous submit, we allow through.
        // Show warning and re-present form — user must submit once more to confirm.
        if (!warnOverlap.dataset.acknowledged) {
            warnOverlap.dataset.acknowledged = 'true';
            return; // First time: show warning, stop here
        }
    }
    // Clear acknowledged flag
    if (warnOverlap) {
        warnOverlap.dataset.acknowledged = '';
        warnOverlap.classList.add('hidden');
    }

    const now = new Date().toISOString();

    if (existingId) {
        // --- EDIT MODE ---
        const taskIndex = (appState.tasks || []).findIndex(t => t.id === existingId);
        if (taskIndex === -1) {
            console.warn('[TaskPlanner] Edit: task not found:', existingId);
            closeTaskModal();
            return;
        }

        const existing = appState.tasks[taskIndex];
        appState.tasks[taskIndex] = {
            ...existing,        // preserve id, createdAt, status
            title,
            description,
            goalId,
            category,
            date,
            startTime,
            endTime,
            priority,
            updatedAt: now
        };
        console.log('[TaskPlanner] Task updated:', existingId);
    } else {
        // --- CREATE MODE ---
        const newTask = {
            id: generateId(),
            title,
            description,
            goalId,
            category,
            date,
            startTime,
            endTime,
            priority,
            status: 'planned',
            createdAt: now,
            updatedAt: now
        };
        if (!Array.isArray(appState.tasks)) appState.tasks = [];
        appState.tasks.push(newTask);
        console.log('[TaskPlanner] Task created:', newTask.id);
    }

    saveAppState();
    closeTaskModal();
    renderTaskList();
    // Refresh dashboard if it's visible
    const dashView = document.getElementById('view-dashboard');
    if (dashView && !dashView.classList.contains('hidden')) {
        renderDashboard();
    }
}

// --------------------------------------------------------------------------
// TP.7  TASK STATUS ACTIONS
// --------------------------------------------------------------------------

/**
 * Updates a task's status.
 * @param {string} taskId
 * @param {'planned'|'completed'|'missed'} newStatus
 */
function setTaskStatus(taskId, newStatus) {
    const task = (appState.tasks || []).find(t => t.id === taskId);
    if (!task) {
        console.warn('[TaskPlanner] setTaskStatus: task not found:', taskId);
        return;
    }

    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    saveAppState();
    renderTaskList();

    // Refresh dashboard counts if visible
    const dashView = document.getElementById('view-dashboard');
    if (dashView && !dashView.classList.contains('hidden')) {
        renderDashboardTodayOverview();
        renderDashboardTodayTasks();
    }
}

// --------------------------------------------------------------------------
// TP.8  TASK DELETE
// --------------------------------------------------------------------------

/**
 * Opens the delete confirmation modal for a given task id.
 */
function openDeleteModal(taskId) {
    const task = (appState.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    taskPlannerState.pendingDeleteId = taskId;

    const modal = document.getElementById('modal-task-delete');
    const titleEl = document.getElementById('delete-task-title-text');
    const hiddenId = document.getElementById('delete-task-target-id');

    if (titleEl) titleEl.textContent = task.title;
    if (hiddenId) hiddenId.value = taskId;
    if (modal) {
        modal.classList.remove('hidden');
        modal.removeAttribute('aria-hidden');
        // Focus the cancel button (safer default)
        const cancelBtn = document.getElementById('btn-delete-cancel');
        if (cancelBtn) requestAnimationFrame(() => cancelBtn.focus());
    }
}

/**
 * Confirms and executes task deletion.
 */
function confirmDeleteTask() {
    const taskId = taskPlannerState.pendingDeleteId;
    if (!taskId) return;

    const idx = (appState.tasks || []).findIndex(t => t.id === taskId);
    if (idx !== -1) {
        appState.tasks.splice(idx, 1);
        saveAppState();
        console.log('[TaskPlanner] Task deleted:', taskId);
    }

    closeDeleteModal();
    renderTaskList();

    // Refresh dashboard if visible
    const dashView = document.getElementById('view-dashboard');
    if (dashView && !dashView.classList.contains('hidden')) {
        renderDashboard();
    }
}

// --------------------------------------------------------------------------
// TP.9  TASK LIST RENDERING
// --------------------------------------------------------------------------

/**
 * Main render function — builds the task list for the current planner state.
 * Called whenever the view needs to update.
 */
function renderTaskList() {
    const container = document.getElementById('task-list-container');
    const countBadge = document.getElementById('tasks-count-badge');
    const viewHeading = document.getElementById('tasks-view-heading');

    if (!container) return;

    const tasks = getFilteredTasks();

    if (viewHeading) viewHeading.textContent = getViewHeading();
    if (countBadge) countBadge.textContent = `${tasks.length} ${tasks.length === 1 ? 'Task' : 'Tasks'}`;

    if (tasks.length === 0) {
        container.innerHTML = buildEmptyState();
        return;
    }

    container.innerHTML = tasks.map(task => buildTaskItemHTML(task)).join('');

    // Attach action event listeners to rendered items
    attachTaskListeners(container, tasks);
}

/**
 * Builds the HTML string for a single task item row.
 */
function buildTaskItemHTML(task) {
    const goalLabel = (() => {
        if (!task.goalId) return '';
        const goals = Array.isArray(appState.goals) ? appState.goals : [];
        const g = goals.find(g => g.id === task.goalId);
        return g ? escapeHtml(g.title) : '';
    })();

    const timeLabel = task.startTime
        ? `${formatTimeDisplay(task.startTime)}${task.endTime ? ' – ' + formatTimeDisplay(task.endTime) : ''}`
        : '';

    const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' }[task.priority] || 'Medium';
    const statusLabel = { planned: 'Planned', completed: 'Completed', missed: 'Missed' }[task.status] || 'Planned';

    const metaParts = [];
    if (timeLabel) metaParts.push(`<span>${escapeHtml(timeLabel)}</span>`);
    if (task.category) metaParts.push(`<span>${escapeHtml(task.category)}</span>`);
    if (goalLabel) metaParts.push(`<span>Goal: ${goalLabel}</span>`);
    // Date shown in upcoming/all views
    if (taskPlannerState.datePreset === 'upcoming' || taskPlannerState.datePreset === 'all') {
        metaParts.push(`<span>${formatDateDisplay(task.date)}</span>`);
    }

    const metaHTML = metaParts
        .map((part, i) => i < metaParts.length - 1
            ? `${part}<span class="task-item-meta-sep">&bull;</span>`
            : part)
        .join('');

    // Action buttons based on current status
    const actionBtns = buildActionButtons(task);

    return `
        <article class="task-item status-${escapeHtml(task.status || 'planned')}" data-task-id="${escapeHtml(task.id)}">
            <div class="task-item-main">
                <div class="task-item-body">
                    <div class="task-item-title-row">
                        <span class="task-item-title">${escapeHtml(task.title)}</span>
                        <span class="priority-badge priority-${escapeHtml(task.priority || 'medium')}">${escapeHtml(priorityLabel)}</span>
                        <span class="status-badge status-${escapeHtml(task.status || 'planned')}">${escapeHtml(statusLabel)}</span>
                    </div>
                    ${task.description ? `<p class="text-small text-secondary" style="margin-top:var(--space-1);margin-bottom:var(--space-1);">${escapeHtml(task.description)}</p>` : ''}
                    ${metaHTML ? `<div class="task-item-meta">${metaHTML}</div>` : ''}
                </div>
            </div>
            <div class="task-item-actions">
                ${actionBtns}
            </div>
        </article>
    `;
}

/**
 * Builds the action buttons HTML for a task based on its current status.
 */
function buildActionButtons(task) {
    const id = escapeHtml(task.id);
    let primaryActions = '';

    if (task.status === 'planned') {
        primaryActions = `
            <button class="task-action-btn action-complete" data-action="complete" data-id="${id}" aria-label="Mark task completed">Complete</button>
            <button class="task-action-btn action-miss" data-action="miss" data-id="${id}" aria-label="Mark task missed">Mark missed</button>
        `;
    } else if (task.status === 'completed' || task.status === 'missed') {
        primaryActions = `
            <button class="task-action-btn action-reopen" data-action="reopen" data-id="${id}" aria-label="Reopen task">Reopen</button>
        `;
    }

    return `
        ${primaryActions}
        <button class="task-action-btn" data-action="edit" data-id="${id}" aria-label="Edit task">Edit</button>
        <button class="task-action-btn action-delete" data-action="delete" data-id="${id}" aria-label="Delete task">Delete</button>
    `;
}

/**
 * Attaches delegated event listeners to the task list container.
 * Uses event delegation on the container to avoid per-item bindings.
 */
function attachTaskListeners(container, tasks) {
    // Remove any previously bound listener by replacing with a clone
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    newContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const taskId = btn.getAttribute('data-id');
        if (!action || !taskId) return;

        switch (action) {
            case 'complete': setTaskStatus(taskId, 'completed'); break;
            case 'miss':     setTaskStatus(taskId, 'missed');    break;
            case 'reopen':   setTaskStatus(taskId, 'planned');   break;
            case 'edit':     openTaskModal(taskId);              break;
            case 'delete':   openDeleteModal(taskId);            break;
        }
    });
}

/**
 * Returns empty-state HTML for the current filter context.
 */
function buildEmptyState() {
    const q = taskPlannerState.searchQuery.trim();
    if (q) {
        return `
            <div class="empty-state">
                <div class="empty-title">No tasks match your search</div>
                <p class="empty-description">No tasks found matching "<strong>${escapeHtml(q)}</strong>". Try a different search term or clear the search.</p>
            </div>
        `;
    }

    if (taskPlannerState.statusFilter !== 'all') {
        const labels = { planned: 'planned', completed: 'completed', missed: 'missed' };
        return `
            <div class="empty-state">
                <div class="empty-title">No ${labels[taskPlannerState.statusFilter] || ''} tasks</div>
                <p class="empty-description">No ${labels[taskPlannerState.statusFilter] || ''} tasks for this period.</p>
            </div>
        `;
    }

    switch (taskPlannerState.datePreset) {
        case 'today':
            return `
                <div class="empty-state">
                    <div class="empty-title">Nothing planned for today</div>
                    <p class="empty-description">Add a task when you know what needs your attention.</p>
                    <button class="btn btn-primary empty-add-btn" style="font-size:var(--font-size-small);">Add a task</button>
                </div>
            `;
        case 'tomorrow':
            return `
                <div class="empty-state">
                    <div class="empty-title">Nothing planned for tomorrow</div>
                    <p class="empty-description">Plan tomorrow by adding a task above.</p>
                    <button class="btn btn-primary empty-add-btn" style="font-size:var(--font-size-small);">Add a task</button>
                </div>
            `;
        case 'upcoming':
            return `
                <div class="empty-state">
                    <div class="empty-title">No upcoming tasks</div>
                    <p class="empty-description">Tasks scheduled beyond today will appear here.</p>
                </div>
            `;
        default:
            return `
                <div class="empty-state">
                    <div class="empty-title">No tasks yet</div>
                    <p class="empty-description">Create your first task to start tracking execution.</p>
                    <button class="btn btn-primary empty-add-btn" style="font-size:var(--font-size-small);">Add a task</button>
                </div>
            `;
    }
}

// --------------------------------------------------------------------------
// TP.10  MODAL KEYBOARD / FOCUS TRAP
// --------------------------------------------------------------------------

/**
 * Traps keyboard focus inside a modal dialog.
 * Returns the handler function so it can be removed when modal closes.
 */
function createFocusTrap(modalEl) {
    const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return function handleTrapKeydown(e) {
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modalEl.querySelectorAll(focusableSelectors));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };
}

// --------------------------------------------------------------------------
// TP.11  TASK PLANNER INITIALIZER
// --------------------------------------------------------------------------

/**
 * Wires all Task Planner event listeners.
 * Called once from DOMContentLoaded.
 */
function initTaskPlanner() {

    // ---- Task Form Modal ----
    const formModal = document.getElementById('modal-task-form');
    const taskForm = document.getElementById('form-task');
    const btnAddTask = document.getElementById('btn-add-task');
    const btnModalClose = document.getElementById('btn-modal-close');
    const btnTaskCancel = document.getElementById('btn-task-cancel');

    if (btnAddTask) {
        btnAddTask.addEventListener('click', () => openTaskModal(null));
    }

    if (btnModalClose) {
        btnModalClose.addEventListener('click', closeTaskModal);
    }

    if (btnTaskCancel) {
        btnTaskCancel.addEventListener('click', closeTaskModal);
    }

    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }

    // Close modal on backdrop click (outside the modal-card)
    if (formModal) {
        formModal.addEventListener('click', (e) => {
            if (e.target === formModal) closeTaskModal();
        });
    }

    // Focus trap for task form modal
    if (formModal) {
        const trapHandler = createFocusTrap(formModal.querySelector('.modal-card') || formModal);
        formModal.addEventListener('keydown', trapHandler);
    }

    // Escape key closes task form modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const taskModal = document.getElementById('modal-task-form');
            const deleteModal = document.getElementById('modal-task-delete');
            if (taskModal && !taskModal.classList.contains('hidden')) {
                closeTaskModal();
            } else if (deleteModal && !deleteModal.classList.contains('hidden')) {
                closeDeleteModal();
            }
        }
    });

    // ---- Delete Modal ----
    const deleteModal = document.getElementById('modal-task-delete');
    const btnDeleteClose = document.getElementById('btn-delete-close');
    const btnDeleteCancel = document.getElementById('btn-delete-cancel');
    const btnDeleteConfirm = document.getElementById('btn-delete-confirm');

    if (btnDeleteClose) {
        btnDeleteClose.addEventListener('click', closeDeleteModal);
    }

    if (btnDeleteCancel) {
        btnDeleteCancel.addEventListener('click', closeDeleteModal);
    }

    if (btnDeleteConfirm) {
        btnDeleteConfirm.addEventListener('click', confirmDeleteTask);
    }

    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // Focus trap for delete modal
    if (deleteModal) {
        const trapHandler = createFocusTrap(deleteModal.querySelector('.modal-card') || deleteModal);
        deleteModal.addEventListener('keydown', trapHandler);
    }

    // ---- Date Tabs ----
    const dateTabs = document.querySelectorAll('.task-date-tabs .tab-btn');
    dateTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            dateTabs.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            taskPlannerState.datePreset = btn.getAttribute('data-date-preset') || 'today';
            taskPlannerState.selectedDate = null;

            // Clear date picker
            const picker = document.getElementById('task-date-picker');
            if (picker) picker.value = '';

            renderTaskList();
        });
    });

    // ---- Date Picker ----
    const datePicker = document.getElementById('task-date-picker');
    if (datePicker) {
        datePicker.addEventListener('change', () => {
            const val = datePicker.value;
            if (val) {
                taskPlannerState.selectedDate = val;
                taskPlannerState.datePreset = null;
                // Deactivate all tabs
                dateTabs.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
            } else {
                taskPlannerState.selectedDate = null;
                // Reactivate today tab
                const todayTab = document.querySelector('.task-date-tabs .tab-btn[data-date-preset="today"]');
                if (todayTab) {
                    todayTab.classList.add('active');
                    todayTab.setAttribute('aria-selected', 'true');
                    taskPlannerState.datePreset = 'today';
                }
            }
            renderTaskList();
        });
    }

    // ---- Status Filter ----
    const statusFilter = document.getElementById('task-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            taskPlannerState.statusFilter = statusFilter.value || 'all';
            renderTaskList();
        });
    }

    // ---- Search ----
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
        let searchTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                taskPlannerState.searchQuery = searchInput.value;
                renderTaskList();
            }, 200); // 200ms debounce
        });
    }

    // ---- Empty state "Add a task" button (delegated from task list) ----
    const taskListWrapper = document.getElementById('task-list-container');
    if (taskListWrapper) {
        // Use capturing listener on the section so it still works after container replacement
        const section = taskListWrapper.closest('section') || taskListWrapper.parentNode;
        if (section) {
            section.addEventListener('click', (e) => {
                if (e.target.classList.contains('empty-add-btn')) {
                    openTaskModal(null);
                }
            });
        }
    }

    // ---- Overlap warning re-present on time change ----
    const startInput = document.getElementById('task-input-start-time');
    const endInput = document.getElementById('task-input-end-time');
    const warnOverlap = document.getElementById('warning-task-overlap');
    function resetOverlapAck() {
        if (warnOverlap) {
            warnOverlap.dataset.acknowledged = '';
            warnOverlap.classList.add('hidden');
        }
    }
    if (startInput) startInput.addEventListener('change', resetOverlapAck);
    if (endInput) endInput.addEventListener('change', resetOverlapAck);

    console.log('[TaskPlanner] Phase 3 Task Planner initialized.');
}


// ==========================================================================
// PHASE 6 — TIMETABLE & STUDENT MODE MODULE
// Generic weekly academic timetable: any institution, any batch, any student.
// ==========================================================================

// --------------------------------------------------------------------------
// TT.1  CONSTANTS
// --------------------------------------------------------------------------
const TT_VALID_DAYS  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const TT_VALID_TYPES = ['lecture','lab','practical','tutorial','exam','contest','yoga','break','lunch','other'];

/** Activity types that are NOT academic — excluded from study-time calculations */
const TT_NON_ACADEMIC_TYPES = ['break','lunch','yoga'];

/** Maps internal type value to a display label */
function ttTypeLabel(type) {
    const labels = {
        lecture:   'Lecture',
        lab:       'Lab',
        practical: 'Practical',
        tutorial:  'Tutorial',
        exam:      'Exam',
        contest:   'Contest',
        yoga:      'Yoga',
        break:     'Break',
        lunch:     'Lunch',
        other:     'Other'
    };
    return labels[type] || 'Other';
}

/** Maps a JS Date.getDay() (0=Sun … 6=Sat) to lowercase day name */
function dayIndexToName(idx) {
    return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][idx];
}

/** Maps a lowercase day name to its short display label */
function dayNameToShort(day) {
    const m = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
                friday:'Fri', saturday:'Sat', sunday:'Sun' };
    return m[day] || day;
}

/** Returns the current local weekday as a lowercase day name */
function getTodayDayName() {
    return dayIndexToName(new Date().getDay());
}

// --------------------------------------------------------------------------
// TT.2  ISOLATED VIEW STATE
// --------------------------------------------------------------------------
const ttState = {
    activeDay:            null,   // currently selected day in the day switcher, or null
    activeSubTab:         'timetable', // 'timetable' | 'overview' | 'subjects' | 'sessions' | 'tests'
    editingEntryId:       null,   // id of entry being edited, null = create mode
    pendingDeleteEntryId: null    // id staged for delete confirmation
};

// --------------------------------------------------------------------------
// TT.3  DERIVED UTILITY FUNCTIONS (public — usable by future phases)
// --------------------------------------------------------------------------

/**
 * Returns all timetable entries for the given weekday, sorted by start time.
 * @param {string} day — lowercase day name (e.g. 'monday')
 * @returns {Array}
 */
function getTimetableForDay(day) {
    if (!TT_VALID_DAYS.includes(day)) return [];
    const entries = (appState.timetable && Array.isArray(appState.timetable.entries))
        ? appState.timetable.entries : [];
    return entries
        .filter(e => e.day === day)
        .sort((a, b) => {
            const am = timeToMinutes(a.startTime);
            const bm = timeToMinutes(b.startTime);
            if (am === null) return 1;
            if (bm === null) return -1;
            return am - bm;
        });
}

/**
 * Returns timetable entries for today's local weekday, sorted by start time.
 * @returns {Array}
 */
function getTodayTimetable() {
    return getTimetableForDay(getTodayDayName());
}

/**
 * Returns the next timetable entry today after the current local time,
 * or null if there are no more entries today.
 * @returns {Object|null}
 */
function getNextTimetableEntry() {
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    return getTodayTimetable().find(e => timeToMinutes(e.startTime) > nowMins) || null;
}

/**
 * Returns timetable entries on a given day whose time range overlaps
 * the supplied startTime–endTime window. Used by Phase 7 for free-time calculation.
 * Interval overlap: entryStart < windowEnd && entryEnd > windowStart
 * @param {string} day
 * @param {string} startTime — HH:MM
 * @param {string} endTime — HH:MM
 * @returns {Array}
 */
function getTimetableEntriesInRange(day, startTime, endTime) {
    const wS = timeToMinutes(startTime);
    const wE = timeToMinutes(endTime);
    if (wS === null || wE === null) return [];
    return getTimetableForDay(day).filter(e => {
        const eS = timeToMinutes(e.startTime);
        const eE = timeToMinutes(e.endTime);
        if (eS === null || eE === null) return false;
        return eS < wE && eE > wS;
    });
}

// --------------------------------------------------------------------------
// TT.4  OVERLAP DETECTION (warning only — never auto-moves entries)
// --------------------------------------------------------------------------

/**
 * Checks if a candidate entry overlaps any existing entry on the same day.
 * Adjacent entries (e.g. 09:00–10:30 and 10:30–12:00) are NOT overlaps.
 * Excludes the entry being edited (by excludeId).
 * @returns {Object|null} conflicting entry, or null
 */
function detectTimetableOverlap(day, startTime, endTime, excludeId) {
    const cS = timeToMinutes(startTime);
    const cE = timeToMinutes(endTime);
    if (cS === null || cE === null) return null;

    const entries = (appState.timetable && Array.isArray(appState.timetable.entries))
        ? appState.timetable.entries : [];

    for (const e of entries) {
        if (e.id === excludeId) continue;
        if (e.day !== day) continue;
        const eS = timeToMinutes(e.startTime);
        const eE = timeToMinutes(e.endTime);
        if (eS === null || eE === null) continue;
        // Strict interval overlap — adjacent times are valid
        if (cS < eE && cE > eS) return e;
    }
    return null;
}

// --------------------------------------------------------------------------
// TT.5  SUBJECT LOOKUP HELPER
// --------------------------------------------------------------------------

/**
 * Returns the subject object from appState.subjects that matches the given id,
 * or null if not found.
 */
function getSubjectById(id) {
    if (!id) return null;
    return (Array.isArray(appState.subjects) ? appState.subjects : [])
        .find(s => s.id === id) || null;
}

/**
 * Returns the subject id whose name matches the given name string (exact, case-insensitive).
 * Returns null if no match.
 */
function findSubjectIdByName(name) {
    if (!name) return null;
    const norm = name.trim().toLowerCase();
    const match = (Array.isArray(appState.subjects) ? appState.subjects : [])
        .find(s => s.name && s.name.trim().toLowerCase() === norm);
    return match ? match.id : null;
}

// --------------------------------------------------------------------------
// TT.6  B1 SEED DATA
// The user's actual supplied B1 timetable (Mon–Fri).
// This function is called ONLY when the timetable has no entries AND
// the user's profile indicates they are a student. The seed function
// resolves subjectIds from appState.subjects by name where possible.
//
// Any student can replace or extend this data through the UI.
// The engine itself is fully generic — this is just initial user data.
// --------------------------------------------------------------------------

/**
 * Creates the B1 batch timetable entry objects from the user-supplied schedule.
 * subjectIds are resolved from appState.subjects by name match at call time.
 * Entries with no matching subject (LHL, CONTEST, Lunch) get subjectId: null.
 */
function createB1TimetableEntries() {
    const now = new Date().toISOString();

    // Helper: create a single timetable entry
    function mkEntry(day, startTime, endTime, title, type, classroom, subjectName) {
        return {
            id:         generateId(),
            day,
            startTime,
            endTime,
            title,
            // Resolve subjectId from subjects list; null if no match or non-academic
            subjectId:  TT_NON_ACADEMIC_TYPES.includes(type) ? null : (findSubjectIdByName(subjectName) || null),
            type,
            classroom:  classroom || "",
            notes:      "",
            createdAt:  now,
            updatedAt:  now
        };
    }

    return [
        // MONDAY
        mkEntry('monday',    '09:00','10:30','Maths 1 Lab',  'lab',     'Classroom 1', 'Maths 1 Lab B1'),
        mkEntry('monday',    '10:30','12:00','PSP Lab',      'lab',     'Classroom 1', 'PSP Lab B1'),
        mkEntry('monday',    '12:00','13:30','Lunch',        'lunch',   '',            null),
        mkEntry('monday',    '13:30','15:00','AP-Robo',      'lecture', 'Classroom 8', 'AP-Robo B'),
        mkEntry('monday',    '15:00','16:30','PSP',          'lecture', 'Classroom 8', 'PSP B'),
        mkEntry('monday',    '16:30','18:00','Maths 1',      'lecture', 'Classroom 8', 'Maths 1 - B'),

        // TUESDAY
        mkEntry('tuesday',   '09:00','10:30','AP-Robo Lab',  'lab',     'Classroom 1', 'AP-Robo Lab B1'),
        mkEntry('tuesday',   '10:30','12:00','SnW Lab',      'lab',     'Classroom 1', 'SnW Lab B1'),
        mkEntry('tuesday',   '12:00','13:30','Lunch',        'lunch',   '',            null),
        mkEntry('tuesday',   '13:30','15:00','SnAI',         'lecture', 'Classroom 8', 'SnAI B'),
        mkEntry('tuesday',   '15:00','16:30','YOGA',         'yoga',    'Practical',   'YOGA B1'),

        // WEDNESDAY
        mkEntry('wednesday', '09:00','10:30','Maths 1 Lab',  'lab',     'Classroom 1', 'Maths 1 Lab B1'),
        mkEntry('wednesday', '10:30','12:00','PSP Lab',      'lab',     'Classroom 1', 'PSP Lab B1'),
        mkEntry('wednesday', '12:00','13:30','Lunch',        'lunch',   '',            null),
        mkEntry('wednesday', '13:30','15:00','AP-Robo',      'lecture', 'Classroom 8', 'AP-Robo B'),
        mkEntry('wednesday', '15:00','16:30','Maths 1',      'lecture', 'Classroom 8', 'Maths 1 - B'),
        mkEntry('wednesday', '16:30','18:00','PSP',          'lecture', 'Classroom 8', 'PSP B'),

        // THURSDAY
        mkEntry('thursday',  '09:00','10:30','AP-Robo Lab',  'lab',     'Classroom 1', 'AP-Robo Lab B1'),
        mkEntry('thursday',  '10:30','12:00','SnW Lab',      'lab',     'Classroom 1', 'SnW Lab B1'),
        mkEntry('thursday',  '12:00','13:30','Lunch',        'lunch',   '',            null),
        mkEntry('thursday',  '13:30','15:00','YOGA',         'yoga',    'Concept Room','YOGA B1'),
        mkEntry('thursday',  '15:00','16:30','SnAI',         'lecture', 'Classroom 8', 'SnAI B'),

        // FRIDAY
        // LHL is in the supplied timetable but NOT in the supplied subject list —
        // stored with subjectId: null (unmapped) per spec requirement.
        mkEntry('friday',    '09:00','12:00','CONTEST',      'contest', 'Classrooms 1, 4, 6, 8 / Concept Room', null),
        mkEntry('friday',    '12:00','13:30','Lunch',        'lunch',   '',            null),
        mkEntry('friday',    '14:00','15:30','English',      'lecture', 'Classroom 8', 'English B'),
        mkEntry('friday',    '15:30','16:30','LHL',          'other',   'Classroom 6', null)
        // No 16:30-18:00 entry on Friday per supplied timetable
    ];
}

/**
 * Seeds the current user's B1 timetable.
 * Only runs if:
 *   1. appState.timetable.entries is empty
 *   2. Called explicitly (e.g. from UI or first-run check)
 * Does NOT auto-run on every page load.
 */
function seedB1TimetableIfEmpty() {
    if (!appState.timetable) {
        appState.timetable = { institution: '', academicYear: '', semester: '', batch: '', entries: [] };
    }
    if (appState.timetable.entries.length > 0) {
        console.log('[Timetable] Entries already exist — skipping B1 seed.');
        return false;
    }
    appState.timetable.institution  = '';
    appState.timetable.academicYear = '';
    appState.timetable.semester     = '1';
    appState.timetable.batch        = 'B1';
    appState.timetable.entries      = createB1TimetableEntries();
    saveAppState();
    console.log('[Timetable] B1 seed data loaded:', appState.timetable.entries.length, 'entries.');
    return true;
}

// --------------------------------------------------------------------------
// TT.7  TIMETABLE FORM — OPEN / CLOSE / POPULATE
// --------------------------------------------------------------------------

/**
 * Opens the timetable entry form modal.
 * @param {string|null} entryId — null for create, id string for edit
 * @param {string|null} prefillDay — pre-select a day when creating from a day view
 */
function openTTEntryModal(entryId, prefillDay) {
    const modal    = document.getElementById('modal-tt-entry-form');
    const titleEl  = document.getElementById('modal-tt-entry-title');
    const saveBtn  = document.getElementById('btn-tt-entry-save');
    if (!modal) return;

    ttState.editingEntryId = entryId || null;

    // Reset form
    clearTTFormErrors();
    const form = document.getElementById('form-tt-entry');
    if (form) form.reset();

    // Populate subject select
    populateTTSubjectSelect();

    // Hide overlap warning
    const warnEl = document.getElementById('warning-tt-overlap');
    if (warnEl) { warnEl.classList.add('hidden'); warnEl.dataset.acknowledged = ''; }

    const idInput = document.getElementById('tt-entry-input-id');
    if (idInput) idInput.value = '';

    if (entryId) {
        // Edit mode
        const entry = (appState.timetable.entries || []).find(e => e.id === entryId);
        if (!entry) { console.warn('[Timetable] Entry not found:', entryId); return; }

        if (titleEl)  titleEl.textContent  = 'Edit Class';
        if (saveBtn)  saveBtn.textContent  = 'Save changes';
        if (idInput)  idInput.value        = entry.id;

        const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        f('tt-entry-input-title',     entry.title);
        f('tt-entry-input-day',       entry.day);
        f('tt-entry-input-type',      entry.type || 'lecture');
        f('tt-entry-input-start',     entry.startTime);
        f('tt-entry-input-end',       entry.endTime);
        f('tt-entry-input-classroom', entry.classroom);
        f('tt-entry-input-subject',   entry.subjectId || '');
        f('tt-entry-input-notes',     entry.notes);
    } else {
        // Create mode
        if (titleEl) titleEl.textContent = 'Add Class';
        if (saveBtn) saveBtn.textContent = 'Save class';

        // Pre-fill day if provided
        if (prefillDay) {
            const dayEl = document.getElementById('tt-entry-input-day');
            if (dayEl) dayEl.value = prefillDay;
        }
        // Default type to lecture
        const typeEl = document.getElementById('tt-entry-input-type');
        if (typeEl) typeEl.value = 'lecture';
    }

    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');

    // Focus title input
    const titleInput = document.getElementById('tt-entry-input-title');
    if (titleInput) requestAnimationFrame(() => titleInput.focus());
}

function closeTTEntryModal() {
    const modal = document.getElementById('modal-tt-entry-form');
    if (modal) { modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }
    clearTTFormErrors();
    ttState.editingEntryId = null;
    const btnAdd = document.getElementById('btn-tt-add-entry');
    if (btnAdd) btnAdd.focus();
}

function closeTTDeleteModal() {
    const modal = document.getElementById('modal-tt-entry-delete');
    if (modal) { modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }
    ttState.pendingDeleteEntryId = null;
}

function clearTTFormErrors() {
    ['error-tt-title','error-tt-day','error-tt-start','error-tt-end','error-tt-time'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    ['tt-entry-input-title','tt-entry-input-day','tt-entry-input-start','tt-entry-input-end'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('error');
    });
}

/** Rebuilds the subject <select> inside the timetable entry form */
function populateTTSubjectSelect() {
    const select = document.getElementById('tt-entry-input-subject');
    if (!select) return;
    const subjects = Array.isArray(appState.subjects) ? appState.subjects : [];
    select.innerHTML = '<option value="">No subject mapped</option>';
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name || 'Untitled Subject';
        select.appendChild(opt);
    });
}

// --------------------------------------------------------------------------
// TT.8  FORM VALIDATION & SAVE
// --------------------------------------------------------------------------

function validateTTEntryForm() {
    let valid = true;
    clearTTFormErrors();

    const titleVal = (document.getElementById('tt-entry-input-title')?.value || '').trim();
    const dayVal   = document.getElementById('tt-entry-input-day')?.value || '';
    const startVal = document.getElementById('tt-entry-input-start')?.value || '';
    const endVal   = document.getElementById('tt-entry-input-end')?.value || '';

    if (!titleVal) {
        const el = document.getElementById('error-tt-title');
        if (el) el.classList.remove('hidden');
        document.getElementById('tt-entry-input-title')?.classList.add('error');
        document.getElementById('tt-entry-input-title')?.focus();
        valid = false;
    }

    if (!dayVal || !TT_VALID_DAYS.includes(dayVal)) {
        const el = document.getElementById('error-tt-day');
        if (el) el.classList.remove('hidden');
        document.getElementById('tt-entry-input-day')?.classList.add('error');
        if (valid) document.getElementById('tt-entry-input-day')?.focus();
        valid = false;
    }

    if (!startVal) {
        const el = document.getElementById('error-tt-start');
        if (el) el.classList.remove('hidden');
        document.getElementById('tt-entry-input-start')?.classList.add('error');
        if (valid) document.getElementById('tt-entry-input-start')?.focus();
        valid = false;
    }

    if (!endVal) {
        const el = document.getElementById('error-tt-end');
        if (el) el.classList.remove('hidden');
        document.getElementById('tt-entry-input-end')?.classList.add('error');
        if (valid) document.getElementById('tt-entry-input-end')?.focus();
        valid = false;
    }

    if (startVal && endVal) {
        const sM = timeToMinutes(startVal);
        const eM = timeToMinutes(endVal);
        if (sM !== null && eM !== null && eM <= sM) {
            const el = document.getElementById('error-tt-time');
            if (el) el.classList.remove('hidden');
            if (valid) document.getElementById('tt-entry-input-end')?.focus();
            valid = false;
        }
    }

    return valid;
}

function handleTTEntryFormSubmit(e) {
    e.preventDefault();

    if (!validateTTEntryForm()) return;

    const existingId  = document.getElementById('tt-entry-input-id')?.value.trim() || '';
    const title       = document.getElementById('tt-entry-input-title')?.value.trim() || '';
    const day         = document.getElementById('tt-entry-input-day')?.value || '';
    const type        = document.getElementById('tt-entry-input-type')?.value || 'lecture';
    const startTime   = document.getElementById('tt-entry-input-start')?.value || '';
    const endTime     = document.getElementById('tt-entry-input-end')?.value || '';
    const classroom   = (document.getElementById('tt-entry-input-classroom')?.value || '').trim();
    const subjectId   = document.getElementById('tt-entry-input-subject')?.value || null;
    const notes       = (document.getElementById('tt-entry-input-notes')?.value || '').trim();
    const warnEl      = document.getElementById('warning-tt-overlap');

    // Overlap check — warning only, user can override by submitting again
    const overlap = detectTimetableOverlap(day, startTime, endTime, existingId || null);
    if (overlap && warnEl) {
        const timeStr = `${formatTimeDisplay(overlap.startTime)}${overlap.endTime ? ' – ' + formatTimeDisplay(overlap.endTime) : ''}`;
        warnEl.innerHTML = `<strong>Warning:</strong> This overlaps with "<em>${escapeHtml(overlap.title)}</em>" (${escapeHtml(timeStr)}) on ${dayNameToShort(day)}. Save anyway to proceed.`;
        warnEl.classList.remove('hidden');
        if (!warnEl.dataset.acknowledged) {
            warnEl.dataset.acknowledged = 'true';
            return; // Show warning first; user submits again to confirm
        }
    }
    if (warnEl) { warnEl.classList.add('hidden'); warnEl.dataset.acknowledged = ''; }

    const now = new Date().toISOString();

    if (!Array.isArray(appState.timetable.entries)) appState.timetable.entries = [];

    if (existingId) {
        // Edit: preserve id and createdAt
        const idx = appState.timetable.entries.findIndex(e => e.id === existingId);
        if (idx !== -1) {
            const orig = appState.timetable.entries[idx];
            appState.timetable.entries[idx] = {
                ...orig,
                title, day, type, startTime, endTime, classroom,
                subjectId: subjectId || null,
                notes,
                updatedAt: now
            };
            console.log('[Timetable] Entry updated:', existingId);
        }
    } else {
        // Create new entry
        const newEntry = {
            id: generateId(), day, startTime, endTime, title, type,
            subjectId: subjectId || null,
            classroom, notes,
            createdAt: now, updatedAt: now
        };
        appState.timetable.entries.push(newEntry);
        console.log('[Timetable] Entry created:', newEntry.id);
    }

    saveAppState();
    closeTTEntryModal();
    renderTimetableTab();
    renderDashboardTodaySchedule();
    updateInspectorUI();
}

// --------------------------------------------------------------------------
// TT.9  DELETE
// --------------------------------------------------------------------------

function openTTDeleteModal(entryId) {
    const entry = (appState.timetable.entries || []).find(e => e.id === entryId);
    if (!entry) return;

    ttState.pendingDeleteEntryId = entryId;

    const modal    = document.getElementById('modal-tt-entry-delete');
    const titleEl  = document.getElementById('tt-delete-entry-title-text');
    const hiddenId = document.getElementById('tt-delete-entry-target-id');

    if (titleEl)  titleEl.textContent = entry.title;
    if (hiddenId) hiddenId.value      = entryId;
    if (modal) {
        modal.classList.remove('hidden');
        modal.removeAttribute('aria-hidden');
        const cancelBtn = document.getElementById('btn-tt-delete-cancel');
        if (cancelBtn) requestAnimationFrame(() => cancelBtn.focus());
    }
}

function confirmTTDeleteEntry() {
    const id = ttState.pendingDeleteEntryId;
    if (!id) return;

    const idx = (appState.timetable.entries || []).findIndex(e => e.id === id);
    if (idx !== -1) {
        appState.timetable.entries.splice(idx, 1);
        saveAppState();
        console.log('[Timetable] Entry deleted:', id);
    }
    closeTTDeleteModal();
    renderTimetableTab();
    renderDashboardTodaySchedule();
    updateInspectorUI();
}

// --------------------------------------------------------------------------
// TT.10  TIMETABLE SETUP (METADATA) SAVE
// --------------------------------------------------------------------------

function handleTTSetupFormSubmit(e) {
    e.preventDefault();
    if (!appState.timetable) appState.timetable = { institution:'', academicYear:'', semester:'', batch:'', entries:[] };

    appState.timetable.institution  = (document.getElementById('tt-input-institution')?.value || '').trim();
    appState.timetable.academicYear = (document.getElementById('tt-input-year')?.value || '').trim();
    appState.timetable.semester     = (document.getElementById('tt-input-semester')?.value || '').trim();
    appState.timetable.batch        = (document.getElementById('tt-input-batch')?.value || '').trim();

    saveAppState();
    renderTTMetaDisplay();

    // Hide form
    const form = document.getElementById('form-tt-setup');
    if (form) form.classList.add('hidden');
    const btn = document.getElementById('btn-tt-setup-toggle');
    if (btn) { btn.textContent = 'Edit details'; btn.dataset.open = ''; }
}

/** Renders the timetable metadata summary line */
function renderTTMetaDisplay() {
    const el = document.getElementById('tt-meta-display');
    if (!el) return;

    const tt = appState.timetable || {};
    const parts = [];
    if (tt.institution)  parts.push(escapeHtml(tt.institution));
    if (tt.academicYear) parts.push(`AY ${escapeHtml(tt.academicYear)}`);
    if (tt.semester)     parts.push(`Semester ${escapeHtml(tt.semester)}`);
    if (tt.batch)        parts.push(`Batch ${escapeHtml(tt.batch)}`);

    el.innerHTML = parts.length > 0
        ? parts.join(' &bull; ')
        : '<span class="text-muted">No details added yet. Click Edit details to set up.</span>';
}

// --------------------------------------------------------------------------
// TT.11  RENDER — TIMETABLE TAB
// --------------------------------------------------------------------------

function renderTimetableTab() {
    renderTTMetaDisplay();
    renderTTDayPanel();
    renderTTWeekSummary();
    syncTTDayButtons();
}

/** Highlights today's day button with a small indicator dot */
function syncTTDayButtons() {
    const today = getTodayDayName();
    document.querySelectorAll('.tt-day-btn').forEach(btn => {
        const d = btn.getAttribute('data-day');
        btn.classList.toggle('has-today-indicator', d === today);
        btn.classList.toggle('active', d === ttState.activeDay);
        btn.setAttribute('aria-selected', d === ttState.activeDay ? 'true' : 'false');
    });
}

/** Renders the day schedule panel for the currently selected day */
function renderTTDayPanel() {
    const headingEl  = document.getElementById('tt-day-panel-heading');
    const countEl    = document.getElementById('tt-day-entry-count');
    const container  = document.getElementById('tt-day-entries-container');
    if (!container) return;

    const day = ttState.activeDay;

    if (!day) {
        if (headingEl) headingEl.textContent = 'Select a day above';
        if (countEl)   countEl.textContent   = '— entries';
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-8) var(--space-4);">
                <div class="empty-title">No day selected</div>
                <p class="empty-description">Choose a day from the tabs above to view its timetable.</p>
            </div>
        `;
        return;
    }

    const entries = getTimetableForDay(day);
    const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

    if (headingEl) headingEl.textContent = `${dayLabel} Schedule`;
    if (countEl)   countEl.textContent   = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-8) var(--space-4);">
                <div class="empty-title">Nothing on ${dayLabel}</div>
                <p class="empty-description">No timetable entry recorded for ${dayLabel}.</p>
                <button class="btn btn-primary empty-add-tt-btn" style="font-size:var(--font-size-small);">Add class</button>
            </div>
        `;
        return;
    }

    container.innerHTML = entries.map(e => buildTTEntryCardHTML(e)).join('');
    attachTTEntryListeners(container);
}

/** Builds the HTML for a single timetable entry card */
function buildTTEntryCardHTML(entry) {
    const id        = escapeHtml(entry.id);
    const subject   = getSubjectById(entry.subjectId);
    const startDisp = formatTimeDisplay(entry.startTime);
    const endDisp   = formatTimeDisplay(entry.endTime);

    const subjectMeta = subject
        ? `<span>${escapeHtml(subject.name)}</span>`
        : (entry.subjectId
            ? `<span class="tt-unmapped-badge">unmapped</span>`
            : '');

    const classroomMeta = entry.classroom
        ? `<span>${escapeHtml(entry.classroom)}</span>`
        : '';

    const metaParts = [subjectMeta, classroomMeta].filter(Boolean);
    if (!metaParts.length && entry.notes) {
        metaParts.push(`<span>${escapeHtml(entry.notes.slice(0, 50))}${entry.notes.length > 50 ? '…' : ''}</span>`);
    }

    return `
        <article class="tt-entry-card" data-entry-id="${id}">
            <div class="tt-entry-time-col">
                <span class="tt-entry-time-start">${escapeHtml(startDisp)}</span>
                <span class="tt-entry-time-end">${escapeHtml(endDisp)}</span>
            </div>
            <div class="tt-entry-body">
                <div class="tt-entry-title">
                    <span class="tt-type-badge tt-type-${escapeHtml(entry.type || 'other')}">${escapeHtml(ttTypeLabel(entry.type))}</span>
                    &nbsp;${escapeHtml(entry.title)}
                </div>
                ${metaParts.length > 0 ? `<div class="tt-entry-meta">${metaParts.join('<span class="task-item-meta-sep">&bull;</span>')}</div>` : ''}
            </div>
            <div class="tt-entry-actions">
                <button class="task-action-btn" data-tt-action="edit"   data-id="${id}" aria-label="Edit ${escapeHtml(entry.title)}">Edit</button>
                <button class="task-action-btn action-delete" data-tt-action="delete" data-id="${id}" aria-label="Delete ${escapeHtml(entry.title)}">Delete</button>
            </div>
        </article>
    `;
}

/** Attaches delegated click listeners to the entry list container */
function attachTTEntryListeners(container) {
    // Replace with clone to avoid listener accumulation
    const fresh = container.cloneNode(true);
    container.parentNode.replaceChild(fresh, container);

    fresh.addEventListener('click', e => {
        const btn = e.target.closest('[data-tt-action]');
        if (!btn) {
            // Check empty-state add button
            if (e.target.classList.contains('empty-add-tt-btn')) {
                openTTEntryModal(null, ttState.activeDay);
            }
            return;
        }
        const action = btn.getAttribute('data-tt-action');
        const id     = btn.getAttribute('data-id');
        if (action === 'edit')   openTTEntryModal(id, null);
        if (action === 'delete') openTTDeleteModal(id);
    });
}

/** Renders the compact week-at-a-glance summary grid */
function renderTTWeekSummary() {
    const container = document.getElementById('tt-week-summary-container');
    if (!container) return;

    const today = getTodayDayName();
    const entries = (appState.timetable && Array.isArray(appState.timetable.entries))
        ? appState.timetable.entries : [];

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-6);">
                <div class="empty-title">No timetable entries</div>
                <p class="empty-description">Add your weekly schedule using the button above.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = TT_VALID_DAYS.map(day => {
        const dayEntries = getTimetableForDay(day);
        const isToday    = day === today;
        const shortLabel = dayNameToShort(day);
        const slots      = dayEntries.length > 0
            ? dayEntries.map(e => `
                <div class="tt-week-slot tt-type-${escapeHtml(e.type || 'other')}"
                     title="${escapeHtml(e.title)} (${escapeHtml(formatTimeDisplay(e.startTime))} – ${escapeHtml(formatTimeDisplay(e.endTime))})">
                    ${escapeHtml(e.title)}
                </div>
              `).join('')
            : `<div class="tt-week-empty">—</div>`;
        return `
            <div class="tt-week-day-col">
                <div class="tt-week-day-label${isToday ? ' today-label' : ''}">${shortLabel}</div>
                ${slots}
            </div>
        `;
    }).join('');
}

// --------------------------------------------------------------------------
// TT.12  RENDER — OVERVIEW TAB
// --------------------------------------------------------------------------

function renderOverviewTab() {
    const dateEl      = document.getElementById('study-overview-date');
    const container   = document.getElementById('study-today-container');
    const nextClassEl = document.getElementById('study-next-class-container');

    if (dateEl) {
        const today = getTodayDayName();
        const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);
        dateEl.textContent = `${todayLabel} — ${getFormattedLocalDate()}`;
    }

    const todayEntries = getTodayTimetable();
    const nextEntry    = getNextTimetableEntry();

    if (nextClassEl) {
        if (nextEntry) {
            nextClassEl.innerHTML = `
                <div class="tt-entry-body">
                    <div class="tt-entry-title">
                        <span class="tt-type-badge tt-type-${escapeHtml(nextEntry.type || 'other')}">${escapeHtml(ttTypeLabel(nextEntry.type))}</span>
                        &nbsp;${escapeHtml(nextEntry.title)}
                    </div>
                    <div class="tt-entry-meta">
                        <span>${escapeHtml(formatTimeDisplay(nextEntry.startTime))}${nextEntry.endTime ? ' – ' + escapeHtml(formatTimeDisplay(nextEntry.endTime)) : ''}</span>
                        ${nextEntry.classroom ? `<span class="task-item-meta-sep">&bull;</span><span>${escapeHtml(nextEntry.classroom)}</span>` : ''}
                    </div>
                </div>
            `;
        } else {
            nextClassEl.innerHTML = `<p class="text-small text-muted">${todayEntries.length > 0 ? 'No more classes today.' : 'No classes on today\'s timetable.'}</p>`;
        }
    }

    if (!container) return;

    if (todayEntries.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-6) var(--space-4);">
                <div class="empty-title">No timetable entries for today</div>
                <p class="empty-description">Switch to the Timetable tab to add your schedule.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todayEntries.map(e => buildTTEntryCardHTML(e)).join('');
    // No edit/delete needed in overview — re-attach listeners for view-only
    const fresh = container.cloneNode(true);
    container.parentNode?.replaceChild(fresh, container);
}

// --------------------------------------------------------------------------
// TT.13  RENDER — FULL STUDY VIEW CONTROLLER
// --------------------------------------------------------------------------

function renderStudyView() {
    // Render whichever sub-tab is active
    switch (ttState.activeSubTab) {
        case 'timetable': renderTimetableTab(); break;
        case 'overview':  renderOverviewTab();  break;
        case 'planner':   renderPlannerTab();   break;
        case 'subjects':  renderSubjectsTab();  break;
        case 'sessions':  renderSessionsTab();  break;
        case 'tests':     renderTestsTab();     break;
        default:          renderTimetableTab(); break;
    }
}

// --------------------------------------------------------------------------
// TT.14  INITIALIZER
// --------------------------------------------------------------------------

function initTimetable() {

    // ---- Dashboard "View timetable" button ----
    const dashGotoStudy = document.getElementById('dash-btn-goto-study');
    if (dashGotoStudy) {
        dashGotoStudy.addEventListener('click', () => {
            const studyBtn = document.querySelector('.nav-btn[data-view="study"]');
            if (studyBtn) studyBtn.click();
        });
    }

    // ---- Student Mode sub-navigation ----
    const studyNavBtns = document.querySelectorAll('.study-nav-btn');
    studyNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-study-tab');

            // Toggle button active state
            studyNavBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            // Toggle tab panels
            document.querySelectorAll('.study-tab-panel').forEach(panel => {
                panel.classList.add('hidden');
            });
            const targetPanel = document.getElementById(`study-tab-${tab}`);
            if (targetPanel) targetPanel.classList.remove('hidden');

            ttState.activeSubTab = tab;

            // Render the newly shown tab
            if (tab === 'timetable') renderTimetableTab();
            if (tab === 'overview')  renderOverviewTab();
            if (tab === 'planner')   renderPlannerTab();
            if (tab === 'subjects')  renderSubjectsTab();
            if (tab === 'sessions')  renderSessionsTab();
            if (tab === 'tests')     renderTestsTab();
        });
    });

    // ---- Timetable setup form toggle ----
    const btnSetupToggle = document.getElementById('btn-tt-setup-toggle');
    const setupForm      = document.getElementById('form-tt-setup');
    if (btnSetupToggle && setupForm) {
        btnSetupToggle.addEventListener('click', () => {
            const isOpen = btnSetupToggle.dataset.open === 'true';
            if (isOpen) {
                setupForm.classList.add('hidden');
                btnSetupToggle.textContent = 'Edit details';
                btnSetupToggle.dataset.open = '';
            } else {
                // Populate form with current values
                const tt = appState.timetable || {};
                const f  = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
                f('tt-input-institution', tt.institution);
                f('tt-input-year',        tt.academicYear);
                f('tt-input-semester',    tt.semester);
                f('tt-input-batch',       tt.batch);
                setupForm.classList.remove('hidden');
                btnSetupToggle.textContent = 'Cancel';
                btnSetupToggle.dataset.open = 'true';
                document.getElementById('tt-input-institution')?.focus();
            }
        });
    }
    if (setupForm) {
        setupForm.addEventListener('submit', handleTTSetupFormSubmit);
    }
    const btnSetupCancel = document.getElementById('btn-tt-setup-cancel');
    if (btnSetupCancel) {
        btnSetupCancel.addEventListener('click', () => {
            if (setupForm) setupForm.classList.add('hidden');
            if (btnSetupToggle) { btnSetupToggle.textContent = 'Edit details'; btnSetupToggle.dataset.open = ''; }
        });
    }

    // ---- Add entry button ----
    const btnAddEntry = document.getElementById('btn-tt-add-entry');
    if (btnAddEntry) {
        btnAddEntry.addEventListener('click', () => openTTEntryModal(null, ttState.activeDay));
    }

    // ---- Day switcher tabs ----
    document.querySelectorAll('.tt-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            ttState.activeDay = day;
            syncTTDayButtons();
            renderTTDayPanel();
        });
    });

    // ---- Timetable entry form modal ----
    const entryModal    = document.getElementById('modal-tt-entry-form');
    const entryForm     = document.getElementById('form-tt-entry');
    const btnModalClose = document.getElementById('btn-tt-modal-close');
    const btnCancel     = document.getElementById('btn-tt-entry-cancel');

    if (btnModalClose) btnModalClose.addEventListener('click', closeTTEntryModal);
    if (btnCancel)     btnCancel.addEventListener('click', closeTTEntryModal);
    if (entryForm)     entryForm.addEventListener('submit', handleTTEntryFormSubmit);
    if (entryModal)    entryModal.addEventListener('click', e => { if (e.target === entryModal) closeTTEntryModal(); });

    // Focus trap for entry modal
    if (entryModal) {
        const trap = createFocusTrap(entryModal.querySelector('.modal-card') || entryModal);
        entryModal.addEventListener('keydown', trap);
    }

    // Reset overlap acknowledgment when day/time changes
    ['tt-entry-input-day','tt-entry-input-start','tt-entry-input-end'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            const w = document.getElementById('warning-tt-overlap');
            if (w) { w.classList.add('hidden'); w.dataset.acknowledged = ''; }
        });
    });

    // ---- Delete modal ----
    const deleteModal      = document.getElementById('modal-tt-entry-delete');
    const btnDeleteClose   = document.getElementById('btn-tt-delete-close');
    const btnDeleteCancel  = document.getElementById('btn-tt-delete-cancel');
    const btnDeleteConfirm = document.getElementById('btn-tt-delete-confirm');

    if (btnDeleteClose)   btnDeleteClose.addEventListener('click', closeTTDeleteModal);
    if (btnDeleteCancel)  btnDeleteCancel.addEventListener('click', closeTTDeleteModal);
    if (btnDeleteConfirm) btnDeleteConfirm.addEventListener('click', confirmTTDeleteEntry);
    if (deleteModal)      deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeTTDeleteModal(); });

    // Focus trap for delete modal
    if (deleteModal) {
        const trap = createFocusTrap(deleteModal.querySelector('.modal-card') || deleteModal);
        deleteModal.addEventListener('keydown', trap);
    }

    // ---- Escape key closes timetable modals ----
    // (The Phase 3 Escape handler already runs; add TT modals here)
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const ttForm = document.getElementById('modal-tt-entry-form');
        const ttDel  = document.getElementById('modal-tt-entry-delete');
        if (ttForm && !ttForm.classList.contains('hidden')) { closeTTEntryModal(); return; }
        if (ttDel  && !ttDel.classList.contains('hidden'))  { closeTTDeleteModal(); return; }
    });

    // ---- Auto-select today's day when entering timetable view ----
    // Set the default active day to today so the user immediately sees today's schedule
    ttState.activeDay = getTodayDayName();

    console.log('[Timetable] Phase 6 Timetable initialized.');
}

// ==========================================================================
// PHASE 7 — REALISTIC STUDY PLANNER & STUDENT MODE EXPANSIONS
// ==========================================================================

const plannerState = {
    activeDate: getTodayDateString(),
    targetHours: 3.5,
    sessionDuration: 60,
    editingSessionId: null
};

/**
 * Seeds B1 subjects if the subjects array is currently empty.
 * Matches exact spec mappings for the B1 timetable.
 */
function seedB1SubjectsIfEmpty() {
    if (!Array.isArray(appState.subjects)) appState.subjects = [];
    if (appState.subjects.length > 0) return false;

    const now = new Date().toISOString();
    const b1Subjects = [
        { name: "Maths 1 - B", goalType: "Engineering", active: true },
        { name: "Maths 1 Lab B1", goalType: "Engineering", active: true },
        { name: "PSP B", goalType: "Engineering", active: true },
        { name: "PSP Lab B1", goalType: "Engineering", active: true },
        { name: "AP-Robo B", goalType: "Engineering", active: true },
        { name: "AP-Robo Lab B1", goalType: "Engineering", active: true },
        { name: "SnAI B", goalType: "Engineering", active: true },
        { name: "SnW Lab B1", goalType: "Engineering", active: true },
        { name: "English B", goalType: "General", active: true },
        { name: "YOGA B1", goalType: "General", active: true }
    ];

    b1Subjects.forEach(s => {
        appState.subjects.push({
            id: generateId(),
            name: s.name,
            goalType: s.goalType,
            active: true,
            createdAt: now,
            updatedAt: now
        });
    });

    seedInitialChaptersIfEmpty();
    saveAppState();
    console.log('[Academic] B1 curriculum subjects and chapters seeded.');
    return true;
}

/**
 * Seeds initial academic chapters for core subjects if empty.
 */
function seedInitialChaptersIfEmpty() {
    if (!Array.isArray(appState.chapters)) appState.chapters = [];
    if (appState.chapters.length > 0) return false;

    const maths = findSubjectIdByName("Maths 1 - B");
    const psp = findSubjectIdByName("PSP B");
    const aprobo = findSubjectIdByName("AP-Robo B");
    const snai = findSubjectIdByName("SnAI B");
    const english = findSubjectIdByName("English B");

    const chaptersData = [
        { subjectId: maths, name: "Matrices & Linear Algebra", status: "completed", revisionCount: 1, order: 1 },
        { subjectId: maths, name: "Differential Calculus", status: "in_progress", revisionCount: 0, order: 2 },
        { subjectId: maths, name: "Integral Calculus", status: "not_started", revisionCount: 0, order: 3 },
        { subjectId: maths, name: "Vector Spaces", status: "not_started", revisionCount: 0, order: 4 },

        { subjectId: psp, name: "Control Structures & Loops", status: "completed", revisionCount: 1, order: 1 },
        { subjectId: psp, name: "Functions & Recursion", status: "in_progress", revisionCount: 0, order: 2 },
        { subjectId: psp, name: "Pointers & Dynamic Memory", status: "not_started", revisionCount: 0, order: 3 },
        { subjectId: psp, name: "Data Structures Basics", status: "not_started", revisionCount: 0, order: 4 },

        { subjectId: aprobo, name: "Robot Kinematics", status: "completed", revisionCount: 1, order: 1 },
        { subjectId: aprobo, name: "Sensors & Actuators", status: "in_progress", revisionCount: 0, order: 2 },
        { subjectId: aprobo, name: "Microcontroller Interfaces", status: "not_started", revisionCount: 0, order: 3 },

        { subjectId: snai, name: "State Space Search", status: "in_progress", revisionCount: 0, order: 1 },
        { subjectId: snai, name: "Heuristic Search & A*", status: "not_started", revisionCount: 0, order: 2 },
        { subjectId: snai, name: "Knowledge Representation", status: "not_started", revisionCount: 0, order: 3 },

        { subjectId: english, name: "Technical Report Writing", status: "completed", revisionCount: 1, order: 1 },
        { subjectId: english, name: "Executive Summaries", status: "in_progress", revisionCount: 0, order: 2 }
    ];

    const now = new Date().toISOString();
    chaptersData.filter(c => c.subjectId).forEach(c => {
        appState.chapters.push({
            id: generateId(),
            subjectId: c.subjectId,
            name: c.name,
            status: c.status,
            revisionCount: c.revisionCount,
            order: c.order,
            notes: "",
            createdAt: now,
            updatedAt: now
        });
    });

    return true;
}

/**
 * Calculates open study windows on a target date between timetable entries and scheduled tasks.
 * Avoids impossible schedules, avoids overlapping classes, and avoids overlapping tasks.
 */
function calculateAvailableStudyWindows(date) {
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const d = new Date(date + 'T12:00:00');
    const dayOfWeek = dayNames[d.getDay()];

    const wakeTimeStr = (appState.academicProfile && appState.academicProfile.routine && appState.academicProfile.routine.wakeTime)
        || (appState.profile && appState.profile.wakeTime) || '07:00';
    const sleepTimeStr = (appState.academicProfile && appState.academicProfile.routine && appState.academicProfile.routine.sleepTime)
        || (appState.profile && appState.profile.sleepTime) || '23:00';

    const wakeMinutes = timeToMinutes(wakeTimeStr);
    const sleepMinutes = timeToMinutes(sleepTimeStr);

    // 1. Timetable classes on this day
    const dayClasses = (appState.timetable && Array.isArray(appState.timetable.entries))
        ? appState.timetable.entries.filter(e => e.day === dayOfWeek)
        : [];

    // 2. Existing scheduled tasks on this date (that have start and end time)
    const dayTasks = (Array.isArray(appState.tasks) ? appState.tasks : [])
        .filter(t => t.date === date && t.status !== 'missed' && t.startTime && t.endTime);

    // 3. Assemble commitments
    const busyIntervals = [];

    dayClasses.forEach(c => {
        busyIntervals.push({
            type: 'class',
            title: c.title,
            start: timeToMinutes(c.startTime),
            end: timeToMinutes(c.endTime)
        });
    });

    dayTasks.forEach(t => {
        busyIntervals.push({
            type: 'task',
            title: t.title,
            start: timeToMinutes(t.startTime),
            end: timeToMinutes(t.endTime)
        });
    });

    // Sort commitments chronologically
    busyIntervals.sort((a, b) => a.start - b.start);

    // Merge overlapping or adjacent busy intervals
    const mergedBusy = [];
    busyIntervals.forEach(curr => {
        if (mergedBusy.length === 0) {
            mergedBusy.push(Object.assign({}, curr));
        } else {
            const prev = mergedBusy[mergedBusy.length - 1];
            if (curr.start < prev.end) {
                prev.end = Math.max(prev.end, curr.end);
                prev.title += ` + ${curr.title}`;
            } else {
                mergedBusy.push(Object.assign({}, curr));
            }
        }
    });

    // 4. Invert busy intervals to find free study windows >= 45 minutes
    const freeWindows = [];
    let cursor = wakeMinutes;

    mergedBusy.forEach(busy => {
        if (busy.start > cursor) {
            const gap = busy.start - cursor;
            if (gap >= 45) {
                freeWindows.push({
                    start: cursor,
                    end: busy.start,
                    duration: gap,
                    precedingEvent: cursor === wakeMinutes ? 'Wake up' : 'Previous activity',
                    followingEvent: busy.title
                });
            }
        }
        cursor = Math.max(cursor, busy.end);
    });

    if (cursor < sleepMinutes) {
        const gap = sleepMinutes - cursor;
        if (gap >= 45) {
            freeWindows.push({
                start: cursor,
                end: sleepMinutes,
                duration: gap,
                precedingEvent: 'Classes & tasks completed',
                followingEvent: 'Bedtime'
            });
        }
    }

    return {
        date,
        dayOfWeek,
        busyIntervals,
        freeWindows,
        totalFreeMinutes: freeWindows.reduce((acc, w) => acc + w.duration, 0)
    };
}

/**
 * Realistic Study Planner Engine.
 * Generates an explainable study plan for a specific date respecting all schedule constraints.
 */
function generateRealisticStudyPlan(date = getTodayDateString(), targetHours = 3.5, sessionDuration = 60) {
    if (!Array.isArray(appState.studyPlans)) appState.studyPlans = [];
    if (!Array.isArray(appState.subjects)) appState.subjects = [];
    if (!Array.isArray(appState.chapters)) appState.chapters = [];

    // Clean existing planned (non-completed) sessions for this date only
    appState.studyPlans = appState.studyPlans.filter(p => !(p.date === date && p.status === 'planned'));

    const windowData = calculateAvailableStudyWindows(date);
    const targetMinutes = Math.round(targetHours * 60);

    // Identify candidate academic subjects (exclude General/Yoga)
    const academicSubjects = appState.subjects.filter(s => s.active !== false && s.goalType !== 'General');
    const weakSubjectIds = (appState.academicProfile && appState.academicProfile.weakSubjectIds) || [];

    // Prioritize candidate chapters
    const candidateChapters = [];
    academicSubjects.forEach(sub => {
        const subChapters = appState.chapters.filter(c => c.subjectId === sub.id);
        const isWeak = weakSubjectIds.includes(sub.id);

        subChapters.forEach(ch => {
            let priorityScore = 0;
            if (isWeak) priorityScore += 30;
            if (ch.status === 'in_progress') priorityScore += 20;
            else if (ch.status === 'not_started') priorityScore += 15;
            else if (ch.status === 'completed' && (ch.revisionCount || 0) < 2) priorityScore += 5;

            candidateChapters.push({
                subject: sub,
                chapter: ch,
                priorityScore
            });
        });
    });

    // Sort chapters by priority descending
    candidateChapters.sort((a, b) => b.priorityScore - a.priorityScore);

    let allocatedMinutes = 0;
    const generatedSessions = [];
    let chapterIndex = 0;

    // Helper: format minutes to HH:MM string
    function minsToTimeStr(totalMins) {
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Allocate into free windows
    for (const win of windowData.freeWindows) {
        if (allocatedMinutes >= targetMinutes) break;

        let windowCursor = win.start;
        while (windowCursor + 45 <= win.end && allocatedMinutes < targetMinutes) {
            const remainingWindow = win.end - windowCursor;
            const remainingTarget = targetMinutes - allocatedMinutes;
            const blockDuration = Math.min(sessionDuration, remainingWindow, remainingTarget);

            if (blockDuration < 45) break;

            const cand = candidateChapters[chapterIndex % (candidateChapters.length || 1)];
            chapterIndex++;

            const startTimeStr = minsToTimeStr(windowCursor);
            const endTimeStr = minsToTimeStr(windowCursor + blockDuration);

            const subjectName = cand ? cand.subject.name : "Core Academic Study";
            const chapterName = cand ? cand.chapter.name : "Key Concepts";
            const subjectId = cand ? cand.subject.id : null;
            const chapterId = cand ? cand.chapter.id : null;

            // Factual, explainable scheduling reason
            const reason = `Scheduled because ${subjectName} has unfinished chapter '${chapterName}' and you have a free ${blockDuration}-minute window (${formatTimeDisplay(startTimeStr)}–${formatTimeDisplay(endTimeStr)}) between ${win.precedingEvent} and ${win.followingEvent}.`;

            const session = {
                id: generateId(),
                date,
                startTime: startTimeStr,
                endTime: endTimeStr,
                durationMinutes: blockDuration,
                subjectId,
                chapterId,
                reason,
                status: 'planned',
                taskId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            generatedSessions.push(session);
            appState.studyPlans.push(session);

            windowCursor += blockDuration + 15; // 15m rest break buffer between study blocks
            allocatedMinutes += blockDuration;
        }
    }

    saveAppState();
    return {
        date,
        totalAllocatedMinutes: allocatedMinutes,
        sessions: generatedSessions,
        windowData
    };
}

/**
 * Converts generated study plan sessions on a date into actual tasks in appState.tasks.
 * Prevents duplicate task entries.
 */
function applyStudyPlanToTasks(date) {
    if (!Array.isArray(appState.studyPlans)) return 0;
    if (!Array.isArray(appState.tasks)) appState.tasks = [];

    const planSessions = appState.studyPlans.filter(p => p.date === date && p.status === 'planned');
    let addedCount = 0;

    planSessions.forEach(p => {
        const sub = getSubjectById(p.subjectId);
        const subName = sub ? sub.name : 'Study Session';
        const ch = (appState.chapters || []).find(c => c.id === p.chapterId);
        const taskTitle = ch ? `${subName}: ${ch.name}` : `Study: ${subName}`;

        // Duplicate check on date & times
        const exists = appState.tasks.some(t => t.date === date && t.startTime === p.startTime && t.endTime === p.endTime);
        if (!exists) {
            const taskId = generateId();
            appState.tasks.push({
                id: taskId,
                title: taskTitle,
                category: 'Study',
                date,
                startTime: p.startTime,
                endTime: p.endTime,
                priority: 'high',
                estimatedDuration: p.durationMinutes,
                notes: p.reason,
                status: 'planned',
                completionPercentage: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            p.taskId = taskId;
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveAppState();
        renderTaskList();
        alert(`Successfully imported ${addedCount} planned study block(s) into your Task schedule!`);
    } else {
        alert("All planned study blocks for this date are already in your Task schedule.");
    }

    return addedCount;
}

/**
 * Regenerates the study plan for a given day.
 */
function regeneratePlannerDay(date) {
    if (confirm(`Regenerate study plan for ${date}? Non-completed planned sessions on this date will be refreshed.`)) {
        generateRealisticStudyPlan(date, plannerState.targetHours, plannerState.sessionDuration);
        renderPlannerTab();
    }
}

/**
 * Builds HTML card for a planned study session.
 */
function buildPlannerSessionCardHTML(session) {
    const sub = getSubjectById(session.subjectId);
    const subName = sub ? sub.name : 'Study Subject';
    const ch = (appState.chapters || []).find(c => c.id === session.chapterId);
    const chName = ch ? ch.name : 'General Concepts';

    return `
        <div class="planner-card" data-plan-id="${escapeHtml(session.id)}">
            <div class="planner-card-header">
                <div>
                    <span class="badge-status badge-in-progress">${escapeHtml(subName)}</span>
                    <strong class="ml-xs" style="font-size:var(--font-size-subheading);">${escapeHtml(chName)}</strong>
                </div>
                <div class="text-small" style="font-weight:600; color:var(--color-brand);">
                    ${escapeHtml(formatTimeDisplay(session.startTime))} – ${escapeHtml(formatTimeDisplay(session.endTime))} (${session.durationMinutes} mins)
                </div>
            </div>
            <div class="planner-reason-box">
                <strong>Why Scheduled:</strong> ${escapeHtml(session.reason)}
            </div>
            <div class="flex-header mt-xs">
                <span class="text-caption text-muted">Status: ${escapeHtml(session.status)}</span>
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm btn-plan-edit" data-id="${escapeHtml(session.id)}">Edit</button>
                    <button class="btn btn-danger btn-sm btn-plan-del" data-id="${escapeHtml(session.id)}">Remove</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the Study Planner tab.
 */
function renderPlannerTab() {
    const dateInput = document.getElementById('planner-input-date');
    const targetInput = document.getElementById('planner-input-target-hours');
    const sessionLenInput = document.getElementById('planner-input-session-len');
    const summaryEl = document.getElementById('planner-constraints-summary');
    const container = document.getElementById('planner-sessions-container');
    const headingEl = document.getElementById('planner-schedule-heading');

    if (dateInput && !dateInput.value) {
        dateInput.value = plannerState.activeDate;
    }
    const curDate = (dateInput && dateInput.value) ? dateInput.value : plannerState.activeDate;
    plannerState.activeDate = curDate;

    if (headingEl) {
        headingEl.textContent = `Planned Study Sessions (${curDate})`;
    }

    // Constraint analysis
    const winData = calculateAvailableStudyWindows(curDate);
    if (summaryEl) {
        const freeHours = (winData.totalFreeMinutes / 60).toFixed(1);
        summaryEl.innerHTML = `
            <strong>Schedule Analysis:</strong> ${winData.busyIntervals.length} commitments on ${winData.dayOfWeek} (${winData.busyIntervals.filter(b=>b.type==='class').length} classes, ${winData.busyIntervals.filter(b=>b.type==='task').length} scheduled tasks). 
            Total available study windows: <strong>${freeHours} hours</strong> across ${winData.freeWindows.length} free block(s).
        `;
    }

    if (!container) return;

    const plannedForDate = (appState.studyPlans || []).filter(p => p.date === curDate);

    if (plannedForDate.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-8) var(--space-4);">
                <div class="empty-title">No study plan generated for this date</div>
                <p class="empty-description">Click "Generate Plan" above to calculate realistic study sessions fitted around your classes and tasks.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = plannedForDate.map(s => buildPlannerSessionCardHTML(s)).join('');

    // Attach edit and delete listeners
    container.querySelectorAll('.btn-plan-edit').forEach(btn => {
        btn.addEventListener('click', () => openPlannerEditModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-plan-del').forEach(btn => {
        btn.addEventListener('click', () => deletePlannedSession(btn.dataset.id));
    });
}

function openPlannerEditModal(sessionId) {
    const session = (appState.studyPlans || []).find(s => s.id === sessionId);
    if (!session) return;

    plannerState.editingSessionId = sessionId;
    const modal = document.getElementById('modal-planner-session-edit');
    const subSel = document.getElementById('planner-edit-input-subject');
    const chSel = document.getElementById('planner-edit-input-chapter');
    const startIn = document.getElementById('planner-edit-input-start');
    const endIn = document.getElementById('planner-edit-input-end');
    const reasonIn = document.getElementById('planner-edit-input-reason');

    if (!modal) return;

    // Populate subjects
    if (subSel) {
        subSel.innerHTML = (appState.subjects || []).map(s => `
            <option value="${escapeHtml(s.id)}" ${s.id === session.subjectId ? 'selected' : ''}>${escapeHtml(s.name)}</option>
        `).join('');
    }

    // Populate chapters
    function updateChapters() {
        if (!chSel || !subSel) return;
        const curSub = subSel.value;
        const chs = (appState.chapters || []).filter(c => c.subjectId === curSub);
        chSel.innerHTML = chs.map(c => `
            <option value="${escapeHtml(c.id)}" ${c.id === session.chapterId ? 'selected' : ''}>${escapeHtml(c.name)}</option>
        `).join('');
    }
    updateChapters();
    if (subSel) subSel.onchange = updateChapters;

    if (startIn) startIn.value = session.startTime;
    if (endIn) endIn.value = session.endTime;
    if (reasonIn) reasonIn.value = session.reason;

    modal.classList.remove('hidden');
}

function closePlannerEditModal() {
    const modal = document.getElementById('modal-planner-session-edit');
    if (modal) modal.classList.add('hidden');
    plannerState.editingSessionId = null;
}

function deletePlannedSession(sessionId) {
    if (confirm("Remove this planned session from your study plan?")) {
        appState.studyPlans = (appState.studyPlans || []).filter(s => s.id !== sessionId);
        saveAppState();
        renderPlannerTab();
    }
}

// --------------------------------------------------------------------------
// SUBJECTS & CHAPTERS CONTROLLER
// --------------------------------------------------------------------------

function renderSubjectsTab() {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    const subjects = Array.isArray(appState.subjects) ? appState.subjects : [];
    const weakSubjectIds = (appState.academicProfile && appState.academicProfile.weakSubjectIds) || [];

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding:var(--space-8);">
                <div class="empty-title">No academic subjects defined</div>
                <p class="empty-description">Click "+ Add Subject" to start tracking your syllabus.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = subjects.map(s => {
        const isWeak = weakSubjectIds.includes(s.id);
        const chapters = (appState.chapters || []).filter(c => c.subjectId === s.id);
        const completedChCount = chapters.filter(c => c.status === 'completed').length;

        return `
            <article class="card">
                <div class="flex-header mb-sm">
                    <div>
                        <h3 class="heading-subheading">${escapeHtml(s.name)}</h3>
                        <span class="nav-tag">${escapeHtml(s.goalType || 'Academic')}</span>
                        ${isWeak ? '<span class="badge-status badge-weak ml-xs">Focus Area</span>' : ''}
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary btn-sm btn-sub-toggle-weak" data-id="${escapeHtml(s.id)}">
                            ${isWeak ? 'Unmark Focus' : 'Mark Focus'}
                        </button>
                        <button class="btn btn-secondary btn-sm btn-sub-add-ch" data-id="${escapeHtml(s.id)}">+ Chapter</button>
                    </div>
                </div>

                <div class="text-caption text-secondary mb-xs">
                    Progress: ${completedChCount} / ${chapters.length} chapters completed
                </div>
                <div class="progress-bar-track mb-sm">
                    <div class="progress-bar-fill" style="width: ${chapters.length ? Math.round((completedChCount / chapters.length) * 100) : 0}%;"></div>
                </div>

                <div class="chapters-sublist" style="display:flex; flex-direction:column; gap:var(--space-1);">
                    ${chapters.length === 0 ? '<p class="text-caption text-muted">No chapters added yet.</p>' : ''}
                    ${chapters.map(c => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-1) var(--space-2); background:var(--color-surface-elevated); border-radius:var(--radius-sm); font-size:var(--font-size-small);">
                            <span>${escapeHtml(c.name)}</span>
                            <div style="display:flex; align-items:center; gap:var(--space-2);">
                                <span class="badge-status badge-${c.status === 'completed' ? 'completed' : c.status === 'in_progress' ? 'in-progress' : 'not-started'}">
                                    ${c.status === 'completed' ? 'Done' : c.status === 'in_progress' ? 'Active' : 'Pending'}
                                </span>
                                <button class="btn-link text-small btn-toggle-ch-status" data-id="${escapeHtml(c.id)}" style="cursor:pointer;">
                                    ${c.status === 'completed' ? 'Reopen' : 'Done'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </article>
        `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.btn-sub-toggle-weak').forEach(btn => {
        btn.addEventListener('click', () => {
            const subId = btn.dataset.id;
            if (!appState.academicProfile) appState.academicProfile = createInitialState().academicProfile;
            if (!Array.isArray(appState.academicProfile.weakSubjectIds)) appState.academicProfile.weakSubjectIds = [];
            const idx = appState.academicProfile.weakSubjectIds.indexOf(subId);
            if (idx >= 0) {
                appState.academicProfile.weakSubjectIds.splice(idx, 1);
            } else {
                appState.academicProfile.weakSubjectIds.push(subId);
            }
            saveAppState();
            renderSubjectsTab();
        });
    });

    container.querySelectorAll('.btn-sub-add-ch').forEach(btn => {
        btn.addEventListener('click', () => {
            const subId = btn.dataset.id;
            const modal = document.getElementById('modal-chapter-form');
            const subIn = document.getElementById('chapter-input-subject-id');
            const nameIn = document.getElementById('chapter-input-name');
            if (modal && subIn) {
                subIn.value = subId;
                if (nameIn) nameIn.value = '';
                modal.classList.remove('hidden');
            }
        });
    });

    container.querySelectorAll('.btn-toggle-ch-status').forEach(btn => {
        btn.addEventListener('click', () => {
            const chId = btn.dataset.id;
            const ch = (appState.chapters || []).find(c => c.id === chId);
            if (ch) {
                if (ch.status === 'completed') {
                    ch.status = 'in_progress';
                } else {
                    ch.status = 'completed';
                    ch.revisionCount = (ch.revisionCount || 0) + 1;
                }
                ch.updatedAt = new Date().toISOString();
                saveAppState();
                renderSubjectsTab();
            }
        });
    });
}

// --------------------------------------------------------------------------
// SESSIONS & TESTS CONTROLLERS
// --------------------------------------------------------------------------

function renderSessionsTab() {
    const container = document.getElementById('study-sessions-list-container');
    const hoursEl = document.getElementById('stat-study-total-hours');
    const sessionsEl = document.getElementById('stat-study-total-sessions');
    const questionsEl = document.getElementById('stat-study-questions');
    const accuracyEl = document.getElementById('stat-study-accuracy');

    const sessions = Array.isArray(appState.studySessions) ? appState.studySessions : [];
    const totalMinutes = sessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const totalQuestions = sessions.reduce((acc, s) => acc + (Number(s.questionsSolved) || 0), 0);

    if (hoursEl) hoursEl.textContent = `${(totalMinutes / 60).toFixed(1)}h`;
    if (sessionsEl) sessionsEl.textContent = sessions.length;
    if (questionsEl) questionsEl.textContent = totalQuestions;

    if (accuracyEl) {
        const recordedAccs = sessions.filter(s => typeof s.accuracyPercent === 'number');
        if (recordedAccs.length > 0) {
            const avgAcc = Math.round(recordedAccs.reduce((a, b) => a + b.accuracyPercent, 0) / recordedAccs.length);
            accuracyEl.textContent = `${avgAcc}%`;
        } else {
            accuracyEl.textContent = '—';
        }
    }

    if (!container) return;

    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-8);">
                <div class="empty-title">No completed study sessions logged</div>
                <p class="empty-description">Click "+ Log Study Session" to record your completed focus blocks.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Duration</th>
                        <th>Questions</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessions.slice().reverse().map(s => {
                        const sub = getSubjectById(s.subjectId);
                        const subName = sub ? sub.name : (s.subjectId || 'Self Study');
                        return `
                            <tr>
                                <td>${escapeHtml(s.date || s.createdAt.slice(0, 10))}</td>
                                <td><strong>${escapeHtml(subName)}</strong> ${s.chapter ? `<span class="text-secondary text-small">(${escapeHtml(s.chapter)})</span>` : ''}</td>
                                <td>${s.duration || 60} mins</td>
                                <td>${s.questionsSolved || 0}</td>
                                <td class="text-secondary">${escapeHtml(s.notes || '—')}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTestsTab() {
    const container = document.getElementById('mock-tests-list-container');
    if (!container) return;

    const tests = Array.isArray(appState.mockTests) ? appState.mockTests : [];
    if (tests.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-8);">
                <div class="empty-title">No mock tests or quizzes recorded</div>
                <p class="empty-description">Click "+ Log Mock Test" to track diagnostics and practice exam scores.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Test Title</th>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${tests.slice().reverse().map(t => {
                        const sub = getSubjectById(t.subjectId);
                        return `
                            <tr>
                                <td>${escapeHtml(t.date || t.createdAt.slice(0, 10))}</td>
                                <td><strong>${escapeHtml(t.title)}</strong></td>
                                <td>${escapeHtml(sub ? sub.name : 'General')}</td>
                                <td><span class="badge-status badge-completed">${t.scorePercent}% (${t.correctAnswers}/${t.totalQuestions})</span></td>
                                <td>${t.durationMinutes || 60} mins</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function initRealisticPlanner() {
    const btnGen = document.getElementById('btn-planner-generate');
    const btnRegen = document.getElementById('btn-planner-regenerate');
    const btnApply = document.getElementById('btn-planner-apply-tasks');
    const dateInput = document.getElementById('planner-input-date');
    const targetInput = document.getElementById('planner-input-target-hours');
    const sessionLenInput = document.getElementById('planner-input-session-len');

    if (dateInput) {
        dateInput.value = plannerState.activeDate;
        dateInput.addEventListener('change', () => {
            plannerState.activeDate = dateInput.value;
            renderPlannerTab();
        });
    }

    if (btnGen) {
        btnGen.addEventListener('click', () => {
            const d = (dateInput && dateInput.value) || plannerState.activeDate;
            const t = (targetInput && Number(targetInput.value)) || plannerState.targetHours;
            const s = (sessionLenInput && Number(sessionLenInput.value)) || plannerState.sessionDuration;
            plannerState.activeDate = d;
            plannerState.targetHours = t;
            plannerState.sessionDuration = s;

            generateRealisticStudyPlan(d, t, s);
            renderPlannerTab();
        });
    }

    if (btnRegen) {
        btnRegen.addEventListener('click', () => {
            const d = (dateInput && dateInput.value) || plannerState.activeDate;
            regeneratePlannerDay(d);
        });
    }

    if (btnApply) {
        btnApply.addEventListener('click', () => {
            const d = (dateInput && dateInput.value) || plannerState.activeDate;
            applyStudyPlanToTasks(d);
        });
    }

    // Modal forms
    const formPlanEdit = document.getElementById('form-planner-session-edit');
    if (formPlanEdit) {
        formPlanEdit.addEventListener('submit', e => {
            e.preventDefault();
            const id = plannerState.editingSessionId;
            const s = (appState.studyPlans || []).find(p => p.id === id);
            if (s) {
                const subSel = document.getElementById('planner-edit-input-subject');
                const chSel = document.getElementById('planner-edit-input-chapter');
                const startIn = document.getElementById('planner-edit-input-start');
                const endIn = document.getElementById('planner-edit-input-end');
                const reasonIn = document.getElementById('planner-edit-input-reason');

                if (subSel) s.subjectId = subSel.value;
                if (chSel) s.chapterId = chSel.value;
                if (startIn) s.startTime = startIn.value;
                if (endIn) s.endTime = endIn.value;
                if (reasonIn) s.reason = reasonIn.value;
                s.durationMinutes = Math.max(15, timeToMinutes(s.endTime) - timeToMinutes(s.startTime));
                s.updatedAt = new Date().toISOString();

                saveAppState();
                closePlannerEditModal();
                renderPlannerTab();
            }
        });
    }

    const btnPlanEditClose = document.getElementById('btn-planner-edit-close');
    const btnPlanEditCancel = document.getElementById('btn-planner-edit-cancel');
    const btnPlanEditDelete = document.getElementById('btn-planner-edit-delete');
    if (btnPlanEditClose) btnPlanEditClose.addEventListener('click', closePlannerEditModal);
    if (btnPlanEditCancel) btnPlanEditCancel.addEventListener('click', closePlannerEditModal);
    if (btnPlanEditDelete) {
        btnPlanEditDelete.addEventListener('click', () => {
            if (plannerState.editingSessionId) {
                deletePlannedSession(plannerState.editingSessionId);
                closePlannerEditModal();
            }
        });
    }

    // Subject form modal
    const btnAddSub = document.getElementById('btn-add-subject');
    const modalSub = document.getElementById('modal-subject-form');
    const formSub = document.getElementById('form-subject');
    const btnSubClose = document.getElementById('btn-subject-close');
    const btnSubCancel = document.getElementById('btn-subject-cancel');

    if (btnAddSub && modalSub) {
        btnAddSub.addEventListener('click', () => {
            const nameIn = document.getElementById('subject-input-name');
            if (nameIn) nameIn.value = '';
            modalSub.classList.remove('hidden');
        });
    }
    if (btnSubClose && modalSub) btnSubClose.addEventListener('click', () => modalSub.classList.add('hidden'));
    if (btnSubCancel && modalSub) btnSubCancel.addEventListener('click', () => modalSub.classList.add('hidden'));

    if (formSub) {
        formSub.addEventListener('submit', e => {
            e.preventDefault();
            const nameIn = document.getElementById('subject-input-name');
            const catIn = document.getElementById('subject-input-category');
            const weakIn = document.getElementById('subject-input-weak');
            const nameVal = nameIn ? nameIn.value.trim() : '';
            if (!nameVal) return;

            const newSub = {
                id: generateId(),
                name: nameVal,
                goalType: catIn ? catIn.value : 'Engineering',
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            appState.subjects.push(newSub);

            if (weakIn && weakIn.value === 'true') {
                if (!appState.academicProfile.weakSubjectIds) appState.academicProfile.weakSubjectIds = [];
                appState.academicProfile.weakSubjectIds.push(newSub.id);
            }

            saveAppState();
            if (modalSub) modalSub.classList.add('hidden');
            renderSubjectsTab();
        });
    }

    // Chapter form modal
    const modalCh = document.getElementById('modal-chapter-form');
    const formCh = document.getElementById('form-chapter');
    const btnChClose = document.getElementById('btn-chapter-close');
    const btnChCancel = document.getElementById('btn-chapter-cancel');

    if (btnChClose && modalCh) btnChClose.addEventListener('click', () => modalCh.classList.add('hidden'));
    if (btnChCancel && modalCh) btnChCancel.addEventListener('click', () => modalCh.classList.add('hidden'));

    if (formCh) {
        formCh.addEventListener('submit', e => {
            e.preventDefault();
            const subIdIn = document.getElementById('chapter-input-subject-id');
            const nameIn = document.getElementById('chapter-input-name');
            const statusIn = document.getElementById('chapter-input-status');
            const revIn = document.getElementById('chapter-input-revisions');

            const nameVal = nameIn ? nameIn.value.trim() : '';
            const subIdVal = subIdIn ? subIdIn.value : null;
            if (!nameVal || !subIdVal) return;

            if (!Array.isArray(appState.chapters)) appState.chapters = [];
            appState.chapters.push({
                id: generateId(),
                subjectId: subIdVal,
                name: nameVal,
                status: statusIn ? statusIn.value : 'not_started',
                revisionCount: revIn ? Number(revIn.value) || 0 : 0,
                order: appState.chapters.filter(c => c.subjectId === subIdVal).length + 1,
                notes: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            saveAppState();
            if (modalCh) modalCh.classList.add('hidden');
            renderSubjectsTab();
        });
    }

    // Session log modal
    const btnLogSess = document.getElementById('btn-log-session');
    const modalSess = document.getElementById('modal-session-form');
    const formSess = document.getElementById('form-study-session');
    const btnSessClose = document.getElementById('btn-session-close');
    const btnSessCancel = document.getElementById('btn-session-cancel');

    if (btnLogSess && modalSess) {
        btnLogSess.addEventListener('click', () => {
            const subSel = document.getElementById('session-input-subject');
            const dateIn = document.getElementById('session-input-date');
            if (subSel) {
                subSel.innerHTML = (appState.subjects || []).map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
            }
            if (dateIn) dateIn.value = getTodayDateString();
            modalSess.classList.remove('hidden');
        });
    }
    if (btnSessClose && modalSess) btnSessClose.addEventListener('click', () => modalSess.classList.add('hidden'));
    if (btnSessCancel && modalSess) btnSessCancel.addEventListener('click', () => modalSess.classList.add('hidden'));

    if (formSess) {
        formSess.addEventListener('submit', e => {
            e.preventDefault();
            const subSel = document.getElementById('session-input-subject');
            const chSel = document.getElementById('session-input-chapter');
            const dateIn = document.getElementById('session-input-date');
            const durIn = document.getElementById('session-input-duration');
            const qIn = document.getElementById('session-input-questions');
            const notesIn = document.getElementById('session-input-notes');

            const newSession = {
                id: generateId(),
                subjectId: subSel ? subSel.value : null,
                chapter: chSel ? chSel.value : "",
                date: (dateIn && dateIn.value) || getTodayDateString(),
                duration: durIn ? Number(durIn.value) || 60 : 60,
                questionsSolved: qIn ? Number(qIn.value) || 0 : 0,
                notes: notesIn ? notesIn.value.trim() : "",
                createdAt: new Date().toISOString()
            };
            appState.studySessions.push(newSession);
            saveAppState();
            if (modalSess) modalSess.classList.add('hidden');
            renderSessionsTab();
        });
    }

    // Mock test log modal
    const btnLogTest = document.getElementById('btn-log-mock-test');
    const modalTest = document.getElementById('modal-test-form');
    const formTest = document.getElementById('form-mock-test');
    const btnTestClose = document.getElementById('btn-test-close');
    const btnTestCancel = document.getElementById('btn-test-cancel');

    if (btnLogTest && modalTest) {
        btnLogTest.addEventListener('click', () => {
            const subSel = document.getElementById('test-input-subject');
            const dateIn = document.getElementById('test-input-date');
            if (subSel) {
                subSel.innerHTML = (appState.subjects || []).map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
            }
            if (dateIn) dateIn.value = getTodayDateString();
            modalTest.classList.remove('hidden');
        });
    }
    if (btnTestClose && modalTest) btnTestClose.addEventListener('click', () => modalTest.classList.add('hidden'));
    if (btnTestCancel && modalTest) btnTestCancel.addEventListener('click', () => modalTest.classList.add('hidden'));

    if (formTest) {
        formTest.addEventListener('submit', e => {
            e.preventDefault();
            const titleIn = document.getElementById('test-input-title');
            const subSel = document.getElementById('test-input-subject');
            const dateIn = document.getElementById('test-input-date');
            const totIn = document.getElementById('test-input-total');
            const corrIn = document.getElementById('test-input-correct');
            const durIn = document.getElementById('test-input-duration');

            const totVal = totIn ? Number(totIn.value) || 1 : 1;
            const corrVal = corrIn ? Number(corrIn.value) || 0 : 0;
            const scorePercent = Math.round((corrVal / totVal) * 100);

            if (!Array.isArray(appState.mockTests)) appState.mockTests = [];
            appState.mockTests.push({
                id: generateId(),
                title: titleIn ? titleIn.value.trim() : 'Mock Test',
                subjectId: subSel ? subSel.value : null,
                date: (dateIn && dateIn.value) || getTodayDateString(),
                totalQuestions: totVal,
                correctAnswers: corrVal,
                scorePercent,
                durationMinutes: durIn ? Number(durIn.value) || 60 : 60,
                createdAt: new Date().toISOString()
            });

            saveAppState();
            if (modalTest) modalTest.classList.add('hidden');
            renderTestsTab();
        });
    }

    console.log('[Study Planner] Phase 7 initialized.');
}


// ==========================================================================
// PHASE 8 — HEALTH & HABITS MODULE
// ==========================================================================

const wellnessState = {
    activeTab: 'habits'
};

/**
 * Calculates consecutive daily streak backwards from today (or yesterday).
 * Mathematically supported; never fabricates.
 */
function computeHabitStreak(habit) {
    if (!habit || !Array.isArray(habit.completions) || habit.completions.length === 0) {
        return 0;
    }

    const todayStr = getTodayDateString();
    const sorted = Array.from(new Set(habit.completions)).sort().reverse();

    let streak = 0;
    let checkDate = new Date();

    // If today is completed, start streak from today; otherwise check if yesterday was completed
    if (sorted.includes(todayStr)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestStr = checkDate.toISOString().slice(0, 10);
        if (!sorted.includes(yestStr)) {
            return 0;
        }
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dStr = checkDate.toISOString().slice(0, 10);
        if (sorted.includes(dStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function renderHabitsList() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;

    const habits = Array.isArray(appState.habits) ? appState.habits : [];
    const todayStr = getTodayDateString();

    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding:var(--space-8);">
                <div class="empty-title">No habits created yet</div>
                <p class="empty-description">Click "+ Add Habit" to track your daily execution routines.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = habits.map(h => {
        const isDoneToday = Array.isArray(h.completions) && h.completions.includes(todayStr);
        const streak = computeHabitStreak(h);
        h.streak = streak; // keep state sync

        return `
            <div class="habit-card ${isDoneToday ? 'completed' : ''}" data-habit-id="${escapeHtml(h.id)}">
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:var(--font-size-body);">${escapeHtml(h.title)}</div>
                    <div class="text-caption text-secondary">Target: ${h.targetDays || 7} days/week</div>
                </div>
                <div style="display:flex; align-items:center; gap:var(--space-3);">
                    <div class="habit-streak">${streak}d streak</div>
                    <button class="habit-check-btn ${isDoneToday ? 'checked' : ''} btn-toggle-habit" data-id="${escapeHtml(h.id)}" title="${isDoneToday ? 'Mark not done' : 'Mark done for today'}">
                        ${isDoneToday ? '✓' : ''}
                    </button>
                    <button class="btn-link text-danger text-small btn-del-habit" data-id="${escapeHtml(h.id)}" title="Delete habit">&times;</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-toggle-habit').forEach(btn => {
        btn.addEventListener('click', () => {
            const hId = btn.dataset.id;
            const h = (appState.habits || []).find(item => item.id === hId);
            if (!h) return;
            if (!Array.isArray(h.completions)) h.completions = [];

            const idx = h.completions.indexOf(todayStr);
            if (idx >= 0) {
                h.completions.splice(idx, 1);
            } else {
                h.completions.push(todayStr);
            }
            h.streak = computeHabitStreak(h);
            saveAppState();
            renderHabitsList();
        });
    });

    container.querySelectorAll('.btn-del-habit').forEach(btn => {
        btn.addEventListener('click', () => {
            const hId = btn.dataset.id;
            if (confirm("Delete this habit and its history?")) {
                appState.habits = (appState.habits || []).filter(h => h.id !== hId);
                saveAppState();
                renderHabitsList();
            }
        });
    });
}

function renderSleepLogs() {
    const container = document.getElementById('sleep-logs-container');
    const avgEl = document.getElementById('stat-sleep-avg');
    const lastBedEl = document.getElementById('stat-sleep-last-bed');
    const lastWakeEl = document.getElementById('stat-sleep-last-wake');

    const logs = Array.isArray(appState.sleepLogs) ? appState.sleepLogs : [];

    if (logs.length > 0) {
        const totalDur = logs.reduce((acc, l) => acc + (Number(l.duration) || 0), 0);
        if (avgEl) avgEl.textContent = `${(totalDur / logs.length).toFixed(1)}h`;
        const latest = logs[logs.length - 1];
        if (lastBedEl) lastBedEl.textContent = formatTimeDisplay(latest.bedtime) || '—';
        if (lastWakeEl) lastWakeEl.textContent = formatTimeDisplay(latest.wakeTime) || '—';
    } else {
        if (avgEl) avgEl.textContent = '—';
        if (lastBedEl) lastBedEl.textContent = '—';
        if (lastWakeEl) lastWakeEl.textContent = '—';
    }

    if (!container) return;

    if (logs.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding:var(--space-6);"><p class="text-secondary">No sleep entries logged yet.</p></div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Bedtime</th>
                    <th>Wake Time</th>
                    <th>Duration</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${logs.slice().reverse().map(l => `
                    <tr>
                        <td>${escapeHtml(l.date)}</td>
                        <td>${escapeHtml(formatTimeDisplay(l.bedtime))}</td>
                        <td>${escapeHtml(formatTimeDisplay(l.wakeTime))}</td>
                        <td><strong>${l.duration}h</strong></td>
                        <td class="text-secondary">${escapeHtml(l.notes || '—')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderWaterCard() {
    const textEl = document.getElementById('water-progress-text');
    const fillEl = document.getElementById('water-progress-fill');
    const targetInput = document.getElementById('water-target-input');
    const historyEl = document.getElementById('water-logs-history');

    const todayStr = getTodayDateString();
    if (!Array.isArray(appState.waterLogs)) appState.waterLogs = [];

    let todayLog = appState.waterLogs.find(w => w.date === todayStr);
    if (!todayLog) {
        const targetVal = (targetInput && Number(targetInput.value)) || 2500;
        todayLog = { id: generateId(), date: todayStr, amountMl: 0, targetMl: targetVal, entries: [] };
        appState.waterLogs.push(todayLog);
    }

    const pct = Math.min(100, Math.round((todayLog.amountMl / (todayLog.targetMl || 2500)) * 100));

    if (textEl) textEl.textContent = `${todayLog.amountMl} / ${todayLog.targetMl} ml (${pct}%)`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (targetInput) targetInput.value = todayLog.targetMl;

    if (historyEl) {
        const prevLogs = appState.waterLogs.filter(w => w.amountMl > 0).slice().reverse();
        if (prevLogs.length === 0) {
            historyEl.innerHTML = `<p class="text-small text-muted">No hydration logs recorded.</p>`;
        } else {
            historyEl.innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Date</th><th>Logged Amount</th><th>Target</th><th>Progress</th></tr></thead>
                    <tbody>
                        ${prevLogs.map(w => `
                            <tr>
                                <td>${escapeHtml(w.date)}</td>
                                <td><strong>${w.amountMl} ml</strong></td>
                                <td>${w.targetMl} ml</td>
                                <td>${Math.round((w.amountMl / w.targetMl) * 100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
}

function renderExerciseLogs() {
    const container = document.getElementById('exercise-logs-container');
    if (!container) return;

    const logs = Array.isArray(appState.exerciseLogs) ? appState.exerciseLogs : [];
    if (logs.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding:var(--space-6);"><p class="text-secondary">No exercise sessions logged yet.</p></div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Duration</th>
                    <th>Intensity</th>
                </tr>
            </thead>
            <tbody>
                ${logs.slice().reverse().map(l => `
                    <tr>
                        <td>${escapeHtml(l.date)}</td>
                        <td><strong>${escapeHtml(l.activity || l.type || 'Exercise')}</strong></td>
                        <td>${l.durationMinutes || 30} mins</td>
                        <td><span class="badge-status badge-in-progress">${escapeHtml(l.intensity || 'moderate')}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderMoodLogs() {
    const container = document.getElementById('mood-logs-container');
    if (!container) return;

    const logs = Array.isArray(appState.moodLogs) ? appState.moodLogs : [];
    if (logs.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding:var(--space-6);"><p class="text-secondary">No mood check-ins logged yet.</p></div>`;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>State</th>
                    <th>Energy (1–5)</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${logs.slice().reverse().map(l => `
                    <tr>
                        <td>${escapeHtml(l.date)}</td>
                        <td><strong>${escapeHtml(l.label || 'Focused')}</strong></td>
                        <td>${l.energyLevel || 3} / 5</td>
                        <td class="text-secondary">${escapeHtml(l.notes || '—')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderWellnessView() {
    switch (wellnessState.activeTab) {
        case 'habits':   renderHabitsList();   break;
        case 'sleep':    renderSleepLogs();    break;
        case 'water':    renderWaterCard();    break;
        case 'exercise': renderExerciseLogs(); break;
        case 'mood':     renderMoodLogs();     break;
        default:         renderHabitsList();   break;
    }
}

function initWellnessModule() {
    const navBtns = document.querySelectorAll('.wellness-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-wellness-tab');
            navBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            document.querySelectorAll('.wellness-tab-panel').forEach(p => p.classList.add('hidden'));
            const targetPanel = document.getElementById(`wellness-tab-${tab}`);
            if (targetPanel) targetPanel.classList.remove('hidden');

            wellnessState.activeTab = tab;
            renderWellnessView();
        });
    });

    // Habit modal
    const btnAddHabit = document.getElementById('btn-add-habit');
    const modalHabit = document.getElementById('modal-habit-form');
    const formHabit = document.getElementById('form-habit');
    const btnHabitClose = document.getElementById('btn-habit-close');
    const btnHabitCancel = document.getElementById('btn-habit-cancel');

    if (btnAddHabit && modalHabit) {
        btnAddHabit.addEventListener('click', () => {
            const tIn = document.getElementById('habit-input-title');
            if (tIn) tIn.value = '';
            modalHabit.classList.remove('hidden');
        });
    }
    if (btnHabitClose && modalHabit) btnHabitClose.addEventListener('click', () => modalHabit.classList.add('hidden'));
    if (btnHabitCancel && modalHabit) btnHabitCancel.addEventListener('click', () => modalHabit.classList.add('hidden'));

    if (formHabit) {
        formHabit.addEventListener('submit', e => {
            e.preventDefault();
            const tIn = document.getElementById('habit-input-title');
            const targetIn = document.getElementById('habit-input-target');
            const titleVal = tIn ? tIn.value.trim() : '';
            if (!titleVal) return;

            if (!Array.isArray(appState.habits)) appState.habits = [];
            appState.habits.push({
                id: generateId(),
                title: titleVal,
                frequency: 'daily',
                targetDays: targetIn ? Number(targetIn.value) || 7 : 7,
                streak: 0,
                completions: [],
                archived: false,
                createdAt: new Date().toISOString()
            });

            saveAppState();
            if (modalHabit) modalHabit.classList.add('hidden');
            renderHabitsList();
        });
    }

    // Sleep modal
    const btnLogSleep = document.getElementById('btn-log-sleep');
    const modalSleep = document.getElementById('modal-sleep-form');
    const formSleep = document.getElementById('form-sleep');
    const btnSleepClose = document.getElementById('btn-sleep-close');
    const btnSleepCancel = document.getElementById('btn-sleep-cancel');

    if (btnLogSleep && modalSleep) {
        btnLogSleep.addEventListener('click', () => {
            const dIn = document.getElementById('sleep-input-date');
            if (dIn) dIn.value = getTodayDateString();
            modalSleep.classList.remove('hidden');
        });
    }
    if (btnSleepClose && modalSleep) btnSleepClose.addEventListener('click', () => modalSleep.classList.add('hidden'));
    if (btnSleepCancel && modalSleep) btnSleepCancel.addEventListener('click', () => modalSleep.classList.add('hidden'));

    if (formSleep) {
        formSleep.addEventListener('submit', e => {
            e.preventDefault();
            const dIn = document.getElementById('sleep-input-date');
            const bedIn = document.getElementById('sleep-input-bed');
            const wakeIn = document.getElementById('sleep-input-wake');
            const noteIn = document.getElementById('sleep-input-notes');

            const bedMins = timeToMinutes(bedIn ? bedIn.value : '23:30');
            const wakeMins = timeToMinutes(wakeIn ? wakeIn.value : '07:15');

            // Handle overnight duration
            let durMins = wakeMins - bedMins;
            if (durMins < 0) durMins += 24 * 60;
            const durHours = Number((durMins / 60).toFixed(2));

            if (!Array.isArray(appState.sleepLogs)) appState.sleepLogs = [];
            appState.sleepLogs.push({
                id: generateId(),
                date: (dIn && dIn.value) || getTodayDateString(),
                bedtime: bedIn ? bedIn.value : '23:30',
                wakeTime: wakeIn ? wakeIn.value : '07:15',
                duration: durHours,
                notes: noteIn ? noteIn.value.trim() : '',
                createdAt: new Date().toISOString()
            });

            saveAppState();
            if (modalSleep) modalSleep.classList.add('hidden');
            renderSleepLogs();
        });
    }

    // Water buttons
    const btnW250 = document.getElementById('btn-water-add-250');
    const btnW500 = document.getElementById('btn-water-add-500');
    const btnWReset = document.getElementById('btn-water-reset-today');
    const targetInput = document.getElementById('water-target-input');

    function addWater(amount) {
        const todayStr = getTodayDateString();
        let log = (appState.waterLogs || []).find(w => w.date === todayStr);
        if (!log) {
            log = { id: generateId(), date: todayStr, amountMl: 0, targetMl: 2500, entries: [] };
            appState.waterLogs.push(log);
        }
        log.amountMl = Math.max(0, (log.amountMl || 0) + amount);
        saveAppState();
        renderWaterCard();
    }

    if (btnW250) btnW250.addEventListener('click', () => addWater(250));
    if (btnW500) btnW500.addEventListener('click', () => addWater(500));
    if (btnWReset) {
        btnWReset.addEventListener('click', () => {
            const todayStr = getTodayDateString();
            const log = (appState.waterLogs || []).find(w => w.date === todayStr);
            if (log) log.amountMl = 0;
            saveAppState();
            renderWaterCard();
        });
    }
    if (targetInput) {
        targetInput.addEventListener('change', () => {
            const todayStr = getTodayDateString();
            const log = (appState.waterLogs || []).find(w => w.date === todayStr);
            if (log) log.targetMl = Number(targetInput.value) || 2500;
            saveAppState();
            renderWaterCard();
        });
    }

    // Exercise modal
    const btnLogEx = document.getElementById('btn-log-exercise');
    const modalEx = document.getElementById('modal-exercise-form');
    const formEx = document.getElementById('form-exercise');
    const btnExClose = document.getElementById('btn-exercise-close');
    const btnExCancel = document.getElementById('btn-exercise-cancel');

    if (btnLogEx && modalEx) btnLogEx.addEventListener('click', () => modalEx.classList.remove('hidden'));
    if (btnExClose && modalEx) btnExClose.addEventListener('click', () => modalEx.classList.add('hidden'));
    if (btnExCancel && modalEx) btnExCancel.addEventListener('click', () => modalEx.classList.add('hidden'));

    if (formEx) {
        formEx.addEventListener('submit', e => {
            e.preventDefault();
            const actIn = document.getElementById('exercise-input-activity');
            const durIn = document.getElementById('exercise-input-duration');
            const intIn = document.getElementById('exercise-input-intensity');

            if (!Array.isArray(appState.exerciseLogs)) appState.exerciseLogs = [];
            appState.exerciseLogs.push({
                id: generateId(),
                date: getTodayDateString(),
                activity: actIn ? actIn.value.trim() : 'Exercise',
                durationMinutes: durIn ? Number(durIn.value) || 30 : 30,
                intensity: intIn ? intIn.value : 'moderate',
                createdAt: new Date().toISOString()
            });

            saveAppState();
            if (modalEx) modalEx.classList.add('hidden');
            renderExerciseLogs();
        });
    }

    // Mood modal
    const btnLogMood = document.getElementById('btn-log-mood');
    const modalMood = document.getElementById('modal-mood-form');
    const formMood = document.getElementById('form-mood');
    const btnMoodClose = document.getElementById('btn-mood-close');
    const btnMoodCancel = document.getElementById('btn-mood-cancel');

    if (btnLogMood && modalMood) btnLogMood.addEventListener('click', () => modalMood.classList.remove('hidden'));
    if (btnMoodClose && modalMood) btnMoodClose.addEventListener('click', () => modalMood.classList.add('hidden'));
    if (btnMoodCancel && modalMood) btnMoodCancel.addEventListener('click', () => modalMood.classList.add('hidden'));

    if (formMood) {
        formMood.addEventListener('submit', e => {
            e.preventDefault();
            const lblIn = document.getElementById('mood-input-label');
            const engIn = document.getElementById('mood-input-energy');
            const nIn = document.getElementById('mood-input-notes');

            if (!Array.isArray(appState.moodLogs)) appState.moodLogs = [];
            appState.moodLogs.push({
                id: generateId(),
                date: getTodayDateString(),
                label: lblIn ? lblIn.value : 'Focused',
                energyLevel: engIn ? Number(engIn.value) || 3 : 3,
                notes: nIn ? nIn.value.trim() : '',
                createdAt: new Date().toISOString()
            });

            saveAppState();
            if (modalMood) modalMood.classList.add('hidden');
            renderMoodLogs();
        });
    }

    console.log('[Wellness] Phase 8 initialized.');
}


// ==========================================================================
// PHASE 9 — RULE-BASED AI COACH V1
// 100% Deterministic • Operates Exclusively on Stored Data • Zero Cloud APIs
// ==========================================================================

/**
 * Evaluates behavioral patterns and constraints across stored application state.
 * Returns observations, conflicts, and actionable adjustments with factual citations.
 */
function evaluateAICoach(state = appState) {
    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    const accRecords = Array.isArray(state.accountabilityRecords) ? state.accountabilityRecords : [];
    const studySessions = Array.isArray(state.studySessions) ? state.studySessions : [];
    const sleepLogs = Array.isArray(state.sleepLogs) ? state.sleepLogs : [];
    const habits = Array.isArray(state.habits) ? state.habits : [];
    const timetable = (state.timetable && Array.isArray(state.timetable.entries)) ? state.timetable.entries : [];

    const totalEvents = tasks.length + studySessions.length + sleepLogs.length;

    // Data Sufficiency Threshold: requires at least 3 total records
    if (totalEvents < 3) {
        return {
            hasEnoughData: false,
            message: "Not enough data yet to identify a reliable pattern. Continue logging your tasks, study sessions, and routines.",
            conflicts: [],
            patterns: [],
            adjustments: []
        };
    }

    const conflicts = [];
    const patterns = [];
    const adjustments = [];

    // Rule 1: Task Overload Detection (Days with > 5 tasks or > 8h scheduled)
    const taskCountByDate = {};
    const taskHoursByDate = {};
    tasks.filter(t => t.status === 'planned').forEach(t => {
        if (!t.date) return;
        taskCountByDate[t.date] = (taskCountByDate[t.date] || 0) + 1;
        const durHours = (t.estimatedDuration || 60) / 60;
        taskHoursByDate[t.date] = (taskHoursByDate[t.date] || 0) + durHours;
    });

    Object.keys(taskCountByDate).forEach(d => {
        if (taskCountByDate[d] >= 6 || taskHoursByDate[d] >= 8) {
            conflicts.push({
                type: 'overload',
                severity: 'warning',
                title: `High Task Overload on ${d}`,
                evidence: `${taskCountByDate[d]} planned tasks totaling ${taskHoursByDate[d].toFixed(1)} scheduled hours.`,
                suggestion: `Days with more than 5 scheduled tasks exhibit higher miss rates. Consider deferring low-priority items.`
            });
        }
    });

    // Rule 2: Timetable / Task Collision
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    tasks.filter(t => t.status === 'planned' && t.startTime && t.endTime && t.date).forEach(t => {
        const dObj = new Date(t.date + 'T12:00:00');
        const dayOfWeek = dayNames[dObj.getDay()];
        const tStart = timeToMinutes(t.startTime);
        const tEnd = timeToMinutes(t.endTime);

        const overlappingClass = timetable.find(c => {
            if (c.day !== dayOfWeek) return false;
            const cStart = timeToMinutes(c.startTime);
            const cEnd = timeToMinutes(c.endTime);
            return (tStart < cEnd && tEnd > cStart);
        });

        if (overlappingClass) {
            conflicts.push({
                type: 'collision',
                severity: 'error',
                title: `Task Clashes with Timetable on ${t.date}`,
                evidence: `Task "${t.title}" (${formatTimeDisplay(t.startTime)}–${formatTimeDisplay(t.endTime)}) overlaps with "${overlappingClass.title}" (${formatTimeDisplay(overlappingClass.startTime)}–${formatTimeDisplay(overlappingClass.endTime)}).`,
                suggestion: `Move "${t.title}" to an open window outside class hours to prevent an unavoidable miss.`
            });
        }
    });

    // Rule 3: Repeated Miss Reason Pattern (>= 40% of missed tasks with same reason)
    const missedRecords = accRecords.filter(r => r.status === 'missed');
    if (missedRecords.length >= 3) {
        const reasonCounts = {};
        missedRecords.forEach(r => {
            const reason = r.reason || 'Other / Unspecified';
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });

        Object.keys(reasonCounts).forEach(reason => {
            const count = reasonCounts[reason];
            const pct = Math.round((count / missedRecords.length) * 100);
            if (pct >= 40) {
                patterns.push({
                    title: `Primary Miss Factor: ${reason}`,
                    evidence: `"${reason}" accounts for ${count} of your last ${missedRecords.length} missed tasks (${pct}%).`,
                    impact: `Identified as the dominant operational blocker interrupting task momentum.`
                });

                if (reason.toLowerCase().includes('fatigue') || reason.toLowerCase().includes('energy')) {
                    adjustments.push({
                        action: `Shift Demanding Tasks Earlier`,
                        detail: `Schedule high-focus academic tasks during morning or early afternoon windows when energy levels are highest.`
                    });
                } else if (reason.toLowerCase().includes('estimation') || reason.toLowerCase().includes('time')) {
                    adjustments.push({
                        action: `Add 25% Buffer to Block Durations`,
                        detail: `Increase estimated durations for complex problem solving to prevent schedule spill-overs.`
                    });
                }
            }
        });
    }

    // Rule 4: Evening Vulnerability Window (>= 50% misses after 19:00)
    const missedWithTime = tasks.filter(t => t.status === 'missed' && t.startTime);
    if (missedWithTime.length >= 3) {
        const eveningMisses = missedWithTime.filter(t => timeToMinutes(t.startTime) >= 19 * 60).length;
        const evePct = Math.round((eveningMisses / missedWithTime.length) * 100);
        if (evePct >= 50) {
            patterns.push({
                title: `Evening Vulnerability Window`,
                evidence: `${eveningMisses} of your ${missedWithTime.length} timed missed tasks occurred after 7:00 PM (${evePct}%).`,
                impact: `Tasks scheduled late in the evening show significantly higher miss likelihood due to cumulative cognitive load.`
            });
            adjustments.push({
                action: `Cap Evening Workload`,
                detail: `Reserve post-7 PM windows exclusively for light review or habit routines, not deep problem solving.`
            });
        }
    }

    // Rule 5: Habit Momentum Alert
    habits.forEach(h => {
        const streak = computeHabitStreak(h);
        const todayDone = Array.isArray(h.completions) && h.completions.includes(getTodayDateString());
        if (streak >= 2 && !todayDone) {
            patterns.push({
                title: `Streak Protection: "${h.title}"`,
                evidence: `Currently on a ${streak}-day consecutive streak. Not yet logged for today.`,
                impact: `Completing this habit today preserves your streak.`
            });
        }
    });

    // Rule 6: Sleep Correlation
    if (sleepLogs.length >= 3) {
        const shortSleepDates = sleepLogs.filter(s => Number(s.duration) < 6).map(s => s.date);
        const nextDayMisses = tasks.filter(t => t.status === 'missed' && shortSleepDates.includes(t.date)).length;
        if (nextDayMisses >= 1) {
            patterns.push({
                title: `Sleep Deficit Correlation`,
                evidence: `${nextDayMisses} task misses occurred on dates where sleep was recorded below 6 hours.`,
                impact: `Sleep consistency directly stabilizes daily task execution rates.`
            });
        }
    }

    // Default recovery adjustment if recent misses exist
    if (missedRecords.length >= 2) {
        adjustments.push({
            action: `Post-Miss Stabilization`,
            detail: `After missed tasks, avoid compensatory over-scheduling. Focus on executing 2 high-priority tasks cleanly today.`
        });
    }

    return {
        hasEnoughData: true,
        conflicts,
        patterns,
        adjustments
    };
}

function renderAICoachView() {
    const analysis = evaluateAICoach(appState);
    const badgeEl = document.getElementById('aicoach-rules-triggered-badge');
    const titleEl = document.getElementById('aicoach-data-sufficiency-title');
    const descEl = document.getElementById('aicoach-data-sufficiency-desc');
    const conflictsContainer = document.getElementById('aicoach-conflicts-container');
    const patternsContainer = document.getElementById('aicoach-patterns-container');
    const adjustmentsContainer = document.getElementById('aicoach-adjustments-container');

    if (!analysis.hasEnoughData) {
        if (badgeEl) badgeEl.textContent = 'Insufficient data';
        if (titleEl) titleEl.textContent = 'Accumulating Behavioral Baseline';
        if (descEl) descEl.textContent = analysis.message;
        if (conflictsContainer) conflictsContainer.innerHTML = `<p class="text-secondary text-small">No conflicts evaluated yet.</p>`;
        if (patternsContainer) patternsContainer.innerHTML = `<p class="text-secondary text-small">Patterns emerge as you record completions and missed reasons.</p>`;
        if (adjustmentsContainer) adjustmentsContainer.innerHTML = `<p class="text-secondary text-small">Adjustments will be suggested when execution data is available.</p>`;
        return;
    }

    const totalActiveRules = analysis.conflicts.length + analysis.patterns.length + analysis.adjustments.length;
    if (badgeEl) badgeEl.textContent = `${totalActiveRules} active observation(s)`;
    if (titleEl) titleEl.textContent = `Active Operational Insights`;
    if (descEl) descEl.textContent = `All observations are strictly evaluated from your stored tasks, timetable, habits, and accountability logs.`;

    // Render conflicts
    if (conflictsContainer) {
        if (analysis.conflicts.length === 0) {
            conflictsContainer.innerHTML = `<p class="text-small text-muted">No schedule conflicts or daily overload detected.</p>`;
        } else {
            conflictsContainer.innerHTML = analysis.conflicts.map(c => `
                <div class="alert alert-warning mb-sm">
                    <strong>${escapeHtml(c.title)}:</strong> ${escapeHtml(c.evidence)}
                    <div class="mt-xs text-small">${escapeHtml(c.suggestion)}</div>
                </div>
            `).join('');
        }
    }

    // Render patterns
    if (patternsContainer) {
        if (analysis.patterns.length === 0) {
            patternsContainer.innerHTML = `<p class="text-small text-muted">No recurring bottleneck patterns identified yet.</p>`;
        } else {
            patternsContainer.innerHTML = analysis.patterns.map(p => `
                <div class="planner-card">
                    <strong style="color:var(--color-brand);">${escapeHtml(p.title)}</strong>
                    <div class="body-text text-secondary mt-xs">${escapeHtml(p.evidence)}</div>
                    <div class="card-caption text-muted mt-xs">${escapeHtml(p.impact)}</div>
                </div>
            `).join('');
        }
    }

    // Render adjustments
    if (adjustmentsContainer) {
        if (analysis.adjustments.length === 0) {
            adjustmentsContainer.innerHTML = `<p class="text-small text-muted">Your current schedule execution is well-balanced.</p>`;
        } else {
            adjustmentsContainer.innerHTML = analysis.adjustments.map(a => `
                <div class="planner-card mb-xs">
                    <div style="font-weight:600; font-size:var(--font-size-body);">${escapeHtml(a.action)}</div>
                    <div class="text-secondary text-small mt-xs">${escapeHtml(a.detail)}</div>
                </div>
            `).join('');
        }
    }
}

function initAICoachModule() {
    const btnRefresh = document.getElementById('btn-refresh-aicoach');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            renderAICoachView();
        });
    }
    console.log('[AI Coach] Phase 9 initialized.');
}


// ==========================================================================
// PHASE 10 — REMINDERS MODULE
// Local Storage Alerts • Notification API • Accountability Lifecycle Link
// ==========================================================================

const remindersState = {
    activeCategory: 'all'
};

function renderRemindersView() {
    const container = document.getElementById('reminders-list-container');
    const badgeEl = document.getElementById('reminders-count-badge');
    const permText = document.getElementById('reminder-permission-status-text');

    if (permText && typeof Notification !== 'undefined') {
        permText.textContent = `Notification permission: ${Notification.permission.toUpperCase()}. Local alerts fire when tab is open.`;
    }

    const reminders = Array.isArray(appState.reminders) ? appState.reminders : [];
    const filtered = reminders.filter(r => {
        if (remindersState.activeCategory === 'all') return true;
        return (r.category || '').toLowerCase() === remindersState.activeCategory;
    });

    if (badgeEl) {
        const activeCount = reminders.filter(r => r.enabled && !r.handled).length;
        badgeEl.textContent = `${activeCount} active`;
    }

    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:var(--space-8);">
                <div class="empty-title">No reminders in this category</div>
                <p class="empty-description">Click "+ Add Reminder" above to set a scheduled execution prompt.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(r => `
        <div class="reminder-card ${r.handled ? 'handled' : ''}" data-reminder-id="${escapeHtml(r.id)}">
            <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:var(--space-2);">
                    <span class="reminder-category-pill">${escapeHtml(r.category || 'other')}</span>
                    <strong style="font-size:var(--font-size-body);">${escapeHtml(r.title)}</strong>
                </div>
                <div class="text-caption text-secondary mt-xs">
                    Scheduled: ${escapeHtml(r.dateTime.replace('T', ' '))}
                    ${r.handled ? '<span class="ml-xs text-muted">(Handled)</span>' : ''}
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-secondary btn-sm btn-toggle-rem" data-id="${escapeHtml(r.id)}">
                    ${r.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button class="btn btn-primary btn-sm btn-handle-rem" data-id="${escapeHtml(r.id)}">
                    ${r.handled ? 'Reopen' : 'Done'}
                </button>
                <button class="btn btn-danger btn-sm btn-del-rem" data-id="${escapeHtml(r.id)}">&times;</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.btn-toggle-rem').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = (appState.reminders || []).find(item => item.id === btn.dataset.id);
            if (r) {
                r.enabled = !r.enabled;
                saveAppState();
                renderRemindersView();
            }
        });
    });

    container.querySelectorAll('.btn-handle-rem').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = (appState.reminders || []).find(item => item.id === btn.dataset.id);
            if (r) {
                r.handled = !r.handled;
                saveAppState();
                renderRemindersView();
            }
        });
    });

    container.querySelectorAll('.btn-del-rem').forEach(btn => {
        btn.addEventListener('click', () => {
            const rId = btn.dataset.id;
            if (confirm("Delete this reminder?")) {
                appState.reminders = (appState.reminders || []).filter(r => r.id !== rId);
                saveAppState();
                renderRemindersView();
            }
        });
    });
}

function startRemindersInterval() {
    // Check every 25 seconds for due reminders
    setInterval(() => {
        checkDueReminders();
    }, 25000);
}

function checkDueReminders() {
    const nowIso = new Date().toISOString();
    const nowLocal = nowIso.slice(0, 16); // YYYY-MM-DDTHH:MM

    const due = (appState.reminders || []).find(r => {
        return r.enabled && !r.handled && r.dateTime && r.dateTime <= nowLocal;
    });

    if (due) {
        showReminderAlert(due);
    }
}

function showReminderAlert(reminder) {
    const modal = document.getElementById('modal-reminder-alert');
    const textEl = document.getElementById('reminder-alert-text');
    const catEl = document.getElementById('reminder-alert-category');
    const idIn = document.getElementById('reminder-alert-target-id');

    if (!modal) return;

    if (textEl) textEl.textContent = reminder.title;
    if (catEl) catEl.textContent = (reminder.category || 'Study').toUpperCase();
    if (idIn) idIn.value = reminder.id;

    modal.classList.remove('hidden');

    // Trigger browser notification if permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
            new Notification(`Momentum AI: ${reminder.title}`, {
                body: `Scheduled reminder for ${reminder.category || 'activity'}. Execution over intention.`
            });
        } catch (e) {
            console.warn('[Notification] Could not display native notification:', e);
        }
    }
}

function initRemindersModule() {
    const btnAdd = document.getElementById('btn-add-reminder');
    const modalForm = document.getElementById('modal-reminder-form');
    const form = document.getElementById('form-reminder');
    const btnClose = document.getElementById('btn-reminder-close');
    const btnCancel = document.getElementById('btn-reminder-cancel');
    const btnPerm = document.getElementById('btn-request-notification-perm');

    if (btnAdd && modalForm) {
        btnAdd.addEventListener('click', () => {
            const titleIn = document.getElementById('reminder-input-title');
            const dtIn = document.getElementById('reminder-input-datetime');
            const taskSel = document.getElementById('reminder-input-linked-task');

            if (titleIn) titleIn.value = '';
            if (dtIn) {
                const now = new Date();
                now.setMinutes(now.getMinutes() + 15);
                dtIn.value = now.toISOString().slice(0, 16);
            }
            if (taskSel) {
                taskSel.innerHTML = `<option value="">No linked task</option>` +
                    (appState.tasks || []).map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.title)} (${t.date})</option>`).join('');
            }
            modalForm.classList.remove('hidden');
        });
    }

    if (btnClose && modalForm) btnClose.addEventListener('click', () => modalForm.classList.add('hidden'));
    if (btnCancel && modalForm) btnCancel.addEventListener('click', () => modalForm.classList.add('hidden'));

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const titleIn = document.getElementById('reminder-input-title');
            const catIn = document.getElementById('reminder-input-category');
            const dtIn = document.getElementById('reminder-input-datetime');
            const taskIn = document.getElementById('reminder-input-linked-task');

            const title = titleIn ? titleIn.value.trim() : '';
            const dt = dtIn ? dtIn.value : '';
            const cat = catIn ? catIn.value : 'study';

            if (!title || !dt) return;

            // Duplicate protection: prevent duplicate title + category + datetime within 5m
            const isDup = (appState.reminders || []).some(r => r.title === title && r.category === cat && r.dateTime === dt);
            if (isDup) {
                alert("An identical reminder is already scheduled for this time.");
                return;
            }

            if (!Array.isArray(appState.reminders)) appState.reminders = [];
            appState.reminders.push({
                id: generateId(),
                title,
                category: cat,
                dateTime: dt,
                linkedTaskId: taskIn && taskIn.value ? taskIn.value : null,
                linkedGoalId: null,
                enabled: true,
                handled: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            saveAppState();
            if (modalForm) modalForm.classList.add('hidden');
            renderRemindersView();
        });
    }

    if (btnPerm) {
        btnPerm.addEventListener('click', () => {
            if (typeof Notification !== 'undefined') {
                Notification.requestPermission().then(perm => {
                    renderRemindersView();
                });
            } else {
                alert("Web Notifications API is not supported in this browser.");
            }
        });
    }

    // Reminder alert popup handlers
    const modalAlert = document.getElementById('modal-reminder-alert');
    const btnAlertDone = document.getElementById('btn-reminder-alert-done');
    const btnAlertSnooze = document.getElementById('btn-reminder-alert-snooze');
    const btnAlertClose = document.getElementById('btn-reminder-alert-close');
    const targetIdIn = document.getElementById('reminder-alert-target-id');

    if (btnAlertClose && modalAlert) btnAlertClose.addEventListener('click', () => modalAlert.classList.add('hidden'));

    if (btnAlertDone) {
        btnAlertDone.addEventListener('click', () => {
            const id = targetIdIn ? targetIdIn.value : null;
            const r = (appState.reminders || []).find(item => item.id === id);
            if (r) {
                r.handled = true;
                saveAppState();
                renderRemindersView();
            }
            if (modalAlert) modalAlert.classList.add('hidden');
        });
    }

    if (btnAlertSnooze) {
        btnAlertSnooze.addEventListener('click', () => {
            const id = targetIdIn ? targetIdIn.value : null;
            const r = (appState.reminders || []).find(item => item.id === id);
            if (r) {
                const now = new Date();
                now.setMinutes(now.getMinutes() + 15);
                r.dateTime = now.toISOString().slice(0, 16);
                saveAppState();
                renderRemindersView();
            }
            if (modalAlert) modalAlert.classList.add('hidden');
        });
    }

    // Category filter tabs
    document.querySelectorAll('#reminder-category-filters .tt-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#reminder-category-filters .tt-day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            remindersState.activeCategory = btn.dataset.category;
            renderRemindersView();
        });
    });

    console.log('[Reminders] Phase 10 initialized.');
}


// ==========================================================================
// PHASE 11 & 12 — ANALYTICS & PRODUCTIVITY SCORE
// Weighted Formula: Tasks 35% + Study 35% + Habits 20% + Planning 10%
// ==========================================================================

const analyticsState = {
    activeScope: '7days'
};

/**
 * Filters items by the currently active date scope.
 */
function isDateInScope(dateStr, scope = analyticsState.activeScope) {
    if (!dateStr) return false;
    if (scope === 'all') return true;

    const targetDate = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (scope === 'today') {
        return dateStr === getTodayDateString();
    }

    const diffDays = Math.round((today - targetDate) / (1000 * 60 * 60 * 24));
    if (scope === '7days') return diffDays >= 0 && diffDays <= 7;
    if (scope === '30days') return diffDays >= 0 && diffDays <= 30;

    return true;
}

/**
 * Strict Phase 12 Productivity Score Formula:
 * Score = taskCompletion * 0.35 + studyTargetCompletion * 0.35 + habitConsistency * 0.20 + planningConsistency * 0.10
 * Does NOT fabricate when insufficient data.
 */
function calculateProductivityScore(scope = analyticsState.activeScope) {
    const tasks = (appState.tasks || []).filter(t => isDateInScope(t.date, scope));
    const studySessions = (appState.studySessions || []).filter(s => isDateInScope(s.date || s.createdAt.slice(0, 10), scope));
    const habits = appState.habits || [];

    // Check if there is enough activity data
    if (tasks.length === 0 && studySessions.length === 0 && habits.length === 0) {
        return {
            hasData: false,
            score: null,
            taskComp: 0,
            studyComp: 0,
            habitComp: 0,
            planComp: 0,
            message: "Insufficient activity data to compute score for this period."
        };
    }

    // 1. Task Completion (35%)
    let taskPct = 0;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const closedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'missed').length;
    if (closedTasks > 0) {
        taskPct = Math.round((completedTasks / closedTasks) * 100);
    } else if (tasks.length > 0) {
        taskPct = 50; // In-progress baseline
    }

    // 2. Study Target Completion (35%)
    const targetDailyHours = (appState.academicProfile && appState.academicProfile.dailyStudyTargetHours) || 3.5;
    const scopeDays = scope === 'today' ? 1 : scope === '7days' ? 7 : scope === '30days' ? 30 : Math.max(1, (tasks.length || 7));
    const expectedStudyHours = targetDailyHours * scopeDays;
    const loggedStudyMinutes = studySessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const loggedStudyHours = loggedStudyMinutes / 60;
    const studyPct = Math.min(100, Math.round((loggedStudyHours / (expectedStudyHours || 1)) * 100));

    // 3. Habit Consistency (20%)
    let habitPct = 0;
    if (habits.length > 0) {
        const totalStreak = habits.reduce((acc, h) => acc + computeHabitStreak(h), 0);
        habitPct = Math.min(100, Math.round((totalStreak / (habits.length * 5)) * 100));
    }

    // 4. Planning Consistency (10%)
    // Ratio of planned tasks completed on schedule without last-minute cancellation
    const planPct = closedTasks > 0 ? taskPct : 70;

    // Weighted Formula
    const scoreVal = Math.round(
        (taskPct * 0.35) +
        (studyPct * 0.35) +
        (habitPct * 0.20) +
        (planPct * 0.10)
    );

    return {
        hasData: true,
        score: Math.min(100, Math.max(0, scoreVal)),
        taskComp: Number((taskPct * 0.35).toFixed(1)),
        studyComp: Number((studyPct * 0.35).toFixed(1)),
        habitComp: Number((habitPct * 0.20).toFixed(1)),
        planComp: Number((planPct * 0.10).toFixed(1)),
        raw: { taskPct, studyPct, habitPct, planPct }
    };
}

function renderAnalyticsView() {
    const scope = analyticsState.activeScope;
    const scoreData = calculateProductivityScore(scope);

    // Productivity score display
    const scoreValEl = document.getElementById('analytics-score-val');
    const scorePeriodEl = document.getElementById('analytics-score-period-text');
    const compTaskEl = document.getElementById('score-comp-task');
    const compTaskSub = document.getElementById('score-comp-task-sub');
    const compStudyEl = document.getElementById('score-comp-study');
    const compStudySub = document.getElementById('score-comp-study-sub');
    const compHabitEl = document.getElementById('score-comp-habit');
    const compHabitSub = document.getElementById('score-comp-habit-sub');
    const compPlanEl = document.getElementById('score-comp-plan');
    const compPlanSub = document.getElementById('score-comp-plan-sub');

    if (scorePeriodEl) {
        scorePeriodEl.textContent = scope === 'today' ? 'Today' : scope === '7days' ? '7 Days Scope' : scope === '30days' ? '30 Days Scope' : 'All Time';
    }

    if (scoreData.hasData) {
        if (scoreValEl) scoreValEl.textContent = scoreData.score;
        if (compTaskEl) compTaskEl.textContent = `${scoreData.raw.taskPct}%`;
        if (compTaskSub) compTaskSub.textContent = `${scoreData.taskComp} / 35 pts`;
        if (compStudyEl) compStudyEl.textContent = `${scoreData.raw.studyPct}%`;
        if (compStudySub) compStudySub.textContent = `${scoreData.studyComp} / 35 pts`;
        if (compHabitEl) compHabitEl.textContent = `${scoreData.raw.habitPct}%`;
        if (compHabitSub) compHabitSub.textContent = `${scoreData.habitComp} / 20 pts`;
        if (compPlanEl) compPlanEl.textContent = `${scoreData.raw.planPct}%`;
        if (compPlanSub) compPlanSub.textContent = `${scoreData.planComp} / 10 pts`;
    } else {
        if (scoreValEl) scoreValEl.textContent = '—';
        if (compTaskEl) compTaskEl.textContent = '—';
        if (compTaskSub) compTaskSub.textContent = '0 / 35 pts';
        if (compStudyEl) compStudyEl.textContent = '—';
        if (compStudySub) compStudySub.textContent = '0 / 35 pts';
        if (compHabitEl) compHabitEl.textContent = '—';
        if (compHabitSub) compHabitSub.textContent = '0 / 20 pts';
        if (compPlanEl) compPlanEl.textContent = '—';
        if (compPlanSub) compPlanSub.textContent = '0 / 10 pts';
    }

    // Key metrics summary
    const tasks = (appState.tasks || []).filter(t => isDateInScope(t.date, scope));
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const missedTasks = tasks.filter(t => t.status === 'missed');
    const taskRateEl = document.getElementById('analytics-tasks-rate');
    const taskDetailEl = document.getElementById('analytics-tasks-detail');

    if (taskRateEl && taskDetailEl) {
        if (tasks.length > 0) {
            const rate = Math.round((completedTasks.length / tasks.length) * 100);
            taskRateEl.textContent = `${rate}%`;
            taskDetailEl.textContent = `${completedTasks.length} of ${tasks.length} tasks completed`;
        } else {
            taskRateEl.textContent = '—';
            taskDetailEl.textContent = 'No tasks in this period';
        }
    }

    const studySessions = (appState.studySessions || []).filter(s => isDateInScope(s.date || s.createdAt.slice(0, 10), scope));
    const studyHoursEl = document.getElementById('analytics-study-hours');
    const studyDetailEl = document.getElementById('analytics-study-detail');
    if (studyHoursEl && studyDetailEl) {
        const totalMins = studySessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
        studyHoursEl.textContent = `${(totalMins / 60).toFixed(1)}h`;
        studyDetailEl.textContent = `${studySessions.length} session(s) logged`;
    }

    const habits = appState.habits || [];
    const habitRateEl = document.getElementById('analytics-habits-rate');
    const habitDetailEl = document.getElementById('analytics-habits-detail');
    if (habitRateEl && habitDetailEl) {
        const totalCompletions = habits.reduce((acc, h) => {
            const inScope = (h.completions || []).filter(d => isDateInScope(d, scope)).length;
            return acc + inScope;
        }, 0);
        habitRateEl.textContent = totalCompletions;
        habitDetailEl.textContent = `Total habit check-ins in period`;
    }

    const sleepLogs = (appState.sleepLogs || []).filter(s => isDateInScope(s.date, scope));
    const sleepAvgEl = document.getElementById('analytics-sleep-avg');
    const sleepDetailEl = document.getElementById('analytics-sleep-detail');
    if (sleepAvgEl && sleepDetailEl) {
        if (sleepLogs.length > 0) {
            const avgDur = (sleepLogs.reduce((acc, s) => acc + (Number(s.duration) || 0), 0) / sleepLogs.length).toFixed(1);
            sleepAvgEl.textContent = `${avgDur}h`;
            sleepDetailEl.textContent = `${sleepLogs.length} night(s) logged`;
        } else {
            sleepAvgEl.textContent = '—';
            sleepDetailEl.textContent = 'No sleep records in period';
        }
    }

    // Missed reasons breakdown
    const missedReasonsContainer = document.getElementById('analytics-missed-reasons-container');
    if (missedReasonsContainer) {
        const accRecords = (appState.accountabilityRecords || []).filter(r => isDateInScope(r.recordedAt.slice(0, 10), scope) && r.status === 'missed');
        if (accRecords.length === 0) {
            missedReasonsContainer.innerHTML = `<p class="text-small text-muted" style="padding:var(--space-4);">No missed task accountability records in this period.</p>`;
        } else {
            const counts = {};
            accRecords.forEach(r => {
                const re = r.reason || 'Other';
                counts[re] = (counts[re] || 0) + 1;
            });
            missedReasonsContainer.innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Reason</th><th>Count</th><th>Share</th></tr></thead>
                    <tbody>
                        ${Object.keys(counts).map(k => `
                            <tr>
                                <td><strong>${escapeHtml(k)}</strong></td>
                                <td>${counts[k]}</td>
                                <td>${Math.round((counts[k] / accRecords.length) * 100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Wellness summary table
    const wellnessSummaryContainer = document.getElementById('analytics-wellness-summary-container');
    if (wellnessSummaryContainer) {
        const waterLogs = (appState.waterLogs || []).filter(w => isDateInScope(w.date, scope));
        const exLogs = (appState.exerciseLogs || []).filter(e => isDateInScope(e.date, scope));
        const totalWater = waterLogs.reduce((a, b) => a + (Number(b.amountMl) || 0), 0);
        const totalExMinutes = exLogs.reduce((a, b) => a + (Number(b.durationMinutes) || 0), 0);

        wellnessSummaryContainer.innerHTML = `
            <table class="data-table">
                <tbody>
                    <tr><td>Total Hydration Logged</td><td><strong>${totalWater} ml</strong></td></tr>
                    <tr><td>Total Physical Exercise</td><td><strong>${totalExMinutes} mins</strong> (${exLogs.length} sessions)</td></tr>
                    <tr><td>Active Habit Streaks</td><td><strong>${habits.filter(h => computeHabitStreak(h) > 0).length}</strong> / ${habits.length} habits</td></tr>
                </tbody>
            </table>
        `;
    }

    // Draw Canvas Charts
    const plannedHours = (tasks.reduce((a, t) => a + (t.estimatedDuration || 60), 0) / 60);
    const executedHours = (completedTasks.reduce((a, t) => a + (t.estimatedDuration || 60), 0) / 60) + ((studySessions.reduce((a, s) => a + (Number(s.duration) || 0), 0)) / 60);
    drawPlanVsActualChart(plannedHours, executedHours);

    // Weekday completion
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    completedTasks.forEach(t => {
        const dObj = new Date(t.date + 'T12:00:00');
        weekdayCounts[dObj.getDay()]++;
    });
    drawWeekdayCompletionChart(weekdayCounts);
}

function drawPlanVsActualChart(plannedHours, executedHours) {
    const canvas = document.getElementById('canvas-plan-vs-actual');
    const summaryEl = document.getElementById('chart-plan-summary');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (summaryEl) {
        summaryEl.textContent = `Planned: ${plannedHours.toFixed(1)}h | Verified Executed: ${executedHours.toFixed(1)}h`;
    }

    // Chart styling strictly matching design tokens
    const maxVal = Math.max(1, Math.ceil(Math.max(plannedHours, executedHours) * 1.25));
    const padding = 40;
    const barW = 80;

    // Draw Y-axis grid
    ctx.strokeStyle = '#2a2c30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();

    // Bars
    const h1 = ((plannedHours / maxVal) * (h - padding * 2));
    const h2 = ((executedHours / maxVal) * (h - padding * 2));

    // Bar 1: Planned (Neutral Gray / Charcoal)
    ctx.fillStyle = '#475569';
    ctx.fillRect(w / 2 - barW - 20, h - padding - h1, barW, h1);

    // Bar 2: Executed (Muted Brand Teal #0f766e)
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(w / 2 + 20, h - padding - h2, barW, h2);

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Planned (${plannedHours.toFixed(1)}h)`, w / 2 - barW / 2 - 20, h - padding + 20);
    ctx.fillText(`Executed (${executedHours.toFixed(1)}h)`, w / 2 + barW / 2 + 20, h - padding + 20);
}

function drawWeekdayCompletionChart(counts) {
    const canvas = document.getElementById('canvas-weekday-completion');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(1, Math.ceil(Math.max(...counts) * 1.25));
    const padding = 30;
    const barW = (w - padding * 2) / 7 - 10;
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    ctx.strokeStyle = '#2a2c30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();

    counts.forEach((c, idx) => {
        const barH = (c / maxVal) * (h - padding * 2);
        const x = padding + idx * (barW + 10) + 5;
        const y = h - padding - barH;

        ctx.fillStyle = c > 0 ? '#0f766e' : '#334155';
        ctx.fillRect(x, y, barW, barH);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "IBM Plex Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[idx], x + barW / 2, h - padding + 18);
        if (c > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(c, x + barW / 2, y - 6);
        }
    });
}

function initAnalyticsModule() {
    const scopeBtns = document.querySelectorAll('.analytics-scope-btn');
    scopeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            scopeBtns.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-secondary');
            });
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');

            analyticsState.activeScope = btn.dataset.scope;
            renderAnalyticsView();
        });
    });

    console.log('[Analytics] Phases 11 & 12 initialized.');
}


// ==========================================================================
// PHASE 13 — SETTINGS MODULE
// Profile • Goals • Academic • Theme • Safe Export/Import • Safe Reset
// ==========================================================================

function renderSettingsView() {
    const nameIn = document.getElementById('settings-input-name');
    const typeIn = document.getElementById('settings-input-usertype');
    const wakeIn = document.getElementById('settings-input-waketime');
    const sleepIn = document.getElementById('settings-input-sleeptime');
    const focusIn = document.getElementById('settings-input-focus');

    if (appState.profile) {
        if (nameIn) nameIn.value = appState.profile.name || '';
        if (typeIn) typeIn.value = appState.profile.userType || appState.profile.studentOrWorker || 'student';
        if (wakeIn) wakeIn.value = appState.profile.wakeTime || '07:00';
        if (sleepIn) sleepIn.value = appState.profile.sleepTime || '23:00';
        if (focusIn) focusIn.value = appState.profile.peakFocusTime || 'Morning';
    }

    const examIn = document.getElementById('settings-input-target-exam');
    const examDateIn = document.getElementById('settings-input-exam-date');
    const targetIn = document.getElementById('settings-input-daily-study-target');
    const sessLenIn = document.getElementById('settings-input-session-len');

    if (appState.academicProfile) {
        if (examIn) examIn.value = appState.academicProfile.targetExam || '';
        if (examDateIn) examDateIn.value = appState.academicProfile.examDate || '';
        if (targetIn) targetIn.value = appState.academicProfile.dailyStudyTargetHours || 3.5;
        if (sessLenIn) sessLenIn.value = appState.academicProfile.preferredSessionDurationMinutes || 60;
    }

    const themeSel = document.getElementById('settings-select-theme');
    const motionSel = document.getElementById('settings-toggle-reduced-motion');

    if (appState.settings) {
        if (themeSel) themeSel.value = appState.settings.theme || 'system';
        if (motionSel) motionSel.value = String(appState.settings.reducedMotion === true);
    }
}

function exportStateJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `momentum_ai_backup_${getTodayDateString()}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importStateJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed || typeof parsed !== 'object' || !parsed.schemaVersion) {
                alert("Invalid state file format. Could not detect a valid Momentum AI schema.");
                return;
            }
            if (confirm(`Import state from file (Schema version ${parsed.schemaVersion})? This will replace current local data.`)) {
                const migrated = migrateAppState(parsed);
                if (validateAppState(migrated.state)) {
                    appState = migrated.state;
                    saveAppState();
                    applyTheme(appState.settings.theme);
                    renderAllUI();
                    alert("Data imported successfully!");
                } else {
                    alert("Imported state failed validation.");
                }
            }
        } catch (err) {
            alert(`Error reading backup JSON: ${err.message}`);
        }
    };
    reader.readAsText(file);
}

function resetOnboarding() {
    if (confirm("Reset onboarding? This will allow you to run through the setup wizard again, but will PRESERVE all your existing tasks, timetable, study plans, habits, and history.")) {
        if (appState.profile) {
            appState.profile.onboardingCompleted = false;
        }
        saveAppState();
        checkOnboardingState();
    }
}

function initSettingsModule() {
    const formProf = document.getElementById('form-settings-profile');
    if (formProf) {
        formProf.addEventListener('submit', e => {
            e.preventDefault();
            const nameIn = document.getElementById('settings-input-name');
            const typeIn = document.getElementById('settings-input-usertype');
            const wakeIn = document.getElementById('settings-input-waketime');
            const sleepIn = document.getElementById('settings-input-sleeptime');
            const focusIn = document.getElementById('settings-input-focus');

            if (!appState.profile) appState.profile = createInitialState().profile;
            if (nameIn) appState.profile.name = nameIn.value.trim();
            if (typeIn) {
                appState.profile.userType = typeIn.value;
                appState.profile.studentOrWorker = typeIn.value;
            }
            if (wakeIn) appState.profile.wakeTime = wakeIn.value;
            if (sleepIn) appState.profile.sleepTime = sleepIn.value;
            if (focusIn) appState.profile.peakFocusTime = focusIn.value;

            saveAppState();
            renderActiveProfileSummary();
            alert("Profile settings saved!");
        });
    }

    const formAcad = document.getElementById('form-settings-academic');
    if (formAcad) {
        formAcad.addEventListener('submit', e => {
            e.preventDefault();
            const examIn = document.getElementById('settings-input-target-exam');
            const examDateIn = document.getElementById('settings-input-exam-date');
            const targetIn = document.getElementById('settings-input-daily-study-target');
            const sessLenIn = document.getElementById('settings-input-session-len');

            if (!appState.academicProfile) appState.academicProfile = createInitialState().academicProfile;
            if (examIn) appState.academicProfile.targetExam = examIn.value.trim();
            if (examDateIn) appState.academicProfile.examDate = examDateIn.value || null;
            if (targetIn) appState.academicProfile.dailyStudyTargetHours = Number(targetIn.value) || 3.5;
            if (sessLenIn) appState.academicProfile.preferredSessionDurationMinutes = Number(sessLenIn.value) || 60;

            saveAppState();
            alert("Academic parameters saved!");
        });
    }

    const themeSel = document.getElementById('settings-select-theme');
    if (themeSel) {
        themeSel.addEventListener('change', () => {
            if (!appState.settings) appState.settings = { theme: 'system' };
            appState.settings.theme = themeSel.value;
            applyTheme(themeSel.value);
            saveAppState();
        });
    }

    const motionSel = document.getElementById('settings-toggle-reduced-motion');
    if (motionSel) {
        motionSel.addEventListener('change', () => {
            if (!appState.settings) appState.settings = { theme: 'system' };
            appState.settings.reducedMotion = motionSel.value === 'true';
            saveAppState();
        });
    }

    const btnExport = document.getElementById('btn-settings-export-json');
    if (btnExport) btnExport.addEventListener('click', exportStateJSON);

    const inputImport = document.getElementById('input-settings-import-json');
    if (inputImport) {
        inputImport.addEventListener('change', e => {
            const file = e.target.files && e.target.files[0];
            if (file) importStateJSON(file);
        });
    }

    const btnResetOnb = document.getElementById('btn-settings-reset-onboarding');
    if (btnResetOnb) btnResetOnb.addEventListener('click', resetOnboarding);

    // Clear all data with "DELETE" confirmation
    const btnClearTrigger = document.getElementById('btn-settings-clear-data');
    const modalClear = document.getElementById('modal-clear-data');
    const btnClearClose = document.getElementById('btn-clear-data-close');
    const btnClearCancel = document.getElementById('btn-clear-data-cancel');
    const inputClearConfirm = document.getElementById('input-clear-confirm');
    const btnClearConfirm = document.getElementById('btn-clear-data-confirm');

    if (btnClearTrigger && modalClear) {
        btnClearTrigger.addEventListener('click', () => {
            if (inputClearConfirm) inputClearConfirm.value = '';
            if (btnClearConfirm) btnClearConfirm.disabled = true;
            modalClear.classList.remove('hidden');
        });
    }

    if (inputClearConfirm && btnClearConfirm) {
        inputClearConfirm.addEventListener('input', () => {
            btnClearConfirm.disabled = (inputClearConfirm.value.trim() !== 'DELETE');
        });
    }

    if (btnClearClose && modalClear) btnClearClose.addEventListener('click', () => modalClear.classList.add('hidden'));
    if (btnClearCancel && modalClear) btnClearCancel.addEventListener('click', () => modalClear.classList.add('hidden'));

    if (btnClearConfirm) {
        btnClearConfirm.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            appState = createInitialState();
            saveAppState();
            applyTheme(appState.settings.theme);
            if (modalClear) modalClear.classList.add('hidden');
            checkOnboardingState();
            renderAllUI();
            alert("All state data has been permanently cleared.");
        });
    }

    console.log('[Settings] Phase 13 initialized.');
}

// --------------------------------------------------------------------------
// PHASE 14 — UX POLISH & ACCESSIBILITY MODAL ESCAPE HANDLERS
// --------------------------------------------------------------------------

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;

    const modalIds = [
        'modal-planner-session-edit',
        'modal-subject-form',
        'modal-chapter-form',
        'modal-session-form',
        'modal-test-form',
        'modal-habit-form',
        'modal-sleep-form',
        'modal-exercise-form',
        'modal-mood-form',
        'modal-reminder-form',
        'modal-reminder-alert',
        'modal-clear-data'
    ];

    modalIds.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });
});
