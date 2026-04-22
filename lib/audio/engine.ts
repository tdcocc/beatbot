'use client';

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useSequencer } from '../store';
import { TOTAL_STEPS, TRACK_ORDER, TrackId } from '../types';
import { createVoice, Voice } from './instruments';

let silentAudio: HTMLAudioElement | null = null;

// iOS Safari routes Web Audio through the "ambient" audio session by default,
// which honors the physical silent/ring switch. Playing a looping silent
// HTMLAudioElement inside the user gesture switches the session to "playback",
// so Tone.js output is audible even with the ring switch flipped to silent.
function createSilentAudio(): HTMLAudioElement {
  const sampleRate = 8000;
  const durationSec = 1;
  const numSamples = sampleRate * durationSec;
  const bufferSize = 44 + numSamples * 2;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  // Sample bytes are already zero = silence.

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const audio = new Audio(URL.createObjectURL(blob));
  audio.loop = true;
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  audio.setAttribute('x-webkit-airplay', 'deny');
  return audio;
}

export async function startAudio() {
  // Called on every user gesture (play, stop, generate, cell tap). Must be
  // idempotent and always re-resume the context — iOS Safari suspends the
  // AudioContext in the background and after periods of inactivity.
  if (typeof window !== 'undefined') {
    // Silent-audio unlock (iOS silent switch bypass) — create once,
    // keep playing.
    if (!silentAudio) {
      try {
        silentAudio = createSilentAudio();
      } catch {
        // not critical
      }
    }
    if (silentAudio && silentAudio.paused) {
      void silentAudio.play().catch(() => {});
    }
  }

  // Tone.start() is idempotent: if the context is already running this is
  // a no-op; if it was suspended (iOS backgrounding, page hidden, etc.)
  // this re-resumes it within the user gesture.
  await Tone.start();

  if (typeof window !== 'undefined') {
    (window as unknown as { __Tone?: typeof Tone }).__Tone = Tone;
  }
}

export function useAudioEngine() {
  const voicesRef = useRef<Map<TrackId, Voice> | null>(null);
  const sequenceRef = useRef<Tone.Sequence<number> | null>(null);

  const isPlaying = useSequencer((s) => s.isPlaying);
  const bpm = useSequencer((s) => s.bpm);
  const patternNonce = useSequencer((s) => s.patternNonce);

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
        let fired = 0;
        for (const track of state.tracks) {
          if (track.muted) continue;
          if (track.steps[step]) {
            voices.get(track.id)?.trigger(time, track.volume);
            fired += 1;
          }
        }
        if (step === 0) {
          console.log('[beatbot] step0', {
            fired,
            bpm: Tone.getTransport().bpm.value,
            time: time.toFixed(3),
          });
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
    console.log('[beatbot] effect fired', {
      isPlaying,
      patternNonce,
      hasSeq: !!seq,
      ctxState: Tone.getContext().state,
      transportState: transport.state,
    });
    if (!seq) return;
    try {
      if (isPlaying) {
        // Start the sequence once, never re-start it — re-starting while
        // stopping in the same tick races Tone's internal state machine and
        // leaves the scheduler wedged (symptom: transport.state === 'started'
        // but no step triggers fire).
        if (seq.state !== 'started') {
          seq.start(0);
        }
        // Jumping position to 0 while transport runs restarts at step 0 of
        // whatever pattern is currently in state. No stop needed.
        transport.position = 0;
        if (transport.state !== 'started') {
          transport.start();
        }
        console.log('[beatbot] started', {
          seqState: seq.state,
          transportState: transport.state,
        });
      } else {
        if (transport.state === 'started') {
          transport.stop();
        }
        console.log('[beatbot] stopped');
      }
    } catch (err) {
      console.error('[beatbot] transport toggle failed', err);
    }
  }, [isPlaying, patternNonce]);
}
