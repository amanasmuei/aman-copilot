#!/usr/bin/env node
/**
 * uninstall-mcp.mjs — Remove aman MCP server entries from VS Code and/or
 * Copilot CLI config files. Preserves all other servers. Idempotent.
 *
 *   (default)  Remove from VS Code (Copilot Chat) config
 *   --cli      Remove from Copilot CLI config
 *   --all      Remove from both
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const args = process.argv.slice(2);
const wantCli = args.includes("--cli");
const wantAll = args.includes("--all");
const wantVscode = args.includes("--vscode") || (!wantCli && !wantAll);

const VSCODE_TARGET = {
  name: "VS Code (Copilot Chat)",
  topKey: "servers",
  names: ["aman", "amem-memory"],
};

const CLI_TARGET = {
  name: "Copilot CLI",
  topKey: "mcpServers",
  names: ["aman"],
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

async function removeFrom(targetDef, configPath) {
  let raw;
  try {
    raw = await fs.readFile(configPath, "utf-8");
  } catch {
    console.log(`${targetDef.name}: nothing to do — ${configPath} does not exist.`);
    return { ok: true };
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    console.error(`${targetDef.name}: failed to parse ${configPath}: ${err.message}`);
    return { ok: false };
  }

  const bucket = config[targetDef.topKey];
  if (!bucket || typeof bucket !== "object") {
    console.log(`${targetDef.name}: no ${targetDef.topKey} key — nothing to remove.`);
    return { ok: true };
  }

  const removed = [];
  for (const name of targetDef.names) {
    if (bucket[name]) {
      delete bucket[name];
      removed.push(name);
    }
  }

  if (removed.length === 0) {
    console.log(`${targetDef.name}: no aman entries found — nothing removed.`);
    return { ok: true };
  }

  const tmp = `${configPath}.aman-uninstall.tmp`;
  await fs.writeFile(tmp, JSON.stringify(config, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, configPath);

  console.log(`${targetDef.name}: removed ${removed.join(", ")} from ${configPath}`);
  return { ok: true };
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: uninstall-mcp [--vscode | --cli | --all]");
    return;
  }

  const results = [];
  if (wantAll || wantVscode) {
    results.push(await removeFrom(VSCODE_TARGET, vscodeConfigPath()));
  }
  if (wantAll || wantCli) {
    results.push(await removeFrom(CLI_TARGET, cliConfigPath()));
  }

  if (results.some((r) => !r.ok)) process.exit(1);
  console.log("");
  console.log("Restart VS Code / Copilot CLI to apply.");
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
