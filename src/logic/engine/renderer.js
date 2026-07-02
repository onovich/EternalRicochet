import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getRenderQualityProfile } from "./renderQuality.js";

export function createRenderer({
  canvas,
  ctx,
  input,
  config = GAME_CONFIG,
  quality = getRenderQualityProfile(GAME_CONFIG.renderQuality.defaultTier),
}) {
  const qualityProfile = {
    ...getRenderQualityProfile(config.renderQuality.defaultTier, config.renderQuality),
    ...quality,
  };

  function render({
    gameState,
    player,
    bullet,
    bullets,
    ammoState,
    enemies,
    obstacles,
    projectiles,
    particles,
    frameCount,
    shakeTime,
  }) {
    const renderBullets = bullets?.length ? bullets : [bullet].filter(Boolean);
    const canFire = ammoState ? ammoState.available > 0 : !bullet?.active;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = config.canvas.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    applyScreenShake(shakeTime);
    drawGrid(player);

    ctx.globalCompositeOperation = "lighter";
    obstacles.forEach(drawObstacle);
    particles.forEach(drawParticle);
    if (gameState === "PLAYING") {
      projectiles.forEach(drawProjectile);
      renderBullets.forEach(drawBullet);
      enemies.forEach((enemy) => drawEnemy(enemy, player));
      drawPlayer(player, canFire, frameCount);
    }
    ctx.restore();

    drawJoysticks(gameState, canFire);
  }

  function applyScreenShake(shakeTime) {
    if (shakeTime <= 0) return;
    const mag = (shakeTime / 15) * 8 * qualityProfile.screenShakeScale;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  function drawGrid(player) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = config.canvas.gridSize;
    const offsetX = (player ? -player.x * 0.05 : 0) % gridSize;
    const offsetY = (player ? -player.y * 0.05 : 0) % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  function drawParticle(particle) {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
  }

  function drawObstacle(obstacle) {
    drawObstacleMotionHint(obstacle);
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.beginPath();
    ctx.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
    ctx.fillStyle = obstacle.coreColor;
    ctx.strokeStyle = obstacle.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = scaleGlow(18);
    ctx.shadowColor = obstacle.color;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, obstacle.radius * 0.45, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawObstacleMotionHint(obstacle) {
    if (!obstacle.motion) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(obstacle.originX, obstacle.originY);
    ctx.lineTo(obstacle.x, obstacle.y);
    ctx.strokeStyle = obstacle.motionHintColor ?? "rgba(0, 255, 170, 0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.restore();
  }

  function drawProjectile(projectile) {
    if (!projectile.active) return;

    if (qualityProfile.projectileTrail) {
      drawProjectileTrail(projectile);
    }

    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fillStyle = projectile.color;
    ctx.shadowBlur = scaleGlow(12);
    ctx.shadowColor = projectile.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawProjectileTrail(projectile) {
    const speed = Math.hypot(projectile.vx, projectile.vy);
    if (speed <= 0) return;

    const nx = projectile.vx / speed;
    const ny = projectile.vy / speed;
    const length = projectile.radius * 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(projectile.x - nx * length, projectile.y - ny * length);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.strokeStyle = "rgba(255, 136, 68, 0.35)";
    ctx.lineWidth = projectile.radius * 1.2;
    ctx.lineCap = "round";
    ctx.shadowBlur = scaleGlow(8);
    ctx.shadowColor = projectile.color;
    ctx.stroke();
    ctx.restore();
  }

  function drawBullet(bullet) {
    if (!bullet.active) return;

    const trail = getBulletTrailPoints(bullet);
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i += 1) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.strokeStyle = bullet.isRecalling ? bullet.config.recallTrailColor : bullet.color;
      ctx.lineWidth = bullet.radius;
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = scaleGlow(20);
    ctx.shadowColor = bullet.isRecalling ? bullet.config.recallGlowColor : bullet.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawEnemy(enemy, player) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(Math.atan2(player.y - enemy.y, player.x - enemy.x));
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = scaleGlow(10);
    ctx.shadowColor = enemy.color;
    ctx.fillStyle = "rgba(0,0,0,0.5)";

    ctx.beginPath();
    if (enemy.type === "tank") {
      for (let i = 0; i < 6; i += 1) {
        ctx.lineTo(
          enemy.radius * Math.cos((i * Math.PI) / 3),
          enemy.radius * Math.sin((i * Math.PI) / 3),
        );
      }
    } else if (enemy.type === "shooter") {
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(-enemy.radius * 0.7, -enemy.radius * 0.75);
      ctx.lineTo(-enemy.radius * 0.25, 0);
      ctx.lineTo(-enemy.radius * 0.7, enemy.radius * 0.75);
    } else {
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(-enemy.radius, -enemy.radius * 0.8);
      ctx.lineTo(-enemy.radius * 0.5, 0);
      ctx.lineTo(-enemy.radius, enemy.radius * 0.8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = enemy.color;
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer(player, canFire, frameCount) {
    if (player.invulnTime > 0 && Math.floor(frameCount / 4) % 2 === 0) return;

    const dashState = player.getDashState?.() ?? { active: false, evading: false };
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = dashState.evading ? "#ffffff" : player.color;
    ctx.shadowBlur = scaleGlow(dashState.active ? 26 : 15);
    ctx.shadowColor = dashState.evading ? "#facc15" : player.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (dashState.evading) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    drawAimLine(player, canFire);
  }

  function drawAimLine(player, canFire) {
    if (!canFire) return;

    const aim = input.getAimState();
    if (aim.isTouchDevice && aim.rightStick.isDragging) {
      const aimAngle = Math.atan2(aim.rightStick.y - aim.rightStick.oy, aim.rightStick.x - aim.rightStick.ox);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(aimAngle);
      ctx.beginPath();
      ctx.moveTo(player.radius + 5, 0);
      ctx.lineTo(150, 0);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
      drawChargeIndicator(player);
      return;
    }

    if (!aim.isTouchDevice) {
      const aimAngle = Math.atan2(aim.mouse.y - player.y, aim.mouse.x - player.x);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(aimAngle);
      ctx.beginPath();
      ctx.moveTo(player.radius + 10, 0);
      ctx.lineTo(player.radius + 20, 0);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      drawChargeIndicator(player);
    }
  }

  function drawChargeIndicator(player) {
    const chargeState = input.getChargeState?.() ?? { active: false, frames: 0 };
    if (!chargeState.active) return;

    const chargeConfig = config.bullet.charge;
    const ratio = Math.min(1, Math.max(0, chargeState.frames / Math.max(1, chargeConfig.framesToMax)));
    const radius = chargeConfig.indicatorRadius;
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.strokeStyle = `rgba(250, 204, 21, ${0.35 + ratio * 0.45})`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowBlur = scaleGlow(12);
    ctx.shadowColor = "#facc15";
    ctx.stroke();
    ctx.restore();
  }

  function drawJoysticks(gameState, canFire) {
    const aim = input.getAimState();
    if (!aim.isTouchDevice || gameState !== "PLAYING") return;

    ctx.globalCompositeOperation = "source-over";
    if (aim.leftStick.active) {
      ctx.beginPath();
      ctx.arc(aim.leftStick.ox, aim.leftStick.oy, 40, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(aim.leftStick.x, aim.leftStick.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 255, 0.4)";
      ctx.fill();
    }

    if (aim.rightStick.active && aim.rightStick.isDragging && canFire) {
      ctx.beginPath();
      ctx.arc(aim.rightStick.ox, aim.rightStick.oy, 30, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,0,0,0.05)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(aim.rightStick.x, aim.rightStick.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
      ctx.fill();
    }
  }

  function getBulletTrailPoints(bullet) {
    const limit = Math.max(0, Math.floor(qualityProfile.bulletTrailLength));
    if (limit <= 0) return [];
    return bullet.trail.slice(Math.max(0, bullet.trail.length - limit));
  }

  function scaleGlow(value) {
    return Math.max(0, value * qualityProfile.glowScale);
  }

  return { render };
}
