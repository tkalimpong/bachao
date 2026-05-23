/** Short coin-clink via Web Audio (no asset file). */
export function playCoinSound(count = 3): void {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < count; i++) {
      const t = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const base = 720 + Math.random() * 280;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.06);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    }
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* autoplay blocked or unsupported */
  }
}
