'use client';

import { useSequencer } from '@/lib/store';
import { STEPS_PER_BAR, TOTAL_STEPS, Track } from '@/lib/types';
import { StepCell } from './StepCell';
import { TrackIcon } from './TrackIcon';

const TRACK_SHORT: Record<Track['id'], string> = {
  kick: 'KCK',
  snare: 'SNR',
  closedHat: 'HHT',
  openHat: 'OHT',
  clap: 'CLP',
  cowbell: 'COW',
  tom: 'TOM',
};

export function TrackRow({ track }: { track: Track }) {
  const currentStep = useSequencer((s) => s.currentStep);
  const isPlaying = useSequencer((s) => s.isPlaying);

  return (
    <div className="flex items-center border-t border-[color:var(--color-divider)]/30 first:border-t-0">
      <div
        className="sticky left-0 z-10 flex w-14 shrink-0 items-center gap-2 bg-[color:var(--color-cream-soft)] pl-3 text-[color:var(--color-ink)] sm:w-20"
      >
        <TrackIcon id={track.id} className="h-4 w-4 shrink-0" />
        <span className="hidden font-mono text-[9px] font-semibold uppercase tracking-widest text-[color:var(--color-muted)] sm:inline">
          {TRACK_SHORT[track.id]}
        </span>
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
            beatBoundary={i > 0 && i % 4 === 0 && i % STEPS_PER_BAR !== 0}
          />
        ))}
      </div>
    </div>
  );
}
