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

// "VU meter" — three small LEDs that flicker while playing
function LedMeter() {
  const isPlaying = useSequencer((s) => s.isPlaying);
  const [levels, setLevels] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    if (!isPlaying) {
      setLevels([0, 0, 0]);
      return;
    }
    let raf = 0;
    const tick = () => {
      setLevels([
        Math.random(),
        Math.random() * 0.9,
        Math.random() * 0.7,
      ]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-[5px]">
      {levels.map((v, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full transition-opacity duration-75"
          style={{
            background: 'var(--color-lcd-text)',
            opacity: 0.12 + v * 0.7,
            boxShadow:
              v > 0.5
                ? '0 0 4px rgba(215, 211, 193, 0.8)'
                : 'none',
          }}
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
    <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-3 px-4 py-4 sm:px-6">
      {/* Play / Stop — physical button feel */}
      <button
        type="button"
        onClick={handleTransport}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:translate-y-[0.5px]"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, #f5f2e6 0%, #ddd8c8 80%)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, 0 -2px 4px rgba(0,0,0,0.08) inset, 0 3px 6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)',
        }}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <Square
            className="h-3 w-3 fill-[color:var(--color-red)] text-[color:var(--color-red)]"
          />
        ) : (
          <Play
            className="ml-[2px] h-4 w-4 fill-[color:var(--color-red)] text-[color:var(--color-red)]"
          />
        )}
      </button>

      {/* LCD panel */}
      <div
        className="order-3 flex w-full items-center gap-4 rounded-md px-4 py-2.5 font-mono text-sm sm:order-none sm:w-auto sm:gap-6 sm:py-2"
        style={{
          background:
            'linear-gradient(180deg, #0f0e0c 0%, #1a1916 50%, #0f0e0c 100%)',
          color: 'var(--color-lcd-text)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 4px rgba(0,0,0,0.5) inset, 0 0 0 1px rgba(0,0,0,0.15)',
        }}
      >
        <span
          className="tabular-nums tracking-[0.15em]"
          style={{ textShadow: '0 0 4px rgba(215,211,193,0.25)' }}
        >
          {formatTime(elapsed)}
        </span>
        <LedMeter />
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <span className="text-[9px] uppercase tracking-[0.28em] opacity-60">
            BPM
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => setBpm(bpm - (e.shiftKey ? 10 : 1))}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/10"
              aria-label="Decrease BPM"
              title="Decrease BPM (shift-click for -10)"
            >
              <Minus className="h-3 w-3 opacity-70" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={bpmText}
              onChange={(e) =>
                setBpmText(e.target.value.replace(/[^0-9]/g, ''))
              }
              onBlur={commitBpm}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  (e.target as HTMLInputElement).blur();
              }}
              className="w-10 cursor-text bg-transparent text-center tabular-nums tracking-wider outline-none"
              style={{
                color: 'var(--color-lcd-text)',
                textShadow: '0 0 4px rgba(215,211,193,0.25)',
              }}
            />
            <button
              type="button"
              onClick={(e) => setBpm(bpm + (e.shiftKey ? 10 : 1))}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/10"
              aria-label="Increase BPM"
              title="Increase BPM (shift-click for +10)"
            >
              <Plus className="h-3 w-3 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary controls — small Braun-style icon buttons */}
      <div className="flex items-center gap-1 text-[color:var(--color-muted)]">
        <IconBtn onClick={testBeep} label="Test sound">
          <Volume2 className="h-3.5 w-3.5" />
        </IconBtn>
        <SaveControls />
        <IconBtn
          onClick={() => {
            if (!hasAnyStep) return;
            if (window.confirm('Clear all steps?')) clearAll();
          }}
          disabled={!hasAnyStep}
          label="Clear all steps"
        >
          <Eraser className="h-3.5 w-3.5" />
        </IconBtn>
        <div
          className="mx-1 h-4 w-px bg-[color:var(--color-divider)]"
          aria-hidden
        />
        <IconBtn onClick={undo} disabled={!canUndo} label="Undo">
          <Undo2 className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn onClick={redo} disabled={!canRedo} label="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-cream-deep)]/50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[color:var(--color-muted)]"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
