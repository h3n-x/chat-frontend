/**
 * Web Audio API Digital Signal Processing (DSP) Voice Scrambler.
 * Alters biometric voice characteristics (pitch, formants, frequency distribution)
 * in real-time before MediaRecorder captures the stream.
 */

export type VoiceEffect = 'natural' | 'robot' | 'radio' | 'deep';

export interface VoiceProfile {
  id: VoiceEffect;
  label: string;
  icon: string;
  description: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'natural',
    label: 'Natural',
    icon: '🎭',
    description: 'Voz directa sin distorsión',
  },
  {
    id: 'deep',
    label: 'Grave',
    icon: '👤',
    description: 'Filtro resonante profundo (testigo protegido)',
  },
  {
    id: 'robot',
    label: 'Robot',
    icon: '🤖',
    description: 'Modulación en anillo a 65Hz (destruye formantes)',
  },
  {
    id: 'radio',
    label: 'Radio',
    icon: '📻',
    description: 'Paso banda militar 400-3200Hz con overdrive',
  },
];

function makeDistortionCurve(amount = 20): Float32Array {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function setupVoiceDsp(
  stream: MediaStream,
  effect: VoiceEffect
): { destinationStream: MediaStream; cleanup: () => void } {
  if (effect === 'natural' || typeof window === 'undefined') {
    return {
      destinationStream: stream,
      cleanup: () => {},
    };
  }

  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtxClass) {
    return { destinationStream: stream, cleanup: () => {} };
  }

  const ctx = new AudioCtxClass();
  const source = ctx.createMediaStreamSource(stream);
  const destination = ctx.createMediaStreamDestination();
  const cleanupNodes: (() => void)[] = [];

  if (effect === 'robot') {
    // Ring Modulator (Carrier Oscillator multiplying input signal via GainNode)
    const carrier = ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(65, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);

    carrier.connect(gainNode);
    source.connect(gainNode.gain);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(15) as Float32Array<ArrayBuffer>;
    shaper.oversample = '4x';

    gainNode.connect(shaper);
    shaper.connect(destination);

    carrier.start();
    cleanupNodes.push(() => {
      try {
        carrier.stop();
      } catch {}
    });
  } else if (effect === 'radio') {
    // Walkie-Talkie / Military Radio Bandpass + Saturation
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(400, ctx.currentTime);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.0, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, ctx.currentTime);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(25) as Float32Array<ArrayBuffer>;

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(shaper);
    shaper.connect(destination);
  } else if (effect === 'deep') {
    // Deep resonant filter (Protected witness mode)
    const bassBoost = ctx.createBiquadFilter();
    bassBoost.type = 'lowshelf';
    bassBoost.frequency.setValueAtTime(220, ctx.currentTime);
    bassBoost.gain.setValueAtTime(8, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(360, ctx.currentTime);
    lowpass.Q.setValueAtTime(2.8, ctx.currentTime);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(10) as Float32Array<ArrayBuffer>;

    source.connect(bassBoost);
    bassBoost.connect(lowpass);
    lowpass.connect(shaper);
    shaper.connect(destination);
  }

  return {
    destinationStream: destination.stream,
    cleanup: () => {
      cleanupNodes.forEach((fn) => fn());
      ctx.close().catch(() => {});
    },
  };
}
