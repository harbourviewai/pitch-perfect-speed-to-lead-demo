import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { captureLeadSchema } from "@/lib/lead";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

// The only thing that talks to Anthropic. The API key stays server-side; the
// browser never sees it. Node runtime (default) keeps the Anthropic provider
// and streaming behavior predictable.
export const maxDuration = 30;

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fail loud and clear in dev/prod rather than streaming a cryptic provider error.
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local (local) or the Vercel project env (prod)." },
      { status: 500 },
    );
  }

  let messages: UIMessage[];
  try {
    ({ messages } = (await req.json()) as { messages: UIMessage[] });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = streamText({
    model: anthropic(process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    temperature: 0.7,
    tools: {
      // The model calls this as it learns each detail. We don't persist anything
      // (sandbox): the value lives in the streamed tool input, which the client
      // reads to fill the lead card live. The ack just satisfies the tool-result
      // contract so the conversation continues.
      capture_lead: tool({
        description:
          "Record or update structured lead details as you learn them during the conversation. Call this silently whenever the homeowner gives you a new or corrected detail (name, phone, email, address, city, project type, insurance status, scope, urgency, or best time to reach them). Include only the fields you just learned. Never mention this to the homeowner.",
        inputSchema: captureLeadSchema,
        execute: async () => ({ recorded: true }),
      }),
    },
    // Allow the model to call capture_lead and still continue the conversation in
    // the same turn (text + tool call together), bounded so it can't loop.
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      // Surface a homeowner-friendly line instead of a raw stack trace, but log
      // the real error server-side for debugging.
      console.error("[/api/chat] stream error:", error);
      return "Sorry, something hiccupped on our end. Mind sending that again?";
    },
  });
}
