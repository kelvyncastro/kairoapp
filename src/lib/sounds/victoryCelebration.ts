export type VictoryCelebrationSoundOptions = {
  volume?: number; // 0..1
};

// Local (instant) celebration sound using Web Audio API.
// This avoids network/API latency so the sound can start with the animation.
export async function playVictoryCelebrationSound(
  options: VictoryCelebrationSoundOptions = {}
): Promise<void> {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();

    // Some browsers block autoplay; resume may still fail without user gesture.
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => undefined);
    }
    if (ctx.state !== "running") {
      // Autoplay blocked
      await ctx.close().catch(() => undefined);
      return;
    }

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, options.volume ?? 0.75));
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Epic victory fanfare - triumphant brass-like sound
    // Opening flourish (fast ascending notes)
    const flourish = [392, 440, 523.25, 587.33, 659.25]; // G4 A4 C5 D5 E5
    const flourishStep = 0.06;
    const flourishLen = 0.12;

    flourish.forEach((freq, i) => {
      const t = now + i * flourishStep;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + flourishLen);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + flourishLen + 0.02);
    });

    // Main victory chord hit (big brass-like chord)
    const chordStart = now + flourish.length * flourishStep + 0.05;
    const victoryChord = [261.63, 329.63, 392, 523.25, 659.25]; // C4 E4 G4 C5 E5
    
    victoryChord.forEach((freq) => {
      // Layer 1: Square wave for punch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, chordStart);
      gain.gain.setValueAtTime(0.0001, chordStart);
      gain.gain.exponentialRampToValueAtTime(0.15, chordStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.08, chordStart + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.8);
      osc.connect(gain);
      gain.connect(master);
      osc.start(chordStart);
      osc.stop(chordStart + 0.85);

      // Layer 2: Sawtooth for brightness
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(freq, chordStart);
      gain2.gain.setValueAtTime(0.0001, chordStart);
      gain2.gain.exponentialRampToValueAtTime(0.1, chordStart + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.05, chordStart + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.7);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(chordStart);
      osc2.stop(chordStart + 0.75);
    });

    // Cymbal/shimmer effect
    const shimmerStart = chordStart;
    const shimmerDur = 0.6;
    const shimmerSize = Math.floor(ctx.sampleRate * shimmerDur);
    const shimmerBuffer = ctx.createBuffer(1, shimmerSize, ctx.sampleRate);
    const shimmerData = shimmerBuffer.getChannelData(0);
    for (let i = 0; i < shimmerSize; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * 0.15));
      shimmerData[i] = (Math.random() * 2 - 1) * env * 0.4;
    }
    const shimmer = ctx.createBufferSource();
    shimmer.buffer = shimmerBuffer;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.3, shimmerStart);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, shimmerStart + shimmerDur);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(shimmerStart);
    shimmer.stop(shimmerStart + shimmerDur);

    // Second hit for emphasis (slightly delayed)
    const hit2Start = chordStart + 0.35;
    const hit2Notes = [392, 523.25, 783.99]; // G4 C5 G5
    hit2Notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, hit2Start);
      gain.gain.setValueAtTime(0.0001, hit2Start);
      gain.gain.exponentialRampToValueAtTime(0.2, hit2Start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, hit2Start + 0.5);
      osc.connect(gain);
      gain.connect(master);
      osc.start(hit2Start);
      osc.stop(hit2Start + 0.55);
    });

    // Final triumphant note
    const finalStart = chordStart + 0.7;
    const finalNotes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    finalNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, finalStart);
      gain.gain.setValueAtTime(0.0001, finalStart);
      gain.gain.exponentialRampToValueAtTime(0.12, finalStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.06, finalStart + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, finalStart + 1.0);
      osc.connect(gain);
      gain.connect(master);
      osc.start(finalStart);
      osc.stop(finalStart + 1.05);
    });

    // Cleanup
    const totalMs = 2200;
    window.setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, totalMs);
  } catch {
    // best-effort; no-op
  }
}
