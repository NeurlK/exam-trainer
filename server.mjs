#!/usr/bin/env node
// Serves public/ on http://localhost:8765 and opens it in the default browser.
// No dependencies. Options: PORT=9000 npm start · node server.mjs --no-open

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 8765;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    // no-store: edits to question files show up on a plain page reload
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  });
});

const url = `http://localhost:${PORT}/`;

function openBrowser() {
  if (process.argv.includes('--no-open')) return;
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${cmd} ${url}`);
}

// Saved history is tied to the exact address (port included), so never fall back to another port.
server.once('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log(`\n  Port ${PORT} is already in use — the trainer is probably running in another window.`);
    console.log(`  Opening ${url}\n  (If that page doesn't load, close the other program or run: PORT=9000 npm start)\n`);
    openBrowser();
    process.exit(0);
  }
  console.error(e.message);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Exam trainer is running at ${url}\n  Press Ctrl+C to stop.\n`);
  openBrowser();
});
