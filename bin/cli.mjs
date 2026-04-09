#!/usr/bin/env node
/**
 * aman-copilot CLI — thin dispatcher.
 *
 * Subcommands:
 *   init           Write .github/copilot-instructions.md from acore + arules.
 *   install-mcp    Register aman-mcp + amem-memory in VS Code's mcp.json.
 *   uninstall-mcp  Remove the aman entries from VS Code's mcp.json.
 */

import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USAGE = `aman-copilot — bring the aman ecosystem into GitHub Copilot Chat.

Usage:
  aman-copilot init [--user|--project]   Write copilot-instructions.md
  aman-copilot install-mcp                Register aman-mcp + amem in VS Code
  aman-copilot uninstall-mcp              Remove aman entries from VS Code mcp.json
  aman-copilot --help                     Show this message

Scope: dev:copilot
`;

const [, , cmd, ...rest] = process.argv;

if (!cmd || cmd === "--help" || cmd === "-h") {
  console.log(USAGE);
  process.exit(0);
}

const scripts = {
  init: "init.mjs",
  "install-mcp": "install-mcp.mjs",
  "uninstall-mcp": "uninstall-mcp.mjs",
};

const script = scripts[cmd];
if (!script) {
  console.error(`Unknown subcommand: ${cmd}\n`);
  console.error(USAGE);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [path.join(__dirname, script), ...rest],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
