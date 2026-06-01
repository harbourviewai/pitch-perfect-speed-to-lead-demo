# Pitch Perfect — Speed-to-Lead Demo

A live, sandbox demo built for the Pitch Perfect close call. It proves Harbourview AI can collapse a 7-day lead-response time to under a minute.

A split-screen `/demo` page: on the left, a Pitch Perfect-branded chat widget where a homeowner types; on the right, an ops view where a structured lead card, an AI summary, and a mock JobTread file populate in real time as the conversation happens, with a timer landing on "captured and filed in ~47s" against a struck-through "Today: ~7 days."

The mechanism: Claude runs the conversation and emits structured fields via a `capture_lead` tool call in the same streamed turn, so the chat and the ops file update a half-second apart. No separate extraction pass.

> **Sandbox proof, not production.** No real customer PII, no JobTread API write, no real SMS or email send, no persistence. Production is the paid Phase 1 build.

## Stack

- Next.js 16 (App Router, Turbopack)
- Vercel AI SDK (`ai` v6) + `@ai-sdk/anthropic`
- Claude Sonnet 4.6 (`claude-sonnet-4-6`); Haiku 4.5 is the latency fallback
- Tailwind CSS v4
- Hosted on Vercel

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

The API key is server-side only. The browser never sees it; the `/api/chat` route is the only thing that talks to Anthropic.

## Environment

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Server-side Anthropic key. Required for the chat engine (M1+). |
| `ANTHROPIC_MODEL` | Conversation model. Defaults to `claude-sonnet-4-6`. |

`.env.local` is gitignored. Never commit secrets.

## Documentation

- [CLAUDE.md](CLAUDE.md) — working context, locked decisions, hard constraints.
- [demo-spec.md](demo-spec.md) — full build spec: lead schema, conversation design, run-of-show.
- [service-area.md](service-area.md) — Polk County and surrounding counties for the in-area check.

## Milestones

- **M0** — Scaffold + deploy stub to lock the demo URL. *(current)*
- **M1** — Streaming `/api/chat` conversation, Sonnet 4.6, intake system prompt.
- **M2** — `capture_lead` tool + live lead card.
- **M3** — `finalize_lead` summary + JobTread mock + split-screen + brand.
- **M4** — Speed timer, photo stub, polish, recorded fallback.
