---
description: "View or update the user's aman identity"
mode: "agent"
---

Use the `aman` MCP server to manage the user's identity (acore layer).

If the user's request is a **question** ("who am I", "what do you know about me", "what's my role"):
- Call `identity_read` and summarize the relevant sections.

If the user's request is an **update** ("change my personality to…", "add a preference…", "update my role…"):
- Call `identity_update_section` with the section name and new content.
- Confirm the change back to the user in one sentence.

If unclear, call `identity_summary` first and ask what they want to change.

User's request: ${input:request:what do you want to know or change?}
