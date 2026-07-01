import { GAME_CONFIG } from "../../data/gameConfig.js";
import {
  clampMagnitude,
  distance,
  magnitudeSq,
  normalize,
  reflectVelocity,
  velocityFallbackNormal,
} from "./vectorMath.js";

export function resolveBulletWallBounce(bullet, bounds, config = GAME_CONFIG.bullet) {
  const impactSpeedSq = magnitudeSq({ x: bullet.vx, y: bullet.vy });
  let bounced = false;

  if (bullet.x < bullet.radius) {
    bullet.x = bullet.radius;
    bullet.vx = Math.abs(bullet.vx);
    bounced = true;
  }
  if (bullet.x > bounds.width - bullet.radius) {
    bullet.x = bounds.width - bullet.radius;
    bullet.vx = -Math.abs(bullet.vx);
    bounced = true;
  }
  if (bullet.y < bullet.radius) {
    bullet.y = bullet.radius;
    bullet.vy = Math.abs(bullet.vy);
    bounced = true;
  }
  if (bullet.y > bounds.height - bullet.radius) {
    bullet.y = bounds.height - bullet.radius;
    bullet.vy = -Math.abs(bullet.vy);
    bounced = true;
  }

  if (bounced) {
    const velocity = clampMagnitude(
      {
        x: bullet.vx * config.wallRestitution,
        y: bullet.vy * config.wallRestitution,
      },
      config.minWallBounceSpeed,
      config.maxBounceSpeed,
    );
    bullet.vx = velocity.x;
    bullet.vy = velocity.y;
  }

  return { bounced, impactSpeedSq };
}

export function resolvePlayerEnemyCollision({ player, enemy, effects }) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= player.radius + enemy.radius) {
    return { collided: false, playerKilled: false };
  }

  const normal = normalize({ x: dx, y: dy }, { x: 1, y: 0 });
  const playerKilled = player.hit();
  enemy.x -= normal.x * 20;
  enemy.y -= normal.y * 20;

  if (playerKilled || player.wasHitThisFrame) {
    effects.audio.hit();
    effects.addScreenShake(GAME_CONFIG.feedback.playerHitShake);
    effects.createParticles(player.x, player.y, 20, player.color);
    effects.freezeFrames(GAME_CONFIG.feedback.playerHitFreezeFrames);
  }

  return { collided: true, playerKilled };
}

export function resolveBulletEnemyCollision({ bullet, enemy, effects, config = GAME_CONFIG }) {
  if (!bullet.active || !enemy.active) return { hit: false, killed: false };

  const bulletSpeedSq = magnitudeSq({ x: bullet.vx, y: bullet.vy });
  if (bulletSpeedSq <= config.bullet.minDamageSpeedSq && !bullet.isRecalling) {
    return { hit: false, killed: false };
  }

  const hitRadius =
    enemy.radius +
    bullet.radius +
    (bullet.isRecalling ? config.bullet.recallHitPadding : 0);
  if (distance(enemy, bullet) >= hitRadius) {
    return { hit: false, killed: false };
  }
  if (!bullet.canHitEnemy(enemy.id)) {
    return { hit: false, killed: false, coolingDown: true };
  }

  bullet.setEnemyHitCooldown(enemy.id, config.bullet.enemyHitCooldownFrames);
  const killed = enemy.takeDamage();
  effects.createParticles(enemy.x, enemy.y, 5, enemy.color);

  if (killed) {
    enemy.active = false;
    bullet.vx *= config.bullet.killDamping;
    bullet.vy *= config.bullet.killDamping;
    effects.createParticles(enemy.x, enemy.y, 15, enemy.color);
    effects.audio.enemyDie();
    effects.addScore(enemy.scoreVal);
    effects.addScreenShake(config.feedback.enemyKillShake);
    effects.freezeFrames(config.feedback.enemyKillFreezeFrames);
    return { hit: true, killed: true };
  }

  reboundBulletFromEnemy(bullet, enemy, config.bullet);
  effects.audio.enemyHit();
  effects.addScreenShake(config.feedback.enemyHitShake);
  effects.freezeFrames(config.feedback.enemyHitFreezeFrames);
  return { hit: true, killed: false };
}

function reboundBulletFromEnemy(bullet, enemy, config) {
  const normal = normalize(
    { x: bullet.x - enemy.x, y: bullet.y - enemy.y },
    velocityFallbackNormal({ x: bullet.vx, y: bullet.vy }),
  );
  const reflected = reflectVelocity(
    { x: bullet.vx, y: bullet.vy },
    normal,
    config.enemyRestitution,
  );
  const clamped = clampMagnitude(reflected, config.minEnemyBounceSpeed, config.maxBounceSpeed);

  bullet.vx = clamped.x;
  bullet.vy = clamped.y;
  bullet.x = enemy.x + normal.x * (enemy.radius + bullet.radius + config.enemyHitSeparation);
  bullet.y = enemy.y + normal.y * (enemy.radius + bullet.radius + config.enemyHitSeparation);
}

