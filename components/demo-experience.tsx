"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { LeadCard } from "@/components/lead-card";
import type { LeadFields } from "@/lib/lead";
import { GREETING } from "@/lib/system-prompt";

const transport = new DefaultChatTransport({ api: "/api/chat" });

const greeting: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [{ type: "text", text: GREETING }],
};

// Walk every capture_lead tool call in the conversation and merge its fields into
// one lead. Later non-empty values win, so corrections and streaming updates take
// precedence. Partial values that stream in mid-call show up too, which is what
// gives the card its live "fills in as they type" feel.
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

export function DemoExperience() {
  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [greeting],
  });
  const [input, setInput] = useState("");

  const lead = useMemo(() => deriveLead(messages), [messages]);
  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2">
      <div className="h-[min(680px,82vh)]">
        <ChatPanel
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          status={status}
          error={error}
        />
      </div>
      <div className="h-[min(680px,82vh)]">
        <LeadCard lead={lead} />
      </div>
    </div>
  );
}
