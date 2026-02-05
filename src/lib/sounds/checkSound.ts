export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Satisfying soft "pop" check sound - inspired by popular productivity apps.
// Uses Web Audio API for instant playback.
export function playCheckSound(options: CheckSoundOptions = {}): void {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.5));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Soft "pop" - low frequency thump
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(400, now);
    pop.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    popGain.gain.setValueAtTime(0.5, now);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    pop.connect(popGain);
    popGain.connect(master);
    pop.start(now);
    pop.stop(now + 0.12);

    // Bright "tick" overlay - gives it that satisfying click
    const tick = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tick.type = "triangle";
    tick.frequency.setValueAtTime(1800, now);
    tick.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
    tickGain.gain.setValueAtTime(0.25, now);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    tick.connect(tickGain);
    tickGain.connect(master);
    tick.start(now);
    tick.stop(now + 0.06);

    // Gentle harmonic tail - warmth
    const tail = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tail.type = "sine";
    tail.frequency.setValueAtTime(600, now + 0.02);
    tailGain.gain.setValueAtTime(0.0001, now);
    tailGain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    tail.connect(tailGain);
    tailGain.connect(master);
    tail.start(now);
    tail.stop(now + 0.18);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 250);
  } catch {
    // best-effort; no-op
  }
}
