'use client';

import { useState } from 'react';
import { startAudio } from '@/lib/audio/engine';
import { useSequencer } from '@/lib/store';
import {
  TOTAL_STEPS,
  Track,
  TRACK_LABELS,
  TrackId,
} from '@/lib/types';

type ApiResponse =
  | { bpm: number; tracks: Array<{ id: TrackId; steps: number[] }> }
  | { error: string };

export function PromptToBeat() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadPattern = useSequencer((s) => s.loadPattern);
  const play = useSequencer((s) => s.play);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    void startAudio();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || 'error' in data) {
        throw new Error(
          'error' in data ? data.error : `Request failed (${res.status})`,
        );
      }

      const tracks: Track[] = data.tracks.map((t) => {
        const steps = Array<boolean>(TOTAL_STEPS).fill(false);
        for (const i of t.steps) {
          if (Number.isInteger(i) && i >= 0 && i < TOTAL_STEPS) {
            steps[i] = true;
          }
        }
        return {
          id: t.id,
          name: TRACK_LABELS[t.id] ?? t.id,
          steps,
          volume: 0.9,
          muted: false,
        };
      });

      loadPattern(data.bpm, tracks);
      play();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-5 w-full max-w-4xl">
      <div
        className="flex items-stretch overflow-hidden rounded-[10px] border border-[color:var(--color-divider)]/50 bg-[color:var(--color-cream)]"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center gap-2 pl-3 pr-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--color-red)] shadow-[0_0_4px_rgba(195,55,42,0.5)]" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
            Compose
          </span>
        </div>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. slow hip-hop at 90 BPM with heavy kicks"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-muted)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="shrink-0 border-l border-[color:var(--color-divider)]/50 bg-[color:var(--color-cream-soft)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-cream-deep)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
          style={{
            boxShadow: 'inset 0 0 0 0 transparent',
          }}
        >
          {loading ? 'Thinking…' : 'Generate'}
        </button>
      </div>
      {error && (
        <div className="mt-2 rounded-[6px] border border-[color:var(--color-red)]/30 bg-[color:var(--color-red)]/5 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-red-deep)]">
          {error}
        </div>
      )}
    </form>
  );
}
