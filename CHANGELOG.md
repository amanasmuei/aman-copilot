# Changelog

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
