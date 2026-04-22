'use client';

import { create } from 'zustand';
import {
  Edit,
  Track,
  TOTAL_STEPS,
  TRACK_LABELS,
  TRACK_ORDER,
  TrackId,
} from './types';

type State = {
  bpm: number;
  tracks: Track[];
  isPlaying: boolean;
  currentStep: number;
  history: Edit[];
  future: Edit[];
  // Increments every time loadPattern runs. Lets the audio engine force
  // a clean seq.stop()+seq.start() restart even when React batches the
  // loadPattern + play() state updates into a single render.
  patternNonce: number;
};

type Actions = {
  toggleStep: (trackId: TrackId, stepIndex: number) => void;
  setBpm: (bpm: number) => void;
  play: () => void;
  stop: () => void;
  setCurrentStep: (step: number) => void;
  undo: () => void;
  redo: () => void;
  loadPattern: (bpm: number, tracks: Track[]) => void;
  clearAll: () => void;
};

const makeTrack = (id: TrackId): Track => ({
  id,
  name: TRACK_LABELS[id],
  steps: Array(TOTAL_STEPS).fill(false),
  volume: 0.9,
  muted: false,
});

const applyEdit = (
  state: State,
  edit: Edit,
  direction: 'forward' | 'reverse',
): Partial<State> => {
  if (edit.kind === 'toggleStep') {
    return {
      tracks: state.tracks.map((t) =>
        t.id === edit.trackId
          ? {
              ...t,
              steps: t.steps.map((s, i) => (i === edit.stepIndex ? !s : s)),
            }
          : t,
      ),
    };
  }
  if (edit.kind === 'setBpm') {
    return { bpm: direction === 'forward' ? edit.newBpm : edit.prevBpm };
  }
  if (direction === 'forward') {
    return {
      tracks: state.tracks.map((t) => ({
        ...t,
        steps: Array(TOTAL_STEPS).fill(false),
      })),
    };
  }
  return {
    tracks: edit.prevTracks.map((t) => ({ ...t, steps: [...t.steps] })),
  };
};

export const useSequencer = create<State & Actions>((set, get) => ({
  bpm: 140,
  tracks: TRACK_ORDER.map(makeTrack),
  isPlaying: false,
  currentStep: 0,
  history: [],
  future: [],
  patternNonce: 0,

  toggleStep: (trackId, stepIndex) => {
    const edit: Edit = { kind: 'toggleStep', trackId, stepIndex };
    set((state) => ({
      ...applyEdit(state, edit, 'forward'),
      history: [...state.history, edit],
      future: [],
    }));
  },

  setBpm: (bpm) => {
    const clamped = Math.max(40, Math.min(220, Math.round(bpm)));
    const state = get();
    if (clamped === state.bpm) return;
    const edit: Edit = { kind: 'setBpm', prevBpm: state.bpm, newBpm: clamped };
    set({
      bpm: clamped,
      history: [...state.history, edit],
      future: [],
    });
  },

  play: () => set({ isPlaying: true }),
  stop: () => set({ isPlaying: false, currentStep: 0 }),
  setCurrentStep: (step) => set({ currentStep: step }),

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const last = state.history[state.history.length - 1];
    set({
      ...applyEdit(state, last, 'reverse'),
      history: state.history.slice(0, -1),
      future: [last, ...state.future],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const [next, ...rest] = state.future;
    set({
      ...applyEdit(state, next, 'forward'),
      future: rest,
      history: [...state.history, next],
    });
  },

  clearAll: () => {
    const state = get();
    const hasAny = state.tracks.some((t) => t.steps.some(Boolean));
    if (!hasAny) return;
    const edit: Edit = {
      kind: 'clearAll',
      prevTracks: state.tracks.map((t) => ({ ...t, steps: [...t.steps] })),
    };
    set({
      ...applyEdit(state, edit, 'forward'),
      history: [...state.history, edit],
      future: [],
    });
  },

  loadPattern: (bpm, tracks) => {
    const ordered = TRACK_ORDER.map(
      (id) =>
        tracks.find((t) => t.id === id) ?? {
          id,
          name: TRACK_LABELS[id],
          steps: Array(TOTAL_STEPS).fill(false),
          volume: 0.9,
          muted: false,
        },
    );
    set((s) => ({
      bpm: Math.max(40, Math.min(220, Math.round(bpm))),
      tracks: ordered,
      isPlaying: false,
      currentStep: 0,
      history: [],
      future: [],
      patternNonce: s.patternNonce + 1,
    }));
  },
}));
