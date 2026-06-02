import Image from "next/image";

// M0 landing — a deploy stub whose only job is to lock the demo URL on Vercel.
// The real split-screen experience lives at /demo (built in M1 to M4).
// NOTE: palette below is a tasteful placeholder. Confirmed Pitch Perfect brand
// colors (from pitchperfectbuilds.com) get wired in at M3.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-neutral-950 px-6 text-center">
      <main className="flex w-full max-w-xl flex-col items-center gap-8">
        <Image
          src="/logo-badge.png"
          alt="Pitch Perfect"
          width={260}
          height={110}
          priority
          className="h-auto w-[200px] sm:w-[260px]"
        />

        <div className="flex flex-col items-center gap-4">
          <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-brand-bright">
            Speed to Lead
          </span>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-neutral-50 sm:text-4xl">
            A lead, captured and filed in under a minute.
          </h1>
          <p className="max-w-md text-pretty text-base leading-7 text-neutral-400">
            Today that lead waits about seven days. The live demo shows what
            happens when it waits less than one. Coming online here shortly.
          </p>
        </div>

        <p className="text-xs uppercase tracking-widest text-neutral-600">
          Built by Harbourview AI
        </p>
      </main>
    </div>
  );
}
