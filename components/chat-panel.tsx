"use client";

import type { ChatStatus, UIMessage } from "ai";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Attachment } from "@/lib/lead";

// Pull the visible text out of a UIMessage's parts (ignores tool / non-text parts).
function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

interface ChatPanelProps {
  messages: UIMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: ChatStatus;
  error?: Error;
  attachments: Attachment[];
  onAttach: (file: File) => void;
  attachDisabled?: boolean;
}

// The homeowner-facing chat (left side of the demo). Presentational: all state
// lives in DemoExperience so the ops view can read the same stream.
export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  status,
  error,
  attachments,
  onAttach,
  attachDisabled,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onAttach(file);
    e.target.value = ""; // allow re-selecting the same file
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Only render messages that actually have visible text (skip turns that were
  // pure tool calls, which can happen as the model records details).
  const visibleMessages = messages.filter((m) => messageText(m).trim().length > 0);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
      <header className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-950/60 px-4 py-3">
        <Image src="/logo-badge.png" alt="Pitch Perfect" width={120} height={51} className="h-7 w-auto" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-neutral-100">Pitch Perfect</span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Assistant
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {visibleMessages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-sm bg-brand text-white"
                    : "rounded-bl-sm bg-neutral-800 text-neutral-100",
                ].join(" ")}
              >
                {messageText(message)}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-neutral-800 px-4 py-3">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            Something went wrong reaching the assistant. Check that the API key is set, then try again.
          </div>
        )}
      </div>

      {/* Attached photo thumbnails (stub: object URLs, not uploaded anywhere) */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-800 bg-neutral-950/60 px-3 pt-3">
          {attachments.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={a.url}
              alt={a.name}
              className="lead-pop h-12 w-12 rounded-lg object-cover ring-1 ring-neutral-700"
            />
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-neutral-800 bg-neutral-950/60 p-3">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachDisabled}
          aria-label="Attach a photo"
          title="Attach a photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition-colors hover:border-brand hover:text-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          aria-label="Message"
          className="flex-1 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500"
      style={{ animationDelay: delay }}
    />
  );
}
