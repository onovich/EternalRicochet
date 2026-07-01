import { GAME_CONFIG } from "../../data/gameConfig.js";
import { resolveBulletWallBounce } from "./collisions.js";
import { clampMagnitude } from "./vectorMath.js";

let nextEnemyId = 1;

export class Player {
  constructor(bounds, config = GAME_CONFIG.player) {
    this.config = config;
    this.x = bounds.width / 2;
    this.y = bounds.height / 2;
    this.radius = config.radius;
    this.vx = 0;
    this.vy = 0;
    this.speed = config.speed;
    this.friction = config.friction;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.invulnTime = 0;
    this.color = config.color;
    this.wasHitThisFrame = false;
  }

  update({ moveVector, bounds }) {
    this.wasHitThisFrame = false;

    if (moveVector.x !== 0 || moveVector.y !== 0) {
      this.vx += moveVector.x * this.config.acceleration;
      this.vy += moveVector.y * this.config.acceleration;
    }

    this.vx *= this.friction;
    this.vy *= this.friction;

    const clamped = clampMagnitude({ x: this.vx, y: this.vy }, 0, this.speed);
    this.vx = clamped.x;
    this.vy = clamped.y;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.radius) this.x = this.radius;
    if (this.x > bounds.width - this.radius) this.x = bounds.width - this.radius;
    if (this.y < this.radius) this.y = this.radius;
    if (this.y > bounds.height - this.radius) this.y = bounds.height - this.radius;

    if (this.invulnTime > 0) this.invulnTime -= 1;
  }

  applyShotRecoil(angle) {
    this.vx -= Math.cos(angle) * this.config.shotRecoil;
    this.vy -= Math.sin(angle) * this.config.shotRecoil;
  }

  hit() {
    if (this.invulnTime > 0) {
      return { tookDamage: false, killed: false };
    }

    this.hp -= 1;
    this.invulnTime = this.config.invulnFrames;
    this.wasHitThisFrame = true;
    return { tookDamage: true, killed: this.hp <= 0 };
  }
}

export class Bullet {
  constructor(config = GAME_CONFIG.bullet) {
    this.config = config;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.radius = config.radius;
    this.vx = 0;
    this.vy = 0;
    this.baseSpeed = config.baseSpeed;
    this.color = config.color;
    this.isRecalling = false;
    this.trail = [];
    this.enemyHitCooldowns = new Map();
  }

  fireFrom(origin, angle) {
    this.active = true;
    this.x = origin.x;
    this.y = origin.y;
    this.vx = Math.cos(angle) * this.baseSpeed;
    this.vy = Math.sin(angle) * this.baseSpeed;
    this.isRecalling = false;
    this.trail = [{ x: origin.x, y: origin.y }];
    this.enemyHitCooldowns.clear();
  }

  update({ recallRequested, player, bounds }) {
    const events = [];
    if (!this.active) return events;

    this.tickEnemyHitCooldowns();

    if (recallRequested) {
      if (!this.isRecalling) events.push({ type: "recall-start" });
      this.isRecalling = true;
    } else {
      this.isRecalling = false;
    }

    if (this.isRecalling) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        this.vx += (dx / dist) * this.config.recallForce;
        this.vy += (dy / dist) * this.config.recallForce;
      }
      this.vx *= this.config.recallDrag;
      this.vy *= this.config.recallDrag;

      if (dist < player.radius + this.radius + this.config.collectRecallPadding) {
        this.collect();
        events.push({ type: "collect" });
        return events;
      }
    } else {
      this.vx *= this.config.naturalDrag;
      this.vy *= this.config.naturalDrag;
    }

    this.x += this.vx;
    this.y += this.vy;

    const wallBounce = resolveBulletWallBounce(this, bounds, this.config);
    if (wallBounce.bounced) {
      events.push({ type: "wall-bounce", impactSpeedSq: wallBounce.impactSpeedSq });
    }

    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq < this.config.collectSpeedSq) {
      const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
      if (distToPlayer < player.radius + this.radius + this.config.collectPadding) {
        this.collect();
        events.push({ type: "collect" });
        return events;
      }
    }

    this.recordTrail();
    return events;
  }

  collect() {
    this.active = false;
    this.isRecalling = false;
    this.trail = [];
    this.enemyHitCooldowns.clear();
  }

  recordTrail() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.config.trailLength) {
      this.trail.shift();
    }
  }

  tickEnemyHitCooldowns() {
    for (const [enemyId, frames] of this.enemyHitCooldowns.entries()) {
      if (frames <= 1) {
        this.enemyHitCooldowns.delete(enemyId);
      } else {
        this.enemyHitCooldowns.set(enemyId, frames - 1);
      }
    }
  }

  canHitEnemy(enemyId) {
    return !this.enemyHitCooldowns.has(enemyId);
  }

  setEnemyHitCooldown(enemyId, frames) {
    this.enemyHitCooldowns.set(enemyId, frames);
  }
}

export class Enemy {
  constructor(x, y, type, config = GAME_CONFIG.enemy) {
    const typeConfig = config[type] ?? config.chaser;
    this.id = nextEnemyId;
    nextEnemyId += 1;
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.radius = typeConfig.radius;
    this.speed = typeConfig.minSpeed + Math.random() * typeConfig.speedVariance;
    this.hp = typeConfig.hp;
    this.color = typeConfig.color;
    this.scoreVal = typeConfig.score;
    this.minRange = typeConfig.minRange ?? 0;
    this.preferredRange = typeConfig.preferredRange ?? 0;
    this.fireIntervalFrames = typeConfig.fireIntervalFrames ?? 0;
    this.fireCooldown = typeConfig.initialFireDelayFrames ?? typeConfig.fireIntervalFrames ?? 0;
    this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) return;

    if (this.type === "shooter") {
      if (dist > this.preferredRange) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      } else if (dist < this.minRange) {
        this.x -= (dx / dist) * this.speed;
        this.y -= (dy / dist) * this.speed;
      } else {
        this.x += (-dy / dist) * this.speed * 0.35 * this.strafeDirection;
        this.y += (dx / dist) * this.speed * 0.35 * this.strafeDirection;
      }

      if (this.fireCooldown > 0) this.fireCooldown -= 1;
      return;
    }

    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
  }

  canShoot() {
    return this.type === "shooter" && this.fireCooldown <= 0;
  }

  resetShotCooldown() {
    this.fireCooldown = this.fireIntervalFrames;
  }

  takeDamage() {
    this.hp -= 1;
    return this.hp <= 0;
  }
}

export class Obstacle {
  constructor(x, y, radius, index, config = GAME_CONFIG.obstacles) {
    this.id = `obstacle-${index}`;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = config.color;
    this.coreColor = config.coreColor;
    this.restitution = config.restitution;
    this.minBounceSpeed = config.minBounceSpeed;
  }
}

export class EnemyProjectile {
  constructor(origin, target, ownerId, config = GAME_CONFIG.enemyProjectile) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.active = true;
    this.ownerId = ownerId;
    this.x = origin.x;
    this.y = origin.y;
    this.radius = config.radius;
    this.vx = (dx / dist) * config.speed;
    this.vy = (dy / dist) * config.speed;
    this.life = config.lifeFrames;
    this.color = config.color;
    this.wallBounces = 0;
    this.config = config;
  }

  update() {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
    if (this.life <= 0) this.active = false;
  }
}

export class Particle {
  constructor(x, y, color, config = GAME_CONFIG.particles) {
    this.active = false;
    this.reset(x, y, color, config);
  }

  reset(x, y, color, config = this.config) {
    this.config = config;
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * config.speedVariance + config.minSpeed;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = 1;
    this.decay = Math.random() * config.decayVariance + config.minDecay;
    this.size = Math.random() * config.sizeVariance + config.minSize;
    this.active = true;
  }

  update() {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.config.friction;
    this.vy *= this.config.friction;
    this.life -= this.decay;
    if (this.life <= 0) this.active = false;
  }
}
