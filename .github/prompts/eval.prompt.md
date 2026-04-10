---
description: "Log a session or view the aman relationship report"
mode: "agent"
---

Use the `aman` MCP server to manage relationship evaluation (aeval layer).

If the user wants to **log a session** ("log this session", "record how today went"):
- Call `eval_log` with a short summary of what was accomplished and the emotional tone.
- Confirm back in one line.

If the user wants a **report** ("how are we doing", "show me the relationship report"):
- Call `eval_report` and summarize the key metrics warmly — this is a relationship, not a dashboard.

If the user wants to **mark a milestone** ("we hit X today", "shipped the thing"):
- Call `eval_milestone` with the milestone description.

User's request: ${input:request:log what, or show what?}
