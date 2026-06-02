"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { JobTreadFile } from "@/components/jobtread-file";
import type { FinalizedLead, LeadFields } from "@/lib/lead";
import { GREETING } from "@/lib/system-prompt";

const transport = new DefaultChatTransport({ api: "/api/chat" });

const greeting: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [{ type: "text", text: GREETING }],
};

// Merge every capture_lead tool call into one lead. Later non-empty values win,
// so corrections and streaming updates take precedence. Partial values that
// stream mid-call show up too, which gives the file its live "fills in" feel.
function deriveLead(messages: UIMessage[]): LeadFields {
  const lead: Record<string, string> = {};
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "tool-capture_lead") continue;
      const input = (part as { input?: Record<string, unknown> }).input;
      if (!input) continue;
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === "string" && value.trim().length > 0) lead[key] = value;
      }
    }
  }
  return lead as LeadFields;
}

// The summary + routing from finalize_lead (fires once, near the end). Last wins.
function deriveFinalized(messages: UIMessage[]): FinalizedLead | null {
  let result: FinalizedLead | null = null;
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "tool-finalize_lead") continue;
      const input = (part as { input?: Partial<FinalizedLead> }).input;
      if (input && typeof input.summary === "string" && input.summary.trim().length > 0) {
        result = { summary: input.summary, routing: typeof input.routing === "string" ? input.routing : "" };
      }
    }
  }
  return result;
}

export function DemoExperience() {
  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [greeting],
  });
  const [input, setInput] = useState("");

  const lead = useMemo(() => deriveLead(messages), [messages]);
  const finalized = useMemo(() => deriveFinalized(messages), [messages]);
  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5">
      <header className="flex items-center gap-3">
        <Image src="/logo-badge.png" alt="Pitch Perfect" width={160} height={68} className="h-10 w-auto" priority />
        <div className="border-l border-neutral-800 pl-3">
          <h1 className="text-lg font-semibold leading-tight text-neutral-50">Speed to Lead</h1>
          <p className="text-sm text-neutral-400">First message to filed customer file, in under a minute.</p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-[min(680px,78vh)]">
          <ChatPanel
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            status={status}
            error={error}
          />
        </div>
        <div className="h-[min(680px,78vh)]">
          <JobTreadFile lead={lead} finalized={finalized} />
        </div>
      </div>
    </div>
  );
}
