'use client';

import { motion } from 'framer-motion';
import { useSequencer } from '@/lib/store';
import { TrackId } from '@/lib/types';
import { startAudio } from '@/lib/audio/engine';

type Props = {
  trackId: TrackId;
  stepIndex: number;
  active: boolean;
  isPlayhead: boolean;
  barBoundary: boolean;
};

export function StepCell({
  trackId,
  stepIndex,
  active,
  isPlayhead,
  barBoundary,
}: Props) {
  const toggle = useSequencer((s) => s.toggleStep);
  const hit = active && isPlayhead;

  const handleClick = () => {
    void startAudio();
    toggle(trackId, stepIndex);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex h-11 items-center justify-center ${
        barBoundary ? 'border-l border-zinc-200/70' : ''
      }`}
      aria-label={`Step ${stepIndex + 1}`}
      aria-pressed={active}
    >
      <motion.span
        animate={hit ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={[
          'block rounded-full transition-colors duration-150',
          active
            ? hit
              ? 'h-6 w-6 bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.55)]'
              : 'h-6 w-6 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
            : 'h-5 w-5 bg-zinc-100 group-hover:bg-zinc-200',
        ].join(' ')}
      />
    </button>
  );
}
