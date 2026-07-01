import { GAME_CONFIG } from "../../data/gameConfig.js";
import { createAudioSystem } from "./audio.js";
import {
  resolveBulletEnemyCollision,
  resolveBulletObstacleCollision,
  resolveCircleObstacleSeparation,
  resolvePlayerEnemyCollision,
  resolvePlayerProjectileCollision,
  resolveProjectileObstacleCollision,
  resolveProjectileWallCollision,
} from "./collisions.js";
import { Bullet, Enemy, EnemyProjectile, Particle, Player } from "./entities.js";
import { createHud } from "./hud.js";
import { createInputController } from "./input.js";
import { createObstacleLayout } from "./level.js";
import {
  createEffectiveRunConfig,
  createMetaProgressionStore,
  createRunSettlement,
} from "./metaProgression.js";
import { createRenderer } from "./renderer.js";
import { ComboState } from "./scoring.js";
import { createUpgradeShop } from "../../view/components/upgradeShop.js";

export function createGameRuntime({
  documentRef = document,
  windowRef = window,
  config = GAME_CONFIG,
} = {}) {
  const canvas = documentRef.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let gameState = "MENU";
  let runConfig = config;
  let score = 0;
  let highScore = Number(windowRef.localStorage.getItem("eternalRicochetHighScore") || 0);
  let frameCount = 0;
  let shakeTime = 0;
  let freezeFrames = 0;
  let player = null;
  let bullet = new Bullet(config.bullet);
  let enemies = [];
  let obstacles = [];
  let projectiles = [];
  let particles = [];
  let spawnTimer = 0;
  let currentSpawnInterval = config.enemy.baseSpawnInterval;
  const combo = new ComboState(config.combo);
  let started = false;
  let shooterIntroduced = false;
  let lastSettlement = null;

  function getBounds() {
    return { width: canvas.width, height: canvas.height };
  }

  function getGameState() {
    return gameState;
  }

  const input = createInputController({
    canvas,
    getGameState,
    getBulletActive: () => bullet.active,
    windowRef,
  });
  const audio = createAudioSystem({ getGameState, windowRef });
  const hud = createHud(documentRef);
  const renderer = createRenderer({ canvas, ctx, input, config });
  const metaStore = createMetaProgressionStore({
    storage: windowRef.localStorage,
    config: config.metaProgression,
  });
  const runSettlement = createRunSettlement(metaStore);
  createUpgradeShop({
    documentRef,
    metaStore,
    config: config.metaProgression,
    onChange: (metaState) => hud.updateMeta({ metaState }),
  });

  const effects = {
    audio: audio.sfx,
    addScreenShake,
    createParticles,
    freezeFrames: (frames) => {
      freezeFrames = Math.max(freezeFrames, frames);
    },
    addScore,
  };

  function resizeCanvas() {
    canvas.width = windowRef.innerWidth;
    canvas.height = windowRef.innerHeight;
  }

  function initGame() {
    runConfig = createEffectiveRunConfig(metaStore.reload(), config);
    player = new Player(getBounds(), runConfig.player);
    bullet = new Bullet(runConfig.bullet);
    enemies = [];
    obstacles = createObstacleLayout(getBounds(), config.obstacles);
    projectiles = [];
    particles = [];
    combo.reset();
    score = 0;
    frameCount = 0;
    shakeTime = 0;
    freezeFrames = 0;
    spawnTimer = 0;
    currentSpawnInterval = config.enemy.baseSpawnInterval;
    shooterIntroduced = false;
    runSettlement.reset();
    lastSettlement = null;
    input.resetTransient();
    hud.showPlaying();
    updateHud();
    gameState = "PLAYING";
    audio.init();
  }

  function endGame() {
    gameState = "GAMEOVER";
    combo.reset();
    projectiles = [];
    lastSettlement = runSettlement.settleScore(score);
    if (score > highScore) {
      highScore = score;
      windowRef.localStorage.setItem("eternalRicochetHighScore", String(highScore));
    }
    hud.showGameOver({
      scoreValue: score,
      highScoreValue: highScore,
      settlement: lastSettlement,
    });
  }

  function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    const margin = config.enemy.spawnMargin;
    let x;
    let y;

    if (side === 0) {
      x = Math.random() * canvas.width;
      y = -margin;
    } else if (side === 1) {
      x = canvas.width + margin;
      y = Math.random() * canvas.height;
    } else if (side === 2) {
      x = Math.random() * canvas.width;
      y = canvas.height + margin;
    } else {
      x = -margin;
      y = Math.random() * canvas.height;
    }

    const shooterProbability =
      frameCount >= config.enemy.shooter.spawnStartFrame
        ? Math.min(
            config.enemy.shooter.maxProbability,
            frameCount / config.enemy.shooter.probabilityFrameDivisor,
          )
        : 0;
    const tankProbability = Math.min(
      config.enemy.tankMaxProbability,
      frameCount / config.enemy.tankProbabilityFrameDivisor,
    );
    const roll = Math.random();
    let type = "chaser";
    if (frameCount >= config.enemy.shooter.spawnStartFrame && !shooterIntroduced) {
      type = "shooter";
    } else if (roll < shooterProbability) {
      type = "shooter";
    } else if (roll < shooterProbability + tankProbability) {
      type = "tank";
    }
    if (type === "shooter") shooterIntroduced = true;
    enemies.push(new Enemy(x, y, type, config.enemy));
  }

  function updateHud() {
    hud.update({
      hp: player.hp,
      maxHp: player.maxHp,
      bulletActive: bullet.active,
      scoreValue: score,
      combo: combo.getHudState(),
    });
  }

  function addScore(points) {
    const comboResult = combo.recordKill(points);
    score += comboResult.points;
    updateHud();
    hud.pulseScore();
  }

  function addScreenShake(amount) {
    shakeTime = Math.max(shakeTime, amount);
  }

  function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      particles.push(new Particle(x, y, color, config.particles));
    }
  }

  function fireIfRequested() {
    const angle = input.consumeShootAngle(player);
    if (angle === null) return;

    bullet.fireFrom({ x: player.x, y: player.y }, angle);
    combo.reset();
    player.applyShotRecoil(angle);
    input.clearRecallLatch();
    audio.sfx.shoot();
    addScreenShake(config.feedback.shotShake);
    updateHud();
  }

  function handleBulletEvents(events) {
    for (const event of events) {
      if (event.type === "recall-start") {
        audio.sfx.recall();
      }
      if (event.type === "wall-bounce" && event.impactSpeedSq > 5) {
        audio.sfx.bounce();
        createParticles(bullet.x, bullet.y, 5, bullet.color);
        addScreenShake(config.feedback.wallBounceShake);
      }
      if (event.type === "collect") {
        combo.reset();
        input.clearRecallLatch();
        audio.sfx.collect();
        createParticles(player.x, player.y, 8, bullet.color);
        updateHud();
      }
    }
  }

  function updatePlaying() {
    if (freezeFrames > 0) {
      freezeFrames -= 1;
      return;
    }

    frameCount += 1;
    player.update({ moveVector: input.getMoveVector(), bounds: getBounds() });
    for (const obstacle of obstacles) {
      resolveCircleObstacleSeparation(player, obstacle);
    }
    fireIfRequested();
    handleBulletEvents(
      bullet.update({
        recallRequested: input.isRecallRequested(),
        player,
        bounds: getBounds(),
      }),
    );
    handleBulletObstacleCollisions();

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.update(player);
      for (const obstacle of obstacles) {
        resolveCircleObstacleSeparation(enemy, obstacle, config.obstacles.enemySeparationPadding);
      }
      const playerCollision = resolvePlayerEnemyCollision({ player, enemy, effects });
      if (playerCollision.playerKilled) {
        updateHud();
        endGame();
        return;
      }
      resolveBulletEnemyCollision({ bullet, enemy, effects, config: runConfig });
      if (!enemy.active) enemies.splice(i, 1);
      else if (enemy.canShoot()) spawnEnemyProjectile(enemy);
    }

    updateProjectiles();
    updateParticles();
    spawnTimer += 1;
    if (spawnTimer >= currentSpawnInterval) {
      spawnTimer = 0;
      spawnEnemy();
      if (currentSpawnInterval > config.enemy.minSpawnInterval) {
        currentSpawnInterval -= config.enemy.spawnIntervalStep;
      }
    }

    updateHud();
  }

  function handleBulletObstacleCollisions() {
    for (const obstacle of obstacles) {
      const result = resolveBulletObstacleCollision({ bullet, obstacle, config: runConfig });
      if (result.bounced) {
        audio.sfx.bounce();
        createParticles(bullet.x, bullet.y, 6, obstacle.color);
        addScreenShake(config.feedback.obstacleBounceShake);
      }
    }
  }

  function spawnEnemyProjectile(enemy) {
    projectiles.push(new EnemyProjectile({ x: enemy.x, y: enemy.y }, player, enemy.id, config.enemyProjectile));
    enemy.resetShotCooldown();
    addScreenShake(config.feedback.shooterFireShake);
  }

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = projectiles[i];
      projectile.update();
      resolveProjectileWallCollision(projectile, getBounds(), config.enemyProjectile);
      for (const obstacle of obstacles) {
        resolveProjectileObstacleCollision(projectile, obstacle, config.enemyProjectile);
      }
      const projectileHit = resolvePlayerProjectileCollision({ player, projectile, effects, config });
      if (projectileHit.playerKilled) {
        updateHud();
        endGame();
        return;
      }
      if (!projectile.active) projectiles.splice(i, 1);
    }
  }

  function updateMenuParticles() {
    if (Math.random() < 0.1) {
      createParticles(Math.random() * canvas.width, Math.random() * canvas.height, 1, config.player.color);
    }
    updateParticles();
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      particles[i].update();
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function gameLoop() {
    windowRef.requestAnimationFrame(gameLoop);

    if (gameState === "PLAYING") {
      updatePlaying();
    } else if (gameState === "MENU" || gameState === "GAMEOVER") {
      updateMenuParticles();
    }

    renderer.render({
      gameState,
      player,
      bullet,
      enemies,
      obstacles,
      projectiles,
      particles,
      frameCount,
      shakeTime,
    });
    if (shakeTime > 0 && freezeFrames <= 0) shakeTime -= 1;
  }

  function start() {
    if (started) return;
    started = true;
    resizeCanvas();
    windowRef.addEventListener("resize", resizeCanvas);
    documentRef.getElementById("start-btn").addEventListener("click", initGame);
    documentRef.getElementById("restart-btn").addEventListener("click", initGame);
    windowRef.requestAnimationFrame(gameLoop);
  }

  function getDebugState() {
    return {
      gameState,
      score,
      frameCount,
      player: player ? { hp: player.hp, x: player.x, y: player.y } : null,
      bullet: {
        active: bullet.active,
        isRecalling: bullet.isRecalling,
        trailLength: bullet.trail.length,
      },
      enemies: enemies.map((enemy) => ({
        type: enemy.type,
        hp: enemy.hp,
        active: enemy.active,
        x: enemy.x,
        y: enemy.y,
        fireCooldown: enemy.fireCooldown,
      })),
      obstacles: obstacles.map((obstacle) => ({
        id: obstacle.id,
        x: obstacle.x,
        y: obstacle.y,
        radius: obstacle.radius,
      })),
      projectiles: projectiles.map((projectile) => ({
        active: projectile.active,
        x: projectile.x,
        y: projectile.y,
        wallBounces: projectile.wallBounces,
      })),
      combo: combo.getHudState(),
      meta: metaStore.getState(),
      settlement: lastSettlement,
      runConfig: {
        playerHp: runConfig.player.hp,
        bulletRecallForce: runConfig.bullet.recallForce,
        bulletKillDamping: runConfig.bullet.killDamping,
      },
    };
  }

  return {
    start,
    initGame,
    getDebugState,
    getState: () => ({
      gameState,
      score,
      frameCount,
      player,
      bullet,
      enemies,
      obstacles,
      projectiles,
      particles,
      combo: combo.getHudState(),
      meta: metaStore.getState(),
      settlement: lastSettlement,
      runConfig,
    }),
  };
}
