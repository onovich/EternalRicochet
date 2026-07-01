import { GAME_CONFIG } from "../../data/gameConfig.js";

export function resolveDevStressSeed({
  enabled = false,
  search = "",
  config = GAME_CONFIG.performance.stressSeed,
} = {}) {
  if (!enabled) return createDisabledSeed(config);

  let params;
  try {
    params = new URLSearchParams(search);
  } catch {
    return createDisabledSeed(config);
  }

  if (params.get("erStress") !== "1") return createDisabledSeed(config);

  return {
    enabled: true,
    enemies: readCount(params, "erStressEnemies", config.enemies, config.maxEnemies),
    projectiles: readCount(
      params,
      "erStressProjectiles",
      config.projectiles,
      config.maxProjectiles,
    ),
    particles: readCount(params, "erStressParticles", config.particles, config.maxParticles),
  };
}

function createDisabledSeed(config) {
  return {
    enabled: false,
    enemies: 0,
    projectiles: 0,
    particles: 0,
    maxEnemies: config.maxEnemies,
    maxProjectiles: config.maxProjectiles,
    maxParticles: config.maxParticles,
  };
}

function readCount(params, key, fallback, max) {
  const value = params.get(key);
  if (value === null) return clampCount(fallback, max);
  return clampCount(value, max);
}

function clampCount(value, max) {
  return Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
}
