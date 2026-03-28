/** Convert linear gain 0..2 to dB display string */
export function volumeToDb(v: number): string {
  if (v <= 0) return "-inf";
  const db = 20 * Math.log10(v);
  return db >= 0 ? `+${db.toFixed(1)}` : db.toFixed(1);
}
