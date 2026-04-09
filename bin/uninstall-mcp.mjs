#!/usr/bin/env node
/**
 * uninstall-mcp.mjs — Remove aman entries from VS Code's mcp.json.
 * Preserves any other MCP servers. Idempotent.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const NAMES = ["aman", "amem-memory"];

function vscodeUserDir() {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Code", "User");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Code", "User");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(xdg, "Code", "User");
}

async function main() {
  const target = path.join(vscodeUserDir(), "mcp.json");
  let raw;
  try {
    raw = await fs.readFile(target, "utf-8");
  } catch {
    console.log(`Nothing to do — ${target} does not exist.`);
    return;
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${target}: ${err.message}`);
    process.exit(1);
  }

  if (!config.servers) {
    console.log("No servers key — nothing to remove.");
    return;
  }

  const removed = [];
  for (const name of NAMES) {
    if (config.servers[name]) {
      delete config.servers[name];
      removed.push(name);
    }
  }

  if (removed.length === 0) {
    console.log("No aman entries found — nothing removed.");
    return;
  }

  const tmp = `${target}.aman-uninstall.tmp`;
  await fs.writeFile(tmp, JSON.stringify(config, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, target);

  console.log(`✓ Removed from ${target}: ${removed.join(", ")}`);
  console.log("Restart VS Code to apply.");
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
