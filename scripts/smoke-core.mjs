import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GAME_CONFIG } from "../src/data/gameConfig.js";
import { createAudioSystem } from "../src/logic/engine/audio.js";
import { createBulletPool } from "../src/logic/engine/bulletPool.js";
import {
  resolveBulletEnemyCollision,
  resolveBulletObstacleCollision,
  resolveBulletWallBounce,
  resolvePlayerEnemyCollision,
  resolvePlayerProjectileCollision,
  resolveProjectileObstacleCollision,
  resolveProjectileWallCollision,
} from "../src/logic/engine/collisions.js";
import { resolveDevStressSeed } from "../src/logic/engine/devStress.js";
import { Bullet, Enemy, EnemyProjectile, Player } from "../src/logic/engine/entities.js";
import { createInputController } from "../src/logic/engine/input.js";
import { createObstacleLayout, isPointSafeFromObstacles } from "../src/logic/engine/level.js";
import {
  awardCredits,
  calculateCreditsEarned,
  createDefaultMetaState,
  createEffectiveRunConfig,
  createMetaProgressionStore,
  createRunSettlement,
  purchaseUpgrade,
  readHighScore,
  readMetaState,
  sanitizeMetaState,
  seedMetaStateFromSearch,
  writeHighScore,
} from "../src/logic/engine/metaProgression.js";
import { createParticlePool } from "../src/logic/engine/particlePool.js";
import { createPerformanceMetrics } from "../src/logic/engine/performanceMetrics.js";
import { createRenderer } from "../src/logic/engine/renderer.js";
import { resolveRenderQuality } from "../src/logic/engine/renderQuality.js";
import { ComboState } from "../src/logic/engine/scoring.js";
import {
  createDefaultSettings,
  createSettingsStore,
  readSettings,
  sanitizeSettings,
} from "../src/logic/engine/settings.js";
import { createUltimateState, resolveRadialClear } from "../src/logic/engine/ultimate.js";
import {
  createLeaderboardError,
  LEADERBOARD_CONTRACT,
  LEADERBOARD_ERROR_CODES,
  LEADERBOARD_FORBIDDEN_FIELDS,
  normalizeLeaderboardEntry,
  sanitizeDisplayName,
  validateLeaderboardPayload,
} from "../src/logic/leaderboard/contract.js";
import {
  getLeaderboardCopy,
  LEADERBOARD_COPY,
  LEADERBOARD_COPY_KEYS,
} from "../src/logic/leaderboard/copy.js";
import {
  createLocalLeaderboardProvider,
  LOCAL_LEADERBOARD_PROVIDER_CODES,
  LOCAL_LEADERBOARD_PROVIDER_MODES,
} from "../src/logic/leaderboard/mockProvider.js";
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
  assert.equal(magnitude({ x: bullet.vx, y: bullet.vy }), GAME_CONFIG.bullet.charge.minShotSpeed);
}

function smokePhase13ConfigDefaults() {
  assert.equal(GAME_CONFIG.controls.recallKey, "r");
  assert.equal(GAME_CONFIG.controls.dashKey, " ");
  assert.equal(GAME_CONFIG.controls.ultimateKey, "f");

  assert.equal(GAME_CONFIG.bullet.baseCount, 1);
  assert.equal(GAME_CONFIG.bullet.maxCount, 4);
  assert.ok(GAME_CONFIG.bullet.charge.minShotSpeed < GAME_CONFIG.bullet.charge.maxShotSpeed);
  assert.ok(GAME_CONFIG.bullet.charge.framesToMax > 0);
  assert.ok(GAME_CONFIG.bullet.pickup.settledCollectSpeedSq > GAME_CONFIG.bullet.collectSpeedSq);
  assert.ok(GAME_CONFIG.bullet.pickup.minActiveFrames > 0);
  assert.ok(GAME_CONFIG.bullet.pickup.minTravelDistance > GAME_CONFIG.player.radius);

  assert.ok(GAME_CONFIG.player.dash.speed > GAME_CONFIG.player.speed);
  assert.ok(GAME_CONFIG.player.dash.durationFrames > 0);
  assert.ok(GAME_CONFIG.player.dash.cooldownFrames > GAME_CONFIG.player.dash.durationFrames);
  assert.ok(GAME_CONFIG.player.dash.evasionFrames >= GAME_CONFIG.player.dash.durationFrames);

  assert.equal(GAME_CONFIG.ultimate.baseCharges, 0);
  assert.equal(GAME_CONFIG.ultimate.maxCharges, GAME_CONFIG.metaProgression.upgrades.ultimateCap.maxLevel);
  assert.ok(GAME_CONFIG.ultimate.radius > GAME_CONFIG.player.radius);

  assert.equal(GAME_CONFIG.metaProgression.upgrades.multiball.ballsPerLevel, 1);
  assert.equal(GAME_CONFIG.metaProgression.upgrades.ultimateCap.chargesPerLevel, 1);
  assert.equal(
    GAME_CONFIG.bullet.baseCount + GAME_CONFIG.metaProgression.upgrades.multiball.maxLevel,
    GAME_CONFIG.bullet.maxCount,
  );

  const motionTypes = GAME_CONFIG.obstacles.layout.map((obstacle) => obstacle.motion?.type);
  assert.deepEqual(motionTypes, ["horizontal", "ellipse", "lissajous"]);
}

function smokePhase13UiCopyAndDebugAffordances() {
  const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(indexSource.includes("按住左键蓄力松开发射"), true);
  assert.equal(indexSource.includes("R或右键召回"), true);
  assert.equal(indexSource.includes("Space冲刺"), true);
  assert.equal(indexSource.includes("F终极清场"), true);
  assert.equal(indexSource.includes("空格召回"), false);

  const runtimeSource = readFileSync(
    new URL("../src/logic/engine/gameRuntime.js", import.meta.url),
    "utf8",
  );
  for (const token of ["pickupReady", "motionType", "bulletPickup", "ultimateRadius", "controls"]) {
    assert.equal(runtimeSource.includes(token), true, `gameRuntime debug state should expose ${token}`);
  }
}

function smokeBulletPoolAmmoState() {
  const pool = createBulletPool({ total: 3, config: GAME_CONFIG.bullet });

  assert.equal(pool.bullets.length, 3);
  assert.deepEqual(pool.getAmmoState(), { active: 0, available: 3, total: 3 });
  assert.equal(pool.hasAvailable(), true);

  const first = pool.getAvailable();
  first.fireFrom({ x: 100, y: 100 }, 0);

  assert.equal(first.id, "bullet-1");
  assert.deepEqual(pool.getAmmoState(), { active: 1, available: 2, total: 3 });
  assert.equal(pool.getActive()[0], first);

  const second = pool.getAvailable();
  second.fireFrom({ x: 100, y: 100 }, Math.PI / 2);
  assert.deepEqual(pool.getAmmoState(), { active: 2, available: 1, total: 3 });

  first.collect();
  assert.equal(pool.getAvailable(), first);
  assert.deepEqual(pool.getAmmoState(), { active: 1, available: 2, total: 3 });
}

function smokeBulletPickupGates() {
  const bounds = { width: 420, height: 260 };
  const player = new Player(bounds);
  const bullet = new Bullet();

  bullet.fireFrom({ x: player.x, y: player.y }, 0, { speed: 0 });
  const immediate = bullet.update({ recallRequested: false, player, bounds });
  assert.equal(bullet.active, true);
  assert.equal(immediate.some((event) => event.type === "collect"), false);

  bullet.x = player.x;
  bullet.y = player.y;
  bullet.vx = 1;
  bullet.vy = 0;
  bullet.activeFrames = GAME_CONFIG.bullet.pickup.minActiveFrames;
  bullet.travelDistance = GAME_CONFIG.bullet.pickup.minTravelDistance;
  const settled = bullet.update({ recallRequested: false, player, bounds });
  assert.equal(settled.some((event) => event.type === "collect"), true);
  assert.equal(bullet.active, false);

  bullet.fireFrom({ x: player.x, y: player.y }, 0, { speed: 4 });
  bullet.activeFrames = GAME_CONFIG.bullet.pickup.minActiveFrames;
  bullet.travelDistance = GAME_CONFIG.bullet.pickup.minTravelDistance;
  const fast = bullet.update({ recallRequested: false, player, bounds });
  assert.equal(fast.some((event) => event.type === "collect"), false);
  assert.equal(bullet.active, true);

  bullet.fireFrom({ x: player.x, y: player.y }, 0, { speed: 0 });
  const recalled = bullet.update({ recallRequested: true, player, bounds });
  assert.equal(recalled.some((event) => event.type === "collect"), true);
  assert.equal(bullet.active, false);
}

function smokeChargedShotSpeedClamp() {
  const bullet = new Bullet();
  const charge = GAME_CONFIG.bullet.charge;

  bullet.fireFrom({ x: 120, y: 180 }, 0);
  assert.equal(magnitude({ x: bullet.vx, y: bullet.vy }), charge.minShotSpeed);

  bullet.fireFrom({ x: 120, y: 180 }, 0, { chargePower: charge.minPower });
  assert.equal(magnitude({ x: bullet.vx, y: bullet.vy }), charge.minShotSpeed);

  bullet.fireFrom({ x: 120, y: 180 }, 0, { chargePower: charge.maxPower });
  assert.equal(magnitude({ x: bullet.vx, y: bullet.vy }), charge.maxShotSpeed);

  bullet.fireFrom({ x: 120, y: 180 }, 0, { chargePower: charge.maxPower + 100 });
  assert.equal(magnitude({ x: bullet.vx, y: bullet.vy }), charge.maxShotSpeed);
}

function smokeChargedMouseInputRelease() {
  const windowRef = createInputTestWindow();
  const input = createInputController({
    canvas: { width: 320, height: 240 },
    getGameState: () => "PLAYING",
    getBulletActive: () => false,
    windowRef,
  });

  windowRef.dispatch("mousemove", { clientX: 220, clientY: 120 });
  windowRef.dispatch("mousedown", { button: 0 });
  input.updateCharge();
  input.updateCharge();
  assert.deepEqual(input.getChargeState(), { active: true, frames: 2, source: "mouse" });

  windowRef.dispatch("mouseup", { button: 0 });
  const charged = input.consumeShot({ x: 100, y: 120 }, GAME_CONFIG.bullet.charge);
  assert.equal(charged.source, "mouse");
  assert.equal(charged.angle, 0);
  assert.equal(charged.chargeFrames, 2);
  assert.equal(charged.chargeRatio, 2 / GAME_CONFIG.bullet.charge.framesToMax);
  assert.ok(charged.chargePower > GAME_CONFIG.bullet.charge.minPower);

  windowRef.dispatch("mousedown", { button: 0 });
  windowRef.dispatch("mouseup", { button: 0 });
  const quick = input.consumeShot({ x: 100, y: 120 }, GAME_CONFIG.bullet.charge);
  assert.equal(quick.chargeFrames, 0);
  assert.equal(quick.chargePower, GAME_CONFIG.bullet.charge.minPower);
}

function smokeUltimateInputLatch() {
  const windowRef = createInputTestWindow();
  const input = createInputController({
    canvas: { width: 320, height: 240 },
    getGameState: () => "PLAYING",
    getBulletActive: () => false,
    windowRef,
  });

  windowRef.dispatch("keydown", { key: "f" });
  assert.equal(input.consumeUltimate(), true);
  assert.equal(input.consumeUltimate(), false);

  windowRef.dispatch("keydown", { key: "f", repeat: true });
  assert.equal(input.consumeUltimate(), false);

  windowRef.dispatch("keydown", { key: "F" });
  input.resetTransient();
  assert.equal(input.consumeUltimate(), false);
}

function smokeDashRecallInputRebind() {
  const windowRef = createInputTestWindow();
  const input = createInputController({
    canvas: { width: 320, height: 240 },
    getGameState: () => "PLAYING",
    getBulletActive: () => false,
    windowRef,
  });

  windowRef.dispatch("keydown", { key: " " });
  assert.equal(input.consumeDash(), true);
  assert.equal(input.consumeDash(), false);
  assert.equal(input.isRecallRequested(), false);

  windowRef.dispatch("keydown", { key: "r" });
  assert.equal(input.isRecallRequested(), true);
  input.clearRecallLatch();
  assert.equal(input.isRecallRequested(), true);
  windowRef.dispatch("keyup", { key: "r" });
  input.clearRecallLatch();
  assert.equal(input.isRecallRequested(), false);

  windowRef.dispatch("mousedown", { button: 2 });
  assert.equal(input.isRecallRequested(), true);
  input.clearRecallLatch();
  assert.equal(input.isRecallRequested(), true);
  windowRef.dispatch("mouseup", { button: 2 });
  assert.equal(input.isRecallRequested(), false);
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

function smokeEnemyKillReboundBeforeDamping() {
  const bullet = new Bullet();
  const chaser = new Enemy(160, 120, "chaser");
  bullet.fireFrom({ x: 130, y: 120 }, 0, { speed: 15 });
  bullet.x = 145;
  bullet.y = 120;

  const hit = resolveBulletEnemyCollision({ bullet, enemy: chaser, effects });

  assert.equal(hit.hit, true);
  assert.equal(hit.killed, true);
  assert.equal(chaser.active, false);
  assert.ok(bullet.vx < 0);
  assert.ok(
    magnitude({ x: bullet.vx, y: bullet.vy }) >=
      GAME_CONFIG.bullet.minEnemyBounceSpeed * GAME_CONFIG.bullet.killDamping,
  );
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

function smokeMovingObstacleDeterminismAndBounds() {
  const bounds = { width: 960, height: 540 };
  const first = createObstacleLayout(bounds);
  const second = createObstacleLayout(bounds);

  for (let frame = 1; frame <= 240; frame += 17) {
    for (let i = 0; i < first.length; i += 1) {
      first[i].update(frame, bounds);
      second[i].update(frame, bounds);
      assert.equal(first[i].x, second[i].x);
      assert.equal(first[i].y, second[i].y);
      assert.ok(first[i].x >= first[i].radius + GAME_CONFIG.obstacles.edgePadding);
      assert.ok(first[i].x <= bounds.width - first[i].radius - GAME_CONFIG.obstacles.edgePadding);
      assert.ok(first[i].y >= first[i].radius + GAME_CONFIG.obstacles.edgePadding);
      assert.ok(first[i].y <= bounds.height - first[i].radius - GAME_CONFIG.obstacles.edgePadding);
    }
  }

  assert.ok(first.some((obstacle) => Math.hypot(obstacle.vx, obstacle.vy) > 0));
}

function smokeMovingObstacleRelativeBounce() {
  const obstacle = createObstacleLayout({ width: 640, height: 360 })[0];
  obstacle.x = 240;
  obstacle.y = 180;
  obstacle.prevX = 236;
  obstacle.prevY = 180;
  obstacle.vx = 4;
  obstacle.vy = 0;

  const bullet = new Bullet();
  bullet.fireFrom({ x: obstacle.x - obstacle.radius - GAME_CONFIG.bullet.radius + 2, y: obstacle.y }, 0, {
    speed: 14,
  });

  const result = resolveBulletObstacleCollision({ bullet, obstacle });

  assert.equal(result.bounced, true);
  assert.ok(bullet.vx < obstacle.vx);
  assert.ok(magnitude({ x: bullet.vx - obstacle.vx, y: bullet.vy - obstacle.vy }) >= GAME_CONFIG.obstacles.minBounceSpeed);
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

function smokePlayerDashEvasion() {
  const bounds = { width: 420, height: 260 };
  const player = new Player(bounds);
  const hp = player.hp;

  assert.equal(player.startDash({ x: 1, y: 0 }), true);
  assert.equal(player.getDashState().active, true);
  assert.equal(player.hit().tookDamage, false);
  assert.equal(player.hp, hp);

  const projectile = {
    active: true,
    x: player.x,
    y: player.y,
    radius: GAME_CONFIG.enemyProjectile.radius,
    color: GAME_CONFIG.enemyProjectile.color,
  };
  const projectileHit = resolvePlayerProjectileCollision({ player, projectile, effects });
  assert.equal(projectileHit.hit, true);
  assert.equal(projectile.active, false);
  assert.equal(player.hp, hp);

  const enemy = new Enemy(player.x, player.y, "chaser");
  const enemyHit = resolvePlayerEnemyCollision({ player, enemy, effects });
  assert.equal(enemyHit.collided, true);
  assert.equal(player.hp, hp);

  const beforeX = player.x;
  player.update({ moveVector: { x: 0, y: 0 }, bounds });
  assert.ok(player.x > beforeX);
  assert.equal(player.startDash({ x: 1, y: 0 }), false);

  for (let i = 0; i < GAME_CONFIG.player.dash.evasionFrames; i += 1) {
    player.update({ moveVector: { x: 0, y: 0 }, bounds });
  }
  assert.equal(player.isEvading(), false);
  const damage = player.hit();
  assert.equal(damage.tookDamage, true);
  assert.equal(player.hp, hp - 1);
}

function smokeUltimateStateAndRadialClear() {
  const ultimateState = createUltimateState({ charges: 2, config: GAME_CONFIG.ultimate });
  assert.deepEqual(ultimateState.getState(), {
    charges: 2,
    maxCharges: GAME_CONFIG.ultimate.maxCharges,
    canUse: true,
  });
  assert.equal(ultimateState.consume(), true);
  assert.equal(ultimateState.getCharges(), 1);
  ultimateState.reset(99);
  assert.equal(ultimateState.getCharges(), GAME_CONFIG.ultimate.maxCharges);

  const closeEnemy = new Enemy(120, 100, "chaser");
  const farEnemy = new Enemy(480, 100, "tank");
  const closeProjectile = { active: true, x: 128, y: 108, color: GAME_CONFIG.enemyProjectile.color };
  const farProjectile = { active: true, x: 520, y: 100, color: GAME_CONFIG.enemyProjectile.color };
  const enemies = [closeEnemy, farEnemy];
  const projectiles = [closeProjectile, farProjectile];
  const calls = { score: 0, particles: 0, shakes: 0, freezes: 0 };

  const result = resolveRadialClear({
    origin: { x: 100, y: 100 },
    enemies,
    projectiles,
    config: GAME_CONFIG,
    effects: {
      addScore(points) {
        calls.score += points;
      },
      addScreenShake(amount) {
        calls.shakes += amount;
      },
      createParticles() {
        calls.particles += 1;
      },
      freezeFrames(frames) {
        calls.freezes += frames;
      },
    },
  });

  assert.deepEqual(result, { enemiesCleared: 1, projectilesCleared: 1 });
  assert.deepEqual(enemies, [farEnemy]);
  assert.deepEqual(projectiles, [farProjectile]);
  assert.equal(closeEnemy.active, false);
  assert.equal(closeProjectile.active, false);
  assert.equal(farEnemy.active, true);
  assert.equal(farProjectile.active, true);
  assert.equal(calls.score, closeEnemy.scoreVal);
  assert.equal(calls.particles, 3);
  assert.ok(calls.shakes > 0);
  assert.ok(calls.freezes > 0);
}

function smokeMetaProgressionPersistence() {
  const storage = createMemoryStorage();
  const defaultState = createDefaultMetaState();
  assert.deepEqual(readMetaState(storage), defaultState);
  assert.equal(defaultState.upgrades.multiball, 0);
  assert.equal(defaultState.upgrades.ultimateCap, 0);

  storage.setItem(GAME_CONFIG.metaProgression.storageKey, "{bad json");
  assert.deepEqual(readMetaState(storage), createDefaultMetaState());

  const sanitized = sanitizeMetaState({
    credits: -20,
    totalCreditsEarned: 2000000,
    upgrades: {
      gravityRecall: 99,
      armorPiercer: 2.8,
      energyShield: -1,
      multiball: 99,
      ultimateCap: 1.6,
      unknown: 99,
    },
  });

  assert.equal(sanitized.credits, 0);
  assert.equal(sanitized.totalCreditsEarned, GAME_CONFIG.metaProgression.maxCredits);
  assert.equal(sanitized.upgrades.gravityRecall, GAME_CONFIG.metaProgression.upgrades.gravityRecall.maxLevel);
  assert.equal(sanitized.upgrades.armorPiercer, 2);
  assert.equal(sanitized.upgrades.energyShield, 0);
  assert.equal(sanitized.upgrades.multiball, GAME_CONFIG.metaProgression.upgrades.multiball.maxLevel);
  assert.equal(sanitized.upgrades.ultimateCap, 1);
  assert.equal(sanitized.upgrades.unknown, undefined);
}

function smokeMetaProgressionEconomy() {
  assert.equal(calculateCreditsEarned(124), 4);
  assert.equal(calculateCreditsEarned(-1), 0);

  const awarded = awardCredits(createDefaultMetaState(), 250);
  assert.equal(awarded.earned, 10);
  assert.equal(awarded.state.credits, 10);
  assert.equal(awarded.state.totalCreditsEarned, 10);

  const firstPurchase = purchaseUpgrade(awarded.state, "gravityRecall");
  assert.equal(firstPurchase.purchased, true);
  assert.equal(firstPurchase.cost, GAME_CONFIG.metaProgression.upgrades.gravityRecall.baseCost);
  assert.equal(firstPurchase.state.credits, 2);
  assert.equal(firstPurchase.state.upgrades.gravityRecall, 1);

  const tooExpensive = purchaseUpgrade(firstPurchase.state, "armorPiercer");
  assert.equal(tooExpensive.purchased, false);
  assert.equal(tooExpensive.reason, "insufficient-credits");

  const multiballPurchase = purchaseUpgrade(
    sanitizeMetaState({ credits: GAME_CONFIG.metaProgression.upgrades.multiball.baseCost }),
    "multiball",
  );
  assert.equal(multiballPurchase.purchased, true);
  assert.equal(multiballPurchase.state.credits, 0);
  assert.equal(multiballPurchase.state.upgrades.multiball, 1);

  const ultimatePurchase = purchaseUpgrade(
    sanitizeMetaState({ credits: GAME_CONFIG.metaProgression.upgrades.ultimateCap.baseCost }),
    "ultimateCap",
  );
  assert.equal(ultimatePurchase.purchased, true);
  assert.equal(ultimatePurchase.state.credits, 0);
  assert.equal(ultimatePurchase.state.upgrades.ultimateCap, 1);

  const maxedState = sanitizeMetaState({
    credits: 999,
    upgrades: { energyShield: GAME_CONFIG.metaProgression.upgrades.energyShield.maxLevel },
  });
  const maxedPurchase = purchaseUpgrade(maxedState, "energyShield");
  assert.equal(maxedPurchase.purchased, false);
  assert.equal(maxedPurchase.reason, "max-level");
}

function smokeMetaProgressionStore() {
  const storage = createMemoryStorage();
  const store = createMetaProgressionStore({ storage });
  const award = store.awardScore(250);
  assert.equal(award.saved, true);
  assert.equal(award.earned, 10);

  const purchase = store.purchase("gravityRecall");
  assert.equal(purchase.purchased, true);
  assert.equal(purchase.saved, true);

  const reloaded = createMetaProgressionStore({ storage }).getState();
  assert.equal(reloaded.credits, 2);
  assert.equal(reloaded.upgrades.gravityRecall, 1);
}

function smokeMetaProgressionDevSeed() {
  const storage = createMemoryStorage();
  const seed = seedMetaStateFromSearch({
    storage,
    search:
      "?erSeedMeta=1&credits=40&gravityRecall=1&armorPiercer=2&energyShield=99&multiball=2&ultimateCap=99",
  });
  const seededState = readMetaState(storage);

  assert.equal(seed.saved, true);
  assert.equal(seededState.credits, 40);
  assert.equal(seededState.upgrades.gravityRecall, 1);
  assert.equal(seededState.upgrades.armorPiercer, 2);
  assert.equal(seededState.upgrades.energyShield, GAME_CONFIG.metaProgression.upgrades.energyShield.maxLevel);
  assert.equal(seededState.upgrades.multiball, 2);
  assert.equal(seededState.upgrades.ultimateCap, GAME_CONFIG.metaProgression.upgrades.ultimateCap.maxLevel);
  assert.equal(seedMetaStateFromSearch({ storage, search: "?credits=10" }), null);
}

function smokeHighScorePersistence() {
  const storage = createMemoryStorage();

  assert.equal(readHighScore(storage), 0);
  storage.setItem(GAME_CONFIG.metaProgression.highScoreKey, "-50");
  assert.equal(readHighScore(storage), 0);
  storage.setItem(GAME_CONFIG.metaProgression.highScoreKey, "not-a-score");
  assert.equal(readHighScore(storage), 0);
  storage.setItem(GAME_CONFIG.metaProgression.highScoreKey, "2000000000");
  assert.equal(readHighScore(storage), GAME_CONFIG.metaProgression.maxHighScore);

  const write = writeHighScore(storage, 123);
  assert.equal(write.saved, true);
  assert.equal(readHighScore(storage), 123);
}

function smokeMetaProgressionRunSettlement() {
  const store = createMetaProgressionStore({ storage: createMemoryStorage() });
  const settlement = createRunSettlement(store);

  const first = settlement.settleScore(250);
  const second = settlement.settleScore(250);

  assert.equal(first.earned, 10);
  assert.equal(first.alreadySettled, false);
  assert.equal(second.earned, 10);
  assert.equal(second.alreadySettled, true);
  assert.equal(store.getState().credits, 10);

  settlement.reset();
  const afterReset = settlement.settleScore(25);
  assert.equal(afterReset.earned, 1);
  assert.equal(store.getState().credits, 11);
}

function smokeMetaProgressionUpgradeEffects() {
  const state = sanitizeMetaState({
    upgrades: {
      gravityRecall: 2,
      armorPiercer: 3,
      energyShield: 1,
      multiball: 2,
      ultimateCap: 2,
    },
  });
  const effective = createEffectiveRunConfig(state);

  assert.equal(
    effective.bullet.recallForce,
    GAME_CONFIG.bullet.recallForce +
      2 * GAME_CONFIG.metaProgression.upgrades.gravityRecall.recallForcePerLevel,
  );
  assert.equal(
    effective.bullet.killDamping,
    Math.min(
      GAME_CONFIG.metaProgression.upgrades.armorPiercer.maxKillDamping,
      GAME_CONFIG.bullet.killDamping +
        3 * GAME_CONFIG.metaProgression.upgrades.armorPiercer.killDampingBonusPerLevel,
    ),
  );
  assert.equal(
    effective.player.hp,
    GAME_CONFIG.player.hp + GAME_CONFIG.metaProgression.upgrades.energyShield.hpPerLevel,
  );
  assert.equal(
    effective.bullet.totalCount,
    GAME_CONFIG.bullet.baseCount +
      2 * GAME_CONFIG.metaProgression.upgrades.multiball.ballsPerLevel,
  );
  assert.equal(
    effective.ultimate.charges,
    GAME_CONFIG.ultimate.baseCharges +
      2 * GAME_CONFIG.metaProgression.upgrades.ultimateCap.chargesPerLevel,
  );
  assert.equal(GAME_CONFIG.player.hp, 3);
  assert.equal(GAME_CONFIG.bullet.recallForce, 2);
  assert.equal(GAME_CONFIG.bullet.totalCount, undefined);
  assert.equal(GAME_CONFIG.ultimate.charges, undefined);

  const capped = createEffectiveRunConfig(
    sanitizeMetaState({
      upgrades: {
        multiball: GAME_CONFIG.metaProgression.upgrades.multiball.maxLevel,
        ultimateCap: GAME_CONFIG.metaProgression.upgrades.ultimateCap.maxLevel,
      },
    }),
  );
  assert.equal(capped.bullet.totalCount, GAME_CONFIG.bullet.maxCount);
  assert.equal(capped.ultimate.charges, GAME_CONFIG.ultimate.maxCharges);
}

function smokeRenderQualityResolution() {
  const low = resolveRenderQuality({ search: "?erQuality=low", devMode: true });
  assert.equal(low.tier, "low");
  assert.equal(low.source, "url");
  assert.equal(low.profile.glowScale, GAME_CONFIG.renderQuality.tiers.low.glowScale);
  assert.equal(low.profile.particleCap, GAME_CONFIG.renderQuality.tiers.low.particleCap);

  const devOverride = resolveRenderQuality({
    settings: { renderQuality: "medium" },
    search: "?erQuality=low",
    devMode: true,
  });
  assert.equal(devOverride.tier, "low");
  assert.equal(devOverride.source, "url");

  const settingsQuality = resolveRenderQuality({
    settings: { renderQuality: "medium" },
    search: "?erQuality=low",
    devMode: false,
  });
  assert.equal(settingsQuality.tier, "medium");
  assert.equal(settingsQuality.source, "settings");

  const productionUrlIgnored = resolveRenderQuality({ search: "?erQuality=low" });
  assert.equal(productionUrlIgnored.tier, GAME_CONFIG.renderQuality.defaultTier);
  assert.equal(productionUrlIgnored.source, "default");

  const fallback = resolveRenderQuality({ search: "?erQuality=unknown", devMode: true });
  assert.equal(fallback.tier, GAME_CONFIG.renderQuality.defaultTier);
  assert.equal(fallback.source, "default");
  assert.equal(fallback.profile.glowScale, GAME_CONFIG.renderQuality.tiers.high.glowScale);
}

function smokePerformanceMetricsAggregation() {
  const metrics = createPerformanceMetrics({ sampleSize: 2 });

  metrics.recordFrame(16, {
    counts: { enemies: 1, obstacles: 3, projectiles: 2, particles: 20, bulletActive: true },
    qualityTier: "medium",
  });
  metrics.recordFrame(20, {
    counts: { enemies: 2, obstacles: 3, projectiles: 1, particles: 18, bulletActive: false },
    qualityTier: "low",
  });
  const state = metrics.recordFrame(10, {
    counts: { enemies: 3, obstacles: 3, projectiles: 0, particles: 9, bulletActive: true },
  });

  assert.equal(state.frameCount, 3);
  assert.equal(state.sampleSize, 2);
  assert.equal(state.lastFrameMs, 10);
  assert.equal(state.averageFrameMs, 15);
  assert.equal(state.worstFrameMs, 20);
  assert.deepEqual(state.counts, {
    enemies: 3,
    obstacles: 3,
    projectiles: 0,
    particles: 9,
    bulletActive: 1,
  });
  assert.equal(state.qualityTier, "low");
}

function smokeDevStressSeedResolution() {
  assert.equal(resolveDevStressSeed({ enabled: false, search: "?erStress=1" }).enabled, false);
  assert.equal(resolveDevStressSeed({ enabled: true, search: "?credits=1" }).enabled, false);

  const seed = resolveDevStressSeed({
    enabled: true,
    search: "?erStress=1&erStressEnemies=999&erStressProjectiles=7&erStressParticles=bad",
  });

  assert.equal(seed.enabled, true);
  assert.equal(seed.enemies, GAME_CONFIG.performance.stressSeed.maxEnemies);
  assert.equal(seed.projectiles, 7);
  assert.equal(seed.particles, 0);
}

function smokeParticlePoolCapacityAndReset() {
  const pool = createParticlePool({ capacity: 3, config: GAME_CONFIG.particles });

  const firstEmit = pool.emit(10, 12, 5, "#ffffff");
  assert.deepEqual(firstEmit, { emitted: 3, dropped: 2 });
  assert.equal(pool.active.length, 3);
  assert.equal(pool.getStats().created, 3);
  assert.equal(pool.getStats().dropped, 2);

  pool.active[0].life = 0;
  pool.update();
  assert.equal(pool.active.length, 2);
  assert.equal(pool.getStats().inactive, 1);

  const secondEmit = pool.emit(30, 40, 1, "#00ffff");
  assert.deepEqual(secondEmit, { emitted: 1, dropped: 0 });
  assert.equal(pool.active.length, 3);
  assert.equal(pool.getStats().created, 3);
  assert.equal(pool.active.some((particle) => particle.x === 30 && particle.y === 40), true);

  pool.reset();
  assert.equal(pool.active.length, 0);
  assert.equal(pool.getStats().inactive, 3);
}

function smokeRendererLowQualityGlowScale() {
  const canvas = { width: 320, height: 240 };
  const ctx = createRecordingCanvasContext();
  const input = {
    getAimState() {
      return {
        isTouchDevice: false,
        mouse: { x: 260, y: 120 },
        leftStick: {},
        rightStick: {},
      };
    },
  };
  const renderer = createRenderer({
    canvas,
    ctx,
    input,
    config: GAME_CONFIG,
    quality: GAME_CONFIG.renderQuality.tiers.low,
  });
  const player = new Player(canvas);
  const bullet = new Bullet();
  bullet.fireFrom({ x: player.x, y: player.y }, 0);
  for (let i = 0; i < 12; i += 1) {
    bullet.trail.push({ x: player.x + i * 10, y: player.y });
  }

  renderer.render({
    gameState: "PLAYING",
    player,
    bullet,
    enemies: [],
    obstacles: [],
    projectiles: [],
    particles: [],
    frameCount: 0,
    shakeTime: 10,
  });

  const shadowBlurValues = ctx.calls
    .filter((call) => call.type === "set" && call.name === "shadowBlur")
    .map((call) => call.value);
  assert.ok(Math.max(...shadowBlurValues) <= 20 * GAME_CONFIG.renderQuality.tiers.low.glowScale);
}

function smokeRendererProjectileTrailQualitySwitch() {
  const canvas = { width: 320, height: 240 };
  const input = createStaticAimInput();
  const player = new Player(canvas);
  const projectile = new EnemyProjectile({ x: 80, y: 120 }, { x: 160, y: 120 }, 1);

  const highCtx = createRecordingCanvasContext();
  createRenderer({
    canvas,
    ctx: highCtx,
    input,
    config: GAME_CONFIG,
    quality: GAME_CONFIG.renderQuality.tiers.high,
  }).render({
    gameState: "PLAYING",
    player,
    bullet: new Bullet(),
    enemies: [],
    obstacles: [],
    projectiles: [projectile],
    particles: [],
    frameCount: 0,
    shakeTime: 0,
  });

  const lowCtx = createRecordingCanvasContext();
  createRenderer({
    canvas,
    ctx: lowCtx,
    input,
    config: GAME_CONFIG,
    quality: GAME_CONFIG.renderQuality.tiers.low,
  }).render({
    gameState: "PLAYING",
    player,
    bullet: new Bullet(),
    enemies: [],
    obstacles: [],
    projectiles: [projectile],
    particles: [],
    frameCount: 0,
    shakeTime: 0,
  });

  assert.equal(hasProjectileTrailStroke(highCtx), true);
  assert.equal(hasProjectileTrailStroke(lowCtx), false);
}

function smokeSettingsPersistence() {
  const storage = createMemoryStorage();
  assert.deepEqual(readSettings(storage), createDefaultSettings());

  storage.setItem(GAME_CONFIG.settings.storageKey, "{bad json");
  assert.deepEqual(readSettings(storage), createDefaultSettings());

  const sanitized = sanitizeSettings({
    schemaVersion: -10,
    renderQuality: "medium",
    audioMuted: true,
    fullscreenPreferred: "",
    unknown: "ignored",
  });
  assert.deepEqual(sanitized, {
    schemaVersion: GAME_CONFIG.settings.schemaVersion,
    renderQuality: "medium",
    audioMuted: true,
    fullscreenPreferred: false,
  });

  const invalid = sanitizeSettings({ renderQuality: "ultra" });
  assert.equal(invalid.renderQuality, GAME_CONFIG.settings.defaultRenderQuality);

  const store = createSettingsStore({ storage });
  const update = store.update({
    renderQuality: "low",
    audioMuted: true,
    fullscreenPreferred: true,
  });
  assert.equal(update.saved, true);
  assert.deepEqual(readSettings(storage), {
    schemaVersion: GAME_CONFIG.settings.schemaVersion,
    renderQuality: "low",
    audioMuted: true,
    fullscreenPreferred: true,
  });
}

function smokeAudioMutePreference() {
  const audioCalls = [];
  const windowRef = {
    AudioContext: class FakeAudioContext {
      constructor() {
        this.state = "running";
        this.currentTime = 0;
        this.destination = {};
      }

      resume() {
        audioCalls.push("resume");
      }

      createOscillator() {
        audioCalls.push("oscillator");
        return {
          type: "sine",
          frequency: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
          start() {},
          stop() {},
        };
      }

      createGain() {
        audioCalls.push("gain");
        return {
          connect() {},
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
        };
      }
    },
  };
  let muted = true;
  const audio = createAudioSystem({
    getGameState: () => "PLAYING",
    getMuted: () => muted,
    windowRef,
  });

  audio.init();
  audio.sfx.shoot();
  assert.equal(audio.isMuted(), true);
  assert.equal(audioCalls.includes("oscillator"), false);

  muted = false;
  audio.sfx.shoot();
  assert.equal(audio.isMuted(), false);
  assert.equal(audioCalls.includes("oscillator"), true);
}

function smokeLeaderboardContractValidation() {
  assert.equal(sanitizeDisplayName("  ACE\nRIDER   "), "ACE RIDER");
  assert.equal(sanitizeDisplayName("0123456789abcdefXYZ"), "0123456789abcdef");
  assert.equal(sanitizeDisplayName(" \n\t ", { fallback: LEADERBOARD_CONTRACT.anonymousLabel }), "LOCAL PLAYER");

  const valid = validateLeaderboardPayload(createValidLeaderboardPayload());
  assert.equal(valid.valid, true);
  assert.equal(valid.payload.score, 1234);
  assert.equal(valid.payload.displayName, "ACE");
  assert.equal(valid.payload.anonymousLabel, "LOCAL PLAYER");
  assert.equal(valid.payload.submittedAt, "2026-07-01T12:00:00.000Z");

  const anonymous = validateLeaderboardPayload(createValidLeaderboardPayload({ displayName: undefined }));
  assert.equal(anonymous.valid, true);
  assert.equal(anonymous.payload.displayName, "");

  const emptyName = validateLeaderboardPayload(createValidLeaderboardPayload({ displayName: " \n " }));
  assert.equal(emptyName.valid, false);
  assert.equal(emptyName.errors[0].code, LEADERBOARD_ERROR_CODES.INVALID_DISPLAY_NAME);

  const invalidScore = validateLeaderboardPayload(createValidLeaderboardPayload({ score: -1 }));
  assert.equal(invalidScore.valid, false);
  assert.equal(invalidScore.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_SCORE), true);

  const fractionalScore = validateLeaderboardPayload(createValidLeaderboardPayload({ score: 12.5 }));
  assert.equal(fractionalScore.valid, false);
  assert.equal(
    fractionalScore.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_SCORE),
    true,
  );

  const invalidVersion = validateLeaderboardPayload(
    createValidLeaderboardPayload({ contractVersion: "future-contract" }),
  );
  assert.equal(invalidVersion.valid, false);
  assert.equal(
    invalidVersion.errors.some(
      (error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_CONTRACT_VERSION,
    ),
    true,
  );

  const forbidden = validateLeaderboardPayload(
    createValidLeaderboardPayload({
      settings: { renderQuality: "low" },
      localStorage: "{}",
    }),
  );
  assert.equal(forbidden.valid, false);
  assert.equal(
    forbidden.errors.filter((error) => error.code === LEADERBOARD_ERROR_CODES.FORBIDDEN_FIELD).length,
    2,
  );

  const suspicious = validateLeaderboardPayload(
    createValidLeaderboardPayload({ score: 200000, runDurationFrames: 30 }),
  );
  assert.equal(suspicious.valid, true);
  assert.equal(
    suspicious.warnings.some((warning) => warning.code === LEADERBOARD_ERROR_CODES.SUSPICIOUS_SCORE),
    true,
  );
}

function smokeLeaderboardContractBoundaries() {
  assert.equal(LEADERBOARD_FORBIDDEN_FIELDS.includes("localStorage"), true);
  assert.equal(LEADERBOARD_FORBIDDEN_FIELDS.includes("upgrades"), true);
  assert.equal(LEADERBOARD_FORBIDDEN_FIELDS.includes("deviceId"), true);
  assert.deepEqual(
    createLeaderboardError(LEADERBOARD_ERROR_CODES.INVALID_SCORE, "Bad score.", "score"),
    { code: LEADERBOARD_ERROR_CODES.INVALID_SCORE, message: "Bad score.", field: "score" },
  );

  const nonObject = validateLeaderboardPayload(null);
  assert.equal(nonObject.valid, false);
  assert.equal(nonObject.errors[0].code, LEADERBOARD_ERROR_CODES.INVALID_PAYLOAD);

  const omittedTimestamp = validateLeaderboardPayload(
    createValidLeaderboardPayload({ submittedAt: undefined }),
  );
  assert.equal(omittedTimestamp.valid, true);
  assert.equal(omittedTimestamp.payload.submittedAt, "1970-01-01T00:00:00.000Z");

  const invalidTimestamp = validateLeaderboardPayload(
    createValidLeaderboardPayload({ submittedAt: "not-a-date" }),
  );
  assert.equal(invalidTimestamp.valid, false);
  assert.equal(
    invalidTimestamp.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_TIMESTAMP),
    true,
  );

  const maxScore = validateLeaderboardPayload(
    createValidLeaderboardPayload({ score: LEADERBOARD_CONTRACT.maxScore }),
  );
  assert.equal(maxScore.valid, true);

  const tooLargeScore = validateLeaderboardPayload(
    createValidLeaderboardPayload({ score: LEADERBOARD_CONTRACT.maxScore + 1 }),
  );
  assert.equal(tooLargeScore.valid, false);
  assert.equal(
    tooLargeScore.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_SCORE),
    true,
  );

  const fractionalDuration = validateLeaderboardPayload(
    createValidLeaderboardPayload({ runDurationFrames: 12.5 }),
  );
  assert.equal(fractionalDuration.valid, false);
  assert.equal(
    fractionalDuration.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_RUN_DURATION),
    true,
  );

  const emptyNonce = validateLeaderboardPayload(createValidLeaderboardPayload({ clientNonce: " \n " }));
  assert.equal(emptyNonce.valid, false);
  assert.equal(
    emptyNonce.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_CLIENT_NONCE),
    true,
  );

  const longText = "x".repeat(LEADERBOARD_CONTRACT.maxTextFieldLength + 20);
  const longFields = validateLeaderboardPayload(
    createValidLeaderboardPayload({
      gameVersion: longText,
      buildId: longText,
      clientNonce: longText,
    }),
  );
  assert.equal(longFields.valid, true);
  assert.equal(longFields.payload.gameVersion.length, LEADERBOARD_CONTRACT.maxTextFieldLength);
  assert.equal(longFields.payload.buildId.length, LEADERBOARD_CONTRACT.maxTextFieldLength);
  assert.equal(longFields.payload.clientNonce.length, LEADERBOARD_CONTRACT.maxTextFieldLength);
}

function smokeLeaderboardEntryNormalization() {
  const named = normalizeLeaderboardEntry(createValidLeaderboardPayload(), { rank: 2.8 });

  assert.equal(named.valid, true);
  assert.deepEqual(named.entry, {
    rank: 2,
    score: 1234,
    displayName: "ACE",
    submittedAt: "2026-07-01T12:00:00.000Z",
    gameVersion: "0.1.0",
    buildId: "local-dev",
    scoreEra: LEADERBOARD_CONTRACT.scoreEra,
    source: LEADERBOARD_CONTRACT.providerMode,
  });

  const anonymous = normalizeLeaderboardEntry(createValidLeaderboardPayload({ displayName: undefined }));
  assert.equal(anonymous.valid, true);
  assert.equal(anonymous.entry.displayName, LEADERBOARD_CONTRACT.anonymousLabel);

  const invalid = normalizeLeaderboardEntry(createValidLeaderboardPayload({ scoreEra: "future" }));
  assert.equal(invalid.valid, false);
  assert.equal(invalid.entry, null);
}

function smokeLocalLeaderboardProviderSuccess() {
  const provider = createLocalLeaderboardProvider({
    maxEntries: 2,
    now: () => "2026-07-01T13:00:00.000Z",
  });

  const first = provider.submit(
    createValidLeaderboardPayload({
      score: 100,
      displayName: "  FIRST  ",
      submittedAt: undefined,
      clientNonce: "run-first",
    }),
  );
  assert.equal(first.ok, true);
  assert.equal(first.code, LOCAL_LEADERBOARD_PROVIDER_CODES.SUCCESS);
  assert.equal(first.provider, LEADERBOARD_CONTRACT.providerMode);
  assert.equal(first.entry.displayName, "FIRST");
  assert.equal(first.entry.submittedAt, "2026-07-01T13:00:00.000Z");

  const second = provider.submit(
    createValidLeaderboardPayload({
      score: 250,
      displayName: "SECOND",
      submittedAt: "2026-07-01T12:30:00.000Z",
      clientNonce: "run-second",
    }),
  );
  assert.equal(second.ok, true);
  assert.deepEqual(
    second.entries.map((entry) => [entry.rank, entry.score, entry.displayName]),
    [
      [1, 250, "SECOND"],
      [2, 100, "FIRST"],
    ],
  );

  const duplicate = provider.submit(createValidLeaderboardPayload({ clientNonce: "run-second" }));
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, LOCAL_LEADERBOARD_PROVIDER_CODES.DUPLICATE_CLIENT_NONCE);
  assert.equal(duplicate.errors[0].field, "clientNonce");

  const invalid = provider.submit(createValidLeaderboardPayload({ score: -5, clientNonce: "run-bad" }));
  assert.equal(invalid.ok, false);
  assert.equal(invalid.code, LOCAL_LEADERBOARD_PROVIDER_CODES.VALIDATION_FAILED);
  assert.equal(
    invalid.errors.some((error) => error.code === LEADERBOARD_ERROR_CODES.INVALID_SCORE),
    true,
  );

  const entries = provider.getEntries();
  assert.equal(entries.ok, true);
  assert.equal(entries.entries.length, 2);
}

function smokeLocalLeaderboardProviderModes() {
  const payload = createValidLeaderboardPayload();
  const disabled = createLocalLeaderboardProvider({ mode: LOCAL_LEADERBOARD_PROVIDER_MODES.DISABLED });
  assert.equal(disabled.submit(payload).code, LOCAL_LEADERBOARD_PROVIDER_CODES.DISABLED);
  assert.equal(disabled.getEntries().ok, false);

  const consent = createLocalLeaderboardProvider({
    mode: LOCAL_LEADERBOARD_PROVIDER_MODES.CONSENT_REQUIRED,
  });
  assert.equal(consent.submit(payload).code, LOCAL_LEADERBOARD_PROVIDER_CODES.CONSENT_REQUIRED);

  const unavailable = createLocalLeaderboardProvider({
    mode: LOCAL_LEADERBOARD_PROVIDER_MODES.UNAVAILABLE,
  });
  assert.equal(unavailable.submit(payload).code, LOCAL_LEADERBOARD_PROVIDER_CODES.UNAVAILABLE);

  const rejected = createLocalLeaderboardProvider({ mode: LOCAL_LEADERBOARD_PROVIDER_MODES.REJECTED });
  const rejectedResult = rejected.submit(payload);
  assert.equal(rejectedResult.ok, false);
  assert.equal(rejectedResult.code, LOCAL_LEADERBOARD_PROVIDER_CODES.REJECTED);

  assert.equal(rejected.setMode("unknown-mode"), LOCAL_LEADERBOARD_PROVIDER_MODES.ENABLED);
  assert.equal(rejected.submit(payload).ok, true);
}

function smokeLocalLeaderboardProviderCapacityAndReset() {
  const provider = createLocalLeaderboardProvider({
    maxEntries: 2,
    initialEntries: [
      createValidLeaderboardPayload({ score: 100, displayName: "LOW", clientNonce: "seed-low" }),
      createValidLeaderboardPayload({ score: 300, displayName: "TOP", clientNonce: "seed-top" }),
      createValidLeaderboardPayload({ score: 200, displayName: "MID", clientNonce: "seed-mid" }),
      createValidLeaderboardPayload({ score: -1, displayName: "BAD", clientNonce: "seed-bad" }),
    ],
  });

  assert.deepEqual(
    provider.getEntries().entries.map((entry) => [entry.rank, entry.score, entry.displayName]),
    [
      [1, 300, "TOP"],
      [2, 200, "MID"],
    ],
  );

  const duplicateSeed = provider.submit(createValidLeaderboardPayload({ clientNonce: "seed-top" }));
  assert.equal(duplicateSeed.ok, false);
  assert.equal(duplicateSeed.code, LOCAL_LEADERBOARD_PROVIDER_CODES.DUPLICATE_CLIENT_NONCE);

  provider.reset();
  assert.equal(provider.getEntries().entries.length, 0);
  assert.equal(
    provider.submit(createValidLeaderboardPayload({ clientNonce: "seed-top" })).code,
    LOCAL_LEADERBOARD_PROVIDER_CODES.SUCCESS,
  );
}

function smokeLocalLeaderboardProviderNoNetworkApis() {
  const source = readFileSync(
    new URL("../src/logic/leaderboard/mockProvider.js", import.meta.url),
    "utf8",
  );
  const forbiddenTokens = [
    "fetch(",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "sendBeacon",
    "serviceWorker",
    "firebase",
    "supabase",
    "cloudflare",
    "localStorage",
    "sessionStorage",
  ];

  for (const token of forbiddenTokens) {
    assert.equal(source.includes(token), false, `mockProvider.js must not include ${token}`);
  }
}

function smokeLeaderboardRuntimeSeparation() {
  const leaderboardFiles = [
    "../src/logic/leaderboard/contract.js",
    "../src/logic/leaderboard/mockProvider.js",
    "../src/logic/leaderboard/copy.js",
  ];
  const forbiddenPatterns = [
    /from\s+["']\.\.\/engine\//,
    /from\s+["']\.\.\/\.\.\/data\/gameConfig\.js/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bsendBeacon\b/,
    /\bnavigator\.serviceWorker\b/,
    /\bfirebase\b/i,
    /\bsupabase\b/i,
    /\bcloudflare\b/i,
    /\blocalStorage\./,
    /\bsessionStorage\./,
    /\breadHighScore\b/,
    /\bwriteHighScore\b/,
    /\bcreateMetaProgressionStore\b/,
    /\bcreateSettingsStore\b/,
  ];

  for (const file of leaderboardFiles) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    for (const pattern of forbiddenPatterns) {
      assert.equal(pattern.test(source), false, `${file} must stay isolated from ${pattern}`);
    }
  }

  const runtimeSources = [
    "../src/main.js",
    "../src/logic/engine/gameRuntime.js",
    "../src/logic/engine/metaProgression.js",
    "../src/logic/engine/settings.js",
  ]
    .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
    .join("\n");

  assert.equal(runtimeSources.includes("logic/leaderboard"), false);
  assert.equal(runtimeSources.includes("../leaderboard"), false);
}

function smokeLeaderboardCopyBoundary() {
  const expectedKeys = [
    LEADERBOARD_COPY_KEYS.LOCAL_ONLY,
    LEADERBOARD_COPY_KEYS.CONSENT_REQUIRED,
    LEADERBOARD_COPY_KEYS.PUBLIC_DISPLAY_WARNING,
    LEADERBOARD_COPY_KEYS.DISABLED,
    LEADERBOARD_COPY_KEYS.UNAVAILABLE,
    LEADERBOARD_COPY_KEYS.VALIDATION_FAILED,
    LEADERBOARD_COPY_KEYS.DUPLICATE_REJECTED,
    LEADERBOARD_COPY_KEYS.PRIVACY_BOUNDARY,
  ];

  assert.deepEqual(Object.values(LEADERBOARD_COPY_KEYS), expectedKeys);
  for (const key of expectedKeys) {
    const copy = getLeaderboardCopy(key);
    assert.equal(typeof copy.title, "string");
    assert.equal(copy.title.length > 0, true);
    assert.equal(typeof copy.body, "string");
    assert.equal(copy.body.length > 0, true);
  }

  assert.equal(
    getLeaderboardCopy(LEADERBOARD_COPY_KEYS.LOCAL_ONLY).body.includes("not uploaded"),
    true,
  );
  assert.equal(
    getLeaderboardCopy(LEADERBOARD_COPY_KEYS.CONSENT_REQUIRED).body.includes("require consent"),
    true,
  );
  assert.equal(
    getLeaderboardCopy(LEADERBOARD_COPY_KEYS.DISABLED).body.includes("Local high score"),
    true,
  );
  assert.equal(
    getLeaderboardCopy(LEADERBOARD_COPY_KEYS.PRIVACY_BOUNDARY).body.includes("localStorage"),
    true,
  );
  assert.equal(getLeaderboardCopy("missing-key"), LEADERBOARD_COPY[LEADERBOARD_COPY_KEYS.LOCAL_ONLY]);
}

function createInputTestWindow() {
  const listeners = new Map();
  return {
    navigator: { maxTouchPoints: 0 },
    innerWidth: 800,
    addEventListener(type, handler) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatch(type, event = {}) {
      for (const handler of listeners.get(type) ?? []) {
        handler({
          preventDefault() {},
          ...event,
        });
      }
    },
  };
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function createValidLeaderboardPayload(patch = {}) {
  return {
    contractVersion: LEADERBOARD_CONTRACT.version,
    score: 1234,
    displayName: "ACE",
    anonymousLabel: LEADERBOARD_CONTRACT.anonymousLabel,
    submittedAt: "2026-07-01T12:00:00.000Z",
    gameVersion: "0.1.0",
    buildId: "local-dev",
    runDurationFrames: 3600,
    clientNonce: "local-run-001",
    scoreEra: LEADERBOARD_CONTRACT.scoreEra,
    ...patch,
  };
}

function createRecordingCanvasContext() {
  const calls = [];
  const context = {
    calls,
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    beginPath() {},
    arc() {},
    fill() {},
    stroke() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fillRect() {},
    setLineDash() {},
  };

  return new Proxy(context, {
    set(target, name, value) {
      if (name === "shadowBlur" || name === "strokeStyle") {
        calls.push({ type: "set", name, value });
      }
      target[name] = value;
      return true;
    },
  });
}

function createStaticAimInput() {
  return {
    getAimState() {
      return {
        isTouchDevice: false,
        mouse: { x: 260, y: 120 },
        leftStick: {},
        rightStick: {},
      };
    },
  };
}

function hasProjectileTrailStroke(ctx) {
  return ctx.calls.some(
    (call) =>
      call.type === "set" &&
      call.name === "strokeStyle" &&
      call.value === "rgba(255, 136, 68, 0.35)",
  );
}

smokeBulletFireReset();
smokePhase13ConfigDefaults();
smokePhase13UiCopyAndDebugAffordances();
smokeBulletPoolAmmoState();
smokeBulletPickupGates();
smokeChargedShotSpeedClamp();
smokeChargedMouseInputRelease();
smokeUltimateInputLatch();
smokeDashRecallInputRebind();
smokeWallBounceEnergy();
smokeEnemyReboundAndCooldown();
smokeEnemyKillReboundBeforeDamping();
smokeComboScoring();
smokeObstacleLayoutAndBounce();
smokeMovingObstacleDeterminismAndBounds();
smokeMovingObstacleRelativeBounce();
smokeShooterProjectileLifecycle();
smokePlayerDashEvasion();
smokeUltimateStateAndRadialClear();
smokeMetaProgressionPersistence();
smokeMetaProgressionEconomy();
smokeMetaProgressionStore();
smokeMetaProgressionDevSeed();
smokeHighScorePersistence();
smokeMetaProgressionRunSettlement();
smokeMetaProgressionUpgradeEffects();
smokeRenderQualityResolution();
smokePerformanceMetricsAggregation();
smokeDevStressSeedResolution();
smokeParticlePoolCapacityAndReset();
smokeRendererLowQualityGlowScale();
smokeRendererProjectileTrailQualitySwitch();
smokeSettingsPersistence();
smokeAudioMutePreference();
smokeLeaderboardContractValidation();
smokeLeaderboardContractBoundaries();
smokeLeaderboardEntryNormalization();
smokeLocalLeaderboardProviderSuccess();
smokeLocalLeaderboardProviderModes();
smokeLocalLeaderboardProviderCapacityAndReset();
smokeLocalLeaderboardProviderNoNetworkApis();
smokeLeaderboardRuntimeSeparation();
smokeLeaderboardCopyBoundary();

console.log(
  "Core smoke passed: phase 1 regressions, combo, obstacles, shooter lifecycle, meta progression, performance metrics, leaderboard contract, local leaderboard provider.",
);
