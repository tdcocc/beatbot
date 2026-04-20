'use client';

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useSequencer } from '../store';
import { TOTAL_STEPS, TRACK_ORDER, TrackId } from '../types';
import { createVoice, Voice } from './instruments';

let audioStarted = false;

export async function startAudio() {
  if (audioStarted) return;
  await Tone.start();
  audioStarted = true;
  if (typeof window !== 'undefined') {
    (window as unknown as { __Tone?: typeof Tone }).__Tone = Tone;
  }
}

export function useAudioEngine() {
  const voicesRef = useRef<Map<TrackId, Voice> | null>(null);
  const sequenceRef = useRef<Tone.Sequence<number> | null>(null);

  const isPlaying = useSequencer((s) => s.isPlaying);
  const bpm = useSequencer((s) => s.bpm);

  useEffect(() => {
    const master = Tone.getDestination();

    const voices = new Map<TrackId, Voice>();
    for (const id of TRACK_ORDER) {
      voices.set(id, createVoice(id, master));
    }
    voicesRef.current = voices;

    if (typeof window !== 'undefined') {
      (window as unknown as { __voices?: Map<TrackId, Voice> }).__voices = voices;
      (window as unknown as { __beep?: () => Promise<void> }).__beep = async () => {
        await Tone.start();
        const osc = new Tone.Oscillator(440, 'sine').toDestination();
        osc.volume.value = -6;
        osc.start();
        osc.stop('+0.4');
      };
    }

    const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i);
    const seq = new Tone.Sequence<number>(
      (time, step) => {
        const state = useSequencer.getState();
        for (const track of state.tracks) {
          if (track.muted) continue;
          if (track.steps[step]) {
            voices.get(track.id)?.trigger(time, track.volume);
          }
        }
        Tone.getDraw().schedule(() => {
          useSequencer.getState().setCurrentStep(step);
        }, time);
      },
      steps,
      '16n',
    );
    sequenceRef.current = seq;

    return () => {
      seq.dispose();
      voices.forEach((v) => v.dispose());
    };
  }, []);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    const transport = Tone.getTransport();
    const seq = sequenceRef.current;
    if (!seq) return;
    if (isPlaying) {
      transport.position = 0;
      seq.start(0);
      transport.start();
    } else {
      transport.stop();
      seq.stop();
    }
  }, [isPlaying]);
}
