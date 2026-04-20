'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAudioEngine } from '@/lib/audio/engine';
import { useSequencer } from '@/lib/store';
import { STEPS_PER_BAR, TOTAL_STEPS } from '@/lib/types';
import { Transport } from './Transport';
import { TrackRow } from './TrackRow';

export function Sequencer() {
  useAudioEngine();

  const tracks = useSequencer((s) => s.tracks);
  const currentStep = useSequencer((s) => s.currentStep);
  const isPlaying = useSequencer((s) => s.isPlaying);
  const play = useSequencer((s) => s.play);
  const stop = useSequencer((s) => s.stop);
  const undo = useSequencer((s) => s.undo);
  const redo = useSequencer((s) => s.redo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (useSequencer.getState().isPlaying) stop();
        else play();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play, stop, undo, redo]);

  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-100 bg-gradient-to-b from-white to-zinc-50 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
      <Transport />

      <div className="flex text-[10px] uppercase tracking-widest text-zinc-400">
        <div className="flex w-16 shrink-0 items-center justify-center py-1.5">
          Tracks
        </div>
        <div
          className="grid flex-1"
          style={{
            gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center py-1.5 ${
                i > 0 && i % STEPS_PER_BAR === 0
                  ? 'border-l border-zinc-200/70'
                  : ''
              }`}
            >
              {i % STEPS_PER_BAR === 0 ? i / STEPS_PER_BAR + 1 : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {tracks.map((track) => (
          <TrackRow key={track.id} track={track} />
        ))}

        {isPlaying && (
          <div className="pointer-events-none absolute inset-y-0 left-16 right-0">
            <motion.div
              className="absolute inset-y-0 w-[2px] bg-rose-500/80"
              animate={{
                left: `${((currentStep + 0.5) / TOTAL_STEPS) * 100}%`,
              }}
              transition={{ type: 'tween', duration: 0.05, ease: 'linear' }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center border-t border-zinc-100">
        <button
          type="button"
          className="flex h-11 w-16 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-700"
          aria-label="Add track (coming soon)"
          disabled
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="flex-1" />
      </div>
    </div>
  );
}
