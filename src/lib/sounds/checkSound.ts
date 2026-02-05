export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Soft, satisfying click - gentle and pleasant.
// Volume set to 15% for unobtrusive feedback.
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
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.15));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Soft "tock" - like a gentle wood tap
    const tock = ctx.createOscillator();
    const tockGain = ctx.createGain();
    tock.type = "sine";
    tock.frequency.setValueAtTime(800, now);
    tock.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    tockGain.gain.setValueAtTime(0.5, now);
    tockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    tock.connect(tockGain);
    tockGain.connect(master);
    tock.start(now);
    tock.stop(now + 0.08);

    // Soft resonance tail - warmth after click
    const tail = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tail.type = "sine";
    tail.frequency.setValueAtTime(440, now + 0.02); // A4
    tailGain.gain.setValueAtTime(0.0001, now);
    tailGain.gain.linearRampToValueAtTime(0.2, now + 0.03);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    tail.connect(tailGain);
    tailGain.connect(master);
    tail.start(now);
    tail.stop(now + 0.15);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 200);
  } catch {
    // best-effort; no-op
  }
}
