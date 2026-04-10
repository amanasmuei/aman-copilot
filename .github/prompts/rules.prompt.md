---
description: "Check, add, or list aman guardrails"
mode: "agent"
---

Use the `aman` MCP server to manage the user's guardrails (arules layer).

If the user is **asking whether an action is allowed** ("can I force-push", "is it ok to delete X"):
- Call `rules_check` with the proposed action. Relay the result plainly.

If the user is **adding a new rule** ("never force-push", "always ask before deleting"):
- Call `rules_add` with the rule text.
- Confirm back in one sentence.

If the user is **listing rules** ("what are my rules", "show me my guardrails"):
- Call `rules_list` and format as a bulleted list, grouped by category if the response supports it.

User's request: ${input:request:what rule question or change?}
