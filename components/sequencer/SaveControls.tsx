'use client';

import { FolderOpen, Save as SaveIcon, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSequencer } from '@/lib/store';
import {
  deleteBeat,
  hasSave,
  listSaves,
  saveBeat,
  type SavedBeat,
} from '@/lib/saves';

function defaultName(existing: SavedBeat[]): string {
  let n = existing.length + 1;
  let name = `Beat ${n}`;
  const used = new Set(existing.map((b) => b.name));
  while (used.has(name)) {
    n += 1;
    name = `Beat ${n}`;
  }
  return name;
}

export function SaveControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [saves, setSaves] = useState<SavedBeat[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const loadPattern = useSequencer((s) => s.loadPattern);

  const refresh = () => setSaves(listSaves());

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  const handleSave = () => {
    const state = useSequencer.getState();
    const existing = listSaves();
    const suggested = defaultName(existing);
    const name = window.prompt('Name this beat', suggested)?.trim();
    if (!name) return;
    if (hasSave(name) && !window.confirm(`Overwrite "${name}"?`)) return;
    saveBeat({
      name,
      savedAt: Date.now(),
      bpm: state.bpm,
      tracks: state.tracks.map((t) => ({
        id: t.id,
        steps: [...t.steps],
        volume: t.volume,
        muted: t.muted,
      })),
    });
    refresh();
  };

  const handleLoad = (beat: SavedBeat) => {
    loadPattern(
      beat.bpm,
      beat.tracks.map((t) => ({ ...t, name: t.id, steps: [...t.steps] })),
    );
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"?`)) return;
    deleteBeat(name);
    refresh();
  };

  return (
    <div
      className="relative flex items-center gap-1 text-[color:var(--color-muted)]"
      ref={panelRef}
    >
      <button
        type="button"
        onClick={handleSave}
        className="flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors hover:bg-[color:var(--color-cream-deep)]/50 hover:text-[color:var(--color-ink)]"
        aria-label="Save beat"
        title="Save beat"
      >
        <SaveIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (!isOpen) refresh();
          setIsOpen((v) => !v);
        }}
        className={`flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors hover:bg-[color:var(--color-cream-deep)]/50 hover:text-[color:var(--color-ink)] ${
          isOpen
            ? 'bg-[color:var(--color-cream-deep)]/50 text-[color:var(--color-ink)]'
            : ''
        }`}
        aria-label="Open saved beats"
        aria-expanded={isOpen}
        title="Open saved beats"
      >
        <FolderOpen className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-[8px] border border-[color:var(--color-divider)]/60 bg-[color:var(--color-cream)]"
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.8) inset, 0 12px 24px -8px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="border-b border-[color:var(--color-divider)]/50 bg-[color:var(--color-cream-soft)] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            Saved Beats
          </div>
          {saves.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[color:var(--color-muted)]">
              No saves yet. Tap the disk icon to save the current beat.
            </div>
          ) : (
            <ul className="max-h-64 divide-y divide-[color:var(--color-divider)]/40 overflow-y-auto">
              {saves.map((beat) => (
                <li
                  key={beat.name}
                  className="flex items-center gap-1 pr-1 hover:bg-[color:var(--color-cream-soft)]"
                >
                  <button
                    type="button"
                    onClick={() => handleLoad(beat)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-[color:var(--color-ink)]">
                        {beat.name}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                        {beat.bpm} BPM ·{' '}
                        {new Date(beat.savedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, beat.name)}
                    aria-label={`Delete ${beat.name}`}
                    className="shrink-0 rounded-[4px] p-1.5 text-[color:var(--color-muted)] hover:bg-[color:var(--color-red)]/10 hover:text-[color:var(--color-red)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
