const EMPTY_COUNTS = Object.freeze({
  enemies: 0,
  obstacles: 0,
  projectiles: 0,
  particles: 0,
  bulletActive: 0,
});

export function createPerformanceMetrics({
  sampleSize = 120,
  now = () => performance.now(),
} = {}) {
  const samples = [];
  let frameCount = 0;
  let frameStart = 0;
  let lastFrameMs = 0;
  let totalFrameMs = 0;
  let worstFrameMs = 0;
  let counts = { ...EMPTY_COUNTS };
  let qualityTier = "high";

  function beginFrame() {
    frameStart = safeNow(now);
  }

  function endFrame(snapshot = {}) {
    return recordFrame(Math.max(0, safeNow(now) - frameStart), snapshot);
  }

  function recordFrame(frameMs, snapshot = {}) {
    const safeFrameMs = Math.max(0, Number(frameMs) || 0);
    frameCount += 1;
    lastFrameMs = safeFrameMs;
    totalFrameMs += safeFrameMs;
    samples.push(safeFrameMs);

    while (samples.length > sampleSize) {
      totalFrameMs -= samples.shift();
    }

    worstFrameMs = samples.reduce((max, value) => Math.max(max, value), 0);
    counts = normalizeCounts(snapshot.counts);
    if (snapshot.qualityTier) qualityTier = snapshot.qualityTier;
    return getState();
  }

  function reset() {
    samples.length = 0;
    frameCount = 0;
    frameStart = 0;
    lastFrameMs = 0;
    totalFrameMs = 0;
    worstFrameMs = 0;
    counts = { ...EMPTY_COUNTS };
    qualityTier = "high";
  }

  function getState() {
    return {
      frameCount,
      sampleSize: samples.length,
      lastFrameMs: roundMetric(lastFrameMs),
      averageFrameMs: roundMetric(samples.length ? totalFrameMs / samples.length : 0),
      worstFrameMs: roundMetric(worstFrameMs),
      counts: { ...counts },
      qualityTier,
    };
  }

  return { beginFrame, endFrame, recordFrame, reset, getState };
}

function normalizeCounts(counts = EMPTY_COUNTS) {
  return {
    enemies: toCount(counts.enemies),
    obstacles: toCount(counts.obstacles),
    projectiles: toCount(counts.projectiles),
    particles: toCount(counts.particles),
    bulletActive: counts.bulletActive ? 1 : 0,
  };
}

function toCount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function roundMetric(value) {
  return Math.round(value * 100) / 100;
}

function safeNow(now) {
  try {
    return Number(now()) || 0;
  } catch {
    return 0;
  }
}
