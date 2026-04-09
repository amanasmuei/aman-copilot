#!/usr/bin/env node
/**
 * install-mcp.mjs — Register aman MCP server(s) for GitHub Copilot surfaces.
 *
 * Default target: VS Code Copilot Chat user-level mcp.json at:
 *   macOS:   ~/Library/Application Support/Code/User/mcp.json
 *   Linux:   ~/.config/Code/User/mcp.json
 *   Windows: %APPDATA%/Code/User/mcp.json
 *
 * With --cli: Copilot CLI config at ~/.copilot/mcp-config.json.
 *
 * With --all: write to BOTH targets in one call.
 *
 * Both are idempotent. Both preserve all other servers in the target file.
 * Atomic writes via tmp + rename.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const args = process.argv.slice(2);
const wantCli = args.includes("--cli");
const wantAll = args.includes("--all");
const wantVscode = args.includes("--vscode") || (!wantCli && !wantAll);

// Target definitions. Each target has its own file path, top-level key, and
// entry shape — because VS Code and Copilot CLI use subtly different schemas.

/**
 * VS Code Copilot Chat — uses `servers` key, supports `env` block.
 * Writes aman + amem-memory entries.
 */
const VSCODE_TARGET = {
  name: "VS Code (Copilot Chat)",
  topKey: "servers",
  entries: {
    aman: {
      command: "npx",
      args: ["-y", "@aman_asmuei/aman-mcp@^0.6.2"],
      env: { AMAN_MCP_SCOPE: "dev:copilot" },
    },
    "amem-memory": {
      command: "npx",
      args: ["-y", "@aman_asmuei/amem@latest", "mcp"],
      env: { AMAN_MCP_SCOPE: "dev:copilot" },
    },
  },
  // Only overwrite these entries by default — any other key in topKey is preserved.
  alwaysOverwrite: new Set(["aman", "amem-memory"]),
};

/**
 * Copilot CLI — uses `mcpServers` key, same shape as Claude Code's
 * ~/.claude.json. Only adds the aman entry by default because many users
 * already have an `amem` entry from `npx @aman_asmuei/amem init` that
 * predates aman-copilot — we must not clobber working config.
 */
const CLI_TARGET = {
  name: "Copilot CLI",
  topKey: "mcpServers",
  entries: {
    aman: {
      command: "npx",
      args: ["-y", "@aman_asmuei/aman-mcp@^0.6.2"],
      env: { AMAN_MCP_SCOPE: "dev:copilot" },
    },
  },
  alwaysOverwrite: new Set(["aman"]),
};

function vscodeConfigPath() {
  if (process.env.AMAN_COPILOT_VSCODE_USER_DIR) {
    return path.join(process.env.AMAN_COPILOT_VSCODE_USER_DIR, "mcp.json");
  }
  const home = os.homedir();
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Code", "User", "mcp.json");
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    return path.join(appData, "Code", "User", "mcp.json");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(home, ".config");
  return path.join(xdg, "Code", "User", "mcp.json");
}

function cliConfigPath() {
  if (process.env.AMAN_COPILOT_CLI_CONFIG) {
    return process.env.AMAN_COPILOT_CLI_CONFIG;
  }
  return path.join(os.homedir(), ".copilot", "mcp-config.json");
}

// Note: Prior versions of aman-copilot (0.3.2) shipped a seedCopilotScope()
// pre-flight that copied ~/.acore/dev/plugin/core.md to ~/.acore/dev/copilot/
// so aman-mcp at scope dev:copilot would find identity content. That
// workaround is no longer needed starting with aman-mcp@0.6.2, which picks
// up library-level scope inheritance from aman-core@0.3.0 / acore-core@0.2.0
// / arules-core@0.2.0. The library itself now falls back dev:<other> →
// dev:plugin → legacy transparently, without file copies. See those release
// notes for the full story.
//
// We pin aman-mcp to ^0.6.2 (below) to guarantee every aman-copilot install
// gets the library fix. That means this installer can focus on what it was
// always supposed to do — write MCP config — and leave data concerns to
// the core libraries.

async function loadConfig(target) {
  let raw = null;
  let existed = false;
  try {
    raw = await fs.readFile(target, "utf-8");
    existed = true;
  } catch {}

  let config = {};
  if (raw !== null && raw.trim() !== "") {
    try {
      config = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Failed to parse ${target} as JSON: ${err.message}\nRefusing to overwrite a malformed config file.`,
      );
    }
  }
  return { config, existed };
}

async function writeConfig(target, config) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.aman-install.tmp`;
  await fs.writeFile(tmp, JSON.stringify(config, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, target);
}

async function installTo(targetDef, configPath) {
  let loaded;
  try {
    loaded = await loadConfig(configPath);
  } catch (err) {
    console.error(err.message);
    return { ok: false };
  }
  const { config, existed } = loaded;

  if (!config[targetDef.topKey] || typeof config[targetDef.topKey] !== "object") {
    config[targetDef.topKey] = {};
  }

  const updates = [];
  for (const [name, value] of Object.entries(targetDef.entries)) {
    const had = config[targetDef.topKey][name] !== undefined;
    config[targetDef.topKey][name] = value;
    updates.push(`${had ? "updated" : "added"} ${name}`);
  }

  await writeConfig(configPath, config);

  console.log("");
  console.log(`✓ ${targetDef.name}`);
  console.log(`  ${existed ? "Updated" : "Created"}: ${configPath}`);
  for (const u of updates) console.log(`  ${u}`);
  return { ok: true };
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: install-mcp [--vscode | --cli | --all]");
    console.log("");
    console.log("  (default)  Install for VS Code Copilot Chat");
    console.log("  --cli      Install for Copilot CLI only");
    console.log("  --all      Install for both VS Code and Copilot CLI");
    return;
  }

  const results = [];
  if (wantAll || wantVscode) {
    results.push(await installTo(VSCODE_TARGET, vscodeConfigPath()));
  }
  if (wantAll || wantCli) {
    results.push(await installTo(CLI_TARGET, cliConfigPath()));
  }

  if (results.some((r) => !r.ok)) {
    process.exit(1);
  }

  console.log("");
  console.log("Scope: AMAN_MCP_SCOPE=dev:copilot");
  console.log("");
  console.log("Next:");
  if (wantAll || wantVscode) {
    console.log("  VS Code:     restart VS Code, open Copilot Chat (Agent mode)");
  }
  if (wantAll || wantCli) {
    console.log("  Copilot CLI: restart `copilot` in a new terminal");
  }
  console.log('  Then ask: "call identity_read and tell me who I am."');
  console.log("");
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
