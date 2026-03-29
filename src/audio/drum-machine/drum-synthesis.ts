/**
 * Synthesize TR-808 drum sounds programmatically using OfflineAudioContext.
 * Generates short AudioBuffers (~0.5s) for each drum instrument.
 * Based on docs/research/development/web-audio/synthesizer-dsp-fundamentals.md Section 4.6.
 */

import type { DrumInstrumentId } from "./drum-types";

const SAMPLE_RATE = 44100;
const BUFFER_DURATION = 0.8; // seconds - enough for longest decay

/** Render an OfflineAudioContext to an AudioBuffer, then copy to target context. */
async function renderOffline(
  targetCtx: AudioContext,
  duration: number,
  build: (ctx: OfflineAudioContext) => void,
): Promise<AudioBuffer> {
  const length = Math.ceil(duration * SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);
  build(offline);
  const rendered = await offline.startRendering();
  // Copy to target context's sample rate
  if (targetCtx.sampleRate === SAMPLE_RATE) return rendered;
  const out = targetCtx.createBuffer(1, length, SAMPLE_RATE);
  out.copyToChannel(rendered.getChannelData(0), 0);
  return out;
}

/** Bass Drum: sine oscillator with exponential pitch sweep + click transient */
function buildBassDrum(ctx: OfflineAudioContext): void {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, 0);
  osc.frequency.exponentialRampToValueAtTime(50, 0.04);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, 0);
  gain.gain.exponentialRampToValueAtTime(0.001, 0.5);

  // Click transient
  const clickOsc = ctx.createOscillator();
  clickOsc.type = "square";
  clickOsc.frequency.setValueAtTime(800, 0);
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.3, 0);
  clickGain.gain.exponentialRampToValueAtTime(0.001, 0.005);
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(0);
  clickOsc.stop(0.01);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(0.6);
}

/** Snare: sine tone + filtered white noise */
function buildSnare(ctx: OfflineAudioContext): void {
  // Tonal component: 180Hz sine
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, 0);
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.7, 0);
  toneGain.gain.exponentialRampToValueAtTime(0.001, 0.1);
  osc.connect(toneGain);
  toneGain.connect(ctx.destination);
  osc.start(0);
  osc.stop(0.15);

  // Noise component: white noise through bandpass
  const bufferSize = Math.ceil(0.3 * SAMPLE_RATE);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, SAMPLE_RATE);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 1.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.5, 0);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, 0.2);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(0);
}

/** Hi-hat (closed or open): 6 inharmonic square oscillators + highpass */
function buildHiHat(ctx: OfflineAudioContext, open: boolean): void {
  const ratios = [1.0, 1.342, 1.563, 1.842, 2.127, 2.537];
  const baseFreq = 400;
  const decayTime = open ? 0.4 : 0.04;

  const mergeGain = ctx.createGain();
  mergeGain.gain.value = 1 / 6;

  for (const ratio of ratios) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = baseFreq * ratio;
    osc.connect(mergeGain);
    osc.start(0);
    osc.stop(decayTime + 0.05);
  }

  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 8000;

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.6, 0);
  envGain.gain.exponentialRampToValueAtTime(0.001, decayTime);

  mergeGain.connect(hpf);
  hpf.connect(envGain);
  envGain.connect(ctx.destination);
}

/** Clap: 4 rapid noise bursts through bandpass */
function buildClap(ctx: OfflineAudioContext): void {
  const burstTimes = [0, 0.008, 0.016, 0.024];
  const bufferSize = Math.ceil(0.5 * SAMPLE_RATE);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, SAMPLE_RATE);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 1;

  for (let b = 0; b < burstTimes.length; b++) {
    const t = burstTimes[b] ?? 0;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const gain = ctx.createGain();
    const isLast = b === burstTimes.length - 1;
    const decay = isLast ? 0.3 : 0.01;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);
    noise.connect(gain);
    gain.connect(filter);
    noise.start(t);
    noise.stop(t + decay + 0.01);
  }

  filter.connect(ctx.destination);
}

/** Tom: pitch-enveloped sine (different freq range per tom) */
function buildTom(
  ctx: OfflineAudioContext,
  startFreq: number,
  endFreq: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(startFreq, 0);
  osc.frequency.exponentialRampToValueAtTime(endFreq, 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, 0);
  gain.gain.exponentialRampToValueAtTime(0.001, 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(0.5);
}

/** Rimshot: brief noise burst + short sine tone */
function buildRimshot(ctx: OfflineAudioContext): void {
  // Noise burst
  const bufferSize = Math.ceil(0.05 * SAMPLE_RATE);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, SAMPLE_RATE);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 5000;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, 0);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, 0.005);
  noise.connect(hpf);
  hpf.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(0);

  // Sine tone
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 300;
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.4, 0);
  toneGain.gain.exponentialRampToValueAtTime(0.001, 0.01);
  osc.connect(toneGain);
  toneGain.connect(ctx.destination);
  osc.start(0);
  osc.stop(0.02);
}

/** Cowbell: two square oscillators at 540 Hz and 800 Hz */
function buildCowbell(ctx: OfflineAudioContext): void {
  const osc1 = ctx.createOscillator();
  osc1.type = "square";
  osc1.frequency.value = 540;
  const osc2 = ctx.createOscillator();
  osc2.type = "square";
  osc2.frequency.value = 800;

  const mergeGain = ctx.createGain();
  mergeGain.gain.value = 0.5;
  osc1.connect(mergeGain);
  osc2.connect(mergeGain);

  const bpf = ctx.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.value = 700;
  bpf.Q.value = 3;

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.6, 0);
  envGain.gain.exponentialRampToValueAtTime(0.001, 0.15);

  mergeGain.connect(bpf);
  bpf.connect(envGain);
  envGain.connect(ctx.destination);
  osc1.start(0);
  osc2.start(0);
  osc1.stop(0.2);
  osc2.stop(0.2);
}

/** Cymbal: dense inharmonic oscillators + highpass, long decay */
function buildCymbal(ctx: OfflineAudioContext): void {
  const ratios = [1.0, 1.342, 1.563, 1.842, 2.127, 2.537, 3.174, 3.862];
  const baseFreq = 500;

  const mergeGain = ctx.createGain();
  mergeGain.gain.value = 1 / ratios.length;

  for (const ratio of ratios) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = baseFreq * ratio;
    osc.connect(mergeGain);
    osc.start(0);
    osc.stop(0.75);
  }

  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 6000;

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.4, 0);
  envGain.gain.exponentialRampToValueAtTime(0.001, 0.7);

  mergeGain.connect(hpf);
  hpf.connect(envGain);
  envGain.connect(ctx.destination);
}

const builders: Record<DrumInstrumentId, (ctx: OfflineAudioContext) => void> = {
  bd: buildBassDrum,
  sd: buildSnare,
  ch: (ctx) => {
    buildHiHat(ctx, false);
  },
  oh: (ctx) => {
    buildHiHat(ctx, true);
  },
  cp: buildClap,
  lt: (ctx) => {
    buildTom(ctx, 120, 60);
  },
  mt: (ctx) => {
    buildTom(ctx, 180, 90);
  },
  ht: (ctx) => {
    buildTom(ctx, 260, 130);
  },
  rs: buildRimshot,
  cb: buildCowbell,
  cy: buildCymbal,
};

/**
 * Synthesize all 808 drum samples. Returns a Map of AudioBuffers keyed by instrument ID.
 */
export async function synthesize808Samples(
  ctx: AudioContext,
): Promise<Map<DrumInstrumentId, AudioBuffer>> {
  const samples = new Map<DrumInstrumentId, AudioBuffer>();
  const ids = Object.keys(builders) as DrumInstrumentId[];

  // Render all samples in parallel
  const results = await Promise.all(
    ids.map(async (id) => {
      const buffer = await renderOffline(ctx, BUFFER_DURATION, builders[id]);
      return [id, buffer] as const;
    }),
  );

  for (const [id, buffer] of results) {
    samples.set(id, buffer);
  }
  return samples;
}
