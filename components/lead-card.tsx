"use client";

import {
  entityForProject,
  formatLeadValue,
  LEAD_FIELD_LABELS,
  LEAD_FIELD_ORDER,
  type LeadFields,
} from "@/lib/lead";

// The ops-side lead card. Binds to the lead derived from the chat stream and
// fills field by field as the model records details. M3 layers the AI summary
// and the JobTread file on top of this.
export function LeadCard({ lead }: { lead: LeadFields }) {
  const capturedCount = LEAD_FIELD_ORDER.filter((f) => hasValue(lead[f])).length;
  const entity = entityForProject(lead.project_type);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
      <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/60 px-4 py-3">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-neutral-100">New Lead</span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Capturing live
          </span>
        </div>
        <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-300">
          {capturedCount}/{LEAD_FIELD_ORDER.length} fields
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <dl className="divide-y divide-neutral-800/70">
          {LEAD_FIELD_ORDER.map((field) => {
            const raw = lead[field];
            const filled = hasValue(raw);
            return (
              <div key={field} className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {LEAD_FIELD_LABELS[field]}
                </dt>
                <dd className="max-w-[60%] text-right text-sm">
                  {filled ? (
                    // Keyed by value so it re-mounts and re-animates each time the
                    // field changes, giving the "pops in as they type" effect.
                    <span key={String(raw)} className="lead-pop inline-block font-medium text-neutral-100">
                      {formatLeadValue(field, String(raw))}
                    </span>
                  ) : (
                    <span className="text-neutral-700">&mdash;</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {entity && (
        <footer className="lead-pop border-t border-neutral-800 bg-neutral-950/60 px-4 py-3">
          <span className="text-xs uppercase tracking-wide text-neutral-500">Routes to</span>
          <div className="mt-0.5 text-sm font-semibold text-amber-300">{entity}</div>
        </footer>
      )}
    </div>
  );
}

function hasValue(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
