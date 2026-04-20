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
    <div className="relative flex items-center gap-1 text-zinc-400" ref={panelRef}>
      <button
        type="button"
        onClick={handleSave}
        className="rounded-md p-1.5 transition-colors hover:text-zinc-900"
        aria-label="Save beat"
        title="Save beat"
      >
        <SaveIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (!isOpen) refresh();
          setIsOpen((v) => !v);
        }}
        className={`rounded-md p-1.5 transition-colors hover:text-zinc-900 ${
          isOpen ? 'text-zinc-900' : ''
        }`}
        aria-label="Open saved beats"
        aria-expanded={isOpen}
        title="Open saved beats"
      >
        <FolderOpen className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-64 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400">
            Saved beats
          </div>
          {saves.length === 0 ? (
            <div className="px-3 pb-3 text-xs text-zinc-500">
              No saves yet. Click the disk icon to save the current beat.
            </div>
          ) : (
            <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto">
              {saves.map((beat) => (
                <li
                  key={beat.name}
                  className="flex items-center gap-1 pr-1 hover:bg-zinc-50"
                >
                  <button
                    type="button"
                    onClick={() => handleLoad(beat)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-zinc-800">
                        {beat.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">
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
                    className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500"
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
