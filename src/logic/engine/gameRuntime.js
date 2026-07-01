import { GAME_CONFIG } from "../../data/gameConfig.js";
import { createAudioSystem } from "./audio.js";
import { resolveBulletEnemyCollision, resolvePlayerEnemyCollision } from "./collisions.js";
import { Bullet, Enemy, Particle, Player } from "./entities.js";
import { createHud } from "./hud.js";
import { createInputController } from "./input.js";
import { createRenderer } from "./renderer.js";

export function createGameRuntime({
  documentRef = document,
  windowRef = window,
  config = GAME_CONFIG,
} = {}) {
  const canvas = documentRef.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let gameState = "MENU";
  let score = 0;
  let highScore = Number(windowRef.localStorage.getItem("eternalRicochetHighScore") || 0);
  let frameCount = 0;
  let shakeTime = 0;
  let freezeFrames = 0;
  let player = null;
  let bullet = new Bullet(config.bullet);
  let enemies = [];
  let particles = [];
  let spawnTimer = 0;
  let currentSpawnInterval = config.enemy.baseSpawnInterval;
  let started = false;

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
    player = new Player(getBounds(), config.player);
    bullet = new Bullet(config.bullet);
    enemies = [];
    particles = [];
    score = 0;
    frameCount = 0;
    shakeTime = 0;
    freezeFrames = 0;
    spawnTimer = 0;
    currentSpawnInterval = config.enemy.baseSpawnInterval;
    input.resetTransient();
    hud.showPlaying();
    updateHud();
    gameState = "PLAYING";
    audio.init();
  }

  function endGame() {
    gameState = "GAMEOVER";
    if (score > highScore) {
      highScore = score;
      windowRef.localStorage.setItem("eternalRicochetHighScore", String(highScore));
    }
    hud.showGameOver({ scoreValue: score, highScoreValue: highScore });
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

    const tankProbability = Math.min(
      config.enemy.tankMaxProbability,
      frameCount / config.enemy.tankProbabilityFrameDivisor,
    );
    enemies.push(new Enemy(x, y, Math.random() < tankProbability ? "tank" : "chaser", config.enemy));
  }

  function updateHud() {
    hud.update({
      hp: player.hp,
      maxHp: player.maxHp,
      bulletActive: bullet.active,
      scoreValue: score,
    });
  }

  function addScore(points) {
    score += points;
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
    fireIfRequested();
    handleBulletEvents(
      bullet.update({
        recallRequested: input.isRecallRequested(),
        player,
        bounds: getBounds(),
      }),
    );

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.update(player);
      const playerCollision = resolvePlayerEnemyCollision({ player, enemy, effects });
      if (playerCollision.playerKilled) {
        updateHud();
        endGame();
        return;
      }
      resolveBulletEnemyCollision({ bullet, enemy, effects, config });
      if (!enemy.active) enemies.splice(i, 1);
    }

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

    renderer.render({ gameState, player, bullet, enemies, particles, frameCount, shakeTime });
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

  return {
    start,
    initGame,
    getState: () => ({
      gameState,
      score,
      frameCount,
      player,
      bullet,
      enemies,
      particles,
    }),
  };
}

