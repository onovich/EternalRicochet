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
import { resolveDevStressSeed } from "../src/logic/engine/devStress.js";
import { Bullet, Enemy, EnemyProjectile, Player } from "../src/logic/engine/entities.js";
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

function smokeMetaProgressionPersistence() {
  const storage = createMemoryStorage();
  assert.deepEqual(readMetaState(storage), createDefaultMetaState());

  storage.setItem(GAME_CONFIG.metaProgression.storageKey, "{bad json");
  assert.deepEqual(readMetaState(storage), createDefaultMetaState());

  const sanitized = sanitizeMetaState({
    credits: -20,
    totalCreditsEarned: 2000000,
    upgrades: {
      gravityRecall: 99,
      armorPiercer: 2.8,
      energyShield: -1,
      unknown: 99,
    },
  });

  assert.equal(sanitized.credits, 0);
  assert.equal(sanitized.totalCreditsEarned, GAME_CONFIG.metaProgression.maxCredits);
  assert.equal(sanitized.upgrades.gravityRecall, GAME_CONFIG.metaProgression.upgrades.gravityRecall.maxLevel);
  assert.equal(sanitized.upgrades.armorPiercer, 2);
  assert.equal(sanitized.upgrades.energyShield, 0);
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
    search: "?erSeedMeta=1&credits=40&gravityRecall=1&armorPiercer=2&energyShield=99",
  });
  const seededState = readMetaState(storage);

  assert.equal(seed.saved, true);
  assert.equal(seededState.credits, 40);
  assert.equal(seededState.upgrades.gravityRecall, 1);
  assert.equal(seededState.upgrades.armorPiercer, 2);
  assert.equal(seededState.upgrades.energyShield, GAME_CONFIG.metaProgression.upgrades.energyShield.maxLevel);
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
  assert.equal(GAME_CONFIG.player.hp, 3);
  assert.equal(GAME_CONFIG.bullet.recallForce, 2);
}

function smokeRenderQualityResolution() {
  const low = resolveRenderQuality({ search: "?erQuality=low" });
  assert.equal(low.tier, "low");
  assert.equal(low.profile.glowScale, GAME_CONFIG.renderQuality.tiers.low.glowScale);
  assert.equal(low.profile.particleCap, GAME_CONFIG.renderQuality.tiers.low.particleCap);

  const fallback = resolveRenderQuality({ search: "?erQuality=unknown" });
  assert.equal(fallback.tier, GAME_CONFIG.renderQuality.defaultTier);
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
      if (name === "shadowBlur") calls.push({ type: "set", name, value });
      target[name] = value;
      return true;
    },
  });
}

smokeBulletFireReset();
smokeWallBounceEnergy();
smokeEnemyReboundAndCooldown();
smokeComboScoring();
smokeObstacleLayoutAndBounce();
smokeShooterProjectileLifecycle();
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

console.log(
  "Core smoke passed: phase 1 regressions, combo, obstacles, shooter lifecycle, meta progression, performance metrics.",
);
