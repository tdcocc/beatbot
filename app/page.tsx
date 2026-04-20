import { PromptToBeat } from "@/components/sequencer/PromptToBeat";
import { Sequencer } from "@/components/sequencer/Sequencer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-amber-50 to-violet-100 p-6">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Beatbot
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Describe a beat, or tap cells. Space = play/stop · ⌘Z = undo
        </p>
      </header>
      <PromptToBeat />
      <Sequencer />
    </div>
  );
}
