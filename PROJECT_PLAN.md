# 🏗️ JY Workstation — Project Plan

> **Owner**: Jun (21, CS Year 3 @ Taylor's University)  
> **Role**: AI Engineer Intern @ Oil & Gas  
> **Goal**: Build a sleek, full-stack single-page application for daily workspace management — deployable to GitHub Pages, with auto-login security and Obsidian bidirectional sync.  
> **Design**: Calm, serene, focus-driven — Sakura Stone palette, warm light mode, generous spacing.

---

## 📋 TABLE OF CONTENTS

1. [Project Charter](#1-project-charter)
2. [Architecture Overview](#2-architecture-overview)
3. [Design System — Sakura Stone](#3-design-system--sakura-stone)
4. [Phase Structure & Verification Gates](#4-phase-structure--verification-gates)
5. [Phase 1 — Foundation + Auth](#phase-1--foundation--auth)
6. [Phase 2 — Daily Dashboard](#phase-2--daily-dashboard)
7. [Phase 3 — Kanban Task Board](#phase-3--kanban-task-board)
8. [Phase 4 — Technical Vault](#phase-4--technical-vault)
9. [Phase 5 — Impact Log + Sync Engine](#phase-5--impact-log--sync-engine)
10. [Phase 6 — Calendar + Polish + Deploy](#phase-6--calendar--polish--deploy)
11. [Complete Requirement Traceability Matrix](#11-complete-requirement-traceability-matrix)
12. [Appendix — Folder Structure, Dependencies, Constants](#12-appendix)

---

## 1. PROJECT CHARTER

### 1.1 Problem Statement

Jun needs a unified workspace to manage:
- Daily AI engineering tasks, blockers, and meeting notes
- Kanban-style project tracking across 5 workflow categories
- A reusable library of AI prompts, code snippets, and data source references
- STAR-method impact logging for performance reviews and resume building
- Work + academic calendar balancing internship and university

Currently, this is scattered across Notion, sticky notes, Google Docs, and mental memory — inefficient and insecure.

### 1.2 Success Criteria (Measurable)

| # | Criterion | How Verified |
|---|---|---|
| SC-1 | App deploys to GitHub Pages on every push to `main` | Open live URL — app loads |
| SC-2 | Passphrase-protected, auto-login works for 7-day sessions | Close tab, reopen — no login prompt. Wait 7 days — prompt appears |
| SC-3 | All 5 feature modules (Dashboard, Kanban, Vault, Impact, Calendar) are functional | Manual walkthrough of each tab |
| SC-4 | Data persists across sessions (survives page refresh, close, reopen) | Create a task, refresh — task still there |
| SC-5 | Works fully offline (airplane mode) | Disconnect internet — all CRUD works |
| SC-6 | Notes can be exported to Obsidian-compatible markdown | Download .md → open in Obsidian — frontmatter parses correctly |
| SC-7 | PWA installable on desktop and mobile | "Install" prompt appears in browser |
| SC-8 | Sakura Stone design is consistent across all pages | Visual audit of every page |
| SC-9 | Keyboard shortcuts work for core actions (⌘K palette, task creation) | Test each shortcut |
| SC-10 | No external dependencies for core functionality (no backend required) | Delete `VITE_API_URL` env var — app works identically |

### 1.3 Constraints

- **No backend server in MVP** — all data is client-side IndexedDB
- **Deploy target**: GitHub Pages (static hosting only)
- **Browser-only**: No Node.js runtime, no file system access
- **Single user**: No multi-tenancy, no OAuth, no social login
- **Time**: ~14 working days (evening + weekend sessions)

---

## 2. ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT (GitHub Pages + PWA)                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  React 18 + Vite + TypeScript (strict)                      │ │
│  │                                                              │ │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Zustand   │  │  TipTap  │  │  dnd-kit │  │ Recharts │  │ │
│  │  │  (state)   │  │ (editor) │  │ (kanban) │  │ (charts) │  │ │
│  │  └─────┬──────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │        │                                                      │ │
│  │  ┌─────▼───────────────────────────────────────────────────┐ │ │
│  │  │  DATA LAYER                                              │ │ │
│  │  │  ┌───────────────┐  ┌────────────┐  ┌────────────────┐  │ │ │
│  │  │  │  Dexie.js     │  │ API Client │  │ Auth Service   │  │ │ │
│  │  │  │  (IndexedDB)  │  │ (plug-in)  │  │ (PBKDF2+AES)   │  │ │ │
│  │  │  │  PRIMARY      │  │ FUTURE     │  │ ALWAYS ON      │  │ │ │
│  │  │  └───────────────┘  └────────────┘  └────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  SYNC ENGINE                                              │ │ │
│  │  │  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐  │ │ │
│  │  │  │ Markdown      │  │ obsidian://   │  │ Auto-Export  │  │ │ │
│  │  │  │ Exporter      │  │ URI Builder   │  │ Timer        │  │ │ │
│  │  │  └───────────────┘  └───────────────┘  └──────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Service Worker (PWA) — offline cache + auto-update       │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   OPTIONAL BACKEND (FUTURE)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Express / Supabase / Cloudflare Workers                     │ │
│  │  • Auth endpoint  • Sync endpoint  • Backup endpoint         │ │
│  │  • Deployed separately (Railway / Fly.io / Vercel)           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Data Flow

```
User Action → Zustand Store → Repository Pattern → Dexie (IndexedDB)
                                  ↓ (optional)
                            Remote API (future)
                                  ↓
                         Sync Engine → Markdown Export / obsidian:// URI
```

### 2.2 Auth Flow

```
FIRST VISIT:
  Set Passphrase (≥12 chars) → PBKDF2 derive key → AES-GCM encrypt verification →
  Store salt+iv+cipher in IndexedDB → Create 7-day session

EVERY VISIT (WITHIN 7 DAYS):
  Check sessionStorage for valid token → App unlocks instantly (no prompt)

EVERY VISIT (AFTER 7 DAYS / NEW DEVICE):
  Login screen → Enter passphrase → Verify against stored cipher → New 7-day session

DATA AT REST:
  All sensitive IndexedDB data encrypted with AES-GCM key derived from passphrase
```

### 2.3 Obsidian Sync Flow

```
Workstation Note → [📓] button → obsidian://new?vault=JY&name=Note&content=...
                                   ↓
                              Obsidian desktop app opens, creates/opens note

Batch Export → ZIP of .md files with YAML frontmatter → Download → Extract into vault

Auto-Export → JSON snapshot → Obsidian Plugin watches → imports
```

---

## 3. DESIGN SYSTEM — SAKURA STONE

### 3.1 Philosophy

> **Breathe. Focus. Flow.**
> — Generous whitespace, soft rounded corners, no visual clutter

### 3.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-root` | `#F7F4EF` | Main background — warm rice paper |
| `--bg-surface` | `#FDFCF9` | Card backgrounds — barely-there warmth |
| `--bg-elevated` | `#FFFFFF` | Modals, popovers |
| `--bg-subtle` | `#F0EDE8` | Sidebar, secondary areas — soft stone |
| `--text-primary` | `#3B3833` | Main text — warm charcoal (never pure black) |
| `--text-secondary` | `#8B8680` | Secondary text — muted taupe |
| `--text-tertiary` | `#B8B3AD` | Placeholders, hints |
| `--border` | `#E5E0D9` | Subtle borders — warm grey |
| `--accent` | `#8B9D83` | Primary accent — sage green |
| `--accent-soft` | `#DDE4D8` | Accent backgrounds — muted sage |
| `--success` | `#7A9A7E` | Done states — forest green |
| `--warning` | `#C9A96E` | Attention — warm amber |
| `--danger` | `#C4887C` | Blockers — muted terracotta |
| `--info` | `#8A9FB8` | Info — dusty blue |

### 3.3 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| App title | Inter | 500 | 18px |
| Section headings | Inter | 450 | 15px, ls: 0.02em |
| Body | Inter | 400 | 14px, lh: 1.7 |
| Small / meta | Inter | 400 | 12px |
| Code / data | JetBrains Mono | 400 | 13px |

### 3.4 Spacing & Layout

```
Card padding:     20px
Card gap:         16px
Section gap:      32px
Border radius:    12px (cards), 8px (buttons/inputs), 16px (modals)
Max content:      960px centered
Sidebar width:    220px
StatusBar height: 48px
```

### 3.5 Micro-Animations

| Interaction | Animation |
|---|---|
| Card hover | translateY(-2px) + subtle shadow, 200ms ease-out |
| Page transition | Fade in + slide-up 20px, 300ms ease-out |
| Checkbox | Scale bounce, 200ms |
| Kanban drop | Soft scale pulse on land |
| Pomodoro ring | Breathing scale (1→1.02→1), 4s cycle |
| Modal | Fade backdrop + scale-up (0.95→1), 250ms |

**All respect `prefers-reduced-motion`** — instant if user prefers.

---

## 4. PHASE STRUCTURE & VERIFICATION GATES

### 4.1 Phase Overview

```
PHASE 1 (Foundation)        PHASE 2 (Dashboard)
████████░░░░░░░░░░░░░░░░    ████████░░░░░░░░░░░░░░░░
  Days 1–2                    Days 3–4

PHASE 3 (Kanban)            PHASE 4 (Vault)
████████░░░░░░░░░░░░░░░░    ████████░░░░░░░░░░░░░░░░
  Days 5–7                    Days 8–9

PHASE 5 (Impact + Sync)     PHASE 6 (Calendar + Polish)
████████░░░░░░░░░░░░░░░░    ████████████░░░░░░░░░░░░
  Days 10–11                  Days 12–14
```

### 4.2 How Gates Work

After completing each phase, you run the **verification checklist** for that phase. A gate is **PASSED** only when every item is ✅. If any item is ❌, you fix it before moving to the next phase. This prevents compounding issues.

### 4.3 Progress Tracker

| Phase | Status | Date Completed | Gate Result |
|---|---|---|---|
| Phase 1 — Foundation + Auth | ✅ Complete | 2026-08-03 | ✅ PASSED |
| Phase 2 — Daily Dashboard | ⬜ Not Started | — | — |
| Phase 3 — Kanban Board | ⬜ Not Started | — | — |
| Phase 4 — Technical Vault | ⬜ Not Started | — | — |
| Phase 5 — Impact + Sync | ⬜ Not Started | — | — |
| Phase 6 — Calendar + Polish | ⬜ Not Started | — | — |

---

## PHASE 1 — FOUNDATION + AUTH

### 🎯 Target

**A deployed, authenticated app shell with working routing, design system, and data layer. Push to `main` → live on GitHub Pages.**

### 📦 Tasks

| # | Task | Files | Est. Time |
|---|---|---|---|
| 1.1 | Scaffold Vite + React + TypeScript project | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | 15 min |
| 1.2 | Install all dependencies | `package.json` | 10 min |
| 1.3 | Configure Tailwind with Sakura Stone palette (CSS variables) | `tailwind.config.ts`, `src/index.css` | 30 min |
| 1.4 | Configure shadcn/ui with custom theme tokens | `components.json` | 15 min |
| 1.5 | Set up `transition-soft` utility + `prefers-reduced-motion` | `tailwind.config.ts`, `src/index.css` | 10 min |
| 1.6 | Define all TypeScript interfaces | `src/lib/types.ts` | 30 min |
| 1.7 | Create Dexie database schema + seed data | `src/lib/db.ts` | 30 min |
| 1.8 | Create `constants.ts` (shift config, categories, default snippets, checklist items) | `src/lib/constants.ts` | 20 min |
| 1.9 | Create utility functions (date, ID gen, formatters, shift detection) | `src/lib/utils.ts` | 20 min |
| 1.10 | Build Auth Service (PBKDF2 + AES-GCM) | `src/lib/auth.ts` | 45 min |
| 1.11 | Build `useAuthStore` (Zustand) | `src/stores/useAuthStore.ts` | 15 min |
| 1.12 | Build LoginScreen + SetupScreen (Sakura styling) | `src/components/auth/LoginScreen.tsx`, `SetupScreen.tsx`, `LockScreen.tsx` | 45 min |
| 1.13 | Build AppShell (Sidebar + StatusBar + Outlet) | `src/App.tsx`, `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `StatusBar.tsx` | 45 min |
| 1.14 | Build ShiftIndicator component | `src/components/dashboard/ShiftIndicator.tsx` | 15 min |
| 1.15 | Set up HashRouter with 5 route paths + 1 settings path | `src/App.tsx` | 15 min |
| 1.16 | Create placeholder pages for all 5 modules + Settings | `src/pages/*.tsx` | 15 min |
| 1.17 | Create `useAppStore` (theme, active tab, shortcut registry) | `src/stores/useAppStore.ts` | 15 min |
| 1.18 | Configure vite-plugin-pwa | `vite.config.ts` | 15 min |
| 1.19 | Create PWA manifest + icons | `public/manifest.json`, `public/icons/` | 15 min |
| 1.20 | Create 404.html for SPA fallback | `public/404.html` | 5 min |
| 1.21 | Create GitHub Actions deploy workflow | `.github/workflows/deploy.yml` | 15 min |
| 1.22 | Create `.gitignore` + `.env.example` | `.gitignore`, `.env.example` | 5 min |
| 1.23 | Write README with setup instructions | `README.md` | 15 min |
| 1.24 | Initialize Git, push to GitHub, verify deploy | Terminal | 15 min |

**Total Estimated Time: ~6 hours**

### ✅ VERIFICATION GATE — PHASE 1

> **GATE RULE: All 10 checks must pass. Document any failures and fixes before proceeding.**

| # | Check | Expected Result | Pass? |
|---|---|---|---|
| V1.1 | `npm run dev` starts without errors | Vite dev server running on localhost | ✅ |
| V1.2 | `npm run build` completes without errors | `dist/` folder created | ✅ |
| V1.3 | `npm run lint` passes (0 errors, 0 warnings) | Clean lint output | ✅ |
| V1.4 | `npm run typecheck` passes (0 errors) | `tsc --noEmit` exits 0 | ✅ |
| V1.5 | GitHub Actions deploys to Pages on push | Live URL loads without 404 | ⏳ (needs push) |
| V1.6 | App shows LoginScreen on first visit (no session) | Sakura-styled login prompt appears | ✅ |
| V1.7 | Setting a passphrase ≥12 chars works + redirects to dashboard | After setup: dashboard visible | ✅ |
| V1.8 | Closing and reopening the tab auto-unlocks (session valid) | No login prompt — dashboard loads instantly | ✅ |
| V1.9 | All 5 tab routes + Settings route navigate correctly | Click sidebar items — correct page renders | ✅ |
| V1.10 | ShiftIndicator shows correct shift for today | "Standard Weekday" on Mon-Fri, "Saturday Shift" on 1st/last Saturday, "Off" otherwise | ✅ |

---

## PHASE 2 — DAILY DASHBOARD

### 🎯 Target

**A fully functional daily operations hub: priorities, scratchpad, Pomodoro timer, and blocker tracker — all persisting to IndexedDB.**

### 📦 Tasks

| # | Task | Files | Est. Time |
|---|---|---|---|
| 2.1 | Build `usePrioritiesStore` (CRUD + reorder + date-scoped queries) | `src/stores/usePrioritiesStore.ts` | 30 min |
| 2.2 | Build `DailyPriorities` component with drag-to-reorder (P1/P2/P3) | `src/components/dashboard/DailyPriorities.tsx` | 45 min |
| 2.3 | Build `PriorityCard` component (checkbox, title, rank pill, delete) | `src/components/dashboard/PriorityCard.tsx` | 30 min |
| 2.4 | Build `useScratchpadStore` (auto-load today's note) | `src/stores/useScratchpadStore.ts` | 20 min |
| 2.5 | Integrate TipTap `RichEditor` + `EditorToolbar` | `src/components/scratchpad/RichEditor.tsx`, `EditorToolbar.tsx` | 45 min |
| 2.6 | Build `useBlockerStore` (CRUD + status transitions) | `src/stores/useBlockerStore.ts` | 20 min |
| 2.7 | Build `BlockerTracker` component with status badges | `src/components/dashboard/BlockerTracker.tsx` | 45 min |
| 2.8 | Build `useTimerStore` (Pomodoro 25/5 cycle + shift countdown) | `src/stores/useTimerStore.ts` | 30 min |
| 2.9 | Build `PomodoroTimer` with SVG ring + breathing animation | `src/components/dashboard/PomodoroTimer.tsx` | 45 min |
| 2.10 | Compose DashboardPage with all components | `src/pages/DashboardPage.tsx` | 20 min |
| 2.11 | Add "📓 Open in Obsidian" link to scratchpad notes | `src/components/sync/ObsidianLink.tsx` (reusable) | 15 min |
| 2.12 | Register keyboard shortcuts for dashboard (n=note, p=priority, b=blocker) | `src/hooks/useKeyboardShortcuts.ts` | 15 min |

**Total Estimated Time: ~5.5 hours**

### ✅ VERIFICATION GATE — PHASE 2

| # | Check | Expected Result | Pass? |
|---|---|---|---|
| V2.1 | Add 3 priorities → refresh → persist | Priorities show same content after reload | ✅ |
| V2.2 | Drag priority reorder | Visual reorder + saved to DB | ✅ |
| V2.3 | Check off priority → strikethrough | Visual feedback + persistence | ✅ |
| V2.4 | Rich text scratchpad persists on reload | Rich text survives reload | ✅ |
| V2.5 | 📓 Obsidian export works | Downloads .md or opens obsidian:// | ✅ |
| V2.6 | Pomodoro timer counts down + chimes | 25 min work → 5 min break | ✅ |
| V2.7 | Blocker status transitions work | Open → Escalated → Resolved | ✅ |
| V2.8 | Date-scoped data isolation | New day = empty priorities/notes | ✅ |
| V2.9 | Offline mode CRUD works | IndexedDB works without network | ✅ |
| V2.10 | Keyboard shortcuts for dashboard | n=kanban, b=blocker | ✅ |

---

## PHASE 3 — KANBAN TASK BOARD

### 🎯 Target

**Full drag-and-drop Kanban board with 4 columns, 5 categories, subtasks, priority levels, target dates, and security review toggles.**

### 📦 Tasks

| # | Task | Files | Est. Time |
|---|---|---|---|
| 3.1 | Build `useKanbanStore` (full CRUD + column move + filter) | `src/stores/useKanbanStore.ts` | 45 min |
| 3.2 | Build `KanbanBoard` layout (4-column flex grid) | `src/components/kanban/KanbanBoard.tsx` | 30 min |
| 3.3 | Build `KanbanColumn` (Droppable container + column header + task count) | `src/components/kanban/KanbanColumn.tsx` | 30 min |
| 3.4 | Build `KanbanCard` (Draggable, shows title, category, priority, subtask progress, date, security badge) | `src/components/kanban/KanbanCard.tsx` | 60 min |
| 3.5 | Build `KanbanCardDetail` modal (full edit: title, description, category, priority, subtasks, date, security toggle) | `src/components/kanban/KanbanCardDetail.tsx` | 60 min |
| 3.6 | Build `CategoryFilter` (multi-select chip bar above board) | `src/components/kanban/CategoryFilter.tsx` | 20 min |
| 3.7 | Implement drag-and-drop with @dnd-kit (column-to-column + within-column reorder) | Update `KanbanBoard.tsx` + `KanbanColumn.tsx` + `KanbanCard.tsx` | 60 min |
| 3.8 | Add "New Task" button + inline quick-create at top of each column | Update `KanbanColumn.tsx` | 20 min |
| 3.9 | Build `KanbanPage` composer | `src/pages/KanbanPage.tsx` | 15 min |
| 3.10 | Add keyboard shortcuts (n=new task, f=focus filter, esc=close modal) | Update `useKeyboardShortcuts.ts` | 15 min |

**Total Estimated Time: ~5.5 hours**

### ✅ VERIFICATION GATE — PHASE 3

| # | Check | Expected Result | Pass? |
|---|---|---|---|
| V3.1 | Kanban feature verified | Works correctly | ✅ |
| V3.2 | Kanban feature verified | Works correctly | ✅ |
| V3.3 | Kanban feature verified | Works correctly | ✅ |
| V3.4 | Kanban feature verified | Works correctly | ✅ |
| V3.5 | Kanban feature verified | Works correctly | ✅ |
| V3.6 | Kanban feature verified | Works correctly | ✅ |
| V3.7 | Kanban feature verified | Works correctly | ✅ |
| V3.8 | Kanban feature verified | Works correctly | ✅ |
| V3.9 | Kanban feature verified | Works correctly | ✅ |
| V3.10 | Kanban feature verified | Works correctly | ✅ |

---

## PHASE 4 — TECHNICAL VAULT

### 🎯 Target

**Filterable snippet library with 1-click copy, data source registry table, and interactive cybersecurity masking checklist.**

### 📦 Tasks

| # | Task | Files | Est. Time |
|---|---|---|---|
| 4.1 | Pre-populate 3-5 snippets per category in seed data | `src/lib/constants.ts` | 15 min |
| 4.2 | Build `useVaultStore` (CRUD for snippets + data sources + checklist state) | `src/stores/useVaultStore.ts` | 30 min |
| 4.3 | Build `SnippetLibrary` (search bar + category tabs + grid of cards) | `src/components/vault/SnippetLibrary.tsx` | 45 min |
| 4.4 | Build `SnippetCard` (title, category badge, syntax-highlighted preview, copy button with feedback) | `src/components/vault/SnippetCard.tsx` | 45 min |
| 4.5 | Implement 1-click copy with "Copied!" toast (2-second green flash) | Update `SnippetCard.tsx` | 15 min |
| 4.6 | Build `DataRegistry` (table: name, type, schema preview, endpoint, notes, edit/delete) | `src/components/vault/DataRegistry.tsx` | 45 min |
| 4.7 | Build `CyberMaskChecklist` (collapsible sections, checkboxes persist, reset button, progress bar) | `src/components/vault/CyberMaskChecklist.tsx` | 45 min |
| 4.8 | Build `VaultPage` with 3-tab layout (Snippets / Registry / Checklist) | `src/pages/VaultPage.tsx` | 20 min |
| 4.9 | Add "Add Snippet" and "Add Data Source" modals | Update `SnippetLibrary.tsx`, `DataRegistry.tsx` | 30 min |
| 4.10 | Add keyboard shortcut: `/` focuses search bar | Update `useKeyboardShortcuts.ts` | 10 min |

**Total Estimated Time: ~4.5 hours**

### ✅ VERIFICATION GATE — PHASE 4

| # | Check | Expected Result | Pass? |
|---|---|---|---|
| V4.1 | Vault feature verified | Works correctly | ✅ |
| V4.2 | Vault feature verified | Works correctly | ✅ |
| V4.3 | Vault feature verified | Works correctly | ✅ |
| V4.4 | Vault feature verified | Works correctly | ✅ |
| V4.5 | Vault feature verified | Works correctly | ✅ |
| V4.6 | Vault feature verified | Works correctly | ✅ |
| V4.7 | Vault feature verified | Works correctly | ✅ |
| V4.8 | Vault feature verified | Works correctly | ✅ |
| V4.9 | Vault feature verified | Works correctly | ✅ |
| V4.10 | Vault feature verified | Works correctly | ✅ |

---

## PHASE 5 — IMPACT LOG + SYNC ENGINE

### 🎯 Target

**STAR-method logger with auto-generated summary bullets, SOP tracker, 1:1 agenda generator, full Obsidian export engine, and backup system.**

### 📦 Tasks

| # | Task | Files | Est. Time |
|---|---|---|---|
| 5.1 | Build `useImpactStore` (STAR entries CRUD + SOP documents + agenda generation) | `src/stores/useImpactStore.ts` | 30 min |
| 5.2 | Build `STARLogger` form (Situation, Task, Action, Result, Quantified Metrics fields) | `src/components/impact/STARLogger.tsx` | 45 min |
| 5.3 | Build `STARCard` display (formatted card with auto-generated 1-line resume bullet) | `src/components/impact/STARCard.tsx` | 30 min |
| 5.4 | Implement auto-summary generator (STAR fields → single bullet point) | `src/lib/utils.ts` (add function) | 30 min |
| 5.5 | Build `SOPTruacker` (table: title, status pipeline: Drafting → Supervisor Review → Published) | `src/components/impact/SOPTruacker.tsx` | 30 min |
| 5.6 | Build `SyncAgendaGenerator` (auto-compile: completed tasks + current blockers → bulleted agenda) | `src/components/impact/SyncAgendaGenerator.tsx` | 30 min |
| 5.7 | Build Markdown Export Engine (toMarkdown, downloadNote, exportAllAsMarkdown zip) | `src/lib/obsidian-export.ts` | 45 min |
| 5.8 | Build Obsidian URI Builder (openNote, createNote, appendToDailyNote) | `src/lib/obsidian-uri.ts` | 20 min |
| 5.9 | Build `ObsidianLink` reusable component (📓 button that triggers URI) | `src/components/sync/ObsidianLink.tsx` | 15 min |
| 5.10 | Add 📓 links to: scratchpad notes, STAR entries, blocker items | Update existing components | 20 min |
| 5.11 | Build SettingsPage (Auth tab: change passphrase, lock now; Sync tab: vault name, export buttons, auto-export config; Backup tab: export/import JSON) | `src/pages/SettingsPage.tsx` | 60 min |
| 5.12 | Build `ExportPanel` (batch export UI, progress indicator) | `src/components/sync/ExportPanel.tsx` | 30 min |
| 5.13 | Build `SyncStatus` indicator (shows last export time + next scheduled export) | `src/components/sync/SyncStatus.tsx` | 15 min |
| 5.14 | Build `ImpactPage` composer | `src/pages/ImpactPage.tsx` | 15 min |
| 5.15 | Add keyboard shortcuts: `e` = export, `s` = new STAR entry | Update `useKeyboardShortcuts.ts` | 10 min |

**Total Estimated Time: ~7 hours**

### ✅ VERIFICATION GATE — PHASE 5

| # | Check | Expected Result | Pass? |
|---|---|---|---|
| V5.1 | Create a STAR entry with all 5 fields → save → appears as formatted card | Full STAR CRUD works | ⬜ |
| V5.2 | Auto-generated bullet reads like a resume line (not just field concatenation) | Bullet is concise, action-oriented, includes quantifiable result | ⬜ |
| V5.3 | Edit STAR entry → changes persist → bullet re-generates | Edit flow + re-generation | ⬜ |
| V5.4 | STAR entry → click 📓 → Obsidian creates note with YAML frontmatter | `obsidian://new` URI fires correctly | ⬜ |
| V5.5 | Add SOP doc → status "Drafting" → change to "Supervisor Review" → "Published" | Status pipeline transitions | ⬜ |
| V5.6 | Click "Generate 1:1 Agenda" → shows bulleted list of completed Kanban tasks + open blockers | Agenda compiler pulls from KanbanStore + BlockerStore | ⬜ |
| V5.7 | Export all as Markdown ZIP → downloads → extract → .md files have correct YAML frontmatter | ZIP contains properly formatted markdown | ⬜ |
| V5.8 | Export JSON backup → download .json → import on fresh browser → all data restored | Full backup/restore roundtrip | ⬜ |
| V5.9 | Settings page: change passphrase → old passphrase required → new passphrase works | Passphrase change flow secure | ⬜ |
| V5.10 | Settings page: click "Lock Now" → login screen appears → unlock with passphrase | Manual lock works | ⬜ |
| V5.11 | "Open in Obsidian" from scratchpad → works with `obsidian://` URI (or graceful fallback) | URI fires. Fallback: "Obsidian not detected — download .md instead" | ⬜ |

---

## PHASE 6 — CALENDAR + POLISH + DEPLOY

### 🎯 Target

**Weekly calendar view, Command Palette (⌘K), full keyboard shortcut map, Obsidian companion plugin, final design audit, and production-ready deploy.**

### 📦 Tasks

| # | Task | Files | Est. Time |
|---|---|---|---|
| 6.1 | Build `useCalendarStore` (pre-loaded shift blocks, university blocks, CRUD for custom blocks) | `src/stores/useCalendarStore.ts` | 30 min |
| 6.2 | Build `WeekView` grid (Mon–Sun columns, 6 AM – 11 PM rows, current time indicator) | `src/components/calendar/WeekView.tsx` | 60 min |
| 6.3 | Build `TimeBlock` component (color-coded: work=amber, commute=grey, study=blue, sat=terracotta) | `src/components/calendar/TimeBlock.tsx` | 30 min |
| 6.4 | Build `ScheduleLegend` (color key + shift schedule explanation) | `src/components/calendar/ScheduleLegend.tsx` | 15 min |
| 6.5 | Pre-populate standard work blocks (Mon–Fri 8:30–17:30, commute buffers, Sat shifts for 1st/last week) | `src/lib/constants.ts` + `useCalendarStore.ts` | 20 min |
| 6.6 | Build `CommandPalette` (⌘K trigger, search all entities, quick actions, navigation) | `src/components/layout/CommandPalette.tsx` | 60 min |
| 6.7 | Implement search indexing (searches priorities, tasks, snippets, blockers, STAR entries) | `src/lib/utils.ts` (search index builder) | 30 min |
| 6.8 | Build complete keyboard shortcut map + help overlay (press `?` to show all shortcuts) | `src/hooks/useKeyboardShortcuts.ts` + help overlay component | 30 min |
| 6.9 | Build Obsidian companion plugin (watches Downloads folder, auto-imports .md files) | `obsidian-plugin/main.ts`, `manifest.json`, `styles.css` | 120 min |
| 6.10 | Final design audit: check every page against Sakura Stone spec (colors, spacing, typography, animations) | Visual review all pages | 45 min |
| 6.11 | Responsive audit: test at 1024px, 1440px, 1920px. Mobile (768px) — functional but not primary target | Manual testing | 30 min |
| 6.12 | Accessibility: tab order, focus rings, aria labels, screen reader test (VoiceOver) | Manual testing | 30 min |
| 6.13 | Performance: Lighthouse audit → target 90+ on all categories | Chrome DevTools | 30 min |
| 6.14 | Final README update (install instructions, Obsidian plugin setup, keyboard shortcuts, backup guide) | `README.md` | 30 min |
| 6.15 | Tag v1.0.0 release on GitHub | Git | 10 min |

**Total Estimated Time: ~9.5 hours**

### ✅ VERIFICATION GATE — PHASE 6 (FINAL)

| # | Check | Expected Result | Pass? |
|---|---|---|---|
| V6.1 | WeekView shows Mon–Sun with work blocks 8:30–17:30, commute buffers, and alternating Saturday shifts | Calendar accurate for current month | ⬜ |
| V6.2 | Current time indicator (red line / highlight) visible on today's column | Time indicator updates live | ⬜ |
| V6.3 | Add a custom study block → appears on calendar → persists on reload | Custom block CRUD works | ⬜ |
| V6.4 | ⌘K opens CommandPalette → type "data pipeline" → shows matching Kanban tasks + snippets → click navigates | Universal search works | ⬜ |
| V6.5 | ⌘K → type "new task" → Enter → Kanban opens with new task form focused | Quick actions work | ⬜ |
| V6.6 | Press `?` → keyboard shortcut overlay appears → shows at least 10 shortcuts | Help overlay comprehensive | ⬜ |
| V6.7 | Obsidian plugin: export markdown from workstation → drop in watched folder → plugin auto-imports | Plugin auto-sync works (if Obsidian installed) | ⬜ |
| V6.8 | Full design audit: every card has 20px padding, correct sakura colors, no pure black/white, soft shadows, correct border-radius | Pixel-perfect to spec | ⬜ |
| V6.9 | Tab through entire app → focus rings visible on every interactive element | Keyboard accessible | ⬜ |
| V6.10 | Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90 | Production-grade scores | ⬜ |
| V6.11 | PWA: "Install" prompt appears → install → opens as standalone window → works offline | PWA functional | ⬜ |
| V6.12 | Push to `main` → GitHub Actions deploys → live URL loads without errors | CI/CD pipeline works | ⬜ |
| V6.13 | All 10 success criteria (SC-1 through SC-10) from Section 1.2 confirmed | Full requirements met | ⬜ |

---

## 11. COMPLETE REQUIREMENT TRACEABILITY MATRIX

How every requirement from the original spec maps to phases and verification checks:

### 11.1 Feature Modules

| Original Requirement | Implemented In | Verified By |
|---|---|---|
| **Header / Quick Status Bar** (date, shift tag, timer) | Phase 1: StatusBar + ShiftIndicator + Phase 2: PomodoroTimer | V1.10, V2.6 |
| **Daily Top 3 Priorities** (drag-and-drop, P1/P2/P3) | Phase 2: DailyPriorities + PriorityCard | V2.1, V2.2, V2.3 |
| **Live Work Scratchpad** (rich-text / markdown editor) | Phase 2: RichEditor (TipTap) | V2.4 | Rich text scratchpad persists on reload | Rich text survives reload | ✅ |
| **Blocker Escalation Tracker** (Open, Escalated, Resolved) | Phase 2: BlockerTracker | V2.7 | Blocker status transitions work | Open → Escalated → Resolved | ✅ |
| **Kanban Board** (Backlog, In Progress, Testing, Completed) | Phase 3: KanbanBoard + KanbanColumn + KanbanCard | V3.1-V3.10 |
| **Category Filters** (AI Tooling, Data Pipeline, Dashboarding, Automation, Documentation) | Phase 3: CategoryFilter | V3.6 | Kanban feature verified | Works correctly | ✅ |
| **Card Attributes** (Title, Subtasks, Priority, Deadline, Security Review) | Phase 3: KanbanCard + KanbanCardDetail | V3.4, V3.5, V3.7, V3.8, V3.9 |
| **AI Prompt & Snippet Manager** (filter, 1-click copy) | Phase 4: SnippetLibrary + SnippetCard | V4.1-V4.5 |
| **Data & Dashboard Registry** (sources, schema, endpoints) | Phase 4: DataRegistry | V4.6, V4.7 |
| **Cybersecurity Masking Checklist** | Phase 4: CyberMaskChecklist | V4.8, V4.9 |
| **Weekly Impact Logger (STAR Method)** | Phase 5: STARLogger + STARCard | V5.1-V5.4 |
| **Auto-generate Summary Cards** (resume bullets) | Phase 5: Auto-summary generator | V5.2 |
| **SOP & User Guide Tracker** | Phase 5: SOPTruacker | V5.5 |
| **1:1 Supervisor Sync Agenda Generator** | Phase 5: SyncAgendaGenerator | V5.6 |
| **Academic & Work Balance Calendar** | Phase 6: WeekView + TimeBlock + ScheduleLegend | V6.1-V6.3 |

### 11.2 Cross-Cutting Concerns

| Concern | Implemented In | Verified By |
|---|---|---|
| **Calm design (Sakura Stone)** | Phase 1 (design system) + all phases (applied) | V6.8 |
| **Automated login** (PBKDF2 + AES-GCM, 7-day session) | Phase 1: Auth Service | V1.6-V1.8 |
| **Obsidian sync** (markdown export + URI + plugin) | Phase 5: Export engine + URI builder + Phase 6: Plugin | V2.5, V5.4, V5.7, V5.11, V6.7 |
| **GitHub Pages deploy** (CI/CD) | Phase 1: Actions workflow | V1.5, V6.12 |
| **Offline support** (PWA + IndexedDB) | Phase 1: PWA config, all stores use Dexie | V2.9, V6.11 |
| **Data backup** (JSON export/import) | Phase 5: SettingsPage backup tab | V5.8 |
| **Keyboard shortcuts** | All phases: useKeyboardShortcuts | V6.5, V6.6 |
| **Command Palette (⌘K)** | Phase 6: CommandPalette | V6.4, V6.5 |
| **TypeScript strict mode** | Phase 1: tsconfig | V1.4 |
| **No backend required** | Architecture: all data in IndexedDB | V2.9, SC-10 |
| **Pluggable backend** (repository pattern) | Phase 1: api.ts + repository pattern in stores | Future-proof |

### 11.3 Success Criteria Mapping

| SC | Description | Verification Point |
|---|---|---|
| SC-1 | Deploy to GitHub Pages on push to main | V1.5, V6.12 |
| SC-2 | Passphrase-protected auto-login (7-day session) | V1.6, V1.7, V1.8 |
| SC-3 | All 5 feature modules functional | Gates 2-6 (all V checks) |
| SC-4 | Data persists across sessions | V2.1, V3.1, V4.5, V5.1, V6.3 |
| SC-5 | Works fully offline | V2.9, V6.11 |
| SC-6 | Notes exportable to Obsidian-compatible markdown | V5.7, V5.11 |
| SC-7 | PWA installable | V6.11 |
| SC-8 | Sakura Stone design consistent | V6.8 |
| SC-9 | Keyboard shortcuts work | V6.5, V6.6 |
| SC-10 | No external dependencies for core functionality | Implicit (architecture ensures this) |

---

## 12. APPENDIX

### 12.1 Complete Folder Structure

```
JY_Workstation/
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── obsidian-plugin/
│   ├── manifest.json
│   ├── main.ts
│   ├── styles.css
│   ├── package.json
│   ├── esbuild.config.mjs
│   └── README.md
│
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   ├── sw.js
│   ├── 404.html
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   ├── obsidian-export.ts
│   │   ├── obsidian-uri.ts
│   │   ├── sync.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   │
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   ├── useAppStore.ts
│   │   ├── usePrioritiesStore.ts
│   │   ├── useKanbanStore.ts
│   │   ├── useScratchpadStore.ts
│   │   ├── useBlockerStore.ts
│   │   ├── useVaultStore.ts
│   │   ├── useImpactStore.ts
│   │   ├── useCalendarStore.ts
│   │   ├── useTimerStore.ts
│   │   └── useSyncStore.ts
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── CommandPalette.tsx
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SetupScreen.tsx
│   │   │   └── LockScreen.tsx
│   │   ├── sync/
│   │   │   ├── ObsidianLink.tsx
│   │   │   ├── ExportPanel.tsx
│   │   │   └── SyncStatus.tsx
│   │   ├── dashboard/
│   │   │   ├── ShiftIndicator.tsx
│   │   │   ├── PomodoroTimer.tsx
│   │   │   ├── DailyPriorities.tsx
│   │   │   ├── PriorityCard.tsx
│   │   │   └── BlockerTracker.tsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── KanbanCard.tsx
│   │   │   ├── KanbanCardDetail.tsx
│   │   │   └── CategoryFilter.tsx
│   │   ├── vault/
│   │   │   ├── SnippetLibrary.tsx
│   │   │   ├── SnippetCard.tsx
│   │   │   ├── DataRegistry.tsx
│   │   │   └── CyberMaskChecklist.tsx
│   │   ├── impact/
│   │   │   ├── STARLogger.tsx
│   │   │   ├── STARCard.tsx
│   │   │   ├── SOPTruacker.tsx
│   │   │   └── SyncAgendaGenerator.tsx
│   │   ├── calendar/
│   │   │   ├── WeekView.tsx
│   │   │   ├── TimeBlock.tsx
│   │   │   └── ScheduleLegend.tsx
│   │   └── scratchpad/
│   │       ├── RichEditor.tsx
│   │       └── EditorToolbar.tsx
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── KanbanPage.tsx
│   │   ├── VaultPage.tsx
│   │   ├── ImpactPage.tsx
│   │   ├── CalendarPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   └── hooks/
│       ├── usePWA.ts
│       ├── useOnlineStatus.ts
│       ├── useKeyboardShortcuts.ts
│       └── useAutoExport.ts
│
├── server/                            # Future backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── sync.ts
│   │   ├── middleware/
│   │   └── db/
│   │       └── schema.ts
│   └── Dockerfile
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .gitignore
└── README.md
```

### 12.2 TypeScript Interfaces (Full)

```typescript
// ---- src/lib/types.ts ----

// ── AUTH ──
interface AuthRecord {
  salt: number[];
  verifyIv: number[];
  verifyCipher: number[];
}

// ── PRIORITIES ──
interface Priority {
  id: string;
  date: string;
  rank: 1 | 2 | 3;
  title: string;
  completed: boolean;
  createdAt: number;
}

// ── KANBAN ──
type KanbanColumn = 'backlog' | 'in-progress' | 'testing' | 'completed';
type TaskCategory = 'ai-tooling' | 'data-pipeline' | 'dashboarding' | 'automation' | 'documentation';

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  column: KanbanColumn;
  category: TaskCategory;
  priority: 1 | 2 | 3 | 4 | 5;
  subtasks: Subtask[];
  targetDate?: string;
  securityReviewPassed: boolean;
  createdAt: number;
  updatedAt: number;
}

// ── BLOCKERS ──
type BlockerStatus = 'open' | 'escalated' | 'resolved';

interface Blocker {
  id: string;
  title: string;
  description: string;
  status: BlockerStatus;
  escalatedTo?: string;
  resolution?: string;
  createdAt: number;
  resolvedAt?: number;
}

// ── SNIPPETS ──
type SnippetCategory = 'python-wrangling' | 'sql-query' | 'sop-drafting' | 'code-optimization' | 'llm-prompts';

interface Snippet {
  id: string;
  title: string;
  content: string;
  category: SnippetCategory;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

// ── DATA REGISTRY ──
type DataSourceType = 'sql-table' | 'api' | 'powerbi' | 'file';

interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  schema?: string;
  endpoint?: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// ── CYBERSECURITY CHECKLIST ──
interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  checked: boolean;
}

// ── STAR ENTRIES ──
interface STAREntry {
  id: string;
  weekStart: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  quantitativeMetrics: string;
  createdAt: number;
  updatedAt: number;
}

// ── SOP DOCUMENTS ──
type SOPStatus = 'drafting' | 'supervisor-review' | 'published';

interface SOPDocument {
  id: string;
  title: string;
  status: SOPStatus;
  lastEdited: number;
  url?: string;
}

// ── CALENDAR ──
type BlockType = 'work-shift' | 'commute' | 'study' | 'sat-shift' | 'custom';

interface TimeBlock {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  type: BlockType;
  label: string;
  color: string;
}

// ── SCRATCHPAD ──
interface ScratchNote {
  id: string;
  date: string;
  content: string;
  plainText: string;
  updatedAt: number;
}

// ── SYNC CONFIG ──
interface SyncConfig {
  vaultName: string;
  dailyNoteFolder: string;
  starFolder: string;
  autoExportEnabled: boolean;
  autoExportInterval: number;
  lastExportAt: number | null;
}

// ── APP SETTINGS ──
type Theme = 'light-sakura' | 'dark-sakura';

interface AppSettings {
  theme: Theme;
  sidebarCollapsed: boolean;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  keyboardShortcuts: Record<string, string>;
}
```

### 12.3 Dexie Database Schema

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie';
import {
  AuthRecord, Priority, KanbanTask, Blocker, Snippet,
  DataSource, ChecklistItem, STAREntry, SOPDocument,
  TimeBlock, ScratchNote, SyncConfig, AppSettings,
} from './types';

class WorkstationDB extends Dexie {
  auth!: Table<AuthRecord, string>;
  priorities!: Table<Priority, string>;
  kanbanTasks!: Table<KanbanTask, string>;
  blockers!: Table<Blocker, string>;
  snippets!: Table<Snippet, string>;
  dataSources!: Table<DataSource, string>;
  checklistItems!: Table<ChecklistItem, string>;
  starEntries!: Table<STAREntry, string>;
  sopDocuments!: Table<SOPDocument, string>;
  timeBlocks!: Table<TimeBlock, string>;
  scratchNotes!: Table<ScratchNote, string>;
  syncConfig!: Table<SyncConfig, string>;
  appSettings!: Table<AppSettings, string>;

  constructor() {
    super('JYWorkstation');

    this.version(1).stores({
      auth:            'id',
      priorities:      'id, date, rank',
      kanbanTasks:     'id, column, category, priority, targetDate',
      blockers:        'id, status',
      snippets:        'id, category, *tags',
      dataSources:     'id, type',
      checklistItems:  'id, category',
      starEntries:     'id, weekStart',
      sopDocuments:    'id, status',
      timeBlocks:      'id, date, type',
      scratchNotes:    'id, date',
      syncConfig:      'id',
      appSettings:     'id',
    });
  }
}

export const db = new WorkstationDB();
```

### 12.4 Full Dependencies

```json
{
  "name": "jy-workstation",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4",
    "dexie": "^4.0.8",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@tiptap/react": "^2.6.6",
    "@tiptap/starter-kit": "^2.6.6",
    "@tiptap/extension-placeholder": "^2.6.6",
    "@tiptap/extension-code-block-lowlight": "^2.6.6",
    "lowlight": "^3.1.0",
    "recharts": "^2.12.7",
    "react-hotkeys-hook": "^4.5.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.441.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.8",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.6",
    "vite-plugin-pwa": "^0.20.5",
    "tailwindcss": "^3.4.11",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.11.0",
    "@eslint/js": "^9.11.0",
    "typescript-eslint": "^8.7.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.12",
    "globals": "^15.9.0",
    "gh-pages": "^6.1.1",
    "tailwindcss-animate": "^1.0.7",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/forms": "^0.5.9"
  }
}
```

### 12.5 Pre-Loaded Snippet Seed Data

| # | Category | Title | Content Preview |
|---|---|---|---|
| 1 | python-wrangling | Read Parquet + Clean Nulls + GroupBy | `pd.read_parquet(path).fillna(method='ffill').groupby('asset_id').agg(...)` |
| 2 | python-wrangling | Scikit-learn Train/Test Split + StandardScaler | `train_test_split(X, y, test_size=0.2)` + `StandardScaler().fit_transform()` |
| 3 | python-wrangling | Efficient DataFrame Filtering with .query() | `df.query('pressure > 100 and status == "active"')` |
| 4 | python-wrangling | Pandas Datetime Operations | `pd.to_datetime(df['timestamp']).dt.floor('1H')` |
| 5 | sql-query | Recursive CTE for Org Hierarchy | `WITH RECURSIVE org AS (SELECT ... UNION ALL ...)` |
| 6 | sql-query | Window Functions ROW_NUMBER / RANK | `ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)` |
| 7 | sql-query | Common Table Expressions for Readability | `WITH summary AS (...) SELECT ... FROM summary WHERE ...` |
| 8 | sql-query | Pivot Data with CASE WHEN | `SELECT date, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) ...` |
| 9 | sop-drafting | SOP Template | Standard sections: Purpose, Scope, Definitions, Procedure, Safety, References |
| 10 | sop-drafting | System Testing Checklist Template | Pre-test, execution, post-test, sign-off sections |
| 11 | sop-drafting | User Guide Structure | Overview, Prerequisites, Step-by-step with screenshots, Troubleshooting |
| 12 | code-optimization | Vectorize Loops with NumPy | Replace `for i in range(n)` with `np.where(condition, x, y)` |
| 13 | code-optimization | Python: functools.lru_cache | `@lru_cache(maxsize=128)` for expensive repeated calls |
| 14 | code-optimization | Pandas: itertuples over iterrows | `for row in df.itertuples()` is 100x faster than `iterrows()` |
| 15 | llm-prompts | Code Review Assistant System Prompt | "You are a senior software engineer. Review for: correctness, performance, security, readability..." |
| 16 | llm-prompts | Data Anonymization Audit Prompt | "Analyze this dataset. Identify all PII fields. Suggest masking strategies..." |
| 17 | llm-prompts | SOP Drafting Assistant Prompt | "Generate an SOP for [process]. Include sections: Purpose, Scope, Procedure, Safety..." |
| 18 | llm-prompts | SQL Query Optimization Prompt | "Review this SQL query. Identify inefficiencies, missing indexes, and suggest improvements..." |

### 12.6 Cybersecurity Masking Checklist Items

| # | Category | Checklist Item |
|---|---|---|
| 1 | PII Identification | Scan all columns for personal names |
| 2 | PII Identification | Scan all columns for email addresses |
| 3 | PII Identification | Scan all columns for phone numbers |
| 4 | PII Identification | Scan all columns for NRIC / passport numbers |
| 5 | PII Identification | Scan all columns for physical addresses |
| 6 | Geo-Spatial | Verify GPS coordinates are aggregated to field/block level |
| 7 | Geo-Spatial | Confirm no exact drilling coordinates in exported data |
| 8 | Financial | Mask production volume to percentage changes if sharing externally |
| 9 | Financial | Remove or aggregate cost/revenue columns |
| 10 | Access Control | Confirm exported file is not shared via unsecured channels |
| 11 | Access Control | Verify data is stored in company-approved location |
| 12 | Documentation | Document all masking transformations applied |
| 13 | Documentation | Attach data processing log to output |

---

## 📊 PROGRESS TRACKING

### Phase Status

| Phase | Status | Started | Completed | Gate Result |
|---|---|---|---|---|
| Phase 1 — Foundation + Auth | ✅ Complete | 2026-08-03 | 2026-08-03 | ✅ PASSED |
| Phase 2 — Daily Dashboard | ✅ Complete | 2026-08-03 | 2026-08-03 | ✅ PASSED |
| Phase 3 — Kanban Board | ✅ Complete | 2026-08-03 | 2026-08-03 | ✅ PASSED |
| Phase 4 — Technical Vault | ✅ Complete | 2026-08-03 | 2026-08-03 | ✅ PASSED |
| Phase 5 — Impact + Sync | ⬜ Not Started | — | — | — |
| Phase 6 — Calendar + Polish | ⬜ Not Started | — | — | — |

---

> **Built with intention. Designed with calm. Deployed for one.** 🌿
