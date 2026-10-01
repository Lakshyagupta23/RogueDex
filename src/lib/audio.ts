let audioCtx: AudioContext | null = null;
let ambientInterval: NodeJS.Timeout | null = null;
let ambientOscillators: OscillatorNode[] = [];
let ambientGains: GainNode[] = [];

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playHoverTick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

export function playSelectClick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playLockIn() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Play two quick rising notes
  [0, 0.1].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 * (i + 1.5), ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.1);
  });
}

export function playRevealChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 1);
}

export function playPokemonCry(pokemonId: number) {
  if (typeof window === 'undefined') return;
  
  const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`);
  audio.volume = 0.5;
  audio.play().catch(e => console.error("Failed to play pokemon cry", e));
}

export function playHeistAlarm() {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Dramatic pulsing alarm: 3 descending blurps
  const freqs = [280, 220, 180];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.22;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.18);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  });
}

export function playStealSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Quick swoosh down (steal/grab feeling)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

// ---- AMBIENT PROCEDURAL BACKGROUND MUSIC ----
const CHORDS = [
  [220.00, 277.18, 329.63], // A Major
  [196.00, 246.94, 293.66], // G Major
  [174.61, 220.00, 261.63], // F Major
  [164.81, 196.00, 246.94], // E Minor
];

export function startAmbientMusic() {
  const ctx = getAudioContext();
  if (!ctx || ambientInterval) return;
  
  if (ctx.state === 'suspended') ctx.resume();

  let chordIndex = 0;
  
  const playChord = () => {
    const chord = CHORDS[chordIndex];
    chordIndex = (chordIndex + 1) % CHORDS.length;
    
    // Clear old oscillators
    ambientOscillators.forEach(o => o.stop(ctx.currentTime + 2));
    ambientOscillators = [];
    ambientGains = [];
    
    chord.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Slow fade in and out for ambient feel
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2); // very quiet
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      
      ambientOscillators.push(osc);
      ambientGains.push(gain);
    });
  };
  
  playChord();
  ambientInterval = setInterval(playChord, 5000);
}

export function stopAmbientMusic() {
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
  const ctx = getAudioContext();
  if (ctx) {
    ambientOscillators.forEach(o => {
      try { o.stop(ctx.currentTime + 1); } catch (e) {}
    });
    ambientGains.forEach(g => {
      try { g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); } catch (e) {}
    });
  }
  ambientOscillators = [];
  ambientGains = [];
}
