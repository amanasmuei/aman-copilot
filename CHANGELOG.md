# Changelog

## 0.7.1 — 2026-04-22

### Changed
- **README refresh.** Updated Roadmap section to reflect v0.7 current
  (stale "v0.5 current" label). Added reliability callout under
  Wake-word briefing section noting the two-sided conditional shipped
  in v0.7.0 and the ~39% reduction on the rendered instructions file.
  Docs-only patch release so npm serves the updated README alongside
  the v0.7.0 behavior.

## 0.7.0 — 2026-04-22

Mirror of `aman-claude-code` v3.2.0-alpha.10's Tiered Session Manifest
restructure — applied to the Copilot `copilot-instructions.md` renderer.

### Changed
- **Tiered manifest restructure of `bin/init.mjs`.** Three prose blocks
  compressed aggressively while preserving every keyword the 86-assertion
  test suite verifies: Block A (wake-word briefing), Block B (tier-loader
  + archetype switch + day-to-day verbs), and the session-opening
  envelope (opening protocol + temporal modes + expression style).
  Measured reduction on a minimal-identity seed:
  **`copilot-instructions.md` 16827 → 10218 bytes (39% reduction)**
  per render. Fuller ecosystems with rules/amem installed will see
  proportionally larger absolute savings per session context.

### Fixed
- **Wake-word conditional is now two-sided.** Previously "if match,
  fire" prose got interpreted loosely — sometimes firing the Boot
  Protocol on task-containing first messages, sometimes failing on
  pure wake-word inputs. New conditional specifies both POSITIVE
  patterns (`arienz`, `hi Arienz`, `morning arienz`) AND explicit
  NEGATIVE patterns (`arienz, fix the login bug`, `Arienz what is
  the time`, `arienz run the tests`) with a hard "do NOT fire" clause.
- **Boot Protocol is now an explicit tool-call sequence.** The
  wake-word ritual was ~45 lines of descriptive prose; now it's a
  numbered 6-step sequence with concrete MCP tool calls
  (`identity_summary` → project context note → `memory_recall` →
  `reminder_check` → "suggestions pending" restatement → compose
  4–6 line briefing with Richness > brevity).
- **Test harness bug:** `fail()` now explicitly `return 0`, so
  `set -e` no longer aborts the run on the first failing assertion.

### Tests
+3 assertions (89 total, was 86) verifying the two-sided conditional:
explicit "do NOT fire" clause present, ≥3 distinct negative examples
(`fix the login bug`, `what is the time`, `run the tests`), tight
positive match phrasing (`your AI name alone`).

## 0.6.6 — 2026-04-21

### Fixed
- **Eliminated redundant tool calls on wake-word** — parity with
  `aman-claude-code` v3.2.0-alpha.9. The alpha.8 "Step 0 — call
  identity_summary" instruction caused Copilot to re-fetch identity
  data already in the instructions file. Removed.

### Changed
- **Memory protocol block trimmed** ~57 → ~25 lines. Kept load-bearing
  rules (when to store, when to recall, privacy, session close).
  Dropped verbose phrase tables (redundant with the "Day-to-day verbs"
  catalog elsewhere in the file), rules-of-engagement bullets, and
  tier-promotion notes.

### Tests
- Updated Test group 4b assertions to match the new signatures
  (`When to store`, `When to recall`, `memory_store`, `memory_recall`,
  `memory_summarize`, `Privacy:`). 86 total, was 85.

Re-run `npx @aman_asmuei/aman-copilot init` to embed the leaner
instructions file.

## 0.6.5 — 2026-04-21

### Fixed
- **Wake-word briefing now explicitly PRE-EMPTS the Session opening
  protocol.** Parity with `aman-claude-code` v3.2.0-alpha.8. Closes the
  same trigger-miss bug where Copilot would deliver the generic greeting
  instead of the richer briefing.
- **Step 0: call `identity_summary` or `identity_read`** MCP tool for
  canonical AI/user names before trigger matching. Robust to any
  core.md markdown variation.

### Added
- **Recent Sessions maintenance** instruction. Copilot appends a
  one-bullet session log to `core.md`'s `## Recent Sessions` section
  at session end (via `identity_update_section` MCP tool). Future
  briefings reference the log directly.

Re-run `npx @aman_asmuei/aman-copilot init` to embed the updated
briefing prose into your project's `copilot-instructions.md`.

### Tests
+3 assertions (85 total, was 82).

## 0.6.4 — 2026-04-21

### Changed
- **Wake-word briefing rewritten as a grounded memory-restoration ritual.**
  Parity with `aman-claude-code` v3.2.0-alpha.7. New briefing structure
  (4–8 lines, richness > brevity): memory-restoration acknowledgment,
  greeting with time anchor + user's name, project context from the
  embedded Project-context card, recent reasoning path from
  `memory_recall`, pending items from `reminder_check`, forward-looking
  prompt matched to the archetype.

### Fixed
- **Anti-confusion guardrail** up top — the Identity `name` is YOU
  (the AI), the Relationship `name` is the USER. Never greet the user by
  the AI's own name. Case-insensitive trigger so `arienz` / `Arienz` /
  `ARIENZ` all fire the briefing.

Re-run `npx @aman_asmuei/aman-copilot init` to embed the rewritten
briefing into your project's `copilot-instructions.md`.

### Tests
+3 assertions (82 total, was 80) verifying the memory-restoration ritual,
the "Who is who" guardrail, and the "Richness > brevity" directive are
present in the rendered instructions.

## 0.6.3 — 2026-04-21

### Added
- **Temporal behavior modes** in the rendered `copilot-instructions.md`:
  time-of-day now shapes Copilot's pacing, focus, and language throughout
  each chat — not just the greeting. Four modes (Morning / Afternoon /
  Evening / Late night) each with an energy level, focus area, and
  language register. Blends with the archetype.
- **Lightweight time-anchor directive** in the greeting instruction so
  Copilot grounds its opening line in a specific moment rather than
  floating time-of-day.
- **Expression style follows archetype**: emoji / formatting / emotional
  language are now explicitly archetype-driven. Warm archetypes
  (Collaborator, Mentor, Companion) get light emoji (❤️ 🌱 ✨ ☕ 🌙) and
  warmer language. Direct archetypes (Sparring Partner, Pragmatist,
  Architect) stay plain. Parity with `aman-claude-code` v3.2.0-alpha.6.

Re-run `npx @aman_asmuei/aman-copilot init` to embed the new blocks into
your project's `copilot-instructions.md`.

### Tests
+3 assertions (80 total, was 77) verifying Temporal behavior modes,
Expression style, and time-anchor directive are present in the rendered
instructions.

## 0.6.2 — 2026-04-21

### Added
- **Day-to-day operations verb catalog** embedded in
  `copilot-instructions.md`. Maps natural-language phrases to MCP tools
  on the `aman` server across all six layers:
  - acore: `identity_read`, `identity_update_section`, `identity_summary`
  - arules: `rules_add`, `rules_check`, `rules_list`, `rules_remove`
  - aeval: `eval_log`, `eval_report`, `eval_milestone`
  - aflow: `workflow_list`, `workflow_get`, `workflow_add`, `workflow_remove`
  - askill: `skill_list`, `skill_search`, `skill_install`, `skill_uninstall`
  - akit: `tools_list`, `tools_search`, `tools_add`, `tools_remove`

  Parity with `aman-claude-code` v3.2.0-alpha.5. No shell-out to CLIs for
  day-to-day operations — Copilot handles installs/listings/updates
  in-session via MCP.

Re-run `npx @aman_asmuei/aman-copilot init` to embed the new catalog into
your project's `copilot-instructions.md`.

### Tests
+2 assertions (77 total, was 75) verifying the catalog is present.

## 0.6.1 — 2026-04-21

### Added
- **In-session archetype switch** in Copilot Chat: saying `load archetype`
  (or variants like "switch to mentor") no longer shells out to the
  interactive `npx @aman_asmuei/acore customize` CLI (which doesn't work from
  inside Copilot Chat anyway). Copilot handles the change itself — asks
  which archetype, uses its file-edit tool or the `identity_update_section`
  MCP tool to replace Personality / Communication / Values lines in
  `core.md`, and shifts its own tone mid-conversation. Change persists for
  future Claude Code sessions immediately; Copilot workspace picks it up on
  next `aman-copilot init` re-render.

Parity with `aman-claude-code` v3.2.0-alpha.4 hook instruction.

Re-run `npx @aman_asmuei/aman-copilot init` to embed the new protocol into
your project's `copilot-instructions.md`.

### Tests
+2 assertions verifying the Archetype switch protocol and SHIFT YOUR OWN
TONE instruction are present in rendered `copilot-instructions.md` (75
total, was 73).

## 0.6.0 — 2026-04-21

### Added
- **Project context card**: `aman-copilot init` now resolves the
  current project root (git toplevel or `process.cwd()`) and embeds
  `$PROJECT_ROOT/.acore/context.md` as a "Project context" section in
  the rendered `.github/copilot-instructions.md`. Copilot Chat picks
  up project-local stack, domain, active topics, and recent decisions
  on every chat turn in that workspace.
- Uses `execFile` (argv-separated invocation, no shell spawned) for
  the `git rev-parse` call. No injection surface.

Re-run `npx @aman_asmuei/aman-copilot init` inside a project to pick
up the new embed. Silent no-op when no card is present.

See the design spec in the sibling repo at
`aman-plugin/docs/superpowers/specs/2026-04-21-project-context-card-design.md`.

## 0.5.0 — 2026-04-21

### Added
- `aman-copilot init` now renders two new sections into
  `.github/copilot-instructions.md`:
  - **Wake-word briefing**: when the user's first Copilot Chat message is just
    the AI's name, Copilot responds with a session briefing (memory_recall,
    reminder_check, suggestions line, then "what's next?") instead of diving
    into the task silently. Bullet 4 is Copilot-adapted — it references a
    "suggestions pending" line embedded earlier in the instructions file
    (Copilot has no `<aman-suggestion-notice>` hook tag).
  - **Tier upgrades — natural-language loaders**: catalog mapping
    `load rules`, `load workflows`, `load memory`, `load archetype`,
    `load tools`, `load skills`, `load eval`, `load identity` to the
    corresponding `npx @aman_asmuei/*` installer.

Parity with `aman-claude-code` v3.2.0-alpha.2. Re-run `aman-copilot init` after
upgrading to pick up both blocks.

See the design spec in the sibling repo at
`aman-plugin/docs/superpowers/specs/2026-04-21-wake-word-and-tier-loaders-design.md`.

### Known limitation
- `copilot-instructions.md` is rendered once at `init` time. If the user
  changes their AI's identity name later (e.g., via `acore customize`), the
  old name remains the Copilot wake-word until `aman-copilot init` is re-run.
  Not an issue on `aman-claude-code` — its session-start hook reads `core.md`
  fresh every session.

## 0.4.1 — 2026-04-09

**Memory interface, not memory infrastructure.** Realized that the "amem
doesn't auto-capture conversations" gap isn't an infrastructure problem
— it's a *documentation* problem. The tools already exist (60+ across
4 surfaces); what's missing is the Rosetta Stone mapping how users talk
to what the AI should save. This release closes that gap.

### Added
- **`/session-narrative` slash command** (new prompt file). At the end
  of a substantial session, say *"save a session narrative"* and the
  AI writes a 300–500 word flowing-prose memory note covering what we
  tried, what worked, what didn't, what we decided, and why. Preserves
  the **reasoning path**, not just the decisions. MemoryCore-inspired.
- **Phrase catalog embedded in `copilot-instructions.md`**. The
  generated instructions file now includes save triggers, recall
  triggers, session closers, rules of engagement, and a "when to
  promote to core tier" section. The AI has the contract in context
  on every conversation.
- **Memory 101 section** in the README linking to the full amem prompt
  best practices guide.
- **5 prompt files** generated by `init` (was 4): `/identity`,
  `/rules`, `/eval`, `/remember`, and the new `/session-narrative`.

### Tests
62/62 passing (was 55). Added 7 new assertions:
- 1 for the new `session-narrative.prompt.md` existence
- 1 for its YAML frontmatter well-formedness
- 5 for the phrase catalog ("Save triggers", "Recall triggers",
  "Session closers", "save a session narrative", "memory_tier")

Also updated test sandbox to simulate amem being installed (via
`mkdir -p $FAKE/.amem`) so the amem-gated sections are exercised.

### Cross-repo
Companion changes shipped in the same commit cluster:
- **amem**: new `docs/guides/prompt-best-practices.md` with the full
  phrase catalog, session narrative protocol, memory tiers, privacy,
  and debugging sections. The canonical source; both aman-copilot and
  aman-claude-code READMEs link to it.
- **aman-claude-code**: Memory 101 section added to the README (same
  content shape as aman-copilot's).

### Why session narratives matter
Scattered `memory_store` calls capture *what we decided*. They don't
capture *how we got there*. A session narrative is a single prose note
that preserves attempts, dead ends, pivot moments, and lessons — so
that a future session can understand not just the outcome but the
reasoning path that produced it. This is the MemoryCore-inspired
"Save-Diary-System" pattern, adapted to amem's philosophy of curated
memory over raw transcripts.

## 0.4.0 — 2026-04-09

**Architectural cleanup.** The installer-side scope seed workaround
from v0.3.2 is replaced by library-level scope inheritance in the
`aman-core` / `acore-core` / `arules-core` stack, shipped as
`aman-core@0.3.0` + `acore-core@0.2.0` + `arules-core@0.2.0` and
picked up by `aman-mcp@0.6.2`.

### Changed
- **Removed `seedCopilotScope()` pre-flight** from `install-mcp`.
  It was the right fix at the wrong layer — now that the core
  libraries handle scope inheritance transparently, `install-mcp`
  no longer touches `~/.acore/` or `~/.arules/` at all. It focuses
  on what it should always have been: writing MCP config.
- **Removed `--no-seed` flag** (no longer needed).
- **Removed `AMAN_COPILOT_FAKE_HOME` env var** (test-only, tied to
  the removed seed function).
- **Bumped `aman-mcp` pin** from `^0.6.0` to `^0.6.2` in both VS Code
  and Copilot CLI MCP entries. Every install now guarantees library-
  level scope inheritance.

### Why this is cleaner
The v0.3.2 workaround copied files between scopes. That created
drift risk: edit `dev:plugin`, and `dev:copilot` stayed stale as a
snapshot. The library-level fix has none of that — `dev:copilot`
transparently reads `dev:plugin` on every access, so updates are
always visible. One source of truth, no duplication, no drift.

### Upgrade path
No user action required. `npm` will pick up `aman-copilot@0.4.0` on
next install, and the new MCP pin will pull `aman-mcp@0.6.2` with
scope inheritance. Existing users who have leftover copies in
`~/.acore/dev/copilot/core.md` from v0.3.2's seed can optionally
`rm` them — the library will fall back to `dev:plugin` either way,
but removing the stale copies eliminates the drift risk for future
`dev:plugin` edits.

### Tests
55/55 passing (was 62). Removed 10 seed-related assertions; added
2 new ones confirming `install-mcp` does NOT touch ecosystem files
and pins `aman-mcp@^0.6.2`.

### Upstream releases in this chain
- `@aman_asmuei/aman-core@0.3.0` — new `fallbackChain` +
  `legacyPath` options on `MarkdownFileStorage`, plus
  `explainRead()` for diagnostics. Backward compatible.
- `@aman_asmuei/acore-core@0.2.0` — wires the default
  `dev:* → dev:plugin` policy for identity files.
- `@aman_asmuei/arules-core@0.2.0` — same policy for ruleset files.
- `@aman_asmuei/aman-mcp@0.6.2` — picks up all three library bumps;
  no API changes.

## 0.3.2 — 2026-04-09

Scope seed pre-flight. Caught by real-world testing on Copilot CLI: even
after v0.3.1 fixed the MCP config path, `aman-identity_read` returned
*"No identity configured"* because `aman-mcp` runs with
`AMAN_MCP_SCOPE=dev:copilot` and `acore-core` only falls back from the
new scope to the legacy flat path, not across to sibling scopes like
`dev:plugin`. So users who set up via `aman-plugin` (writing to
`~/.acore/dev/plugin/core.md`) would see an empty identity in Copilot.

### Added
- **`seedCopilotScope()` pre-flight in `install-mcp`** — before writing
  MCP config, ensures `~/.acore/dev/copilot/core.md` and
  `~/.arules/dev/copilot/rules.md` exist, copying from `dev/plugin` or
  the legacy flat path if they're missing. Idempotent: never overwrites
  existing files.
- **`--no-seed` flag** for advanced users who want to skip the seed step.
- **`AMAN_COPILOT_FAKE_HOME` env var** to sandbox HOME during tests.
- **10 new test assertions** (62 total, was 52) covering:
  - Seed from `dev/plugin` source
  - Fallback from `dev/plugin` to legacy flat path
  - Never-overwrite safety for existing `dev/copilot` files
  - Graceful handling when no ecosystem source exists
  - `--no-seed` flag behavior

### Why the installer does this
Crossing a layer boundary (aman-copilot writing to `~/.acore/`) is
defensible: `install-mcp` is the transition command that turns a
plugin-only user into a plugin+copilot user. The scope seed is a
migration, not data ownership. Future work (tracked for a later
session): fix `acore-core` and `arules-core` to support scope
inheritance chains at the library level, at which point this
installer-side workaround becomes redundant.

### Also fixed by this release
Complements `aman-mcp@0.6.1` (published separately), which removed the
`mammoth` dependency that was causing startup crashes on Node 25 due to
a broken `pako@1.0.11` tarball. The two fixes together deliver full
behavioral parity across Claude Code, VS Code Copilot Chat, and Copilot
CLI.

## 0.3.1 — 2026-04-09

Copilot CLI support. Caught by real-world testing: aman-copilot v0.3.0's
`install-mcp` only wrote to VS Code's `mcp.json`, not to Copilot CLI's
separate `~/.copilot/mcp-config.json`. Users of the standalone Copilot CLI
got the greeting protocol (from the plugin-system carry-over) but no live
`aman` MCP tools — `identity_read` was missing from the tool list.

### Added
- **`install-mcp --cli` flag** — writes to `~/.copilot/mcp-config.json`
  with the correct `mcpServers` key (Claude Code-style) and
  Copilot-CLI-compatible entry shape.
- **`install-mcp --all` flag** — writes to both VS Code and Copilot CLI
  targets in one call, for users who want parity everywhere.
- **`install-mcp --vscode` flag** — explicit opt-in for the default
  behavior (backwards compatible; bare `install-mcp` still means VS Code).
- **Matching `uninstall-mcp --cli` and `--all`** flags.
- **`AMAN_COPILOT_CLI_CONFIG` env var** to redirect the CLI target during
  tests (parallels `AMAN_COPILOT_VSCODE_USER_DIR`).
- **14 new test assertions** covering: fresh CLI config creation, key
  schema (`mcpServers` not `servers`), preservation of pre-existing
  `amem` entries (critical: users have `amem` from `npx @aman_asmuei/amem`
  that predates aman-copilot and must not be clobbered), `--all`
  dual-target, idempotency, and selective uninstall.

### Why `--cli` doesn't touch `amem-memory`
The VS Code target adds both `aman` and `amem-memory` because VS Code has
no other installer for amem. But Copilot CLI users typically already have
an `amem` entry from `npx @aman_asmuei/amem` (which works). Overwriting
it with a different name/shape (`amem-memory` + `@latest mcp` subcommand)
would clobber working config. The CLI target adds only `aman`.

### Test coverage
52 assertions total (was 38). `bash test/test.sh`.

## 0.3.0 — 2026-04-09

Test hardening. First CI-ready release.

### Added
- **Test suite** (`test/test.sh`) — 38 assertions across 12 test groups
  covering `init`, `install-mcp`, and `uninstall-mcp`. Uses the same
  `bash + jq` pattern as aman-plugin's test harness for consistency.
- **`AMAN_COPILOT_VSCODE_USER_DIR` env var** on both installers to redirect
  writes to a sandbox directory during tests — no risk of clobbering the
  real VS Code config when `npm test` runs.
- `npm test` script in `package.json`.

### Fixed
- **Unconditional amem protocol leak** (caught on first test run) — the
  Memory protocol section was being written even when `~/.amem/` did not
  exist. Now gated, matching aman-plugin's behavior of only surfacing amem
  guidance when amem is actually installed.

### Test coverage
- `init`: no-ecosystem exit, dev/copilot scope, prompt file generation,
  YAML frontmatter well-formedness, session opening protocol presence,
  scope cascade (`dev/copilot` → `dev/plugin` → legacy), amem gating.
- `install-mcp`: fresh-config creation, preservation of other servers and
  inputs array, idempotency, malformed JSON refusal.
- `uninstall-mcp`: selective removal, preservation, graceful handling of
  missing config.

## 0.2.0 — 2026-04-09

Parity pass with aman-plugin. Closes most of the behavioral gap without
requiring a VS Code extension or touching aman-mcp.

### Added
- **Session opening protocol** in `copilot-instructions.md` — time-aware
  greeting (morning/afternoon/evening/late-night), warm addressing by name,
  one-line spirit, 2–3 sentence cap. Mirrors aman-plugin's SessionStart hook
  behavior.
- **Forced freshness** — instructions direct the model to call `identity_read`
  and `memory_inject` at the start of every new conversation, so the live
  MCP state overrides the static snapshot. Solves the "stale identity after
  editing `~/.acore/core.md`" problem without a file-watcher.
- **Proactive memory protocol** — explicit corrections-are-absolute framing,
  classification guidance (correction/decision/fact), privacy tag reminder.
- **Prompt files (slash commands)** generated by `init`:
  - `/identity` — view or update aman identity
  - `/rules` — check, add, or list guardrails
  - `/eval` — log session or view relationship report
  - `/remember` — store something in amem
  These are native VS Code Copilot Chat slash commands — no extension needed.
- **Rules protocol** — instructions tell the model to call `rules_check`
  before risky actions, falling back to the static snapshot only if the
  live tool is unavailable.

### Fixed
- Prompt file YAML frontmatter uses double-quoted strings with proper
  escaping, so apostrophes in descriptions (`user's`) don't break parsing.

### Parity vs aman-plugin

| Feature | v0.1.0 | v0.2.0 |
|:---|:---:|:---:|
| Identity content loaded | ✅ | ✅ |
| Rules loaded | ✅ | ✅ |
| Shared amem memory | ✅ | ✅ |
| Live MCP tools | ✅ | ✅ |
| Warm time-aware greeting | ❌ | ✅ |
| Auto-fresh on identity change | ❌ | ✅ (forced `identity_read`) |
| Native slash commands | ❌ | ✅ (4 prompt files) |
| Proactive memory usage | ⚠️ | ✅ |

Remaining gaps: exact local time in greeting (model infers), and the
`@aman` chat participant (deferred to v0.3).

## 0.1.0 — 2026-04-09

Initial scaffold. Sibling to aman-plugin, brings the aman ecosystem into
GitHub Copilot Chat in VS Code.

### Added
- `aman-copilot init` — writes `.github/copilot-instructions.md` from acore +
  arules. Scope-aware: prefers `dev/copilot`, falls back to `dev/plugin`,
  then legacy single-tenant paths. Injects amem guidance when `~/.amem/`
  exists.
- `aman-copilot install-mcp` — registers `aman` and `amem-memory` MCP servers
  in VS Code's user-level `mcp.json`. Idempotent, preserves other servers,
  atomic writes. Cross-platform (macOS/Linux/Windows).
- `aman-copilot uninstall-mcp` — removes the aman entries, preserves others.
- Scope: `dev:copilot`.

### Not yet
- Tests
- VS Code extension with `@aman` chat participant
- npm publish
