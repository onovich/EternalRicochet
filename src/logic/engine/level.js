import { GAME_CONFIG } from "../../data/gameConfig.js";
import { Obstacle } from "./entities.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createObstacleLayout(bounds, config = GAME_CONFIG.obstacles) {
  return config.layout.slice(0, config.count).map((item, index) => {
    const radius = item.radius ?? config.radius;
    return new Obstacle(
      clamp(bounds.width * item.x, radius + config.edgePadding, bounds.width - radius - config.edgePadding),
      clamp(bounds.height * item.y, radius + config.edgePadding, bounds.height - radius - config.edgePadding),
      radius,
      index,
      config,
    );
  });
}

export function isPointSafeFromObstacles(point, radius, obstacles, padding = 0) {
  return obstacles.every((obstacle) => {
    const minDistance = radius + obstacle.radius + padding;
    return Math.hypot(point.x - obstacle.x, point.y - obstacle.y) >= minDistance;
  });
}

