'use client';

import { TrackId } from './types';

const STORAGE_KEY = 'beatbot:saves';

export type SavedBeat = {
  name: string;
  savedAt: number;
  bpm: number;
  tracks: Array<{
    id: TrackId;
    steps: boolean[];
    volume: number;
    muted: boolean;
  }>;
};

type SaveMap = Record<string, SavedBeat>;

function read(): SaveMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SaveMap;
  } catch {
    return {};
  }
}

function write(map: SaveMap) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function listSaves(): SavedBeat[] {
  return Object.values(read()).sort((a, b) => b.savedAt - a.savedAt);
}

export function hasSave(name: string): boolean {
  return name in read();
}

export function saveBeat(beat: SavedBeat) {
  const map = read();
  map[beat.name] = beat;
  write(map);
}

export function deleteBeat(name: string) {
  const map = read();
  delete map[name];
  write(map);
}
