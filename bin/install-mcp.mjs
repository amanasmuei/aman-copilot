#!/usr/bin/env node
/**
 * install-mcp.mjs — Register aman-mcp + amem-memory in VS Code's mcp.json.
 *
 * VS Code 1.102+ reads MCP servers from a user-level mcp.json at:
 *   macOS:   ~/Library/Application Support/Code/User/mcp.json
 *   Linux:   ~/.config/Code/User/mcp.json
 *   Windows: %APPDATA%/Code/User/mcp.json
 *
 * GitHub Copilot Chat (agent mode) will discover and use these servers.
 *
 * Idempotent: re-running updates existing entries, preserves other servers.
 * Scope: AMAN_MCP_SCOPE=dev:copilot
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const ENTRIES = {
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
};

function vscodeUserDir() {
  // Test override: point at a sandbox dir instead of the real VS Code config.
  if (process.env.AMAN_COPILOT_VSCODE_USER_DIR) {
    return process.env.AMAN_COPILOT_VSCODE_USER_DIR;
  }
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Code",
      "User",
    );
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Code", "User");
  }
  // linux + others
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(xdg, "Code", "User");
}

async function main() {
  const userDir = vscodeUserDir();
  const target = path.join(userDir, "mcp.json");

  let config = { servers: {} };
  let existed = false;
  try {
    const raw = await fs.readFile(target, "utf-8");
    existed = true;
    try {
      config = raw.trim() === "" ? { servers: {} } : JSON.parse(raw);
    } catch (err) {
      console.error(`Failed to parse ${target} as JSON: ${err.message}`);
      console.error("Refusing to overwrite a malformed config file.");
      process.exit(1);
    }
  } catch {
    // doesn't exist yet — we'll create it
  }

  if (!config.servers || typeof config.servers !== "object") {
    config.servers = {};
  }

  const updated = [];
  for (const [name, value] of Object.entries(ENTRIES)) {
    const had = config.servers[name] !== undefined;
    config.servers[name] = value;
    updated.push(`${had ? "updated" : "added"} ${name}`);
  }

  await fs.mkdir(userDir, { recursive: true });
  const tmp = `${target}.aman-install.tmp`;
  await fs.writeFile(tmp, JSON.stringify(config, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, target);

  console.log("");
  console.log(`✓ ${existed ? "Updated" : "Created"} ${target}`);
  for (const line of updated) console.log(`  ${line}`);
  console.log("");
  console.log("Scope: AMAN_MCP_SCOPE=dev:copilot");
  console.log("");
  console.log("Next:");
  console.log("  1. Restart VS Code (or reload window).");
  console.log("  2. Open Copilot Chat in Agent mode.");
  console.log('  3. Ask: "call identity_read and tell me who I am."');
  console.log("");
  console.log("To remove: aman-copilot uninstall-mcp");
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
