/**
 * Sons placeholders générés (bips), en attendant de vrais fichiers audio.
 * Chaque catégorie de notification a son propre son : on doit pouvoir jouer « à l'oreille ».
 */
export type SfxName =
  | 'notif.family'
  | 'notif.work'
  | 'notif.spam'
  | 'notif.dating'
  | 'notif.social'
  | 'notif.system'
  | 'correct'
  | 'wrong'
  | 'expired'
  | 'collision'
  | 'nearMiss'
  | 'pickup'
  | 'phone'
  | 'lane';

type Note = [frequency: number, duration: number, type?: OscillatorType];

const SOUNDS: Record<SfxName, Note[]> = {
  'notif.family': [
    [880, 0.08],
    [1175, 0.12],
  ],
  'notif.work': [
    [440, 0.1, 'square'],
    [440, 0.1, 'square'],
  ],
  'notif.spam': [[1500, 0.05, 'sawtooth']],
  'notif.dating': [
    [660, 0.07],
    [990, 0.07],
    [1320, 0.1],
  ],
  'notif.social': [
    [740, 0.06],
    [740, 0.06],
  ],
  'notif.system': [[520, 0.15, 'triangle']],
  correct: [
    [1046, 0.06],
    [1568, 0.08],
  ],
  wrong: [[180, 0.18, 'square']],
  expired: [
    [300, 0.12, 'triangle'],
    [220, 0.15, 'triangle'],
  ],
  collision: [[90, 0.25, 'sawtooth']],
  nearMiss: [
    [1200, 0.04],
    [1600, 0.05],
  ],
  pickup: [
    [784, 0.06],
    [1046, 0.06],
    [1318, 0.1],
  ],
  phone: [[600, 0.03, 'triangle']],
  lane: [[400, 0.02, 'triangle']],
};

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

/** À appeler lors d'un geste du joueur (les navigateurs bloquent l'audio avant). */
export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function playSfx(name: SfxName, volume = 0.15): void {
  if (muted || !ctx || ctx.state !== 'running') return;
  let t = ctx.currentTime;
  for (const [frequency, duration, type = 'sine'] of SOUNDS[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
    t += duration * 0.9;
  }
}
