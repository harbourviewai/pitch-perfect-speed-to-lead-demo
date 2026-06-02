import { DemoExperience } from "@/components/demo-experience";

// The demo: homeowner chat on the left, the live ops lead card on the right.
// M3 adds the AI summary, the JobTread file, the speed timer, and full branding.
export default function DemoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
      <DemoExperience />
    </div>
  );
}
