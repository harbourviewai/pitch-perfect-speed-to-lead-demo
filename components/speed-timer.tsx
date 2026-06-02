"use client";

import { useEffect, useState } from "react";

// The money shot: a timer from the homeowner's first message to the filed lead,
// shown against the struck-through "today" baseline. Starts ticking on the first
// message, freezes when finalize_lead fires.
export function SpeedTimer({ startedAt, finishedAt }: { startedAt: number | null; finishedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null && finishedAt === null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [running]);

  const started = startedAt !== null;
  const done = finishedAt !== null;
  const elapsedMs = startedAt === null ? 0 : (finishedAt ?? now) - startedAt;

  return (
    <div
      className={[
        "flex items-center justify-between gap-4 rounded-2xl border px-5 py-3 transition-colors",
        done
          ? "border-emerald-500/40 bg-emerald-500/10"
          : running
            ? "border-brand/40 bg-brand/10"
            : "border-neutral-800 bg-neutral-900",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "text-xs font-medium uppercase tracking-widest",
            done ? "text-emerald-400" : running ? "text-brand-bright" : "text-neutral-500",
          ].join(" ")}
        >
          {done ? "Captured & filed in" : running ? "Capturing" : "Speed to lead"}
        </span>
        <span
          className={[
            "font-mono text-3xl font-bold tabular-nums leading-none",
            done ? "text-emerald-300" : started ? "text-neutral-50" : "text-neutral-600",
          ].join(" ")}
        >
          {formatElapsed(elapsedMs)}
        </span>
        {done && <span className="text-emerald-400">&#10003;</span>}
      </div>

      <div className="text-right">
        <div className="text-xs uppercase tracking-wide text-neutral-500">Today</div>
        <div className="text-sm font-semibold text-neutral-500 line-through decoration-red-500/70 decoration-2">
          about 7 days
        </div>
      </div>
    </div>
  );
}

// Elapsed milliseconds to m:ss (e.g. 47s -> "0:47", 72s -> "1:12").
function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
