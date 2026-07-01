import assert from "node:assert/strict";
import { GAME_CONFIG } from "../src/data/gameConfig.js";
import { resolveBulletEnemyCollision, resolveBulletWallBounce } from "../src/logic/engine/collisions.js";
import { Bullet, Enemy } from "../src/logic/engine/entities.js";
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

smokeBulletFireReset();
smokeWallBounceEnergy();
smokeEnemyReboundAndCooldown();

console.log("Core smoke passed: fire reset, wall rebound, enemy rebound, cooldown.");
