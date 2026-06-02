// Dev-only harness: drives a multi-turn conversation through /api/chat and
// prints the transcript. Lets us validate the qualifying flow, branching, and
// guardrails without clicking through the UI. Not shipped to prod.
const API = process.env.API ?? "http://localhost:3000/api/chat";

const homeownerTurns = [
  "we got hammered by hail last week and i think the roof is leaking in the upstairs bedroom",
  "yeah i already filed a claim with state farm",
  "im out in bolivar, place is on s 13 hwy",
  "whats this gonna cost me roughly?",
  "ok. it's Lance, 417-555-0142. are you a real person or a bot lol",
];

let messages = [
  {
    id: "g",
    role: "assistant",
    parts: [{ type: "text", text: "Hey, thanks for reaching out to Pitch Perfect. What is going on with your home?" }],
  },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

async function send() {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const raw = await res.text();
  // Parse the v6 UI message stream: SSE lines carrying JSON with text deltas
  // and tool-call events. We surface both the reply and any capture_lead fields.
  let text = "";
  const captured = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^data: (.+)$/);
    if (!m) continue;
    try {
      const evt = JSON.parse(m[1]);
      if (evt.type === "text-delta" && typeof evt.delta === "string") text += evt.delta;
      if (evt.type === "tool-input-available" && evt.toolName === "capture_lead") {
        Object.assign(captured, evt.input);
      }
    } catch {
      /* ignore non-JSON keepalives */
    }
  }
  return { text: text.trim(), captured };
}

console.log("ASSISTANT:", messages[0].parts[0].text, "\n");
const running = {};
for (const turn of homeownerTurns) {
  messages.push({ id: uid(), role: "user", parts: [{ type: "text", text: turn }] });
  console.log("HOMEOWNER:", turn);
  const { text, captured } = await send();
  messages.push({ id: uid(), role: "assistant", parts: [{ type: "text", text }] });
  console.log("ASSISTANT:", text);
  if (Object.keys(captured).length) {
    Object.assign(running, captured);
    console.log("  >> capture_lead:", JSON.stringify(captured));
  }
  console.log("");
}
console.log("=== FINAL LEAD ===");
console.log(JSON.stringify(running, null, 2));
