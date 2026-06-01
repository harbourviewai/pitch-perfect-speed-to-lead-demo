"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GREETING } from "@/lib/system-prompt";

// Static config, defined once outside the component so a new transport/greeting
// is not allocated on every render.
const transport = new DefaultChatTransport({ api: "/api/chat" });

const greeting: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [{ type: "text", text: GREETING }],
};

// Pull the visible text out of a UIMessage's parts (ignores non-text parts).
function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function ChatWidget() {
  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [greeting],
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";

  // Keep the latest message in view as the conversation grows and streams.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
      {/* Header */}
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-sm bg-amber-500 text-neutral-950"
                    : "rounded-bl-sm bg-neutral-800 text-neutral-100",
                ].join(" ")}
              >
                {messageText(message)}
              </div>
            </div>
          );
        })}

        {/* Typing indicator while the assistant is thinking / streaming */}
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-neutral-800 bg-neutral-950/60 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          aria-label="Message"
          className="flex-1 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
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
