export function createAudioSystem({ getGameState, windowRef = window }) {
  const AudioContextCtor = windowRef.AudioContext || windowRef.webkitAudioContext;
  let audioCtx;

  function init() {
    if (!AudioContextCtor) return;
    if (!audioCtx) {
      audioCtx = new AudioContextCtor();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, vol, slideFreq = null) {
    if (!audioCtx || getGameState() === "MENU") return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  return {
    init,
    sfx: {
      shoot: () => playTone(800, "square", 0.15, 0.1, 150),
      bounce: () => playTone(1200, "sine", 0.05, 0.05),
      recall: () => playTone(200, "triangle", 0.2, 0.1, 900),
      collect: () => playTone(600, "sine", 0.15, 0.1, 1200),
      hit: () => playTone(150, "sawtooth", 0.4, 0.2, 40),
      enemyDie: () => playTone(100, "square", 0.2, 0.05, 20),
      enemyHit: () => playTone(300, "triangle", 0.1, 0.05, 100),
    },
  };
}

