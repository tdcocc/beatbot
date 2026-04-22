import { PromptToBeat } from "@/components/sequencer/PromptToBeat";
import { Sequencer } from "@/components/sequencer/Sequencer";

export default function Home() {
  return (
    <div className="relative z-[1] flex min-h-screen flex-1 flex-col items-center justify-center p-4 sm:p-8">
      <header className="mb-6 text-center sm:mb-8">
        <div className="mx-auto mb-2 inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-red)] shadow-[0_0_6px_rgba(195,55,42,0.5)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Beatbot · Model 001
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted)] sm:text-sm">
          A rhythm composer. Tap cells, or ask in plain language.
        </p>
      </header>
      <PromptToBeat />
      <Sequencer />
    </div>
  );
}
