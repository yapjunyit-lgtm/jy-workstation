# 🌿 JY Workstation

> Personal daily workspace manager for AI Engineering interns.
> Built with calm intention. Designed with focus.

## Features

- **Daily Dashboard** — Priorities, scratchpad, Pomodoro timer, blocker tracker
- **Kanban Board** — Drag-and-drop task management with 5 workflow categories
- **Technical Vault** — AI prompt library, data registry, cybersecurity checklist
- **Impact Log** — STAR-method brag document, SOP tracker, 1:1 agenda generator
- **Calendar** — Work shift + academic schedule week view
- **Obsidian Sync** — Export notes to markdown, one-click `obsidian://` links
- **Offline PWA** — Install as standalone app, works without internet

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS (Sakura Stone design system)
- Dexie.js (IndexedDB)
- Zustand (state management)
- TipTap (rich text editor)
- dnd-kit (drag and drop)

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run typecheck  # TypeScript check
```

## Deployment

Push to `main` → auto-deploys to GitHub Pages via Actions.

## Architecture

- **100% client-side** — No backend required
- **IndexedDB** — All data stored locally in your browser
- **PBKDF2 + AES-GCM** — Passphrase-protected with 7-day session
- **Optional backend** — Pluggable repository pattern for future cloud sync

## Obsidian Integration

1. **One-click**: Click 📓 on any note to open in Obsidian
2. **Batch export**: Export all notes as markdown ZIP
3. **Companion plugin**: Auto-import workstation exports into your vault (see `obsidian-plugin/`)

## License

Private — For personal use.

---

> *Built with intention. Designed with calm. Deployed for one.* 🌿
