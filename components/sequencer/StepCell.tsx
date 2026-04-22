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
  beatBoundary: boolean;
};

export function StepCell({
  trackId,
  stepIndex,
  active,
  isPlayhead,
  barBoundary,
  beatBoundary,
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
      className={`group relative flex h-10 items-center justify-center touch-manipulation ${
        barBoundary
          ? 'border-l border-[color:var(--color-divider)]/70'
          : beatBoundary
            ? 'border-l border-[color:var(--color-divider)]/25'
            : ''
      }`}
      aria-label={`Step ${stepIndex + 1}`}
      aria-pressed={active}
    >
      <motion.span
        animate={hit ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={[
          'block rounded-full transition-colors duration-150',
          active
            ? hit
              ? // playing hit: solid red LED with glow
                'h-[14px] w-[14px] bg-[color:var(--color-red)] shadow-[0_0_10px_rgba(195,55,42,0.6),0_1px_0_rgba(0,0,0,0.15)_inset]'
              : // toggled: cream button with subtle shadow
                'h-[14px] w-[14px] bg-[color:var(--color-cream)] shadow-[0_1px_2px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.08)]'
            : // inactive: tiny recessed dot
              'h-[5px] w-[5px] bg-[color:var(--color-divider)] group-hover:h-[7px] group-hover:w-[7px] group-hover:bg-[color:var(--color-muted)]',
        ].join(' ')}
      />
    </button>
  );
}
