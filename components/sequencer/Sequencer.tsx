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
    <div
      className="relative w-full max-w-4xl overflow-hidden rounded-[18px] border border-[color:var(--color-divider)]/60 bg-[color:var(--color-cream)]"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(0,0,0,0.08) inset, 0 20px 40px -20px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Chassis badge strip */}
      <div className="flex items-center justify-between border-b border-[color:var(--color-divider)]/50 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-[3px] bg-[color:var(--color-red)] shadow-[0_0_4px_rgba(195,55,42,0.4)]" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--color-ink)]">
            Beatbot
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Rhythm Composer
          </span>
        </div>
        {/* Speaker-grille decoration — small dot matrix */}
        <div
          className="grid gap-[3px] opacity-45"
          style={{
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="h-[3px] w-[3px] rounded-full bg-[color:var(--color-ink)]"
            />
          ))}
        </div>
      </div>

      <Transport />

      {/* Grid area */}
      <div className="border-t border-[color:var(--color-divider)]/50 bg-[color:var(--color-cream-soft)]">
        <div className="overflow-x-auto">
          <div className="min-w-[720px] sm:min-w-0">
            {/* Bar header */}
            <div className="flex border-b border-[color:var(--color-divider)]/40">
              <div className="sticky left-0 z-20 flex w-14 shrink-0 items-center justify-center bg-[color:var(--color-cream-soft)] py-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-muted)] sm:w-20">
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
                    className={`flex items-center justify-center py-2 text-[9px] font-mono uppercase tracking-widest text-[color:var(--color-muted)] ${
                      i > 0 && i % STEPS_PER_BAR === 0
                        ? 'border-l border-[color:var(--color-divider)]/70'
                        : ''
                    }`}
                  >
                    {i % STEPS_PER_BAR === 0
                      ? `Bar ${i / STEPS_PER_BAR + 1}`
                      : i % 4 === 0
                        ? '·'
                        : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {tracks.map((track) => (
                <TrackRow key={track.id} track={track} />
              ))}

              {isPlaying && (
                <div className="pointer-events-none absolute inset-y-0 left-14 right-0 sm:left-20">
                  <motion.div
                    className="absolute inset-y-0 w-[1.5px] bg-[color:var(--color-red)]/75 shadow-[0_0_6px_rgba(195,55,42,0.4)]"
                    animate={{
                      left: `${((currentStep + 0.5) / TOTAL_STEPS) * 100}%`,
                    }}
                    transition={{
                      type: 'tween',
                      duration: 0.05,
                      ease: 'linear',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[color:var(--color-divider)]/50 bg-[color:var(--color-cream)] px-4 py-2 sm:px-6">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Add track (coming soon)"
          disabled
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Track
        </button>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          16 Steps × 2 Bars · 16ᵗʰ Note
        </span>
      </div>
    </div>
  );
}
