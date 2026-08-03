# 🌿 JY Workstation

> Personal daily workspace manager for AI Engineering interns.
> Built with calm intention. Designed with focus.

**🔗 Live: [yapjunyit-lgtm.github.io/jy-workstation](https://yapjunyit-lgtm.github.io/jy-workstation/)**

## Features

- **Daily Dashboard** — Priorities (P1/P2/P3), TipTap rich-text scratchpad, Pomodoro timer, blocker escalation tracker
- **Kanban Board** — Drag-and-drop (Backlog → In Progress → Testing → Completed) with 5 categories, subtasks, security review
- **Technical Vault** — 14 pre-loaded AI/code snippets, data source registry, cybersecurity masking checklist
- **Impact Log** — STAR-method brag document, SOP tracker, 1:1 agenda generator
- **Calendar** — Weekly view with work shifts (8:30–5:30), commute buffers, university study blocks
- **Obsidian Sync** — Markdown export, `obsidian://` URI links, companion plugin for auto-import
- **Offline PWA** — Install as standalone app, works without internet
- **⌘K Command Palette** — Universal search across all tabs

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS (Sakura Stone design system)
- Dexie.js (IndexedDB) + Zustand (state)
- TipTap (rich text) + dnd-kit (drag and drop)

## Quick Start

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
```

## Deployment

Push to `main` → auto-deploys to GitHub Pages via Actions.

## Keyboard Shortcuts

| Keys | Action |
|---|---|
| `⌘K` | Command palette |
| `⌘1–6` | Navigate tabs |
| `n` | New Kanban task |
| `b` | Log a blocker |
| `/` | Focus search (Vault) |
| `?` | Show all shortcuts |

## Obsidian Integration

1. **One-click**: Click 📓 on any note → opens in Obsidian
2. **Batch export**: Settings → Sync → Export All as Markdown ZIP
3. **Companion plugin**: See `obsidian-plugin/` folder

## Architecture

- **100% client-side** — No backend required
- **IndexedDB** — All data stored locally in your browser
- **PBKDF2 + AES-GCM** — Passphrase-protected with 7-day session
- **Optional backend** — Pluggable repository pattern for future cloud sync

---

> *Built with intention. Designed with calm. Deployed for one.* 🌿
