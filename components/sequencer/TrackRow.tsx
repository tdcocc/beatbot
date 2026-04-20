'use client';

import { useSequencer } from '@/lib/store';
import { STEPS_PER_BAR, TOTAL_STEPS, Track } from '@/lib/types';
import { StepCell } from './StepCell';
import { TrackIcon } from './TrackIcon';

export function TrackRow({ track }: { track: Track }) {
  const currentStep = useSequencer((s) => s.currentStep);
  const isPlaying = useSequencer((s) => s.isPlaying);

  return (
    <div className="flex items-center border-t border-zinc-100">
      <div className="sticky left-0 z-10 flex w-12 shrink-0 items-center justify-center bg-white text-zinc-600 sm:w-16 sm:bg-transparent">
        <TrackIcon id={track.id} />
      </div>
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))`,
        }}
      >
        {track.steps.map((active, i) => (
          <StepCell
            key={i}
            trackId={track.id}
            stepIndex={i}
            active={active}
            isPlayhead={isPlaying && currentStep === i}
            barBoundary={i > 0 && i % STEPS_PER_BAR === 0}
          />
        ))}
      </div>
    </div>
  );
}
