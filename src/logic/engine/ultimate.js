import { GAME_CONFIG } from "../../data/gameConfig.js";

const EMPTY_EFFECTS = Object.freeze({
  addScore() {},
  addScreenShake() {},
  createParticles() {},
  freezeFrames() {},
});

export function createUltimateState({ charges = 0, config = GAME_CONFIG.ultimate } = {}) {
  let currentCharges = clampInteger(charges, 0, config.maxCharges);

  return {
    getCharges: () => currentCharges,
    getState: () => ({
      charges: currentCharges,
      maxCharges: config.maxCharges,
      canUse: currentCharges > 0,
    }),
    reset: (nextCharges = charges) => {
      currentCharges = clampInteger(nextCharges, 0, config.maxCharges);
      return currentCharges;
    },
    consume: () => {
      if (currentCharges <= 0) return false;
      currentCharges -= 1;
      return true;
    },
  };
}

export function resolveRadialClear({
  origin,
  enemies = [],
  projectiles = [],
  effects = EMPTY_EFFECTS,
  config = GAME_CONFIG,
} = {}) {
  const ultimateConfig = config.ultimate ?? GAME_CONFIG.ultimate;
  const feedbackConfig = config.feedback ?? GAME_CONFIG.feedback;
  const result = {
    enemiesCleared: 0,
    projectilesCleared: 0,
  };

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    if (!enemy?.active || !isWithinRadius(origin, enemy, ultimateConfig.radius)) continue;

    enemy.active = false;
    enemies.splice(i, 1);
    result.enemiesCleared += 1;
    effects.createParticles?.(enemy.x, enemy.y, 10, enemy.color);
    if (ultimateConfig.scoreClearedEnemies) {
      effects.addScore?.(enemy.scoreVal);
    }
  }

  const projectileRadius = ultimateConfig.radius + ultimateConfig.projectileClearRadiusBonus;
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    if (!projectile?.active || !isWithinRadius(origin, projectile, projectileRadius)) continue;

    projectile.active = false;
    projectiles.splice(i, 1);
    result.projectilesCleared += 1;
    effects.createParticles?.(projectile.x, projectile.y, 5, projectile.color);
  }

  effects.createParticles?.(origin.x, origin.y, ultimateConfig.particleCount, ultimateConfig.color);
  if (result.enemiesCleared > 0 || result.projectilesCleared > 0) {
    effects.addScreenShake?.(feedbackConfig.enemyKillShake + result.projectilesCleared);
    effects.freezeFrames?.(feedbackConfig.enemyKillFreezeFrames);
  }

  return result;
}

function isWithinRadius(origin, target, radius) {
  if (!origin || !target) return false;
  return Math.hypot(target.x - origin.x, target.y - origin.y) <= radius;
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(Number(value))) return min;
  return Math.max(min, Math.min(max, Math.floor(Number(value))));
}
