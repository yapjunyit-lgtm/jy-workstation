#!/usr/bin/env node
/**
 * JY Workstation — Vault Bridge
 * Local control server that connects the workstation app to the Obsidian vault:
 *   - reports vault status (git, today's note, counts)
 *   - runs AI automations via Codex CLI (process inbox, health check, log work, custom)
 *   - keeps a git-committed action ledger for full trackability
 *
 * Usage:  npm run bridge
 * Env:    BRIDGE_PORT (default 4788), VAULT_PATH, CODEX_NODE, CODEX_CLI
 * Binds to 127.0.0.1 only.
 */

import { createServer } from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, appendFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const execFileP = promisify(execFile);

const PORT = Number(process.env.BRIDGE_PORT || 4788);
const VAULT = resolve(process.env.VAULT_PATH || '/Users/jy/Desktop/JY_Vault');
const NODE_BIN = process.env.CODEX_NODE || '/Users/jy/.local/node/bin/node';
const CODEX_CLI = process.env.CODEX_CLI || '/Users/jy/.local/node/bin/codex';
const LEDGER_DIR = join(VAULT, 'JY_Workstation', '_logs');
const LEDGER_FILE = join(LEDGER_DIR, 'actions.jsonl');
const DAILY_DIR = join(VAULT, '10-Daily');
const TEMPLATE_FILE = join(VAULT, '90-Templates', 'Daily Note Template.md');

const startedAt = Date.now();

// Serve the built web app (dist/) alongside the API so the AI page can be
// opened at http://127.0.0.1:4788/jy-workstation/ — same origin, no CORS or
// mixed-content blocking (works even in embedded/WebView browsers).
const APP_DIR = resolve(import.meta.dirname, '../dist');
const APP_PREFIX = '/jy-workstation/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function mimeFor(pathname) {
  const ext = pathname.slice(pathname.lastIndexOf('.'));
  return MIME[ext] || 'application/octet-stream';
}

async function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? 'index.html' : pathname;
  if (rel.startsWith(APP_PREFIX)) rel = rel.slice(APP_PREFIX.length) || 'index.html';
  if (!rel) rel = 'index.html';

  let filePath = join(APP_DIR, rel);
  if (!existsSync(filePath) || (await stat(filePath)).isDirectory()) {
    filePath = join(APP_DIR, 'index.html'); // SPA fallback
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mimeFor(filePath),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

// ── helpers ──────────────────────────────────────────────────────────────
function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prettyDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true',
  });
  res.end(data);
}

async function git(args) {
  const { stdout } = await execFileP('git', ['-C', VAULT, ...args], { maxBuffer: 16 * 1024 * 1024 });
  return stdout.trim();
}

async function gitOk() {
  try {
    await git(['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

async function readLedger(limit = 20) {
  try {
    const raw = await readFile(LEDGER_FILE, 'utf8');
    const entries = raw.split('\n').filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    return entries.slice(-limit).reverse();
  } catch {
    return [];
  }
}

async function appendLedger(entry) {
  await mkdir(LEDGER_DIR, { recursive: true });
  await appendFile(LEDGER_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

async function commitAll(message) {
  const before = await git(['rev-parse', 'HEAD']).catch(() => '');
  try {
    await git(['add', '-A']);
    await git(['commit', '-m', message, '--quiet']);
  } catch {
    return null; // nothing to commit
  }
  const after = await git(['rev-parse', 'HEAD']).catch(() => '');
  return after && after !== before ? after : null;
}

// ── action definitions ───────────────────────────────────────────────────
const ACTIONS = {
  'create-today': {
    label: 'Create Today Note',
    kind: 'direct',
    buildPrompt: () => 'Create today\'s daily note from the template.',
  },
  'process-inbox': {
    label: 'Process Inbox',
    kind: 'codex',
    buildPrompt: () =>
      'Run the "process my inbox" workflow described in AGENTS.md: read everything in 00_INPUT/ (Inbox.md, Raw Dump.md), ' +
      'run the 7-step pipeline (clean → classify → structure → summarize → link → enhance → business-tag), ' +
      'write structured notes into 03_BUILD/ using the Knowledge Note Template, update the relevant MOCs, ' +
      'and clear processed items from the inbox. Follow AGENTS.md rules exactly: no fabrication, check duplicates, link bidirectionally.',
  },
  'health-check': {
    label: 'Health Check (体检)',
    kind: 'codex',
    buildPrompt: () =>
      `Run the "体检" (vault health check) workflow from AGENTS.md and Weekly_Review.md: scan for duplicate notes, broken links, ` +
      'orphan notes, stale or contradictory information, and unprocessed 00_INPUT/ items. ' +
      `Write the full report to "05_SYSTEM/Health_Check_${todayLocal()}.md" (create or overwrite it) with sections: Duplicates, Broken links, ` +
      'Orphans, Stale/Contradictory, Inbox status. End your final message with a 5-line summary and the report path. ' +
      'Do NOT modify any other files.',
  },
  'log-work': {
    label: 'Log Today\'s Work',
    kind: 'codex',
    buildPrompt: (p) =>
      `Log today's work for the project "${p}" following the workflow in 40-Resources/Obsidian Skills.md: ` +
      'read the raw dump in 00_INPUT/Raw Dump.md, structure it into a work log (Problem / What We Did / Solution / Progress / Lessons), ' +
      'save it to the correct work-log folder (40-Resources/Work-Logs/YYYY-MM-DD.md, or 30-Areas/Internship/Work-Logs/ for internship), ' +
      'and update the Master Work Log Index. Follow AGENTS.md: no fabrication, link bidirectionally.',
  },
  'custom': {
    label: 'Custom Prompt',
    kind: 'codex',
    buildPrompt: (p) => p,
  },
};

// ── status ───────────────────────────────────────────────────────────────
async function vaultStatus() {
  const date = todayLocal();
  const notePath = join(DAILY_DIR, `${date}.md`);
  const [repoOk, branch, log, dirtyRaw, ledger] = await Promise.all([
    gitOk(),
    git(['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => 'n/a'),
    git(['log', '--oneline', '-5']).catch(() => ''),
    git(['status', '--porcelain']).catch(() => ''),
    readLedger(5),
  ]);
  const dirty = dirtyRaw ? dirtyRaw.split('\n').filter(Boolean) : [];

  const commits = log ? log.split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf(' ');
    return { hash: l.slice(0, i), subject: l.slice(i + 1) };
  }) : [];

  return {
    date,
    vault: VAULT,
    repoOk,
    branch,
    lastCommit: commits[0] || null,
    commits,
    dirty: { count: dirty.length, files: dirty.map((l) => l.slice(3)) },
    todayNote: {
      exists: existsSync(notePath),
      path: `10-Daily/${date}.md`,
    },
    ledger,
    codex: {
      ok: existsSync(CODEX_CLI) && existsSync(NODE_BIN),
      node: NODE_BIN,
      cli: CODEX_CLI,
    },
    actions: Object.entries(ACTIONS).map(([id, a]) => ({ id, label: a.label, kind: a.kind })),
  };
}

// ── action execution ─────────────────────────────────────────────────────
function sse(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function runCodexAction(res, id, prompt) {
  const lastMsgFile = join(tmpdir(), `codex-last-message-${Date.now()}.txt`);
  const args = [
    CODEX_CLI, 'exec', '--ephemeral', '-s', 'workspace-write', '-C', VAULT,
    '-o', lastMsgFile, prompt,
  ];
  // stdio: ['ignore', ...] closes the child's stdin immediately.
  // Codex exec reads piped stdin to EOF and appends it as <stdin>; an open pipe would hang it forever.
  const child = spawn(NODE_BIN, args, { cwd: VAULT, stdio: ['ignore', 'pipe', 'pipe'] });
  const started = Date.now();

  const forward = (streamName) => (chunk) => {
    const text = chunk.toString();
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) sse(res, { type: 'output', stream: streamName, line: trimmed });
    }
  };
  child.stdout.on('data', forward('stdout'));
  child.stderr.on('data', forward('stderr'));

  const code = await new Promise((resolveCode) => {
    child.on('close', resolveCode);
    child.on('error', (err) => {
      sse(res, { type: 'error', message: `Failed to start Codex: ${err.message}` });
      resolveCode(-1);
    });
  });

  let lastMessage = '';
  for (let attempt = 0; attempt < 3 && !lastMessage; attempt++) {
    try {
      lastMessage = (await readFile(lastMsgFile, 'utf8')).trim().slice(0, 2000);
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const ok = code === 0;
  const commitHash = ok ? await commitAll(`workstation: ${id}`) : null;
  await appendLedger({
    action: id, prompt: prompt.slice(0, 300), status: ok ? 'ok' : 'error',
    exitCode: code, commit: commitHash, message: lastMessage.slice(0, 500),
  });
  sse(res, {
    type: 'done', ok, exitCode: code, commit: commitHash,
    durationMs: Date.now() - started, lastMessage,
  });
}

async function runCreateToday(res) {
  const date = todayLocal();
  const notePath = join(DAILY_DIR, `${date}.md`);
  if (existsSync(notePath)) {
    await appendLedger({ action: 'create-today', status: 'ok', message: 'Daily note already exists' });
    sse(res, { type: 'done', ok: true, message: 'Daily note already exists', lastMessage: `10-Daily/${date}.md` });
    return;
  }

  let content = `# ${date}\n\n## 🎯 Today's Focus\n- \n`;
  try {
    content = (await readFile(TEMPLATE_FILE, 'utf8'))
      .replaceAll('{{date:YYYY-MM-DD}}', date)
      .replaceAll('{{date:dddd, MMMM D, YYYY}}', prettyDate(date));
  } catch { /* fall back to minimal template */ }

  await mkdir(DAILY_DIR, { recursive: true });
  await writeFile(notePath, content, 'utf8');
  const hash = await commitAll('workstation: create-today');
  await appendLedger({ action: 'create-today', status: 'ok', commit: hash, message: `Created 10-Daily/${date}.md` });
  sse(res, { type: 'done', ok: true, commit: hash, lastMessage: `Created 10-Daily/${date}.md` });
}

// ── HTTP server ──────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Private-Network': 'true',
    });
    res.end();
    return;
  }

  // Serve the built web app (same origin as the API)
  if (req.method === 'GET' && url.pathname.startsWith('/')) {
    if (url.pathname.startsWith('/api/')) {
      // API routes handled below
    } else if (url.pathname === '/') {
      res.writeHead(302, { Location: APP_PREFIX });
      res.end();
      return;
    } else {
      await serveStatic(req, res, url.pathname);
      return;
    }
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      json(res, 200, {
        ok: true, service: 'jy-workstation-vault-bridge',
        version: 1, uptimeMs: Date.now() - startedAt,
        vault: VAULT, vaultOk: await gitOk(),
        codex: existsSync(CODEX_CLI) && existsSync(NODE_BIN),
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/vault/status') {
      json(res, 200, await vaultStatus());
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/vault/ledger') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100);
      json(res, 200, { entries: await readLedger(limit) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/vault/actions') {
      let body = '';
      for await (const chunk of req) body += chunk;
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch { /* fall through */ }

      const { action, prompt, project } = parsed;
      const def = ACTIONS[action];
      if (!def) {
        json(res, 400, { error: `Unknown action. Available: ${Object.keys(ACTIONS).join(', ')}` });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Private-Network': 'true',
      });
      sse(res, { type: 'start', action, label: def.label, startedAt: new Date().toISOString() });

      if (def.kind === 'direct') {
        await runCreateToday(res);
      } else {
        const finalPrompt = def.buildPrompt(project || prompt || '');
        await runCodexAction(res, action, finalPrompt);
      }
      res.end();
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (err) {
    json(res, 500, { error: String(err?.message || err) });
  }
});

await mkdir(LEDGER_DIR, { recursive: true });
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[vault-bridge] listening on http://127.0.0.1:${PORT}`);
  console.log(`[vault-bridge] vault: ${VAULT}`);
  console.log(`[vault-bridge] codex: ${existsSync(CODEX_CLI) && existsSync(NODE_BIN) ? 'ok' : 'MISSING'}`);
});
