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
      args: ["-y", "@aman_asmuei/aman-mcp@^0.6.0"],
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
      args: ["-y", "@aman_asmuei/aman-mcp@^0.6.0"],
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

/**
 * Pre-flight: ensure the dev:copilot scope has content to read.
 *
 * Problem: aman-mcp runs with AMAN_MCP_SCOPE=dev:copilot. It uses acore-core /
 * arules-core libraries to resolve layer files. Those libraries look for
 * ~/.acore/dev/copilot/core.md (and arules equivalent), then fall back only to
 * the legacy flat path ~/.acore/core.md. They do NOT cross-scope fallback to
 * sibling scopes like dev:plugin.
 *
 * This means a user who set up their identity via aman-plugin (writing to
 * ~/.acore/dev/plugin/core.md) will see aman-mcp return "No identity
 * configured" in Copilot Chat / Copilot CLI — even though the identity clearly
 * exists one directory over.
 *
 * Fix: before writing MCP config, check if the dev:copilot scope has content.
 * If not, look for a source (dev/plugin, then legacy), and copy it into
 * dev:copilot. Idempotent — never overwrites an existing dev:copilot file.
 *
 * This crosses a layer boundary (aman-copilot touching ~/.acore/), but it's
 * defensible: install-mcp is the transition command that turns a plugin-only
 * user into a plugin+copilot user, so it's the natural place to seed the new
 * scope. We're doing a migration, not owning the data.
 *
 * Future work: acore-core and arules-core should grow a scope-inheritance
 * mechanism so this seed step becomes redundant. Tracked in future session.
 */
async function seedCopilotScope() {
  const home = process.env.AMAN_COPILOT_FAKE_HOME ?? os.homedir();
  const layers = [
    { dir: ".acore", file: "core.md" },
    { dir: ".arules", file: "rules.md" },
  ];

  const results = [];
  for (const layer of layers) {
    const target = path.join(home, layer.dir, "dev", "copilot", layer.file);
    // Skip if dev:copilot scope already has content (never overwrite)
    try {
      await fs.access(target);
      results.push({ layer: layer.dir, status: "already present" });
      continue;
    } catch {}

    // Find a source: dev/plugin → legacy flat path
    const sources = [
      path.join(home, layer.dir, "dev", "plugin", layer.file),
      path.join(home, layer.dir, layer.file),
    ];
    let source = null;
    for (const s of sources) {
      try {
        await fs.access(s);
        source = s;
        break;
      } catch {}
    }

    if (!source) {
      results.push({ layer: layer.dir, status: "no source found" });
      continue;
    }

    // Copy source → target
    await fs.mkdir(path.dirname(target), { recursive: true });
    const content = await fs.readFile(source, "utf-8");
    await fs.writeFile(target, content, "utf-8");
    const sourceLabel = source.endsWith(`/dev/plugin/${layer.file}`)
      ? "dev/plugin"
      : "legacy";
    results.push({ layer: layer.dir, status: `seeded from ${sourceLabel}` });
  }

  // Only print section if we did something or something is missing
  const didWork = results.some(
    (r) => r.status.startsWith("seeded") || r.status === "no source found",
  );
  if (didWork) {
    console.log("");
    console.log("✓ Scope seed (dev:copilot)");
    for (const r of results) {
      console.log(`  ${r.layer}: ${r.status}`);
    }
  }

  // Warn if any layer has no source at all
  const missing = results.filter((r) => r.status === "no source found");
  if (missing.length > 0) {
    console.log("");
    console.log(
      `  Note: ${missing.map((m) => m.layer).join(", ")} — no identity/rules file found in any scope.`,
    );
    console.log("  Run: npx @aman_asmuei/aman@latest");
  }

  return results;
}

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
    console.log("Usage: install-mcp [--vscode | --cli | --all] [--no-seed]");
    console.log("");
    console.log("  (default)  Install for VS Code Copilot Chat");
    console.log("  --cli      Install for Copilot CLI only");
    console.log("  --all      Install for both VS Code and Copilot CLI");
    console.log("  --no-seed  Skip the dev:copilot scope seed pre-flight");
    return;
  }

  // Pre-flight: ensure the dev:copilot scope has identity/rules files
  // so aman-mcp (spawned by the MCP config we're about to write) can
  // actually find them. Skippable via --no-seed for advanced users.
  if (!args.includes("--no-seed")) {
    await seedCopilotScope();
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
