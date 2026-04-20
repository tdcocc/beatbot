export type TrackId =
  | 'kick'
  | 'snare'
  | 'closedHat'
  | 'openHat'
  | 'clap'
  | 'cowbell'
  | 'tom';

export type Track = {
  id: TrackId;
  name: string;
  steps: boolean[];
  volume: number;
  muted: boolean;
};

export type Edit =
  | { kind: 'toggleStep'; trackId: TrackId; stepIndex: number }
  | { kind: 'setBpm'; prevBpm: number; newBpm: number }
  | { kind: 'clearAll'; prevTracks: Track[] };

export const STEPS_PER_BAR = 16;
export const BARS = 2;
export const TOTAL_STEPS = STEPS_PER_BAR * BARS;

export const TRACK_ORDER: TrackId[] = [
  'kick',
  'snare',
  'closedHat',
  'openHat',
  'clap',
  'cowbell',
  'tom',
];

export const TRACK_LABELS: Record<TrackId, string> = {
  kick: 'Kick',
  snare: 'Snare',
  closedHat: 'Closed Hat',
  openHat: 'Open Hat',
  clap: 'Clap',
  cowbell: 'Cowbell',
  tom: 'Tom',
};
