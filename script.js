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
const SCHEMA_VERSION = "1.1.0";
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
 * Creates a clean, empty initial application state structure matching Schema v1.1.0
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
            primaryGoal: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        goals: [],                // { id, type, title, target, deadline, status, createdAt, updatedAt }
        tasks: [],                // { id, title, category, date, startTime, endTime, priority, estimatedDuration, notes, status, completionPercentage, createdAt, updatedAt }
        accountabilityRecords: [],// { id, taskId, status, reason, customReason, recordedAt }
        subjects: [],             // { id, name, goalType, active, createdAt, updatedAt }
        studySessions: [],        // { id, subjectId, chapter, startTime, endTime, duration, sessionType, questionsSolved, notes, createdAt }
        habits: [],               // { id, title, frequency, targetDays, streak, createdAt }
        sleepLogs: [],            // { id, date, bedtime, wakeTime, duration, qualityRating, notes }
        waterLogs: [],            // { id, date, amountMl, targetMl }
        exerciseLogs: [],         // { id, date, type, durationMinutes, intensity, caloriesBurned }
        moodLogs: [],             // { id, date, moodRating, energyLevel, notes }
        reminders: [],            // { id, title, triggerTime, recurring, active }
        // Phase 6: Weekly academic timetable (institution-agnostic recurring schedule)
        timetable: {
            institution: "",      // free text — any school/college/university
            academicYear: "",     // e.g. "2026-27"
            semester: "",         // e.g. "1" or "Semester 1"
            batch: "",            // e.g. "B1", "ECE-A", "Section 2" — any format
            entries: []           // { id, day, startTime, endTime, title, subjectId, type, classroom, notes, createdAt, updatedAt }
        },
        settings: {
            theme: "system"       // "light" | "dark" | "system"
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
        // Deep copy via JSON round-trip to avoid mutations to the original object
        const newState = JSON.parse(JSON.stringify(oldState));
        // Add timetable object — preserve any partial timetable data if somehow present
        if (!newState.timetable || typeof newState.timetable !== 'object') {
            newState.timetable = {
                institution: "",
                academicYear: "",
                semester: "",
                batch: "",
                entries: []
            };
        } else {
            // Ensure entries array exists
            if (!Array.isArray(newState.timetable.entries)) {
                newState.timetable.entries = [];
            }
        }
        console.log('[Migration] 1.0.0 → 1.1.0: timetable object added. Existing data preserved.');
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
        'goals', 'tasks', 'accountabilityRecords', 'subjects', 
        'studySessions', 'habits', 'sleepLogs', 'waterLogs', 
        'exerciseLogs', 'moodLogs', 'reminders'
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

    if (!data.settings || typeof data.settings !== 'object') {
        data.settings = { theme: "system" };
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

    const currentVersion = rawData.schemaVersion || "1.0.0";
    const comp = compareVersions(currentVersion, targetVersion);

    if (comp === 0) {
        // Case C: Current schema 1.0.0
        return { status: 'CURRENT', state: rawData };
    } else if (comp < 0) {
        // Case B: Older schema version (< 1.0.0)
        // Check if an explicit migration handler exists in registry
        if (typeof SCHEMA_MIGRATION_REGISTRY[currentVersion] === 'function') {
            try {
                console.log(`[Migration] Running registered migration for schema v${currentVersion} -> v${targetVersion}`);
                const migrated = SCHEMA_MIGRATION_REGISTRY[currentVersion](rawData);
                migrated.schemaVersion = targetVersion;
                return { status: 'MIGRATED', state: migrated, fromVersion: currentVersion };
            } catch (err) {
                console.error(`[Migration] Explicit migration from v${currentVersion} failed:`, err);
                return { status: 'MIGRATION_FAILED', state: rawData, version: currentVersion };
            }
        } else {
            // No explicit transformation handler exists for this older version.
            // Architecturally honest: Do NOT fake migration by merely changing schemaVersion!
            console.warn(`[Migration] Schema v${currentVersion} is older than v${targetVersion}, but no explicit migration transformation is registered. Preserving raw state without false upgrade.`);
            return { status: 'UNSUPPORTED_OLD_VERSION', state: rawData, version: currentVersion };
        }
    } else {
        // Case D: Unknown/future schema version (> 1.0.0)
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
        { name: 'Study Sessions', schema: 'Array<{ id, subjectId, duration, sessionType }>', count: appState.studySessions.length },
        { name: 'Timetable Entries', schema: 'Array<{ id, day, startTime, endTime, title, type }>', count: ttEntryCount },
        { name: 'Habits', schema: 'Array<{ id, title, frequency, streak }>', count: appState.habits.length },
        { name: 'Sleep Logs', schema: 'Array<{ id, bedtime, wakeTime, duration, quality }>', count: appState.sleepLogs.length },
        { name: 'Water Logs', schema: 'Array<{ id, date, amountMl, targetMl }>', count: appState.waterLogs.length },
        { name: 'Exercise Logs', schema: 'Array<{ id, date, type, durationMinutes }>', count: appState.exerciseLogs.length },
        { name: 'Mood Logs', schema: 'Array<{ id, date, moodRating, energyLevel }>', count: appState.moodLogs.length },
        { name: 'Reminders', schema: 'Array<{ id, title, triggerTime, active }>', count: appState.reminders.length }
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
    const viewPlaceholder = document.getElementById('view-placeholder');
    const placeholderTitle = document.getElementById('placeholder-title');
    const placeholderDesc = document.getElementById('placeholder-desc');

    function hideAllViews() {
        if (viewDashboard) viewDashboard.classList.add('hidden');
        if (viewFoundation) viewFoundation.classList.add('hidden');
        if (viewTasks) viewTasks.classList.add('hidden');
        if (viewStudy) viewStudy.classList.add('hidden');
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
            } else if (targetView === 'study') {
                if (viewStudy) viewStudy.classList.remove('hidden');
                renderStudyView();
            } else {
                if (viewPlaceholder) viewPlaceholder.classList.remove('hidden');
                if (placeholderTitle) {
                    placeholderTitle.textContent = `${btn.textContent.replace(/Phase \d+/, '').trim()} Module (Phase ${targetPhase || '?'})`;
                }
                if (placeholderDesc) {
                    placeholderDesc.textContent = `The ${btn.textContent.replace(/Phase \d+/, '').trim()} user interface will be built in a future phase. The Phase 0/1 foundation engine currently manages all state data schemas for this collection.`;
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
    console.log("[Momentum AI] Initializing Phase 6...");
    loadAppState();
    initThemeSelector();
    initNavigationTabs();
    initActionButtons();
    initOnboardingController();
    initTaskPlanner();
    initTimetable();
    checkOnboardingState();
    renderAllUI();
    registerServiceWorker();
    console.log("[Momentum AI] Phase 6 initialized successfully.");
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
