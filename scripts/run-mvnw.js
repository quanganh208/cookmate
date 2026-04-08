#!/usr/bin/env node
// Cross-platform Maven Wrapper runner.
// Selects `mvnw.cmd` on Windows and `./mvnw` on Unix-like systems,
// forwards CLI args, and runs from the backend/ directory.
//
// Loads the monorepo root .env file into process.env BEFORE spawning mvnw so Spring Boot's
// `${VAR}` placeholders in application.yml resolve correctly. Spring Boot does NOT auto-load
// .env files; it only reads OS environment variables, so the parent process must inject them.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const rootEnvPath = path.join(repoRoot, '.env');

// Tiny inline .env parser. No quoting/escaping support — matches the format used by
// apps/mobile/app.config.js so both backend and mobile share the same single root .env.
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    // Don't override an explicit env var passed in by the parent shell.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const isWindows = process.platform === 'win32';
const backendDir = path.join(repoRoot, 'backend');
const command = isWindows ? 'mvnw.cmd' : './mvnw';
const args = process.argv.slice(2);

const child = spawn(command, args, {
  stdio: 'inherit',
  cwd: backendDir,
  shell: isWindows, // needed on Windows to resolve .cmd
  env: process.env, // explicit pass-through (default but makes intent clear)
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (err) => {
  console.error(`Failed to start Maven wrapper: ${err.message}`);
  process.exit(1);
});
