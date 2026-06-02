"use client";

import { entityForProject, formatLeadValue, type Attachment, type FinalizedLead, type LeadFields } from "@/lib/lead";

// The mock JobTread customer file (right side of the demo). It is intentionally
// light themed so it reads as a separate system from the dark Pitch Perfect chat:
// "intake just auto-created a file in your JobTread." Fields pop in live as the
// model captures them; the AI summary lands when finalize_lead fires.
//
// Sandbox only: nothing is written to a real JobTread. This is a styled mock.
export function JobTreadFile({
  lead,
  finalized,
  attachments = [],
}: {
  lead: LeadFields;
  finalized: FinalizedLead | null;
  attachments?: Attachment[];
}) {
  const fileCreated = Boolean(lead.name || lead.project_type || lead.city);
  const entity = entityForProject(lead.project_type);
  const initials = getInitials(lead.name);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
      {/* JobTread app chrome */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-jobtread text-xs font-bold text-white">
            JT
          </span>
          <span className="text-sm font-semibold text-zinc-800">JobTread</span>
        </div>
        {fileCreated ? (
          <span className="lead-pop flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Customer file created
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
            Awaiting intake
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Customer header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-jobtread/10 text-sm font-bold text-jobtread">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-zinc-900">
              {lead.name ? (
                <span key={lead.name} className="lead-pop inline-block">
                  {lead.name}
                </span>
              ) : (
                <span className="text-zinc-400">New lead</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100">
                Lead
              </span>
              {entity && (
                <span key={entity} className="lead-pop text-xs font-medium text-zinc-500">
                  {entity}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <Section title="Contact">
          <Row label="Phone" value={lead.phone} />
          <Row label="Email" value={lead.email} />
          <Row label="Address" value={lead.address} />
          <Row label="City / Town" value={lead.city} />
        </Section>

        {/* Project */}
        <Section title="Project">
          <Row label="Type" value={fmt(lead, "project_type")} />
          <Row label="Scope" value={lead.scope} />
          <Row
            label="Insurance claim"
            value={fmt(lead, "insurance_claim")}
            highlight={lead.insurance_claim === "yes" ? "amber" : undefined}
          />
          <Row
            label="Urgency"
            value={fmt(lead, "urgency")}
            highlight={lead.urgency === "emergency" ? "red" : undefined}
          />
          <Row label="Best time to reach" value={lead.preferred_contact_time} />
        </Section>

        {/* Attachments (photo stub) */}
        {attachments.length > 0 && (
          <div className="border-b border-zinc-100 px-4 py-3">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Attachments ({attachments.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={a.id}
                  src={a.url}
                  alt={a.name}
                  className="lead-pop h-14 w-14 rounded-md object-cover ring-1 ring-zinc-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* AI summary, populated at handoff */}
        <div className="border-t border-zinc-100 px-4 py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">AI summary</span>
            <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
              Auto
            </span>
          </div>
          {finalized ? (
            <div className="lead-pop space-y-2">
              <p className="text-sm leading-relaxed text-zinc-700">{finalized.summary}</p>
              <div className="rounded-lg bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Next step</span>
                <p className="mt-0.5 text-sm font-medium text-zinc-800">{finalized.routing}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-zinc-400">Generated automatically when the intake wraps up.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-100 px-4 py-3">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <dl className="divide-y divide-zinc-100">{children}</dl>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value?: string; highlight?: "amber" | "red" }) {
  const filled = typeof value === "string" && value.trim().length > 0;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="max-w-[62%] text-right text-sm">
        {filled ? (
          <span
            key={value}
            className={[
              "lead-pop inline-block font-medium",
              highlight === "amber"
                ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800"
                : highlight === "red"
                  ? "rounded bg-red-100 px-1.5 py-0.5 text-red-700"
                  : "text-zinc-900",
            ].join(" ")}
          >
            {value}
          </span>
        ) : (
          <span className="text-zinc-300">&mdash;</span>
        )}
      </dd>
    </div>
  );
}

// Format an enum-bearing field for display, leaving plain strings untouched.
function fmt(lead: LeadFields, field: "project_type" | "insurance_claim" | "urgency"): string | undefined {
  const raw = lead[field];
  return raw ? formatLeadValue(field, raw) : undefined;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}
