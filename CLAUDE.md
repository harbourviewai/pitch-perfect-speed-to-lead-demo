# Pitch Perfect — Speed-to-Lead Demo

A standalone Next.js app: a live, sandbox demo shown on the Pitch Perfect close call (buyer = Lance McKinney). It proves Harbourview AI can collapse their 7-day lead-response time to under a minute, and earns credibility in place of client references.

**This repo is the BUILD.** The agency command center (Harbourview AI OS, on `D:\`) holds the strategy, the proposal, and the source-of-truth spec. This repo is just the app. The full spec is copied here as [demo-spec.md](demo-spec.md) — read it first.

> **Sandbox proof, NOT production.** No real customer PII, no JobTread API write, no real SMS/email send, no persistence. Production is the paid Phase 1 build — do not build it here for free. The demo proves capability; it does not hand over the production system.

---

## What it is

A split-screen `/demo` page driven live on the call:
- **Left:** a Pitch Perfect–branded chat widget (like it'd sit on their site / catch a mysalesman.com quote lead). Lance plays the homeowner and types.
- **Right (ops view):** a lead card, an AI summary, and a JobTread-styled customer file that populate **in real time as he types**, plus a speed timer landing on "captured & filed in ~47s" vs. a struck-through "Today: ~7 days."

The trick: Claude runs the conversation **and** emits structured fields via a `capture_lead` tool call in the same streamed turn, so the chat (left) and the ops file (right) update a half-second apart — no separate extraction pass.

---

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Channel | Branded web **chat widget** | Justin's pick. Respects the no-voice constraint. |
| Engine | **Real Claude API** (not scripted) | The demo's job is credibility with zero references. Must handle Lance off-script + produce a real summary. |
| Model | **Sonnet 4.6** (`claude-sonnet-4-6`) | Best off-script handling. Haiku 4.5 (`claude-haiku-4-5-20251001`) is the latency fallback. |
| Lead landing | Lead card + AI summary + **mock JobTread file** | JobTread is their hub; Julie wants intake auto-creating JobTread files. |
| Framework | Next.js 16 App Router | Matches Justin's trades template; reuse tokens/patterns. |
| AI layer | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | Cleanest streaming + tool-calling; tool calls drive live UI. |
| Host | Vercel (personal account), auto-deploy from GitHub | Fastest path; single demo URL doesn't hit the commercial-use concern. |

---

## Hard constraints (from the 2026-05-22 discovery call)

- **No voice on first contact.** They sell on Lance being personable. Text/web-chat only — no TTS, no voice.
- **The AI must not replace the human sell.** The bot is a fast concierge: it captures, qualifies, and sets a "someone reaches out fast" expectation. It NEVER impersonates Lance, quotes a price, or closes.
- **Insurance-claim aware.** Roofing is mostly hail/insurance restoration — claim status is a first-class field; the flow branches roofing vs. remodel.
- **JobTread is the hub.** Lead lands as a JobTread-styled file (mocked here).
- **Catch mysalesman.com leads.** That quote tool produces hot leads ~July; frame the widget as catching a homeowner right after they pull a quote.

---

## Voice rules (for any user-facing copy)

- Premium, human, no-BS. Never corporate, never salesy, never generic.
- Lead with the homeowner's problem, not the tech.
- Warm and conversational in the chat bot. It mirrors the "we still take pride in our work" brand.
- **Never use long dashes (--).**

---

## Milestones

- **M0** — Scaffold Next.js 16 app, Anthropic key in env, deploy a hello-world to Vercel to lock the demo URL (de-risk hosting first).
- **M1** — `/api/chat` streaming route, intake system prompt, Sonnet 4.6. Working qualifying chat, no tools yet.
- **M2** — `capture_lead` tool + live Lead Card binding over the stream.
- **M3** — `finalize_lead` → AI summary; JobTread-styled file card; split-screen layout; Pitch Perfect branding (logo + colors from pitchperfectbuilds.com).
- **M4** — Speed timer + "7 days → 47s" contrast; photo-upload stub; tune for laptop/projector; record a clean happy-path walkthrough (GIF/video) as the live fallback.

See [demo-spec.md](demo-spec.md) §5 for the lead schema, §6 for conversation/system-prompt design, §8 for the on-call run-of-show.

---

## Inputs needed before / during build

- [ ] **Anthropic API key** → `.env.local` as `ANTHROPIC_API_KEY` (never commit; gitignore it). Required for the real engine.
- [ ] Confirm Vercel project name + that auto-deploy is wired from the GitHub repo.
- [ ] **Pitch Perfect brand assets** — logo + colors. Pull from pitchperfectbuilds.com if not supplied.
- [ ] Any qualification question Lance specifically cares about beyond the schema.
- [ ] Service-area list (Polk County + which surrounding counties) for the in-area check.

---

## Out of scope (protect the audit-first model)

Real JobTread API integration, real SMS/email dispatch, server-side persistence/DB, auth, multi-user, production error handling. All Phase 1 paid-build items.

---

## Conventions

- Git identity: `harbourviewai <info@harbourview.ai>` (matches the other HAI repos).
- GitHub: target repo `harbourviewai/pitch-perfect-speed-to-lead-demo` (private).
- Never commit secrets. `.env.local` is gitignored. Confirm before any commit or push.
- Pitch Perfect facts: Lance McKinney (owner, final buyer), Julie Evans (ops manager, champion). Two entities — Builds (construction/remodel) + Roofing (hail/insurance). Bolivar, MO. 100% residential B2C. Core problem = 7-day lead response on a referral-rich, work-saturated shop.
