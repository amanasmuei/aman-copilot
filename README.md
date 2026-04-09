# aman-copilot

Bring the aman ecosystem (identity, rules, memory, live MCP tools) into **GitHub Copilot Chat** in VS Code.

Sibling to [aman-plugin](https://github.com/amanasmuei/aman-plugin) (which does the same for Claude Code). Both share the same brains — `acore`, `arules`, `amem`, `aman-mcp`.

**Scope:** `dev:copilot`

## Quickstart

```bash
# 1. Set up the aman ecosystem (one-time, skip if you already have it)
npx @aman_asmuei/aman@latest

# 2. Write copilot-instructions.md in the current project
npx @aman_asmuei/aman-copilot init

# 3. Register aman-mcp + amem-memory in VS Code's user mcp.json
npx @aman_asmuei/aman-copilot install-mcp

# 4. Restart VS Code, open Copilot Chat in Agent mode
```

## What it does

| Step | Mechanism | Gives you |
|:---|:---|:---|
| `init` | Writes `.github/copilot-instructions.md` from acore + arules | Copilot Chat loads your identity + guardrails into every chat turn |
| `install-mcp` | Writes `aman` + `amem-memory` into VS Code's `mcp.json` | Live MCP tools: `identity_read`, `memory_store`, `rules_check`, ~60 total |

Both commands are **idempotent** and **preserve other MCP servers** in your config.

## Paths

- **Instructions:** `./.github/copilot-instructions.md` (project-level, default)
- **VS Code MCP config:**
  - macOS: `~/Library/Application Support/Code/User/mcp.json`
  - Linux: `~/.config/Code/User/mcp.json`
  - Windows: `%APPDATA%/Code/User/mcp.json`

## Commands

```
aman-copilot init            # write copilot-instructions.md
aman-copilot install-mcp     # register MCP servers in VS Code
aman-copilot uninstall-mcp   # remove MCP servers
```

## How it differs from aman-plugin

| | aman-plugin (Claude Code) | aman-copilot (VS Code) |
|:---|:---|:---|
| Delivery | `SessionStart` hook injects context | Static `copilot-instructions.md` |
| Live tools | `~/.claude.json` mcpServers | VS Code `mcp.json` servers |
| Scope | `dev:plugin` | `dev:copilot` |
| Slash commands | `/identity`, `/rules`, … | via Copilot Chat `@workspace` + MCP tools |

Identity, rules, and memory are **shared** — editing `~/.acore/core.md` updates both. Run `aman-copilot init` after identity changes to refresh the instructions file.

## Status

**v0.1.0 — initial scaffold.** Working but minimal. No tests yet, no VS Code extension wrapper, no `@aman` chat participant. Those are future work.

## License

MIT
