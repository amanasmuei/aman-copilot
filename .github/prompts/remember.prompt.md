---
description: "Store something in amem persistent memory"
mode: "agent"
---

Use the `amem-memory` MCP server to store something the user wants remembered across sessions.

Classify the content:
- If it's a **correction** or **constraint** ("don't do X", "never Y"): `type=correction`, `confidence=1.0`.
- If it's a **decision** ("we chose X", "let's go with Y"): `type=decision`, `confidence=0.9`.
- If it's a **preference** or **fact** about the user: `type=fact`, `confidence=0.8`.

Call `memory_store` with the classified type. Wrap any sensitive text in `<private>...</private>` before storing.

Confirm back in one line: what was stored, and as which type.

What to remember: ${input:content:what should I remember?}
