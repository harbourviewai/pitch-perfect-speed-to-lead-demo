"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { JobTreadFile } from "@/components/jobtread-file";
import { SpeedTimer } from "@/components/speed-timer";
import type { Attachment, FinalizedLead, LeadFields } from "@/lib/lead";
import { REPLAY_SCRIPT } from "@/lib/replay-script";
import { GREETING } from "@/lib/system-prompt";

const transport = new DefaultChatTransport({ api: "/api/chat" });

const greeting: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [{ type: "text", text: GREETING }],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
    messages: [greeting],
  });
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [replaying, setReplaying] = useState(false);

  const lead = useMemo(() => deriveLead(messages), [messages]);
  const finalized = useMemo(() => deriveFinalized(messages), [messages]);
  const busy = status === "submitted" || status === "streaming";
  const hasUserMessage = messages.some((m) => m.role === "user");

  // Timer: starts on the first homeowner message, freezes when the lead is filed.
  useEffect(() => {
    if (hasUserMessage && startedAt === null) setStartedAt(Date.now());
  }, [hasUserMessage, startedAt]);
  useEffect(() => {
    if (finalized && finishedAt === null) setFinishedAt(Date.now());
  }, [finalized, finishedAt]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (replaying) return;
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  function handleAttach(file: File) {
    if (replaying) return;
    const attachment: Attachment = { id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file) };
    setAttachments((prev) => [...prev, attachment]);
    // Let the assistant acknowledge it naturally and record that a photo came in.
    sendMessage({ text: "(I just attached a photo of the damage)" });
  }

  function reset() {
    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setMessages([greeting]);
    setAttachments([]);
    setInput("");
    setStartedAt(null);
    setFinishedAt(null);
  }

  // Plays the scripted happy path through the real UI. No API call: this is the
  // live fallback if the engine or wifi hiccups on the call.
  async function playSample() {
    if (replaying) return;
    reset();
    setReplaying(true);
    let acc: UIMessage[] = [greeting];
    setMessages(acc);
    for (const step of REPLAY_SCRIPT) {
      await sleep(step.delayMs);
      acc = [...acc, step.message];
      setMessages(acc);
    }
    setReplaying(false);
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/logo-badge.png" alt="Pitch Perfect" width={160} height={68} className="h-10 w-auto" priority />
          <div className="border-l border-neutral-800 pl-3">
            <h1 className="text-lg font-semibold leading-tight text-neutral-50">Speed to Lead</h1>
            <p className="text-sm text-neutral-400">First message to filed customer file, in under a minute.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={playSample}
            disabled={replaying || busy}
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-brand hover:text-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {replaying ? "Playing..." : "Play sample run"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={replaying}
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </header>

      <SpeedTimer startedAt={startedAt} finishedAt={finishedAt} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-[min(620px,72vh)]">
          <ChatPanel
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            status={status}
            error={error}
            attachments={attachments}
            onAttach={handleAttach}
            attachDisabled={replaying || busy}
          />
        </div>
        <div className="h-[min(620px,72vh)]">
          <JobTreadFile lead={lead} finalized={finalized} attachments={attachments} />
        </div>
      </div>
    </div>
  );
}
