'use client';

import {
  Eraser,
  Minus,
  Play,
  Plus,
  Redo2,
  Square,
  Undo2,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { startAudio } from '@/lib/audio/engine';
import { useSequencer } from '@/lib/store';
import { SaveControls } from './SaveControls';

async function testBeep() {
  await startAudio();
  const osc = new Tone.Oscillator(440, 'sine').toDestination();
  osc.volume.value = -6;
  osc.start();
  osc.stop('+0.35');
}

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(m)}:${pad(s)}:${pad(hundredths)}`;
}

function Meter() {
  const isPlaying = useSequencer((s) => s.isPlaying);
  const [levels, setLevels] = useState<number[]>(() =>
    Array(11).fill(0).map((_, i) => 0.1 + i * 0.05),
  );

  useEffect(() => {
    if (!isPlaying) {
      setLevels((prev) => prev.map(() => 0.1));
      return;
    }
    let raf = 0;
    const tick = () => {
      setLevels(() =>
        Array.from({ length: 11 }, (_, i) => {
          const base = 0.25 + i * 0.06;
          const jitter = Math.random() * 0.4;
          return Math.min(1, base + jitter);
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <div className="flex h-3 items-end gap-[2px]">
      {levels.map((v, i) => (
        <span
          key={i}
          className="w-[2px] rounded-sm bg-zinc-300"
          style={{ height: `${Math.max(10, v * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function Transport() {
  const isPlaying = useSequencer((s) => s.isPlaying);
  const bpm = useSequencer((s) => s.bpm);
  const play = useSequencer((s) => s.play);
  const stop = useSequencer((s) => s.stop);
  const setBpm = useSequencer((s) => s.setBpm);
  const undo = useSequencer((s) => s.undo);
  const redo = useSequencer((s) => s.redo);
  const clearAll = useSequencer((s) => s.clearAll);
  const canUndo = useSequencer((s) => s.history.length > 0);
  const canRedo = useSequencer((s) => s.future.length > 0);
  const hasAnyStep = useSequencer((s) =>
    s.tracks.some((t) => t.steps.some(Boolean)),
  );

  const [elapsed, setElapsed] = useState(0);
  const [bpmText, setBpmText] = useState(String(bpm));

  useEffect(() => setBpmText(String(bpm)), [bpm]);

  useEffect(() => {
    if (!isPlaying) {
      setElapsed(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      setElapsed(Tone.getTransport().seconds);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const handleTransport = async () => {
    await startAudio();
    if (isPlaying) stop();
    else play();
  };

  const commitBpm = () => {
    const parsed = parseInt(bpmText, 10);
    if (Number.isFinite(parsed)) setBpm(parsed);
    else setBpmText(String(bpm));
  };

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <button
        type="button"
        onClick={handleTransport}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500 text-white shadow-sm transition-colors hover:bg-rose-600"
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <Square className="h-3 w-3 fill-white" />
        ) : (
          <Play className="ml-[1px] h-3.5 w-3.5 fill-white" />
        )}
      </button>

      <div className="flex items-center gap-5 rounded-2xl bg-zinc-900 px-5 py-2 font-mono text-sm text-zinc-100 shadow-inner">
        <span className="tabular-nums tracking-wider">
          {formatTime(elapsed)}
        </span>
        <Meter />
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400">
            BPM
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => setBpm(bpm - (e.shiftKey ? 10 : 1))}
              className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Decrease BPM"
              title="Decrease BPM (shift-click for -10)"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={bpmText}
              onChange={(e) => setBpmText(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={commitBpm}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-10 cursor-text rounded bg-transparent text-center tabular-nums text-zinc-100 outline-none hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
            />
            <button
              type="button"
              onClick={(e) => setBpm(bpm + (e.shiftKey ? 10 : 1))}
              className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Increase BPM"
              title="Increase BPM (shift-click for +10)"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-zinc-400">
        <button
          type="button"
          onClick={testBeep}
          className="rounded-md p-1.5 transition-colors hover:text-zinc-900"
          aria-label="Test sound"
          title="Test sound"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <SaveControls />
        <button
          type="button"
          onClick={() => {
            if (!hasAnyStep) return;
            if (window.confirm('Clear all steps?')) clearAll();
          }}
          disabled={!hasAnyStep}
          className="rounded-md p-1.5 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-zinc-400"
          aria-label="Clear all steps"
          title="Clear all steps"
        >
          <Eraser className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="rounded-md p-1.5 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-zinc-400"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="rounded-md p-1.5 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-zinc-400"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
