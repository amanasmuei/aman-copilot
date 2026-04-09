#!/usr/bin/env bash
# Tests for aman-copilot — init, install-mcp, uninstall-mcp.
# Mirrors the aman-plugin test harness pattern.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INIT="$REPO_DIR/bin/init.mjs"
INSTALL="$REPO_DIR/bin/install-mcp.mjs"
UNINSTALL="$REPO_DIR/bin/uninstall-mcp.mjs"

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed (brew install jq)"
  exit 1
fi

PASS=0
FAIL=0
TOTAL=0

pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo "  ✗ $1"; [ -n "${2:-}" ] && echo "      $2"; }

# ---------- Helpers ----------

make_sandbox_home() {
  # Creates a throwaway HOME with an acore + arules ecosystem at a chosen scope.
  # Args: scope_dir ("dev/copilot" | "dev/plugin" | "" for legacy)
  local scope="$1"
  local tmp
  tmp=$(mktemp -d)
  local acore_dir="$tmp/.acore"
  local arules_dir="$tmp/.arules"
  if [ -n "$scope" ]; then
    mkdir -p "$acore_dir/$scope" "$arules_dir/$scope"
    echo "# test identity ($scope)" > "$acore_dir/$scope/core.md"
    echo "# test rules ($scope)" > "$arules_dir/$scope/rules.md"
  else
    mkdir -p "$acore_dir" "$arules_dir"
    echo "# test identity (legacy)" > "$acore_dir/core.md"
    echo "# test rules (legacy)" > "$arules_dir/rules.md"
  fi
  echo "$tmp"
}

cleanup_dirs=()
cleanup() {
  for d in "${cleanup_dirs[@]}"; do
    rm -rf "$d" 2>/dev/null || true
  done
}
trap cleanup EXIT

# ---------- Test 1: init fails with no ecosystem ----------
echo ""
echo "Test group 1: init — no ecosystem"
TMP=$(mktemp -d); cleanup_dirs+=("$TMP")
cd "$TMP"
if HOME="$TMP" node "$INIT" 2>/dev/null; then
  fail "init should exit non-zero when no ecosystem exists"
else
  pass "init exits non-zero when no ecosystem exists"
fi

# ---------- Test 2: init with dev/copilot scope ----------
echo ""
echo "Test group 2: init — dev/copilot scope"
FAKE=$(make_sandbox_home "dev/copilot"); cleanup_dirs+=("$FAKE")
WORK=$(mktemp -d); cleanup_dirs+=("$WORK")
cd "$WORK"
HOME="$FAKE" node "$INIT" >/dev/null

if [ -f "$WORK/.github/copilot-instructions.md" ]; then
  pass "writes .github/copilot-instructions.md"
else
  fail "copilot-instructions.md missing"
fi

if grep -q "dev/copilot" "$WORK/.github/copilot-instructions.md" 2>/dev/null; then
  pass "instructions include dev/copilot content"
else
  fail "instructions missing dev/copilot content"
fi

for p in identity rules eval remember; do
  if [ -f "$WORK/.github/prompts/$p.prompt.md" ]; then
    pass "writes prompt file: $p.prompt.md"
  else
    fail "missing prompt file: $p.prompt.md"
  fi
done

# ---------- Test 3: prompt file YAML is parseable ----------
echo ""
echo "Test group 3: prompt file YAML"
for p in identity rules eval remember; do
  f="$WORK/.github/prompts/$p.prompt.md"
  # Extract frontmatter between first two --- lines
  if awk '/^---$/{c++; next} c==1' "$f" | node -e '
    let d = ""; process.stdin.on("data", c => d += c).on("end", () => {
      for (const line of d.split("\n")) {
        if (!line.trim()) continue;
        if (!/^[a-z_]+:\s*"/.test(line)) { process.exit(1); }
      }
    });' 2>/dev/null; then
    pass "$p.prompt.md frontmatter is well-formed (double-quoted)"
  else
    fail "$p.prompt.md frontmatter is malformed"
  fi
done

# ---------- Test 4: session opening protocol present ----------
echo ""
echo "Test group 4: session opening protocol"
INSTR="$WORK/.github/copilot-instructions.md"
for phrase in "session opening protocol" "identity_read" "memory_inject" "morning energy" "afternoon steadiness" "evening warmth" "late-night care" "one short line of spirit"; do
  if grep -qi "$phrase" "$INSTR"; then
    pass "instructions contain: \"$phrase\""
  else
    fail "instructions missing: \"$phrase\""
  fi
done

# ---------- Test 5: scope cascade — copilot > plugin > legacy ----------
echo ""
echo "Test group 5: scope cascade"
FAKE2=$(mktemp -d); cleanup_dirs+=("$FAKE2")
mkdir -p "$FAKE2/.acore/dev/plugin" "$FAKE2/.acore/dev/copilot" "$FAKE2/.acore"
echo "CORE_COPILOT_SCOPE" > "$FAKE2/.acore/dev/copilot/core.md"
echo "CORE_PLUGIN_SCOPE"  > "$FAKE2/.acore/dev/plugin/core.md"
echo "CORE_LEGACY_SCOPE"  > "$FAKE2/.acore/core.md"
mkdir -p "$FAKE2/.arules"
echo "# rules" > "$FAKE2/.arules/rules.md"

WORK2=$(mktemp -d); cleanup_dirs+=("$WORK2")
cd "$WORK2"
HOME="$FAKE2" node "$INIT" >/dev/null
if grep -q "CORE_COPILOT_SCOPE" "$WORK2/.github/copilot-instructions.md"; then
  pass "prefers dev/copilot over dev/plugin and legacy"
else
  fail "did not prefer dev/copilot scope"
fi

# Now remove copilot scope, should fall back to plugin
rm -rf "$FAKE2/.acore/dev/copilot"
rm -rf "$WORK2/.github"
HOME="$FAKE2" node "$INIT" >/dev/null
if grep -q "CORE_PLUGIN_SCOPE" "$WORK2/.github/copilot-instructions.md"; then
  pass "falls back from dev/copilot to dev/plugin"
else
  fail "did not fall back to dev/plugin"
fi

# Remove plugin scope, should fall back to legacy
rm -rf "$FAKE2/.acore/dev"
rm -rf "$WORK2/.github"
HOME="$FAKE2" node "$INIT" >/dev/null
if grep -q "CORE_LEGACY_SCOPE" "$WORK2/.github/copilot-instructions.md"; then
  pass "falls back from dev/plugin to legacy"
else
  fail "did not fall back to legacy"
fi

# ---------- Test 6: amem guidance gated on ~/.amem existence ----------
echo ""
echo "Test group 6: amem guidance gating"
FAKE3=$(make_sandbox_home "dev/plugin"); cleanup_dirs+=("$FAKE3")
WORK3=$(mktemp -d); cleanup_dirs+=("$WORK3")
cd "$WORK3"
HOME="$FAKE3" node "$INIT" >/dev/null
if grep -q "amem-memory" "$WORK3/.github/copilot-instructions.md"; then
  fail "amem guidance leaked without ~/.amem present"
else
  pass "amem guidance NOT injected when ~/.amem missing"
fi

mkdir -p "$FAKE3/.amem"
rm -rf "$WORK3/.github"
HOME="$FAKE3" node "$INIT" >/dev/null
if grep -q "amem-memory" "$WORK3/.github/copilot-instructions.md"; then
  pass "amem guidance IS injected when ~/.amem exists"
else
  fail "amem guidance missing when ~/.amem exists"
fi

# ---------- Test 7: install-mcp creates fresh config ----------
echo ""
echo "Test group 7: install-mcp — fresh config"
SBOX=$(mktemp -d); cleanup_dirs+=("$SBOX")
AMAN_COPILOT_VSCODE_USER_DIR="$SBOX" node "$INSTALL" >/dev/null
CFG="$SBOX/mcp.json"
if [ -f "$CFG" ]; then
  pass "install-mcp creates mcp.json when missing"
else
  fail "mcp.json not created"
fi
if jq -e '.servers.aman.env.AMAN_MCP_SCOPE == "dev:copilot"' "$CFG" >/dev/null; then
  pass "aman server has scope dev:copilot"
else
  fail "aman server scope wrong or missing"
fi
if jq -e '.servers["amem-memory"]' "$CFG" >/dev/null; then
  pass "amem-memory server registered"
else
  fail "amem-memory server missing"
fi

# ---------- Test 8: install-mcp preserves other servers and inputs ----------
echo ""
echo "Test group 8: install-mcp — preservation"
SBOX2=$(mktemp -d); cleanup_dirs+=("$SBOX2")
cat > "$SBOX2/mcp.json" <<'EOF'
{
  "servers": {
    "other-server": {
      "command": "other-cmd",
      "args": ["x"],
      "env": {"FOO": "BAR"}
    }
  },
  "inputs": [
    {"id": "token", "type": "promptString", "description": "API token", "password": true}
  ]
}
EOF
AMAN_COPILOT_VSCODE_USER_DIR="$SBOX2" node "$INSTALL" >/dev/null
CFG2="$SBOX2/mcp.json"

if jq -e '.servers["other-server"].command == "other-cmd"' "$CFG2" >/dev/null; then
  pass "other server preserved unchanged"
else
  fail "other server was clobbered"
fi
if jq -e '.inputs[0].id == "token"' "$CFG2" >/dev/null; then
  pass "inputs array preserved"
else
  fail "inputs array lost"
fi
if [ "$(jq '.servers | length' "$CFG2")" = "3" ]; then
  pass "server count went from 1 to 3 (added aman + amem-memory)"
else
  fail "unexpected server count"
fi

# ---------- Test 9: install-mcp is idempotent ----------
echo ""
echo "Test group 9: install-mcp — idempotency"
BEFORE=$(jq -S . "$CFG2")
AMAN_COPILOT_VSCODE_USER_DIR="$SBOX2" node "$INSTALL" >/dev/null
AFTER=$(jq -S . "$CFG2")
if [ "$BEFORE" = "$AFTER" ]; then
  pass "re-running install-mcp produces identical output"
else
  fail "install-mcp is not idempotent"
fi

# ---------- Test 10: install-mcp refuses malformed JSON ----------
echo ""
echo "Test group 10: install-mcp — malformed JSON"
SBOX3=$(mktemp -d); cleanup_dirs+=("$SBOX3")
echo "{not valid json" > "$SBOX3/mcp.json"
if AMAN_COPILOT_VSCODE_USER_DIR="$SBOX3" node "$INSTALL" >/dev/null 2>&1; then
  fail "install-mcp should refuse to overwrite malformed JSON"
else
  pass "install-mcp refuses malformed JSON (exits non-zero)"
fi
# And the malformed file must be left untouched
if grep -q "not valid json" "$SBOX3/mcp.json"; then
  pass "malformed mcp.json left untouched"
else
  fail "malformed mcp.json was overwritten"
fi

# ---------- Test 11: uninstall-mcp removes only aman entries ----------
echo ""
echo "Test group 11: uninstall-mcp"
AMAN_COPILOT_VSCODE_USER_DIR="$SBOX2" node "$UNINSTALL" >/dev/null
if jq -e '.servers["other-server"].command == "other-cmd"' "$CFG2" >/dev/null; then
  pass "uninstall preserved other-server"
else
  fail "uninstall clobbered other-server"
fi
if jq -e '.servers.aman' "$CFG2" >/dev/null 2>&1; then
  fail "uninstall did not remove aman entry"
else
  pass "uninstall removed aman entry"
fi
if jq -e '.servers["amem-memory"]' "$CFG2" >/dev/null 2>&1; then
  fail "uninstall did not remove amem-memory entry"
else
  pass "uninstall removed amem-memory entry"
fi
if jq -e '.inputs[0].id == "token"' "$CFG2" >/dev/null; then
  pass "uninstall preserved inputs array"
else
  fail "uninstall lost inputs array"
fi

# ---------- Test 12: uninstall-mcp handles missing mcp.json ----------
echo ""
echo "Test group 12: uninstall-mcp — missing file"
SBOX4=$(mktemp -d); cleanup_dirs+=("$SBOX4")
if AMAN_COPILOT_VSCODE_USER_DIR="$SBOX4" node "$UNINSTALL" >/dev/null 2>&1; then
  pass "uninstall handles missing mcp.json gracefully"
else
  fail "uninstall crashed on missing mcp.json"
fi

# ---------- Test 13: install-mcp --cli creates Copilot CLI config ----------
echo ""
echo "Test group 13: install-mcp --cli — Copilot CLI fresh config"
CLI_SBOX=$(mktemp -d); cleanup_dirs+=("$CLI_SBOX")
CLI_CFG="$CLI_SBOX/mcp-config.json"
AMAN_COPILOT_CLI_CONFIG="$CLI_CFG" node "$INSTALL" --cli >/dev/null
if [ -f "$CLI_CFG" ]; then
  pass "install --cli creates mcp-config.json when missing"
else
  fail "mcp-config.json not created"
fi
if jq -e '.mcpServers.aman.command == "npx"' "$CLI_CFG" >/dev/null; then
  pass "CLI config uses mcpServers key (not servers)"
else
  fail "CLI config uses wrong top-level key"
fi
if jq -e '.mcpServers.aman.env.AMAN_MCP_SCOPE == "dev:copilot"' "$CLI_CFG" >/dev/null; then
  pass "CLI aman entry has scope dev:copilot"
else
  fail "CLI aman scope wrong"
fi
# Importantly: --cli should NOT add amem-memory (preserves existing amem config)
if jq -e '.mcpServers["amem-memory"]' "$CLI_CFG" >/dev/null 2>&1; then
  fail "--cli should NOT add amem-memory (would clobber existing amem setups)"
else
  pass "--cli correctly skips amem-memory entry"
fi

# ---------- Test 14: install-mcp --cli preserves existing amem entry ----------
echo ""
echo "Test group 14: install-mcp --cli — preserves existing servers"
CLI_SBOX2=$(mktemp -d); cleanup_dirs+=("$CLI_SBOX2")
CLI_CFG2="$CLI_SBOX2/mcp-config.json"
cat > "$CLI_CFG2" <<'EOF'
{
  "mcpServers": {
    "amem": {
      "command": "npx",
      "args": ["-y", "@aman_asmuei/amem"]
    },
    "some-other": {
      "command": "some-other-cmd",
      "args": []
    }
  }
}
EOF
AMAN_COPILOT_CLI_CONFIG="$CLI_CFG2" node "$INSTALL" --cli >/dev/null

if jq -e '.mcpServers.amem.command == "npx"' "$CLI_CFG2" >/dev/null; then
  pass "existing amem entry preserved untouched"
else
  fail "existing amem entry was clobbered"
fi
if jq -e '.mcpServers["some-other"].command == "some-other-cmd"' "$CLI_CFG2" >/dev/null; then
  pass "other servers preserved"
else
  fail "other servers clobbered"
fi
if jq -e '.mcpServers.aman.command == "npx"' "$CLI_CFG2" >/dev/null; then
  pass "aman entry added alongside existing servers"
else
  fail "aman entry not added"
fi
if [ "$(jq '.mcpServers | length' "$CLI_CFG2")" = "3" ]; then
  pass "server count went from 2 to 3 (added aman only)"
else
  fail "unexpected server count"
fi

# ---------- Test 15: install-mcp --cli is idempotent ----------
echo ""
echo "Test group 15: install-mcp --cli — idempotency"
BEFORE_CLI=$(jq -S . "$CLI_CFG2")
AMAN_COPILOT_CLI_CONFIG="$CLI_CFG2" node "$INSTALL" --cli >/dev/null
AFTER_CLI=$(jq -S . "$CLI_CFG2")
if [ "$BEFORE_CLI" = "$AFTER_CLI" ]; then
  pass "re-running install --cli produces identical output"
else
  fail "install --cli is not idempotent"
fi

# ---------- Test 16: install-mcp --all writes to both targets ----------
echo ""
echo "Test group 16: install-mcp --all — both targets"
VSC_SBOX=$(mktemp -d); cleanup_dirs+=("$VSC_SBOX")
CLI_SBOX3=$(mktemp -d); cleanup_dirs+=("$CLI_SBOX3")
CLI_CFG3="$CLI_SBOX3/mcp-config.json"
AMAN_COPILOT_VSCODE_USER_DIR="$VSC_SBOX" \
AMAN_COPILOT_CLI_CONFIG="$CLI_CFG3" \
  node "$INSTALL" --all >/dev/null

if jq -e '.servers.aman' "$VSC_SBOX/mcp.json" >/dev/null; then
  pass "--all wrote to VS Code mcp.json"
else
  fail "--all missed VS Code target"
fi
if jq -e '.mcpServers.aman' "$CLI_CFG3" >/dev/null; then
  pass "--all wrote to Copilot CLI mcp-config.json"
else
  fail "--all missed Copilot CLI target"
fi

# ---------- Test 17: uninstall-mcp --cli removes only aman, preserves amem ----------
echo ""
echo "Test group 17: uninstall-mcp --cli"
AMAN_COPILOT_CLI_CONFIG="$CLI_CFG2" node "$UNINSTALL" --cli >/dev/null
if jq -e '.mcpServers.amem.command == "npx"' "$CLI_CFG2" >/dev/null; then
  pass "uninstall --cli preserved existing amem"
else
  fail "uninstall --cli removed amem (should not)"
fi
if jq -e '.mcpServers.aman' "$CLI_CFG2" >/dev/null 2>&1; then
  fail "uninstall --cli did not remove aman"
else
  pass "uninstall --cli removed aman"
fi
if jq -e '.mcpServers["some-other"]' "$CLI_CFG2" >/dev/null; then
  pass "uninstall --cli preserved other servers"
else
  fail "uninstall --cli clobbered other servers"
fi

# ---------- Summary ----------
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
