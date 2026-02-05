export type CheckSoundOptions = {
  volume?: number; // 0..1
};

// Gentle "blip" - soft digital confirmation.
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

    // Soft ascending blip - gentle two-tone
    const note1 = ctx.createOscillator();
    const note1Gain = ctx.createGain();
    note1.type = "sine";
    note1.frequency.setValueAtTime(587, now); // D5
    note1Gain.gain.setValueAtTime(0.3, now);
    note1Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    note1.connect(note1Gain);
    note1Gain.connect(master);
    note1.start(now);
    note1.stop(now + 0.1);

    // Second note - slightly higher, delayed
    const note2 = ctx.createOscillator();
    const note2Gain = ctx.createGain();
    note2.type = "sine";
    note2.frequency.setValueAtTime(784, now + 0.06); // G5
    note2Gain.gain.setValueAtTime(0.0001, now);
    note2Gain.gain.linearRampToValueAtTime(0.25, now + 0.06);
    note2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    note2.connect(note2Gain);
    note2Gain.connect(master);
    note2.start(now);
    note2.stop(now + 0.18);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 200);
  } catch {
    // best-effort; no-op
  }
}
