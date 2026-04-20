import * as Tone from 'tone';
import { TrackId } from '../types';

export type Voice = {
  trigger: (time: number, velocity?: number) => void;
  dispose: () => void;
};

export function createVoice(id: TrackId, master: Tone.ToneAudioNode): Voice {
  const out = new Tone.Volume(0).connect(master);

  switch (id) {
    case 'kick': {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.8 },
      }).connect(out);
      synth.volume.value = 2;
      return {
        trigger: (time, v = 1) =>
          synth.triggerAttackRelease('A1', '8n', time, v),
        dispose: () => {
          synth.dispose();
          out.dispose();
        },
      };
    }
    case 'snare': {
      const noise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      }).connect(out);
      const body = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      }).connect(out);
      body.volume.value = -4;
      return {
        trigger: (time, v = 1) => {
          noise.triggerAttackRelease('16n', time, v);
          body.triggerAttackRelease('G2', '16n', time, v * 0.7);
        },
        dispose: () => {
          noise.dispose();
          body.dispose();
          out.dispose();
        },
      };
    }
    case 'closedHat': {
      const hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 8000,
        octaves: 1.5,
      }).connect(out);
      hat.volume.value = -10;
      return {
        trigger: (time, v = 1) =>
          hat.triggerAttackRelease('C5', '32n', time, v),
        dispose: () => {
          hat.dispose();
          out.dispose();
        },
      };
    }
    case 'openHat': {
      const hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.3 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 7000,
        octaves: 1.5,
      }).connect(out);
      hat.volume.value = -12;
      return {
        trigger: (time, v = 1) =>
          hat.triggerAttackRelease('C5', '8n', time, v),
        dispose: () => {
          hat.dispose();
          out.dispose();
        },
      };
    }
    case 'clap': {
      const noise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      }).connect(out);
      return {
        trigger: (time, v = 1) => {
          noise.triggerAttackRelease('32n', time, v);
          noise.triggerAttackRelease('32n', time + 0.015, v * 0.8);
          noise.triggerAttackRelease('32n', time + 0.03, v * 0.6);
        },
        dispose: () => {
          noise.dispose();
          out.dispose();
        },
      };
    }
    case 'cowbell': {
      const bell = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.2, release: 0.1 },
        harmonicity: 3.1,
        modulationIndex: 22,
        resonance: 4000,
        octaves: 0.5,
      }).connect(out);
      bell.volume.value = -10;
      return {
        trigger: (time, v = 1) =>
          bell.triggerAttackRelease('A4', '16n', time, v),
        dispose: () => {
          bell.dispose();
          out.dispose();
        },
      };
    }
    case 'tom': {
      const tom = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.4 },
      }).connect(out);
      return {
        trigger: (time, v = 1) =>
          tom.triggerAttackRelease('A2', '8n', time, v),
        dispose: () => {
          tom.dispose();
          out.dispose();
        },
      };
    }
  }
}
