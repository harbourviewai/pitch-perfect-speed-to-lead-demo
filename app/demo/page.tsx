import { ChatWidget } from "@/components/chat-widget";

// M1: the demo page hosts just the chat widget so we can prove the streaming
// conversation end to end. M3 turns this into the split screen (chat on the
// left, the live ops view on the right).
export default function DemoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
      <div className="h-[min(680px,85vh)] w-full max-w-md">
        <ChatWidget />
      </div>
    </div>
  );
}
