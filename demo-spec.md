# Speed-to-Lead Demo — Build Spec

**Client:** Pitch Perfect Builds / Pitch Perfect Roofing (Bolivar, MO)
**Purpose:** Live, sandbox demo shown on the Lance close call. Proves Harbourview can collapse their 7-day lead response time to under a minute, and earns credibility in place of client references.
**Status:** Spec — not yet built.
**Created:** 2026-06-01

> This is a **sandbox proof, not the production system.** No real customer PII, no JobTread API write, no real SMS/email send, no persistence. Production is the paid Phase 1 build. Keep that line clean — the demo shows capability, it does not hand over free production work.

---

## 1. What this demo has to do

Make Lance *feel* the gap between "a lead waits 7 days" and "a lead is captured, qualified, summarized, and filed in under a minute" — without breaking their hard constraints.

The money shot: a **split screen**. Left = a Pitch Perfect-branded chat widget like it'd sit on their site (and catch mysalesman.com quote leads). Right = the ops view, where a structured lead card + an AI summary + a JobTread-styled customer file populate **in real time as Lance types**. A visible timer counts the seconds. At the end: "Lead captured & filed in 47 seconds" next to a struck-through "Today: ~7 days."

Have **Lance** type, not Justin. Him driving it is the close.

---

## 2. Hard constraints (from the 2026-05-22 discovery call)

| Constraint | Why | Spec impact |
|---|---|---|
| **No voice on first contact** | They sell on Lance being personable/human. Voice AI on intake undercuts the brand. | Text/web-chat only. The widget is the channel. No TTS, no voice. |
| **The AI must not replace the human sell** | Same reason. | The bot is a fast concierge: it captures + qualifies + sets a "someone reaches out fast" expectation. It never pretends to be Lance, never quotes price, never closes. |
| **Insurance-claim awareness** | Roofing is mostly hail/insurance restoration. | Claim status is a first-class qualification field, and the bot adapts its flow for roofing vs. remodel. |
| **JobTread is the hub** | Julie wants intake auto-creating JobTread customer files. | The lead lands as a JobTread-styled file (mocked for the demo). |
| **Catch mysalesman.com leads** | That quote tool produces hot leads ~July; "if you're not responding for 7 days you might as well not use it." | Frame the widget as the thing that catches a homeowner right after they pull a quote. |

---

## 3. Decisions (locked)

- **Channel:** Branded web chat widget. *(Justin's pick.)*
- **Engine:** Real Claude API — genuinely AI-driven qualification + real conversation summary. Credibility > safety here; a scripted recording is the fallback, not the demo.
- **Lead landing:** Lead card + AI summary + mock JobTread customer file, all live-updating.
- **Model:** Claude **Sonnet 4.6** (`claude-sonnet-4-6`) for the conversation — best off-script handling, which is the entire reason we chose a real LLM. Haiku 4.5 (`claude-haiku-4-5-20251001`) is the fallback if latency feels off, but streaming should make Sonnet feel instant.
- **Framework:** Next.js 16 App Router (Justin already runs this in the trades template — reuse tokens/patterns).
- **AI layer:** Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) — cleanest streaming + tool-calling in Next.js, drives live UI updates from tool calls.
- **Host:** Vercel (personal account) for the demo URL — fastest path, and a single sales-demo URL doesn't hit the commercial-use concern that applies to scaled $500 client sites. Cloudflare Pages is the alt if Justin prefers; slightly more setup for streaming.

---

## 4. Architecture

```
Browser — Next.js client (split-screen /demo page)
│
├─ LEFT: Chat widget (Pitch Perfect branded, homeowner-facing)
│     └─ POST /api/chat  (streaming)
│           • Claude Sonnet 4.6 via AI SDK
│           • system prompt = intake-concierge persona + qualification goals + guardrails
│           • tool: capture_lead(fields)   ← model calls this as it extracts each field
│           • tool: finalize_lead(summary, routing)  ← called at handoff
│
└─ RIGHT: Ops view (updates live from tool calls over the stream)
      ├─ Lead Card        (fills field-by-field as capture_lead fires)
      ├─ AI Summary       (rendered when finalize_lead fires)
      ├─ JobTread file    (mock card: "✓ Auto-created in JobTread", populated from the lead)
      └─ Speed timer      (starts on first homeowner message, stops on finalize_lead)
```

The elegant part: the model **runs the conversation and emits structured data via tool calls in the same turn.** Each `capture_lead` call streams a field to the right panel, so the homeowner watching the chat and the "ops team" watching the file are looking at the same event a half-second apart. No separate extraction pass.

**Key principle:** API key lives server-side only (env var). The browser never sees it. The `/api/chat` route is the only thing that talks to Anthropic.

---

## 5. Lead schema (what `capture_lead` populates)

| Field | Notes |
|---|---|
| `name` | Homeowner name |
| `phone` | Primary contact — required |
| `email` | Optional |
| `address` / `city` | Drives the Polk-County-and-surrounding service-area check |
| `project_type` | `roofing` \| `remodel` — routes to the correct entity |
| `insurance_claim` | `yes` \| `no` \| `unsure` — critical for roofing/hail |
| `scope` | Short free-text ("hail damage to roof", "kitchen remodel") |
| `urgency` | `emergency` \| `this_week` \| `this_month` \| `planning` |
| `photos` | Optional upload — stub for the demo (shows a thumbnail; no real storage) |
| `preferred_contact_time` | Optional |
| `summary` | AI-generated 2-3 sentence summary (from `finalize_lead`) |
| `routing` | Which entity + suggested next step ("Roofing — Lance to call re: claim") |

Keep the conversation to ~4-6 exchanges. Fast concierge, not an interrogation.

---

## 6. Conversation design (system prompt principles)

The bot is **"Pitch Perfect's intake concierge."** Its job is to make a homeowner feel heard and get the details ready so the team can reach out fast — *not* to be Lance, sell, or quote.

- Warm, human, plain-spoken. Mirrors the "we still take pride in our work" brand. Never robotic, never corporate.
- Opens by acknowledging the homeowner's actual problem before asking anything.
- **Roofing branch:** ask insurance-claim status early; offer emergency tarp framing if they say storm/leak; invite damage photos.
- **Remodel branch:** ask scope + rough vision; invite idea photos (kitchen/bath).
- Always captures name + phone + address before closing out.
- Closes with a clear handoff + time expectation: "I've got everything the team needs — someone from Pitch Perfect will reach out within [X]. You're all set." Never invents a price or a firm appointment time.
- Guardrails: if asked for a quote → "I'll have [Lance/the team] get you an exact number — I don't want to guess on your home." If asked "are you a bot/AI" → honest, light, reassuring ("I'm Pitch Perfect's assistant — I'm just here to get your details to the team fast so you're not waiting days").

`finalize_lead` produces the summary in the team's voice: 2-3 sentences a human can read in 5 seconds and know exactly what to do.

---

## 7. Build milestones

- **M0 — Scaffold + deploy a stub.** Next.js 16 app, Anthropic key in env, deploy hello-world to Vercel to lock the demo URL. *(De-risk hosting before building on it.)*
- **M1 — Streaming conversation.** `/api/chat` route, intake system prompt, Sonnet 4.6 streaming. A working qualifying chat, no tools yet.
- **M2 — Structured capture.** `capture_lead` tool + live Lead Card binding over the stream.
- **M3 — Summary + JobTread mock + split-screen.** `finalize_lead` → AI summary; JobTread-styled file card; split-screen layout; Pitch Perfect branding (logo + colors pulled from pitchperfectbuilds.com).
- **M4 — Polish + safety net.** Speed timer + "7 days → 47 seconds" contrast; photo-upload stub; tune for laptop/projector; **record a clean happy-path walkthrough (GIF/video) as the live fallback.**

---

## 8. Run-of-show for the call (talk track)

1. Frame it: "Right now a lead waits about a week. Here's what it looks like if it waits under a minute. Lance — you be the homeowner. You just pulled a roof quote on the site and you've got hail damage."
2. Hand Lance the keyboard. Let him type naturally, even off-script — that's the point.
3. As the right panel fills, narrate it: "See that? Name, your number, it already knows it's an insurance claim, it's flagged urgent, and it just opened a customer file in JobTread. Nobody touched it."
4. Land the timer: "Forty-seven seconds. That same lead is sitting in your inbox for seven days today."
5. Bridge to the proposal: "That's Phase 1. This is a sandbox — the real one writes to your actual JobTread, fires the text and email, and routes roofing vs. remodel automatically."

**If the API hiccups live:** switch to the recorded walkthrough without missing a beat — "let me show you the clean run I recorded earlier." Never debug on screen.

---

## 9. Inputs needed from Justin before build

- [ ] **Anthropic API key** → add to `.env` (currently only a GitHub token is there). Required for the real-engine path.
- [ ] Confirm **Vercel** (vs. Cloudflare Pages) for the demo URL.
- [ ] **Pitch Perfect brand assets** — logo + colors. I can pull these from pitchperfectbuilds.com if you'd rather not source them.
- [ ] Any **qualification question Lance specifically cares about** that isn't in the schema above.
- [ ] Confirm the **service-area list** for the in-area / out-of-area check (Polk County + which surrounding counties).

## 10. Out of scope (protect the audit-first model)

- Real JobTread API integration (mock card only).
- Real SMS/email dispatch.
- Server-side persistence / a real database.
- Auth, multi-user, production error handling.

These are Phase 1 paid-build items. The demo proves they're trivial for us to do — it does not do them for free.

---

## 11. Cost & risk

- **Cost:** trivial — a few cents of Sonnet 4.6 usage for the entire build + demo. Vercel hobby is free.
- **Risks & mitigations:**
  - *Live API failure* → recorded fallback (M4); run off the deployed URL, test it an hour before the call.
  - *Latency feels slow* → streaming (first token fast); Haiku 4.5 as a drop-in if needed.
  - *Bot drifts off-brand / impersonates Lance* → tight system prompt + the guardrails in §6.
  - *Scope creep into production* → §10 is the fence. Sandbox only.
