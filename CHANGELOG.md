# Changelog

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
