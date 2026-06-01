# Prime

> Boot this build session. Read the context, then summarize your understanding before doing anything else.

## Read

- CLAUDE.md
- demo-spec.md

## Then summarize

1. **What we're building** — the demo, who it's for, and the one job it has to do on the call.
2. **The locked decisions** — channel, engine, model, lead-landing, stack, host (don't re-litigate these; they're settled).
3. **The hard constraints** — especially no-voice and "the AI never replaces the human sell."
4. **Where we are** — check git state and the filesystem. Which milestone (M0–M4) is done, which is next?
5. **Blockers** — call out anything in the "inputs needed" checklist that isn't satisfied yet (most importantly: is `ANTHROPIC_API_KEY` set in `.env.local`?).

End by stating the single next action and waiting for go.
