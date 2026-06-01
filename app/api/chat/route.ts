import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
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
