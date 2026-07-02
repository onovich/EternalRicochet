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
  const hitResult = player.hit();
  enemy.x -= normal.x * 20;
  enemy.y -= normal.y * 20;

  if (hitResult.tookDamage) {
    effects.audio.hit();
    effects.addScreenShake(GAME_CONFIG.feedback.playerHitShake);
    effects.createParticles(player.x, player.y, 20, player.color);
    effects.freezeFrames(GAME_CONFIG.feedback.playerHitFreezeFrames);
  }

  return { collided: true, playerKilled: hitResult.killed };
}

export function resolveCircleObstacleSeparation(entity, obstacle, padding = 0) {
  const minDistance = entity.radius + obstacle.radius + padding;
  const dx = entity.x - obstacle.x;
  const dy = entity.y - obstacle.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= minDistance) {
    return { separated: false };
  }

  const normal = normalize({ x: dx, y: dy }, { x: 1, y: 0 });
  const push = minDistance - dist;
  entity.x += normal.x * push;
  entity.y += normal.y * push;
  return { separated: true, normal };
}

export function resolveBulletObstacleCollision({ bullet, obstacle, config = GAME_CONFIG }) {
  if (!bullet.active) return { bounced: false };

  const minDistance = bullet.radius + obstacle.radius;
  if (distance(bullet, obstacle) >= minDistance) {
    return { bounced: false };
  }

  const normal = normalize(
    { x: bullet.x - obstacle.x, y: bullet.y - obstacle.y },
    velocityFallbackNormal({ x: bullet.vx, y: bullet.vy }),
  );
  const obstacleVelocity = { x: obstacle.vx ?? 0, y: obstacle.vy ?? 0 };
  const relativeVelocity = {
    x: bullet.vx - obstacleVelocity.x,
    y: bullet.vy - obstacleVelocity.y,
  };
  const reflected = reflectVelocity(
    relativeVelocity,
    normal,
    obstacle.restitution ?? config.obstacles.restitution,
  );
  const clamped = clampMagnitude(
    reflected,
    obstacle.minBounceSpeed ?? config.obstacles.minBounceSpeed,
    config.bullet.maxBounceSpeed,
  );

  bullet.vx = clamped.x + obstacleVelocity.x;
  bullet.vy = clamped.y + obstacleVelocity.y;
  bullet.x = obstacle.x + normal.x * minDistance;
  bullet.y = obstacle.y + normal.y * minDistance;
  return { bounced: true };
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

export function resolveProjectileWallCollision(projectile, bounds, config = GAME_CONFIG.enemyProjectile) {
  if (!projectile.active) return { bounced: false, destroyed: false };

  let bounced = false;
  if (projectile.x < projectile.radius) {
    projectile.x = projectile.radius;
    projectile.vx = Math.abs(projectile.vx);
    bounced = true;
  }
  if (projectile.x > bounds.width - projectile.radius) {
    projectile.x = bounds.width - projectile.radius;
    projectile.vx = -Math.abs(projectile.vx);
    bounced = true;
  }
  if (projectile.y < projectile.radius) {
    projectile.y = projectile.radius;
    projectile.vy = Math.abs(projectile.vy);
    bounced = true;
  }
  if (projectile.y > bounds.height - projectile.radius) {
    projectile.y = bounds.height - projectile.radius;
    projectile.vy = -Math.abs(projectile.vy);
    bounced = true;
  }

  if (!bounced) return { bounced: false, destroyed: false };

  projectile.wallBounces += 1;
  if (projectile.wallBounces > config.maxWallBounces) {
    projectile.active = false;
    return { bounced: true, destroyed: true };
  }

  projectile.vx *= config.wallRestitution;
  projectile.vy *= config.wallRestitution;
  return { bounced: true, destroyed: false };
}

export function resolveProjectileObstacleCollision(projectile, obstacle, config = GAME_CONFIG.enemyProjectile) {
  if (!projectile.active) return { hit: false };

  const minDistance = projectile.radius + obstacle.radius;
  if (distance(projectile, obstacle) >= minDistance) {
    return { hit: false };
  }

  if (config.obstacleBehavior === "destroy") {
    projectile.active = false;
    return { hit: true, destroyed: true };
  }

  const normal = normalize(
    { x: projectile.x - obstacle.x, y: projectile.y - obstacle.y },
    velocityFallbackNormal({ x: projectile.vx, y: projectile.vy }),
  );
  const reflected = reflectVelocity({ x: projectile.vx, y: projectile.vy }, normal, config.wallRestitution);
  projectile.vx = reflected.x;
  projectile.vy = reflected.y;
  projectile.x = obstacle.x + normal.x * minDistance;
  projectile.y = obstacle.y + normal.y * minDistance;
  return { hit: true, destroyed: false };
}

export function resolvePlayerProjectileCollision({ player, projectile, effects, config = GAME_CONFIG }) {
  if (!projectile.active) return { hit: false, playerKilled: false };
  if (distance(player, projectile) >= player.radius + projectile.radius) {
    return { hit: false, playerKilled: false };
  }

  projectile.active = false;
  const hitResult = player.hit();
  if (hitResult.tookDamage) {
    effects.audio.hit();
    effects.addScreenShake(config.feedback.projectileHitShake);
    effects.createParticles(player.x, player.y, 18, player.color);
    effects.freezeFrames(config.feedback.projectileHitFreezeFrames);
  }
  return { hit: true, playerKilled: hitResult.killed };
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
