import { z } from "zod";

/**
 * The lead schema. Single source of truth shared by the server-side `capture_lead`
 * tool and the client-side lead card. The model fills these fields conversationally
 * and emits them through the tool as it learns them; the card binds to the same shape.
 *
 * Every field is optional: the model calls `capture_lead` incrementally as details
 * come up, so a given call may carry only one or two fields. The client merges them.
 *
 * `summary` and `routing` are intentionally NOT here. Those come from `finalize_lead`
 * at handoff (M3), not from the running capture.
 */
export const captureLeadSchema = z.object({
  name: z.string().optional().describe("The homeowner's full name."),
  phone: z.string().optional().describe("Best contact phone number."),
  email: z.string().optional().describe("Email address, if offered. Optional."),
  address: z.string().optional().describe("Street address of the property, if given."),
  city: z.string().optional().describe("Town or city of the property. Used for the service-area check."),
  project_type: z
    .enum(["roofing", "remodel"])
    .optional()
    .describe("'roofing' for any roof, storm, hail, or leak work; 'remodel' for kitchens, baths, additions, or other construction."),
  insurance_claim: z
    .enum(["yes", "no", "unsure"])
    .optional()
    .describe("'yes' if they are filing or considering an insurance claim, 'no' if paying out of pocket, 'unsure' if they do not know yet."),
  scope: z.string().optional().describe("Short plain description of the problem or project, e.g. 'hail damage, active leak in upstairs bedroom' or 'full kitchen remodel'."),
  urgency: z
    .enum(["emergency", "this_week", "this_month", "planning"])
    .optional()
    .describe("'emergency' for active leaks/storm damage/safety; 'this_week' or 'this_month' for near-term; 'planning' if just exploring."),
  preferred_contact_time: z.string().optional().describe("A good time of day to reach them, if mentioned. Optional."),
});

export type LeadFields = z.infer<typeof captureLeadSchema>;

/**
 * `finalize_lead` fires once at handoff. It produces the human-readable summary
 * and the routing recommendation that land on the JobTread file. Kept separate
 * from capture so the summary is written deliberately at the close, not midstream.
 */
export const finalizeLeadSchema = z.object({
  summary: z
    .string()
    .describe("A 2 to 3 sentence summary in the team's voice. What a human needs to read in 5 seconds to know exactly what to do. No fluff."),
  routing: z
    .string()
    .describe("Which entity handles it plus the suggested next step, e.g. 'Roofing — Lance to call re: State Farm claim' or 'Builds — schedule a kitchen walkthrough'."),
});

export type FinalizedLead = z.infer<typeof finalizeLeadSchema>;

// Display order and labels for the lead card.
export const LEAD_FIELD_ORDER: Array<keyof LeadFields> = [
  "name",
  "phone",
  "email",
  "address",
  "city",
  "project_type",
  "insurance_claim",
  "scope",
  "urgency",
  "preferred_contact_time",
];

export const LEAD_FIELD_LABELS: Record<keyof LeadFields, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  address: "Address",
  city: "City / Town",
  project_type: "Project type",
  insurance_claim: "Insurance claim",
  scope: "Scope",
  urgency: "Urgency",
  preferred_contact_time: "Best time to reach",
};

// Turn a stored enum / raw value into something presentable on the card.
export function formatLeadValue(field: keyof LeadFields, value: string): string {
  switch (field) {
    case "project_type":
      return value === "roofing" ? "Roofing" : value === "remodel" ? "Remodel" : value;
    case "insurance_claim":
      return value === "yes" ? "Yes" : value === "no" ? "No" : value === "unsure" ? "Unsure" : value;
    case "urgency":
      return (
        {
          emergency: "Emergency",
          this_week: "This week",
          this_month: "This month",
          planning: "Planning ahead",
        }[value] ?? value
      );
    default:
      return value;
  }
}

// Which Pitch Perfect entity a project routes to. Drives the routing hint on the card.
export function entityForProject(projectType?: string): string | null {
  if (projectType === "roofing") return "Pitch Perfect Roofing";
  if (projectType === "remodel") return "Pitch Perfect Builds";
  return null;
}
