<div align="center">

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/aman--copilot-GitHub_Copilot-white?style=for-the-badge&labelColor=0d1117&color=58a6ff">
  <img alt="aman-copilot" src="https://img.shields.io/badge/aman--copilot-GitHub_Copilot-black?style=for-the-badge&labelColor=f6f8fa&color=24292f">
</picture>

### The aman companion, now inside GitHub Copilot Chat.

Bring your identity, guardrails, memory, and live MCP tools into VS Code — every chat, zero friction.

<br>

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![aman](https://img.shields.io/badge/part_of-aman_ecosystem-ff6b35.svg?style=flat-square)](https://github.com/amanasmuei/aman)
[![VS Code](https://img.shields.io/badge/VS_Code-1.102+-007ACC.svg?style=flat-square)](https://code.visualstudio.com)
[![Copilot](https://img.shields.io/badge/Copilot_Chat-Agent_Mode-24292f.svg?style=flat-square)](https://docs.github.com/copilot)
[![Scope](https://img.shields.io/badge/scope-dev:copilot-informational.svg?style=flat-square)](#scope-and-installation-targets)
[![CI](https://img.shields.io/github/actions/workflow/status/amanasmuei/aman-copilot/test.yml?branch=master&style=flat-square&label=tests)](https://github.com/amanasmuei/aman-copilot/actions/workflows/test.yml)

[Why this exists](#why-this-exists) · [Install](#install) · [Features](#features) · [How to use](#how-to-use) · [vs aman-claude-code](#vs-aman-claude-code) · [Troubleshooting](#troubleshooting) · [Ecosystem](#the-ecosystem)

</div>

---

## Why this exists

You've set up the aman ecosystem — your identity, your rules, your memory. It works in Claude Code via [aman-claude-code](https://github.com/amanasmuei/aman-claude-code). But the moment you switch to VS Code and GitHub Copilot Chat, it forgets who you are. aman-copilot closes that gap: one command writes `.github/copilot-instructions.md` from your identity and rules, another registers `aman-mcp` and `amem-memory` as MCP servers in VS Code. Restart, and Copilot knows everything aman-claude-code knows — because they share the same brain.

---

## Install

### 1. Requirements

| Requirement | Check | Get it |
|:---|:---|:---|
| **Node.js 18+** | `node --version` | https://nodejs.org |
| **VS Code 1.102+** | `code --version` | https://code.visualstudio.com |
| **GitHub Copilot Chat** | VS Code extension | [marketplace](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) |
| **aman ecosystem** | `ls ~/.acore` | `npx @aman_asmuei/aman@latest` |

> **No ecosystem yet?** Run `npx @aman_asmuei/aman@latest` first — it walks through identity, guardrails, and relationship tracking in ~90 seconds.

### 2. Write instructions + register MCP tools

From the root of any project where you want aman context:

```bash
npx @aman_asmuei/aman-copilot init
npx @aman_asmuei/aman-copilot install-mcp --all
```

`init` reads your scope-aware `acore` + `arules` files and writes `.github/copilot-instructions.md`, which Copilot Chat auto-loads into every chat turn in that workspace. `install-mcp --all` registers the `aman` (~31 tools) and `amem-memory` (~30 tools) MCP servers in both VS Code and Copilot CLI.

| Server | Tools | Key tools |
|:---|:---:|:---|
| **`aman`** | ~31 | `identity_read`, `rules_check`, `rules_add`, `eval_log`, `workflow_list`, … |
| **`amem-memory`** | ~30 | `memory_store`, `memory_recall`, `memory_inject`, `reminder_check`, `memory_doctor`, … |

> **Upgrading from 0.4.x?** `copilot-instructions.md` is written at `init` time and cached by Copilot until rewritten. Re-run `npx @aman_asmuei/aman-copilot init` once in each project to pick up the latest instruction blocks.

### 3. Activate and verify

1. Restart VS Code (`Cmd+Shift+P` → *Developer: Reload Window*)
2. Open Copilot Chat → switch to **Agent mode** (MCP tools only surface in Agent, not Ask)
3. Test with: *"Call `identity_read` and tell me who I am."*

---

## Features

### Wake-word briefing

Type your AI's name as the first message in a Copilot Chat Agent-mode session and you get a real briefing — not a silent acknowledgement:

```text
You: Sarah

Sarah: Morning, Aman. Last session we landed scope inheritance
       across the aman ecosystem — v0.3.0 live. 2 reminders due
       today: follow up on the passive-observer alpha, reply
       to the amem RFC thread. What's next?
```

- Fires when your first message is **just** the AI's name, or a short greeting containing the name (`hi Sarah`, `morning Sarah`).
- Does NOT fire when your first message is a task (`Sarah, fix the login bug`) — Copilot folds the greeting into the task opener instead.
- Skipped automatically if the name field is still set to `Companion` (the default before identity setup).

> **Reliability (v0.7.0+).** The trigger is now gated by explicit positive *and* negative examples in the generated `copilot-instructions.md`, not prose alone. Earlier versions drifted on edge cases. v0.7.0 also compresses the instructions file ~39% (16.8KB → 10.2KB on minimal identity), so Copilot has more headroom for your actual work.

> **Staleness caveat.** `copilot-instructions.md` is written at `init` time and cached by Copilot until rewritten. If you rename your AI (via `acore customize` or by editing `~/.acore/core.md`), re-run `npx @aman_asmuei/aman-copilot init` so the wake-word matches the new name. This is not an issue on aman-claude-code — its `SessionStart` hook reads identity fresh every session.

### Tier-loader phrases

Say ecosystem layer names in plain language and Copilot resolves them to the right `npx` command, runs it, and reports the outcome. Layers already installed get a confirmation prompt before re-running.

```text
You: load memory

Copilot: Installing @aman_asmuei/amem (persistent memory MCP)…
         Done. amem will auto-load on your next session.
```

Full catalog:

| You say           | Copilot runs                              | What it adds |
|:------------------|:------------------------------------------|:-------------|
| `load rules`      | `npx @aman_asmuei/arules init`            | Guardrails (24 starter rules) |
| `load workflows`  | `npx @aman_asmuei/aflow init`             | 4 starter workflows |
| `load memory`     | `npx @aman_asmuei/amem`                   | Persistent amem MCP |
| `load eval`       | `npx @aman_asmuei/aeval init`             | Relationship tracking |
| `load identity`   | `npx @aman_asmuei/acore`                  | Full identity (re-)walk |
| `load archetype`  | `npx @aman_asmuei/acore customize`        | Change AI personality |
| `load tools`      | `npx @aman_asmuei/akit add <name>`        | Tool kits (Copilot asks which) |
| `load skills`     | `npx @aman_asmuei/askill add <name>`      | Plugin skills (Copilot asks which) |

The same vocabulary works on aman-claude-code — the phrase catalog is cross-surface by design.

> **`load archetype` is special.** As of v0.6.1 Copilot no longer shells out to the interactive CLI for this phrase — it edits your `core.md` via the `identity_update_section` MCP tool and shifts its own tone mid-chat. No re-init required. See [Day-to-day verbs](#day-to-day-verbs--just-talk) below.

### Day-to-day verbs — just talk

Once layers are installed, you don't need `load` anymore. In Copilot Chat **Agent mode**, say what you want in plain language — Copilot maps your phrase to the right MCP tool on the `aman` server and handles it in-session:

| You say | What happens |
|:---|:---|
| *"add rule: never force-push to main"* | `rules_add` (Copilot classifies the category) |
| *"can I delete this file?"* / *"is X allowed?"* | `rules_check` |
| *"list my rules"* / *"list my skills"* / *"list tools"* | `rules_list` / `skill_list` / `tools_list` |
| *"remove rule about X"* | `rules_remove` |
| *"log this session as productive"* / *"record today"* | `eval_log` |
| *"how are we doing?"* / *"show relationship report"* | `eval_report` |
| *"we hit X today"* / *"milestone: Y"* | `eval_milestone` |
| *"install testing skill"* / *"add security skill"* | `skill_install` |
| *"search skills for X"* | `skill_search` |
| *"add tool: github"* / *"install supabase tool"* | `tools_add` |
| *"add workflow: code-review"* | `workflow_add` |
| *"who am I?"* / *"show my profile"* | `identity_read` |
| *"update my role to senior architect"* | `identity_update_section` |
| *"remember that I use pnpm"* / *"don't commit secrets"* | `memory_store` |
| *"what do you remember about X?"* | `memory_recall` |

**Mental model**

```
New layer I haven't installed yet?  →  load <layer>
I want my AI to feel different?     →  load archetype (tone shifts mid-chat)
Everything else                     →  just say what you want
```

No phrases to memorize. Talk to your AI like a colleague — *"save this"*, *"check my rules"*, *"log today"*, *"install the testing skill"*. Copilot maps your intent to the right tool.

> Shipped in v0.6.2 — the rendered `copilot-instructions.md` embeds the full catalog so Copilot knows every mapping without you teaching it. Re-run `npx @aman_asmuei/aman-copilot init` in existing projects to pick up the catalog.

### Project context card

Juggling multiple repos? `aman-copilot init` now bakes each project's context into its own `copilot-instructions.md`. When you run init in a repo, it resolves the project root (git toplevel or `process.cwd()`), reads `$PROJECT_ROOT/.acore/context.md` if present, and embeds it as a **Project context** section so Copilot Chat knows which project it's in — on every chat turn in that workspace.

```text
You: Sarah

Sarah: Morning, Aman — you're in myapp-frontend (Node/TypeScript).
       Last session here we wired up the checkout flow. 2 reminders
       due today. What's next?
```

Create the card on demand with **`npx @aman_asmuei/aman here`** (fast, single-purpose — writes the card for the current repo and exits), or let the full `npx @aman_asmuei/aman@latest` setup wizard detect your stack and write one automatically. The card captures Stack, Domain, Focus, Session, Active topics, Recent decisions, and Project Patterns. Edit it as you work.

> **Re-run `init` when the card changes.** Unlike `aman-claude-code`, where the session-start hook reads `.acore/context.md` fresh every session, `copilot-instructions.md` is static until rewritten. If you edit `.acore/context.md` during a work session, re-run `npx @aman_asmuei/aman-copilot init` to refresh the embed.

> **Part of a multi-project roadmap.** Path 1 (project context) shipped in v0.6.0. Path 2 (per-project memory tagging in amem) and Path 3 (first-class project registry) are still on the roadmap — this release is a foundation, not a full multi-project system.

### Identity that persists

`aman-copilot init` reads your `~/.acore/dev/copilot/core.md` (falling back through `dev/plugin` → legacy) and bakes your identity and rules into `copilot-instructions.md`. Copilot loads that file on every turn without any session hook. **Re-run `init` any time your identity changes** — Copilot won't pick up edits to `~/.acore` automatically.

### Live MCP tools

`install-mcp` registers `aman` (~31 tools) and `amem-memory` (~30 tools) as Copilot Chat MCP servers. With those registered you can ask Copilot to call tools directly: `identity_read` to fetch your profile, `rules_check` to validate a planned action, `memory_recall` to surface past decisions, `eval_log` to record a session. Tools are idempotent — re-running `install-mcp` updates in place and preserves all your other MCP servers.

### Slash-command prompts

`aman-copilot init` writes 5 prompt files that become native Copilot Chat slash commands in the project:

| Slash command | Purpose |
|:---|:---|
| `/identity` | View or update your aman identity |
| `/rules` | Check, add, or list guardrails |
| `/eval` | Log a session or view the relationship report |
| `/remember` | Store something in amem (auto-classified as correction / decision / fact) |
| `/session-narrative` | Save a 300–500 word flowing-prose narrative of the session's reasoning path |

---

## How to use

### Day-to-day

Copilot is instructed to watch for natural-language patterns and act on them:

- *"don't X"*, *"never Y"*, *"stop doing Z"* → correction stored in amem
- *"we decided X"*, *"let's go with Y"* → decision stored in amem
- *"load rules"*, *"load memory"*, `load archetype` → tier loaders (see catalog above)
- First message is your AI's name → wake-word briefing

### Slash commands

| Command | Purpose |
|:---|:---|
| `/identity` | View or update your aman identity |
| `/rules` | Check, add, or list guardrails |
| `/eval` | Log a session or view relationship report |
| `/remember` | Store a correction, decision, or fact in amem |
| `/session-narrative` | Capture the session's reasoning path as a memory note |

### After identity changes

When you update your aman identity — via `acore customize`, via aman-claude-code skills, or by editing `~/.acore/core.md` directly — the instructions file does not update automatically:

```bash
cd /path/to/project && npx @aman_asmuei/aman-copilot init
```

Then reload the VS Code window. Copilot picks up `.github/copilot-instructions.md` changes on workspace reload.

---

## Scope and installation targets

aman-copilot uses the `dev:copilot` scope. The layer resolver checks `~/.acore/dev/copilot/core.md` first, then falls back to `dev/plugin` (aman-claude-code's scope), then to legacy `~/.acore/core.md`. If you're already an aman-claude-code user, your identity is inherited automatically. To give Copilot a distinct personality, write `~/.acore/dev/copilot/core.md` and it takes precedence without affecting Claude Code.

`install-mcp` writes to the VS Code user-level config by default. With `--cli` it targets the Copilot CLI config. With `--all` it writes both.

| Target | Config file |
|:---|:---|
| VS Code (macOS) | `~/Library/Application Support/Code/User/mcp.json` |
| VS Code (Linux) | `~/.config/Code/User/mcp.json` |
| VS Code (Windows) | `%APPDATA%\Code\User\mcp.json` |
| Copilot CLI (all platforms) | `~/.copilot/mcp-config.json` |

---

## vs aman-claude-code

Both live in the same ecosystem. Pick either, or both.

|  | **aman-claude-code** | **aman-copilot** |
|:---|:---|:---|
| **Target IDE** | Claude Code | VS Code + Copilot Chat |
| **Delivery** | `SessionStart` hook injects context into the prompt | Static `copilot-instructions.md`, auto-loaded |
| **Live tools** | `~/.claude.json` mcpServers | VS Code user-level `mcp.json` |
| **Slash commands** | `/identity`, `/rules`, `/eval`, … | `/identity`, `/rules`, `/eval`, `/remember`, `/session-narrative` |
| **Scope** | `dev:plugin` | `dev:copilot` |
| **Install** | `claude plugin install aman-claude-code@aman` | `npx @aman_asmuei/aman-copilot init && install-mcp` |

**Running both?** They don't conflict. The shared layers (`acore`, `arules`, `amem`) are scope-aware — each adapter reads its own scope first, falls back to the other if unset. One identity, two IDEs.

---

## Troubleshooting

**MCP tools not appearing in Copilot Chat.**
You must be in Agent mode — tools don't surface in Ask or Edit mode. Toggle via the mode dropdown in the chat input. If already in Agent mode, restart VS Code after running `install-mcp`, then check `Cmd+Shift+P` → *MCP: List Servers*.

**Instructions file not taking effect.**
Restart VS Code after running `init`. Confirm `github.copilot.chat.codeGeneration.useInstructionFiles` is `true` in VS Code settings (the default). Project-level instructions only apply when that project is the open workspace.

**Wrong scope / identity not resolving.**
The resolver checks `dev/copilot` → `dev/plugin` → legacy. If none of those paths exist, run `npx @aman_asmuei/aman@latest` to seed them. To verify, check `ls ~/.acore/dev/copilot/core.md` and `ls ~/.acore/dev/plugin/core.md`.

**Identity or AI name is stale.**
`copilot-instructions.md` is static until you re-run `init`. After any identity edit, run `npx @aman_asmuei/aman-copilot init` in the project root, then reload the VS Code window.

**`amem-cli sync` errors.**
Run `npx @aman_asmuei/amem doctor` to diagnose. Common causes: amem daemon not running, or a schema mismatch after an amem upgrade. Follow the repair instructions it prints.

**Which file does `install-mcp --cli` write to?**
`~/.copilot/mcp-config.json` on all platforms. The installer uses the `mcpServers` top-level key (Copilot CLI's schema) and adds only the `aman` server. Any existing `amem` entry is preserved untouched.

---

## The Ecosystem

| Layer | Package | What it does |
|:---|:---|:---|
| Identity | [acore](https://github.com/amanasmuei/acore) | Personality, values, relationship memory |
| Memory | [amem](https://github.com/amanasmuei/amem) | Persistent knowledge storage (MCP) |
| Guardrails | [arules](https://github.com/amanasmuei/arules) | Safety boundaries and permissions |
| Workflows | [aflow](https://github.com/amanasmuei/aflow) | Repeatable task sequences |
| Evaluation | [aeval](https://github.com/amanasmuei/aeval) | Relationship and session tracking |
| Tools | [akit](https://github.com/amanasmuei/akit) | Pluggable tool kits |
| Skills | [askill](https://github.com/amanasmuei/askill) | Plugin skill registry |

---

## Roadmap

- **v0.7 (current)** — Tiered session manifest: two-sided wake-word conditional (explicit positive *and* negative examples), explicit 6-step Boot Protocol as MCP tool-call sequence, ~39% reduction on the rendered instructions file. Mirror of aman-claude-code v3.2.0-alpha.10's same restructure.
- **v0.6** — Project context card (path 1 of multi-project roadmap), `/session-narrative` slash command, phrase catalog embedded in generated instructions.
- **v0.5** — Wake-word briefing and tier-loader phrases (first cut; iterated through v0.6.x before landing reliably in v0.7).
- **Next** — VS Code extension wrapper with `@aman` chat participant for exact local time in greetings; per-project memory tagging in amem (path 2 of multi-project roadmap).
- **Future** — JetBrains support (once their MCP story matures), `aman-cursor` sibling.

See [CHANGELOG.md](CHANGELOG.md) for what's released.

---

## Uninstall

Removes the MCP server entries (VS Code + Copilot CLI) and the generated project files. **Your identity, rules, and memory at `~/.acore`, `~/.arules`, `~/.amem` are untouched** — they survive so the Claude Code side (or a future reinstall) keeps working without losing anything.

```bash
# 1. Remove the aman + amem MCP entries from VS Code and Copilot CLI config
npx @aman_asmuei/aman-copilot uninstall-mcp --all

# 2. In each project you ran `init` in, remove the generated files
cd /path/to/project
rm -f .github/copilot-instructions.md
rm -f .github/prompts/{identity,rules,eval,remember,session-narrative}.prompt.md

# 3. Reload VS Code so Copilot Chat picks up the empty state
```

To also wipe ecosystem data and per-project context cards (full uninstall across every surface), see the [canonical guide in the aman umbrella README](https://github.com/amanasmuei/aman#uninstall--reset).

---

## License

[MIT](LICENSE)
