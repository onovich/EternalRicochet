import assert from "node:assert/strict";
import { GAME_CONFIG } from "../src/data/gameConfig.js";
import {
  resolveBulletEnemyCollision,
  resolveBulletObstacleCollision,
  resolveBulletWallBounce,
  resolvePlayerProjectileCollision,
  resolveProjectileObstacleCollision,
  resolveProjectileWallCollision,
} from "../src/logic/engine/collisions.js";
import { Bullet, Enemy, EnemyProjectile, Player } from "../src/logic/engine/entities.js";
import { createObstacleLayout, isPointSafeFromObstacles } from "../src/logic/engine/level.js";
import { ComboState } from "../src/logic/engine/scoring.js";
import { magnitude } from "../src/logic/engine/vectorMath.js";

const effects = {
  audio: {
    enemyDie() {},
    enemyHit() {},
    hit() {},
  },
  addScore() {},
  addScreenShake() {},
  createParticles() {},
  freezeFrames() {},
};

function smokeBulletFireReset() {
  const bullet = new Bullet();
  bullet.trail = [
    { x: 20, y: 30 },
    { x: 40, y: 50 },
  ];
  bullet.isRecalling = true;
  bullet.setEnemyHitCooldown(999, 8);

  bullet.fireFrom({ x: 120, y: 180 }, Math.PI / 4);

  assert.equal(bullet.active, true);
  assert.equal(bullet.x, 120);
  assert.equal(bullet.y, 180);
  assert.equal(bullet.isRecalling, false);
  assert.deepEqual(bullet.trail, [{ x: 120, y: 180 }]);
  assert.equal(bullet.enemyHitCooldowns.size, 0);
  assert.ok(magnitude({ x: bullet.vx, y: bullet.vy }) > 20);
}

function smokeWallBounceEnergy() {
  const bullet = new Bullet();
  bullet.fireFrom({ x: 4, y: 100 }, Math.PI);
  bullet.x = 2;
  bullet.y = 100;
  bullet.vx = -4;
  bullet.vy = 0;

  const result = resolveBulletWallBounce(bullet, { width: 320, height: 240 });

  assert.equal(result.bounced, true);
  assert.equal(bullet.x, GAME_CONFIG.bullet.radius);
  assert.ok(bullet.vx > 0);
  assert.ok(magnitude({ x: bullet.vx, y: bullet.vy }) >= GAME_CONFIG.bullet.minWallBounceSpeed);
}

function smokeEnemyReboundAndCooldown() {
  const bullet = new Bullet();
  const tank = new Enemy(160, 120, "tank");
  tank.hp = 2;
  bullet.fireFrom({ x: 130, y: 120 }, 0);
  bullet.x = 145;
  bullet.y = 120;
  bullet.vx = 15;
  bullet.vy = 0;

  const firstHit = resolveBulletEnemyCollision({ bullet, enemy: tank, effects });

  assert.equal(firstHit.hit, true);
  assert.equal(firstHit.killed, false);
  assert.equal(tank.hp, 1);
  assert.ok(bullet.vx < 0);
  assert.ok(bullet.x < tank.x);
  assert.equal(bullet.canHitEnemy(tank.id), false);

  const hpAfterFirstHit = tank.hp;
  bullet.x = 145;
  bullet.y = 120;
  const secondHit = resolveBulletEnemyCollision({ bullet, enemy: tank, effects });

  assert.equal(secondHit.hit, false);
  assert.equal(secondHit.coolingDown, true);
  assert.equal(tank.hp, hpAfterFirstHit);
}

function smokeComboScoring() {
  const combo = new ComboState(GAME_CONFIG.combo);

  const first = combo.recordKill(10);
  const second = combo.recordKill(10);

  assert.equal(first.points, 10);
  assert.equal(first.multiplier, 1);
  assert.equal(second.points, 20);
  assert.equal(second.multiplier, 2);
  assert.deepEqual(combo.getHudState(), { killCount: 2, multiplier: 2, visible: true });

  combo.reset();
  assert.deepEqual(combo.getHudState(), { killCount: 0, multiplier: 1, visible: false });
}

function smokeObstacleLayoutAndBounce() {
  const bounds = { width: 960, height: 540 };
  const obstacles = createObstacleLayout(bounds);

  assert.equal(obstacles.length, GAME_CONFIG.obstacles.count);
  assert.equal(
    isPointSafeFromObstacles(
      { x: bounds.width / 2, y: bounds.height / 2 },
      GAME_CONFIG.player.radius,
      obstacles,
      GAME_CONFIG.obstacles.playerSafeRadius - GAME_CONFIG.player.radius,
    ),
    true,
  );

  const obstacle = obstacles[0];
  const bullet = new Bullet();
  bullet.fireFrom({ x: obstacle.x - obstacle.radius - GAME_CONFIG.bullet.radius + 2, y: obstacle.y }, 0);
  bullet.vx = 12;
  bullet.vy = 0;

  const result = resolveBulletObstacleCollision({ bullet, obstacle });

  assert.equal(result.bounced, true);
  assert.ok(bullet.vx < 0);
  assert.ok(magnitude({ x: bullet.vx, y: bullet.vy }) >= GAME_CONFIG.obstacles.minBounceSpeed);
}

function smokeShooterProjectileLifecycle() {
  const bounds = { width: 420, height: 260 };
  const shooter = new Enemy(80, 130, "shooter");
  const player = new Player(bounds);
  player.x = 220;
  player.y = 130;

  assert.equal(shooter.type, "shooter");
  shooter.fireCooldown = 0;
  assert.equal(shooter.canShoot(), true);

  const projectile = new EnemyProjectile(shooter, player, shooter.id);
  projectile.update();
  assert.equal(projectile.active, true);
  assert.ok(projectile.x > shooter.x);

  projectile.x = bounds.width - projectile.radius + 2;
  projectile.y = 130;
  projectile.vx = 8;
  projectile.vy = 0;
  const wallHit = resolveProjectileWallCollision(projectile, bounds);
  assert.equal(wallHit.bounced, true);
  assert.equal(projectile.active, true);

  const [obstacle] = createObstacleLayout(bounds);
  projectile.x = obstacle.x;
  projectile.y = obstacle.y;
  const obstacleHit = resolveProjectileObstacleCollision(projectile, obstacle);
  assert.equal(obstacleHit.hit, true);
  assert.equal(projectile.active, false);

  const hitProjectile = new EnemyProjectile({ x: player.x - 20, y: player.y }, player, shooter.id);
  hitProjectile.x = player.x;
  hitProjectile.y = player.y;
  const playerHit = resolvePlayerProjectileCollision({ player, projectile: hitProjectile, effects });
  assert.equal(playerHit.hit, true);
  assert.equal(player.hp, GAME_CONFIG.player.hp - 1);
}

smokeBulletFireReset();
smokeWallBounceEnergy();
smokeEnemyReboundAndCooldown();
smokeComboScoring();
smokeObstacleLayoutAndBounce();
smokeShooterProjectileLifecycle();

console.log("Core smoke passed: phase 1 regressions, combo, obstacles, shooter projectile lifecycle.");
