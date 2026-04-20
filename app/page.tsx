import { PromptToBeat } from "@/components/sequencer/PromptToBeat";
import { Sequencer } from "@/components/sequencer/Sequencer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-amber-50 to-violet-100 p-3 sm:p-6">
      <header className="mb-5 text-center sm:mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          Beatbot
        </h1>
        <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
          Describe a beat, or tap cells. Space = play/stop · ⌘Z = undo
        </p>
      </header>
      <PromptToBeat />
      <Sequencer />
    </div>
  );
}
