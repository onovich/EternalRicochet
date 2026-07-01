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

  function render({ gameState, player, bullet, enemies, obstacles, projectiles, particles, frameCount, shakeTime }) {
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
      drawBullet(bullet);
      enemies.forEach((enemy) => drawEnemy(enemy, player));
      drawPlayer(player, bullet, frameCount);
    }
    ctx.restore();

    drawJoysticks(gameState, bullet);
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

  function drawProjectile(projectile) {
    if (!projectile.active) return;

    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fillStyle = projectile.color;
    ctx.shadowBlur = scaleGlow(12);
    ctx.shadowColor = projectile.color;
    ctx.fill();
    ctx.shadowBlur = 0;
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

  function drawPlayer(player, bullet, frameCount) {
    if (player.invulnTime > 0 && Math.floor(frameCount / 4) % 2 === 0) return;

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = scaleGlow(15);
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    drawAimLine(player, bullet);
  }

  function drawAimLine(player, bullet) {
    if (bullet.active) return;

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
    }
  }

  function drawJoysticks(gameState, bullet) {
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

    if (aim.rightStick.active && aim.rightStick.isDragging && !bullet.active) {
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
