---
description: "Save a flowing-prose narrative of this session's reasoning path"
mode: "agent"
---

Write a **session narrative** that preserves the *reasoning path* of the current session, not just the facts. Scattered `memory_store` calls capture what we decided; a session narrative captures **how we got there** — the attempts, the dead ends, the pivot moments, the lessons.

## When to refuse

If the session has been trivial (pure implementation of an already-decided plan, or nothing surprising happened), tell the user the session isn't narrative-worthy and suggest scattered `memory_store` calls instead. Don't pad empty sessions into fake narratives.

## How to write it

**300–500 words of flowing prose.** Not a bullet list. Prose, because prose preserves causation ("because X, we tried Y") in a way bullets can't. Write as if telling a colleague who joins the project next week and asks "how did we end up here?"

Cover in order:

1. **Intent** — what were we trying to do at the start?
2. **Attempts** — what did we try, in chronological order?
3. **Dead ends** — what didn't work, and *why*? This is the most valuable part.
4. **Pivot moments** — when and why did we change direction?
5. **Outcome** — what shipped, what's still open
6. **Lessons** — one or two reusable insights (or "none — this was execution")

## How to save it

Call `memory_store` with:
- `type`: `fact` (amem doesn't have a dedicated narrative type yet — we use facts with clear metadata)
- `confidence`: `0.9`
- `content`: the 300–500 word narrative
- Prepend the content with a title line: `# Session narrative — <YYYY-MM-DD> — <short topic>`
- Include a metadata line at the top: `Type: session_narrative | Scope: <current scope> | Duration: <rough estimate>`

After storing, give the user a one-line confirmation plus the narrative's opening sentence so they can verify the right story was captured.

## Safety

- Wrap any sensitive values (tokens, URLs with embedded auth, file paths containing usernames you don't want persisted) in `<private>...</private>` — stripped before storage.
- If the user rejected a direction for reasons that were personal/contextual (e.g. "I was just tired"), keep the rejection in the narrative but frame it neutrally — memory outlives the mood that produced it.

## If the user wants edits

If they push back on the narrative ("you missed the part about X", "rewrite the lessons"), revise in place and re-save via `memory_patch` with the same key, not a second `memory_store`. Narratives should be singular per session, not duplicated.

Topic override (optional): ${input:topic:session topic in a few words, or leave blank for auto}
