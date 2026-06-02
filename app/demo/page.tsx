import { DemoExperience } from "@/components/demo-experience";

// The demo: Pitch Perfect chat on the left, the live JobTread customer file on
// the right. M4 adds the speed timer and the "7 days to under a minute" contrast.
export default function DemoPage() {
  return (
    <div className="flex flex-1 justify-center bg-neutral-950 px-4 py-6">
      <DemoExperience />
    </div>
  );
}
