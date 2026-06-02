import type { UIMessage } from "ai";

/**
 * The scripted happy-path run, used as the live fallback. It plays through the
 * real UI via setMessages, so it exercises the same chat rendering, the same
 * lead derivation, and the same timer as a live conversation. No API call, no
 * network: if the live engine hiccups on the call, this runs identically.
 *
 * Each step is a message to append plus how long to wait before showing it,
 * tuned so the conversation feels naturally paced (homeowner types, assistant
 * "thinks," details pop into the JobTread file).
 *
 * The tool parts carry the same shape the live stream produces, so deriveLead /
 * deriveFinalized fill the file exactly as they would for a real lead.
 */
export interface ReplayStep {
  delayMs: number;
  message: UIMessage;
}

// Small helpers to build messages that match the live UIMessage shape.
let seq = 0;
function user(text: string): UIMessage {
  return { id: `replay-u-${seq++}`, role: "user", parts: [{ type: "text", text }] };
}
function assistant(text: string, tools: Array<Record<string, unknown>> = []): UIMessage {
  const toolParts = tools.map((input, i) => ({
    type: input.__tool as string,
    toolCallId: `replay-t-${seq}-${i}`,
    state: "output-available",
    input: stripMeta(input),
    output: { ok: true },
  }));
  return {
    id: `replay-a-${seq++}`,
    role: "assistant",
    parts: [{ type: "text", text }, ...toolParts] as UIMessage["parts"],
  } as UIMessage;
}
function stripMeta(o: Record<string, unknown>) {
  const { __tool, ...rest } = o;
  void __tool;
  return rest;
}

export const REPLAY_SCRIPT: ReplayStep[] = [
  {
    delayMs: 900,
    message: user("hey, we got slammed by hail last week and now the roof is leaking into our upstairs bedroom"),
  },
  {
    delayMs: 1600,
    message: assistant(
      "Oh no, an active leak upstairs is no fun, that can do real damage fast. You are in the right place. The team handles hail and storm damage all the time and can talk through getting a tarp up quickly to stop anything getting worse.\n\nAre you planning to run this through your insurance, or still figuring that part out?",
      [{ __tool: "tool-capture_lead", project_type: "roofing", scope: "hail damage last week, active leak in upstairs bedroom", urgency: "emergency" }],
    ),
  },
  { delayMs: 1700, message: user("yeah we already filed a claim with state farm") },
  {
    delayMs: 1600,
    message: assistant(
      "Good, getting that filed early is smart. The team works with insurance companies all the time, so they can help make sure nothing gets missed on the claim.\n\nWhat town are you in, and the address if you have it handy?",
      [{ __tool: "tool-capture_lead", insurance_claim: "yes" }],
    ),
  },
  { delayMs: 1800, message: user("we're out in bolivar, 412 s main st") },
  {
    delayMs: 1500,
    message: assistant(
      "Got it, Bolivar is right in their backyard so you are in good hands there.\n\nAnd your name and a good number to reach you?",
      [{ __tool: "tool-capture_lead", address: "412 S Main St", city: "Bolivar" }],
    ),
  },
  { delayMs: 1900, message: user("it's Dave Wilson, 417-555-0188, mornings are best") },
  {
    delayMs: 1700,
    message: assistant(
      "Perfect, thanks Dave. You are all set. Someone from Pitch Perfect will reach out in the morning to get the claim moving and talk through tarping the roof so that leak does not get worse. Hang tight, help is on the way.",
      [
        {
          __tool: "tool-capture_lead",
          name: "Dave Wilson",
          phone: "417-555-0188",
          preferred_contact_time: "mornings",
        },
        {
          __tool: "tool-finalize_lead",
          summary:
            "Dave Wilson at 412 S Main St, Bolivar has hail damage from last week with an active leak in the upstairs bedroom. He has already filed a State Farm claim and needs prompt attention. Best reached by phone in the mornings at 417-555-0188.",
          routing: "Roofing, Lance to call Dave re: State Farm claim and emergency tarping ASAP",
        },
      ],
    ),
  },
];
