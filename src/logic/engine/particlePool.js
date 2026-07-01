import { GAME_CONFIG } from "../../data/gameConfig.js";
import { Particle } from "./entities.js";

export function createParticlePool({
  capacity = 420,
  config = GAME_CONFIG.particles,
} = {}) {
  const active = [];
  const inactive = [];
  let created = 0;
  let emitted = 0;
  let dropped = 0;
  let recycled = 0;

  function emit(x, y, count, color) {
    let emittedNow = 0;
    let droppedNow = 0;
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));

    for (let i = 0; i < safeCount; i += 1) {
      if (active.length >= capacity) {
        dropped += 1;
        droppedNow += 1;
        continue;
      }

      const particle = inactive.pop();
      const nextParticle = particle ?? createParticle(x, y, color);
      if (particle) {
        particle.reset(x, y, color, config);
      }
      active.push(nextParticle);
      emitted += 1;
      emittedNow += 1;
    }

    return { emitted: emittedNow, dropped: droppedNow };
  }

  function update() {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const particle = active[i];
      particle.update();
      if (!particle.active) {
        active.splice(i, 1);
        inactive.push(particle);
        recycled += 1;
      }
    }
  }

  function reset() {
    while (active.length > 0) {
      const particle = active.pop();
      particle.active = false;
      inactive.push(particle);
    }
  }

  function getStats() {
    return {
      capacity,
      active: active.length,
      inactive: inactive.length,
      created,
      emitted,
      dropped,
      recycled,
    };
  }

  function createParticle(x, y, color) {
    created += 1;
    return new Particle(x, y, color, config);
  }

  return { active, emit, update, reset, getStats };
}
