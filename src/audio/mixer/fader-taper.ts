/**
 * Quadratic fader taper: attempt to model a real mixing console fader.
 * Maps linear 0..2 -> gain curve.
 * 0 -> 0 (silence), 1 -> 1 (unity), 2 -> 2 (boost)
 */
export function faderTaper(linear: number): number {
  if (linear <= 0) return 0;
  if (linear <= 1) return linear * linear;
  return 1 + (linear - 1);
}
