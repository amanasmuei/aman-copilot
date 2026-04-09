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
[![Scope](https://img.shields.io/badge/scope-dev:copilot-informational.svg?style=flat-square)](#scope)
[![CI](https://img.shields.io/github/actions/workflow/status/amanasmuei/aman-copilot/test.yml?branch=master&style=flat-square&label=tests)](https://github.com/amanasmuei/aman-copilot/actions/workflows/test.yml)

[Quickstart](#quickstart) · [How it Works](#how-it-works) · [Commands](#commands) · [vs aman-claude-code](#vs-aman-claude-code) · [Troubleshooting](#troubleshooting) · [Ecosystem](#the-ecosystem)

</div>

---

## The Problem

You've set up the aman ecosystem — your identity, your rules, your memory. It works beautifully in Claude Code via [aman-claude-code](https://github.com/amanasmuei/aman-claude-code). But the moment you switch to **VS Code and GitHub Copilot Chat**, it forgets who you are. Different AI, different context, different personality. The same conversation happens three times.

## The Solution

**aman-copilot** is the Copilot Chat adapter for the aman ecosystem. One command writes `copilot-instructions.md` from your identity. Another registers `aman-mcp` and `amem-memory` as MCP servers in VS Code. Restart, and Copilot knows everything aman-claude-code knows — because they share the same brain.

```bash
npx @aman_asmuei/aman-copilot init                 # identity + rules → copilot-instructions.md
npx @aman_asmuei/aman-copilot install-mcp --all    # live tools → VS Code + Copilot CLI
```

> **Same identity. Same rules. Same memory. Two IDEs, one terminal CLI.**

---

## Quickstart

Four steps. Under three minutes.

### Step 1 — Requirements

| Requirement | Check | Get it |
|:---|:---|:---|
| **Node.js 18+** | `node --version` | https://nodejs.org |
| **VS Code 1.102+** | `code --version` | https://code.visualstudio.com |
| **GitHub Copilot Chat** | VS Code extension | [marketplace](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) |
| **aman ecosystem** | `ls ~/.acore` | `npx @aman_asmuei/aman@latest` |

> **No ecosystem yet?** Run the one-shot installer first: `npx @aman_asmuei/aman@latest`. It walks you through identity (`acore`), guardrails (`arules`), and relationship tracking (`aeval`). Takes ~90 seconds.

### Step 2 — Write the instructions file

From the root of any project where you want aman context:

```bash
npx @aman_asmuei/aman-copilot init
```

This reads your scope-aware `acore` + `arules` files and writes `.github/copilot-instructions.md` — which GitHub Copilot Chat auto-loads into every chat turn in that workspace.

<details>
<summary><b>What layer paths does it resolve?</b></summary>

In order, first hit wins:

1. `~/.acore/dev/copilot/core.md` — this plugin's own scope
2. `~/.acore/dev/plugin/core.md` — inherits from aman-claude-code (free for existing users)
3. `~/.acore/core.md` — legacy single-tenant fallback

Same cascade for `arules`. Engine v1 aware.

</details>

### Step 3 — Install live MCP tools

Pick your target:

```bash
# VS Code Copilot Chat (default)
npx @aman_asmuei/aman-copilot install-mcp

# Copilot CLI (standalone terminal agent)
npx @aman_asmuei/aman-copilot install-mcp --cli

# Both at once
npx @aman_asmuei/aman-copilot install-mcp --all
```

This registers MCP servers in the appropriate config file(s):

| Server | Tools | What it gives you |
|:---|:---:|:---|
| **`aman`** | ~31 | `identity_read`, `identity_update_section`, `rules_check`, `rules_add`, `eval_log`, `workflow_list`, … |
| **`amem-memory`** | ~30 | `memory_store`, `memory_recall`, `memory_inject`, `memory_detail`, `reminder_check`, `memory_doctor`, … |

**Idempotent.** Re-running updates in place. **Preserves all your other MCP servers.** Atomic writes. Cross-platform (macOS, Linux, Windows).

<details>
<summary><b>Where does it write?</b></summary>

**VS Code Copilot Chat** (`install-mcp` or `install-mcp --vscode`):

| Platform | Path |
|:---|:---|
| macOS | `~/Library/Application Support/Code/User/mcp.json` |
| Linux | `~/.config/Code/User/mcp.json` |
| Windows | `%APPDATA%\Code\User\mcp.json` |

Top-level key: `servers`. Adds `aman` and `amem-memory`. The `inputs` array and all other servers are preserved byte-for-byte.

**Copilot CLI** (`install-mcp --cli`):

- All platforms: `~/.copilot/mcp-config.json`

Top-level key: `mcpServers` (different from VS Code — this is Claude Code's schema). Adds **only** `aman`. Any existing `amem` entry from `npx @aman_asmuei/amem` is preserved untouched — we never clobber working config.

</details>

### Step 4 — Activate in VS Code

1. **Restart VS Code** (or `Cmd+Shift+P` → *Developer: Reload Window*)
2. Open **Copilot Chat** → switch to **Agent mode** (MCP tools only surface in Agent, not Ask)
3. Verify with one of these:

- [ ] *"Call `identity_read` and tell me who I am."* → should return your acore config
- [ ] *"What do you remember about me? Use `memory_recall`."* → amem bridge
- [ ] *"Is force-pushing to main allowed? Check my rules."* → `rules_check` against arules

---

## How it Works

aman-copilot is **two thin adapters** over the same brains that power aman-claude-code:

```
        ┌─────────────────────────────────────────┐
        │  acore  •  arules  •  amem  •  aman-mcp │
        │      (shared ecosystem, one truth)      │
        └──────┬────────────────────────────┬─────┘
               │                            │
      ┌────────▼────────┐          ┌────────▼────────┐
      │   aman-claude-code   │          │   aman-copilot  │
      │  (Claude Code)  │          │    (VS Code)    │
      │                 │          │                 │
      │  SessionStart   │          │  copilot-       │
      │  hook injects   │          │  instructions   │
      │  into prompt    │          │  .md (static)   │
      │                 │          │                 │
      │  ~/.claude.json │          │  mcp.json       │
      │  mcpServers     │          │  servers        │
      │                 │          │                 │
      │  scope:         │          │  scope:         │
      │  dev:plugin     │          │  dev:copilot    │
      └─────────────────┘          └─────────────────┘
```

**Nothing is duplicated.** Edit `~/.acore/core.md` once → re-run `aman-copilot init` → both IDEs see the update.

### Scope

This plugin uses `dev:copilot`. The layer resolver prefers `dev:copilot`-scoped files first, then falls back through `dev:plugin` → legacy. That means:

- **Already an aman-claude-code user?** You inherit your identity automatically. No re-config.
- **Want Copilot-specific personality?** Write `~/.acore/dev/copilot/core.md` and it overrides.

---

## Commands

```bash
aman-copilot init            # write .github/copilot-instructions.md + prompt files
aman-copilot install-mcp     # register aman + amem-memory in VS Code
aman-copilot uninstall-mcp   # remove the aman entries (preserves others)
aman-copilot --help          # show usage
```

All commands work via `npx @aman_asmuei/aman-copilot <cmd>` without a global install.

`aman-copilot init` also writes 5 prompt files that become native Copilot Chat slash commands inside the project:

| Slash command | Purpose |
|:---|:---|
| `/identity` | View or update your aman identity |
| `/rules` | Check, add, or list guardrails |
| `/eval` | Log a session or view the relationship report |
| `/remember` | Store something in amem (auto-classified as correction / decision / fact) |
| `/session-narrative` ⭐ | Save a 300–500 word flowing-prose narrative of the session's reasoning path |

See [Memory 101](#memory-101--getting-the-most-out-of-amem) for when and how to use `/session-narrative` — it's the pattern that preserves *how* we got to a decision, not just *what* we decided.

### After identity changes

Any time you update your aman identity (via CLI, via aman-claude-code skills, or directly editing `~/.acore/core.md`), refresh the Copilot instructions file:

```bash
cd /path/to/project && npx @aman_asmuei/aman-copilot init
```

VS Code picks up `.github/copilot-instructions.md` changes automatically — no restart needed.

---

## vs aman-claude-code

Both live in the same ecosystem. Pick either, or both.

|  | **aman-claude-code** | **aman-copilot** |
|:---|:---|:---|
| **Target IDE** | Claude Code | VS Code + Copilot Chat |
| **Delivery** | `SessionStart` hook injects context into the prompt | Static `copilot-instructions.md`, auto-loaded |
| **Live tools** | `~/.claude.json` mcpServers | VS Code user-level `mcp.json` |
| **Slash commands** | `/identity`, `/rules`, `/eval`, … | `/identity`, `/rules`, `/eval`, `/remember`, `/session-narrative` (via prompt files) |
| **Scope** | `dev:plugin` | `dev:copilot` |
| **Install** | `claude plugin install aman-claude-code@aman` | `npx @aman_asmuei/aman-copilot init && install-mcp` |
| **Status** | Stable, 20 tests passing | v0.2.0 — parity with aman-claude-code |

**Running both?** They don't conflict. The shared layers (`acore`, `arules`, `amem`) are scope-aware — each plugin reads its own scope first, falls back to the other if unset. One identity, two adapters.

---

## Troubleshooting

<details>
<summary><b>Copilot doesn't seem to know my identity.</b></summary>

1. **Did you restart VS Code?** Instructions files are loaded on workspace open.
2. **Check the file exists:**
   ```bash
   cat .github/copilot-instructions.md | head -20
   ```
3. **Check Copilot is reading instructions files.** In VS Code settings, search for `github.copilot.chat.codeGeneration.useInstructionFiles` — it should be `true` (default).
4. **Are you in the right workspace?** Project-level instructions only apply when that project is open.

</details>

<details>
<summary><b>MCP tools (<code>identity_read</code>, <code>memory_store</code>) aren't available in Copilot Chat.</b></summary>

1. **Are you in Agent mode?** MCP tools only surface in Copilot Chat's *Agent* mode, not *Ask* or *Edit*. Toggle via the mode dropdown in the chat input.
2. **Did you restart VS Code** after running `install-mcp`? MCP servers load on startup.
3. **Check the config:**
   ```bash
   cat "$HOME/Library/Application Support/Code/User/mcp.json" | jq '.servers.aman, .servers["amem-memory"]'
   ```
4. **Check the server is reachable:**
   ```bash
   npx -y @aman_asmuei/aman-mcp@^0.6.0 --help
   ```
5. **View MCP logs** in VS Code: `Cmd+Shift+P` → *MCP: List Servers* → pick `aman` → *Show Output*.

</details>

<details>
<summary><b>The installer complained about malformed mcp.json.</b></summary>

The installer refuses to overwrite a file it can't parse as JSON — by design, to protect your other servers. Fix the JSON manually (or restore from backup), then re-run `install-mcp`.

</details>

<details>
<summary><b>I want Copilot to use a different identity from Claude Code.</b></summary>

Write a scope-specific identity file:

```bash
mkdir -p ~/.acore/dev/copilot
cp ~/.acore/dev/plugin/core.md ~/.acore/dev/copilot/core.md
# edit ~/.acore/dev/copilot/core.md to taste
aman-copilot init
```

The layer resolver prefers `dev/copilot` over `dev/plugin`, so Copilot gets the override and Claude Code is unaffected.

</details>

<details>
<summary><b>How do I uninstall everything?</b></summary>

```bash
npx @aman_asmuei/aman-copilot uninstall-mcp      # removes aman + amem from mcp.json
rm .github/copilot-instructions.md               # per-project, as needed
```

The shared ecosystem (`~/.acore`, `~/.arules`, `~/.amem`) is left alone — other tools use it. Only remove that if you're uninstalling the whole aman ecosystem.

</details>

---

## Memory 101 — getting the most out of amem

Your AI doesn't save everything automatically — it saves what you tell it to save, using natural language phrases the AI has been instructed to listen for. If you skip the phrases, memory silently fails.

**The 30-second version:**

```
SAVE:    "remember that X"          → fact
         "don't X" / "never X"      → correction (always wins)
         "we decided X"             → decision
         "I prefer X over Y"        → preference

RECALL:  "what do you remember about X"
         "check your memory for X"

SESSION: "save a session narrative"   ← ⭐ preserves the reasoning path
         "log this session"
         "what did we figure out?"

PRIVACY: wrap sensitive text in <private>...</private>
```

When you run `aman-copilot init`, this phrase catalog is embedded directly into the generated `.github/copilot-instructions.md`, so the AI has the contract in context on every conversation.

**The session narrative pattern** (⭐) is the most underused and most valuable. At the end of a substantial session, say *"save a session narrative"* — the AI writes a 300–500 word flowing-prose memory note covering what we tried, what worked, what didn't, what we decided, and why. Unlike scattered `memory_store` calls (which capture decisions), the narrative captures the **reasoning path** — the attempts, the dead ends, the pivot moments. Next session, `memory_recall` on that narrative returns the whole story. See the [session-narrative prompt file](#commands) for what `/session-narrative` does.

**Full guide:** [amem prompt best practices](https://github.com/amanasmuei/amem/blob/main/docs/guides/prompt-best-practices.md) — phrase catalog in depth, memory tiers, privacy, debugging, and the philosophy of curated memory over raw transcripts.

---

## Roadmap

- **v0.1** — init, install-mcp, uninstall-mcp. Cross-platform. Scope-aware.
- **v0.2** — **Parity pass.** Time-aware greeting, forced-freshness protocol, native slash commands (`/identity`, `/rules`, `/eval`, `/remember`) via prompt files, proactive memory protocol.
- **v0.3** — **Test hardening + npm publish.** 38 assertions across `init`, `install-mcp`, `uninstall-mcp`. Tag-driven CI/CD with OIDC provenance. Caught an unconditional amem-leak bug.
- **v0.3.1** — **Copilot CLI support.** `install-mcp --cli` / `--all` flags, targets `~/.copilot/mcp-config.json`. Preserves existing `amem` entries. 52 total test assertions.
- **v0.3.2** — **Scope seed pre-flight.** Installer-side workaround that copied `dev/plugin` → `dev/copilot`. Replaced in v0.4.0.
- **v0.4.0** — **Architectural cleanup.** Removed the scope seed workaround after `aman-core@0.3.0` + `acore-core@0.2.0` + `arules-core@0.2.0` shipped library-level scope inheritance. `install-mcp` no longer touches ecosystem files at all. Guarantees `aman-mcp@^0.6.2` via updated pins.
- **v0.4.1 (current)** — **Memory interface, not infrastructure.** New `/session-narrative` slash command for preserving the reasoning path of a session. Phrase catalog (save triggers, recall triggers, session closers) embedded in generated `copilot-instructions.md`. Memory 101 section in README. Full [prompt best practices guide](https://github.com/amanasmuei/amem/blob/main/docs/guides/prompt-best-practices.md) shipped in amem. 62 total test assertions.
- **v0.5** — VS Code extension wrapper with `@aman` chat participant for exact local time in greetings.
- **Future** — JetBrains support (once their MCP story matures), `aman-cursor` sibling.

See [CHANGELOG.md](CHANGELOG.md) for what's released.

---

## The Ecosystem

```
aman
├── acore        → identity    → who your AI IS
├── amem         → memory      → what your AI KNOWS
├── akit         → tools       → what your AI CAN DO
├── aflow        → workflows   → HOW your AI works
├── arules       → guardrails  → what your AI WON'T do
├── askill       → skills      → what your AI MASTERS
├── aeval        → evaluation  → how GOOD your AI is
├── achannel     → channels    → WHERE your AI lives
├── aman-mcp     → MCP server  → the bridge (31 tools)
├── aman-agent   → agent UI    → chat frontend w/ memory
├── aman-claude-code  → Claude Code integration
└── aman-copilot → VS Code + GitHub Copilot integration  ← YOU ARE HERE
```

| Layer | Package | What it does |
|:---|:---|:---|
| Identity | [acore](https://github.com/amanasmuei/acore) | Personality, values, relationship memory |
| Memory | [amem](https://github.com/amanasmuei/amem) | Persistent knowledge storage (MCP) |
| Guardrails | [arules](https://github.com/amanasmuei/arules) | Safety boundaries and permissions |
| MCP Server | [aman-mcp](https://github.com/amanasmuei/aman-mcp) | 31 MCP tools across all layers |
| Claude Code | [aman-claude-code](https://github.com/amanasmuei/aman-claude-code) | Claude Code integration |
| **VS Code** | **aman-copilot** | **GitHub Copilot Chat integration** |

---

## Contributing

Contributions welcome.

1. Open an issue before sending a PR for anything non-trivial.
2. Keep changes scope-aware — never break the `dev/copilot` → `dev/plugin` → legacy fallback chain.
3. **Run the tests:** `bash test/test.sh` — all 38 must pass.
4. Update [`CHANGELOG.md`](CHANGELOG.md) under the next unreleased version.

## License

[MIT](LICENSE)

---

<div align="center">

**One identity. Two IDEs. Zero duplication.**

<sub>Built with care as part of the <a href="https://github.com/amanasmuei/aman">aman ecosystem</a>.</sub>

</div>
