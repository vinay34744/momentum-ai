# Momentum AI

> **Tagline:** Execution Over Intention.

Momentum AI is a serious, practical personal execution engine built to bridge the gap between intent and completion. It tracks what you planned, what you completed, and what you missed — forming the data foundation for accountability analysis and realistic planning.

---

## 1. Overview

Momentum AI structures daily execution around a closed-loop behavioral cycle:

```text
Plan ──> Reminder ──> Execute ──> Complete/Miss ──> Explain ──> Analyze ──> Adapt ──> Plan Again
```

Phase 6 extends Student Mode with a **generic weekly academic timetable system**. Any student at any institution can configure their institution, semester, batch, subjects, and weekly schedule. The B1 batch timetable is included as the current user's initial data.

---

## 2. Technology Stack

- **HTML5**: Semantic markup, accessible focus structures, structured layout.
- **CSS3**: Native CSS custom properties, design tokens, responsive breakpoints, dark/light/system mode, reduced motion support.
- **Vanilla JavaScript (ES6+)**: Centralized state manager, schema migration engine (1.0.0 -> 1.1.0), Task Planner, Timetable controller, PWA service worker.
- **LocalStorage**: Single-key JSON serialization (`momentumAI`). All reads and writes go through `loadAppState()` / `saveAppState()`.
- **PWA (Web Manifest & Service Worker v1.2.0)**: Offline static asset caching.

No React, Next.js, Node.js, npm, backend, database, authentication, or external APIs.

---

## 3. Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 0** | Complete | Foundation state engine, schema v1.0.0, LocalStorage architecture, PWA shell, design tokens |
| **Phase 1** | Complete | Landing page, multi-step onboarding wizard, profile persistence, initial goal creation, returning user flow |
| **Phase 2** | Complete | Dashboard overview, time-adaptive greeting, today overview metrics, current focus card, active goals list |
| **Phase 3** | Complete | Task Planner — create, edit, complete, miss, reopen, delete tasks; date navigation, search, overlap detection |
| **Phase 4** | Complete | Accountability Engine — missed task reason capture, accountability records schema |
| **Phase 5** | Complete | Behavior Analysis — task/accountability data analysis; does NOT include timetable entries as task outcomes |
| **Phase 6** | Complete (current) | Student Mode — academic profile, subjects, chapters, study sessions, mock tests, **timetable** |

---

## 4. Current Architecture

### Centralized Application State

All data is stored in a single `appState` object, persisted to a single `localStorage` key (`momentumAI`). No module uses its own independent storage. Every write goes through:

```javascript
saveAppState();  // serializes entire appState to localStorage['momentumAI']
```

On load, `loadAppState()` reads, parses, validates, and migrates data as needed.

### Schema Versioning & Migration

**Current schema version:** `1.1.0`

The `SCHEMA_MIGRATION_REGISTRY` contains explicit migration handlers per version. A migration is never faked by bumping the version string without a real transformation.

| Source Version | Target Version | Migration |
|---|---|---|
| `1.0.0` | `1.1.0` | Adds empty `timetable` object. All existing goals, tasks, accountability records, subjects, sessions, habits, logs, and reminders are preserved exactly. |

Migration cases handled:

- **Fresh state** — creates empty timetable safely
- **Existing 1.0.0 state** — migrates to 1.1.0, adds empty timetable
- **Current 1.1.0 state** — loads normally
- **Future schema (> 1.1.0)** — preserved in read-only mode, not overwritten
- **Corrupted state** — raw string preserved to `momentumAI_corrupted_backup` recovery key; app re-initializes safely

### PWA Foundation

- Service Worker v1.2.0
- Cache-first, network-fallback strategy
- Caches: `index.html`, `style.css`, `script.js`, `manifest.json`, `privacy.html`, `terms.html`, icons

---

## 5. Phase 6 — Student Mode & Timetable

### Purpose

The timetable represents the student's existing fixed academic schedule — classes already arranged by the institution. It answers: **"When do I already have commitments this week?"**

This data is stored and displayed in Phase 6. It is read-only data for future planning phases.

### Student Mode Features

Student Mode supports:
- **Academic profile** — institution, academic year, semester, batch/section
- **Subjects** — subject management (schema ready; UI tab is a placeholder stub for future update)
- **Chapters** — chapter tracking (schema ready; future phase)
- **Study Sessions** — recorded actual study time (schema ready; UI tab is a placeholder stub)
- **Mock Tests** — test tracking (schema ready; UI tab is a placeholder stub)
- **Timetable** — full weekly timetable CRUD (fully implemented)

### Timetable System

The timetable is a **generic, institution-agnostic recurring weekly schedule**. Any student at any institution can configure:
- Their institution name
- Their academic year
- Their semester
- Their batch/section
- Their subjects
- Their own timetable entries (days, times, rooms, activity types)

Timetable entries are stored as **recurring weekly schedule data** — they represent a fixed repeating weekly schedule. They have no status, priority, or completion fields. They are never automatically converted to tasks or study sessions.

**Timetable features:**
- Add class entries (title, day, start time, end time, type, classroom, optional subject mapping, notes)
- Edit entries (preserves original `id` and `createdAt`; `updatedAt` is updated)
- Delete entries (with confirmation dialog)
- Overlap detection (warning only — user can override by submitting again; adjacent classes are NOT overlaps)
- Day switcher: select any day (Mon-Sun) to view its schedule
- Week-at-a-glance summary grid
- Today's schedule shown in both Student Mode overview and main Dashboard
- Next class derived from current local time

**Query utilities (public API for future phases):**
- `getTimetableForDay(day)` — sorted entries for a weekday
- `getTodayTimetable()` — entries for today's local weekday
- `getNextTimetableEntry()` — first entry today after current time
- `getTimetableEntriesInRange(day, startTime, endTime)` — overlap window

**Dashboard integration:**
- **Today's Schedule** card — shows next class indicator and up to 4 of today's timetable entries
- **View timetable** button — navigates directly to Student Mode -> Timetable tab
- Derived from `appState.timetable.entries` — no data duplication

### Timetable Schema

```javascript
timetable: {
  institution: "",      // free text — any school/college/university
  academicYear: "",     // e.g. "2026-27"
  semester: "",         // e.g. "1" or "Semester 1"
  batch: "",            // e.g. "B1", "ECE-A", "Section 2" — any format
  entries: [
    {
      id:         "uuid",
      day:        "monday",      // lowercase weekday name (monday-sunday)
      startTime:  "09:00",       // HH:MM 24h
      endTime:    "10:30",       // HH:MM 24h
      title:      "Maths 1 Lab",
      subjectId:  null,          // null or UUID from appState.subjects
      type:       "lab",         // lecture|lab|practical|tutorial|exam|contest|yoga|break|lunch|other
      classroom:  "Classroom 1",
      notes:      "",
      createdAt:  "ISO-8601",
      updatedAt:  "ISO-8601"
    }
  ]
}
```

### Activity Types

`lecture`, `lab`, `practical`, `tutorial`, `exam`, `contest`, `yoga`, `break`, `lunch`, `other`

Non-academic types (not counted as study time): `break`, `lunch`, `yoga`

### Important Distinctions

| Data type | Meaning |
|---|---|
| **Timetable entry** | Institution-scheduled fixed weekly commitment. No status, no priority, no completion. |
| **Task** | User-planned action (Phase 3). Has status, priority, date-specific. |
| **Study Session** | User-recorded actual study time (Phase 6+, stub). |
| **Accountability Record** | Missed task context (Phase 4). |

These are **never merged**. Timetable entries do not become tasks. Tasks do not become timetable entries.

---

## 6. Current User — B1 Batch Timetable

The current user's first-semester engineering schedule (Batch B1) is seeded as initial timetable data. This is the user's data — it is not hard-coded into application logic. Any other student can replace this with their own institution, batch, and schedule through the UI without changing source code.

### Subjects

| Subject Name |
|---|
| AP-Robo B |
| AP-Robo Lab B1 |
| English B |
| Maths 1 - B |
| Maths 1 Lab B1 |
| PSP B |
| PSP Lab B1 |
| SnAI B |
| SnW Lab B1 |
| YOGA B1 |

### B1 Timetable — Subject Mapping

| Timetable title | Subject (appState.subjects) |
|---|---|
| Maths 1 Lab | Maths 1 Lab B1 |
| PSP Lab | PSP Lab B1 |
| AP-Robo Lab | AP-Robo Lab B1 |
| SnW Lab | SnW Lab B1 |
| Maths 1 | Maths 1 - B |
| PSP | PSP B |
| AP-Robo | AP-Robo B |
| SnAI | SnAI B |
| YOGA | YOGA B1 |
| English | English B |
| LHL | **null** — unmapped. LHL appears on Friday (Classroom 6, 15:30-16:30). Its full meaning was not supplied; it is stored with `subjectId: null` and `type: "other"`. Do not invent its meaning. |
| CONTEST | null — activity type (contest), not a subject |
| Lunch | null — non-academic break |

### B1 Weekly Schedule

**Monday**
- 09:00-10:30  Maths 1 Lab (lab) — Classroom 1
- 10:30-12:00  PSP Lab (lab) — Classroom 1
- 12:00-13:30  Lunch
- 13:30-15:00  AP-Robo (lecture) — Classroom 8
- 15:00-16:30  PSP (lecture) — Classroom 8
- 16:30-18:00  Maths 1 (lecture) — Classroom 8

**Tuesday**
- 09:00-10:30  AP-Robo Lab (lab) — Classroom 1
- 10:30-12:00  SnW Lab (lab) — Classroom 1
- 12:00-13:30  Lunch
- 13:30-15:00  SnAI (lecture) — Classroom 8
- 15:00-16:30  YOGA (yoga) — Practical

**Wednesday**
- 09:00-10:30  Maths 1 Lab (lab) — Classroom 1
- 10:30-12:00  PSP Lab (lab) — Classroom 1
- 12:00-13:30  Lunch
- 13:30-15:00  AP-Robo (lecture) — Classroom 8
- 15:00-16:30  Maths 1 (lecture) — Classroom 8
- 16:30-18:00  PSP (lecture) — Classroom 8

**Thursday**
- 09:00-10:30  AP-Robo Lab (lab) — Classroom 1
- 10:30-12:00  SnW Lab (lab) — Classroom 1
- 12:00-13:30  Lunch
- 13:30-15:00  YOGA (yoga) — Concept Room
- 15:00-16:30  SnAI (lecture) — Classroom 8

**Friday**
- 09:00-12:00  CONTEST (contest) — Classrooms 1, 4, 6, 8 / Concept Room
- 12:00-13:30  Lunch
- 14:00-15:30  English (lecture) — Classroom 8
- 15:30-16:30  LHL (other) — Classroom 6 (unmapped — meaning not supplied)

---

## 7. Task Schema (Phase 3)

Each task in `appState.tasks`:

```javascript
{
  id:          "uuid-v4",
  title:       "Complete physics assignment",
  description: "",
  goalId:      null,
  category:    "Study",
  date:        "YYYY-MM-DD",
  startTime:   "",
  endTime:     "",
  priority:    "medium",
  status:      "planned",
  createdAt:   "ISO-8601",
  updatedAt:   "ISO-8601"
}
```

---

## 8. Task Lifecycle

```text
Create  -->  planned
planned -->  completed   (user clicks "Complete")
planned -->  missed      (user clicks "Mark missed")
completed--> planned     (user clicks "Reopen")
missed  -->  planned     (user clicks "Reopen")
```

Tasks are never automatically marked missed. Status is only changed by explicit user action.

---

## 9. LocalStorage Strategy

- **Primary key**: `momentumAI` — full serialized `appState` JSON.
- **Recovery key**: `momentumAI_corrupted_backup` — raw string preserved if JSON parsing fails. Never used as an active state store.
- **Schema version**: `1.1.0`
- **Migration engine**: `SCHEMA_MIGRATION_REGISTRY` — explicit handler registered per version.

---

## 10. Project File Structure

```text
momentum-ai/
├── index.html          # App entry point: landing, onboarding, dashboard, task planner, student mode
├── style.css           # Design system tokens + all component styles (Phase 0-6)
├── script.js           # State engine + onboarding + dashboard + task planner + timetable (Phase 0-6)
├── README.md           # This documentation
├── privacy.html        # Privacy policy
├── terms.html          # Terms of service
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline cache (v1.2.0)
└── assets/
    ├── icon-192.png
    └── icon-512.png
```

---

## 11. How to Run

Zero build steps. Zero `npm install`.

**Option A — VS Code Live Server:**
Right-click `index.html` -> Open with Live Server -> `http://127.0.0.1:5500/`

**Option B — Python HTTP Server:**
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000/` in your browser.

---

## 12. Privacy

All user data including tasks, goals, timetable, and profile information is stored exclusively in the local browser via `localStorage`. No data is transmitted to any server, third-party service, or external API.

---

## 13. Current Limitations (Phase 6)

- No automatic study plan generation (planned for a future phase)
- No recurring exception handling (holidays, exam weeks)
- No notification/reminder for upcoming classes
- Subjects tab, Study Sessions tab, and Mock Tests tab are placeholder stubs
- No backend, database, cloud sync, or authentication
- All data stored locally in the browser; clearing browser data clears all stored information
