import { GAME_CONFIG } from "../../data/gameConfig.js";
import { Bullet } from "./entities.js";

export function createBulletPool({
  total = GAME_CONFIG.bullet.baseCount,
  config = GAME_CONFIG.bullet,
} = {}) {
  const safeTotal = clampInteger(total, 1, config.maxCount ?? total);
  const bullets = Array.from({ length: safeTotal }, (_, index) => {
    const bullet = new Bullet(config);
    bullet.id = `bullet-${index + 1}`;
    return bullet;
  });

  function getActive() {
    return bullets.filter((bullet) => bullet.active);
  }

  function getAvailable() {
    return bullets.find((bullet) => !bullet.active) ?? null;
  }

  function getAmmoState() {
    const active = getActive().length;
    return {
      active,
      available: bullets.length - active,
      total: bullets.length,
    };
  }

  return {
    bullets,
    getActive,
    getAvailable,
    getAmmoState,
    hasAvailable: () => getAvailable() !== null,
    getPrimary: () => bullets[0] ?? new Bullet(config),
  };
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(Number(value))) return min;
  return Math.max(min, Math.min(max, Math.floor(Number(value))));
}
