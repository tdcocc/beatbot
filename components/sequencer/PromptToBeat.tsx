'use client';

import { Sparkles } from 'lucide-react';
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
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/80 p-1.5 shadow-sm backdrop-blur">
        <Sparkles className="ml-2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a beat — e.g. 'hip-hop 90 BPM with heavy kicks and cowbell'"
          className="flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-zinc-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="rounded-xl bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>
      {error && (
        <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}
    </form>
  );
}
