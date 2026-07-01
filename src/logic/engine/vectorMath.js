export function magnitudeSq(vector) {
  return vector.x * vector.x + vector.y * vector.y;
}

export function magnitude(vector) {
  return Math.hypot(vector.x, vector.y);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(vector, fallback = { x: 0, y: 0 }) {
  const len = magnitude(vector);
  if (len <= Number.EPSILON) return { x: fallback.x, y: fallback.y };
  return { x: vector.x / len, y: vector.y / len };
}

export function clampMagnitude(vector, min, max) {
  const len = magnitude(vector);
  if (len <= Number.EPSILON) return { x: 0, y: 0 };
  const target = Math.min(max, Math.max(min, len));
  return {
    x: (vector.x / len) * target,
    y: (vector.y / len) * target,
  };
}

export function reflectVelocity(velocity, normal, restitution = 1) {
  const unitNormal = normalize(normal, { x: 1, y: 0 });
  const dot = velocity.x * unitNormal.x + velocity.y * unitNormal.y;
  return {
    x: (velocity.x - 2 * dot * unitNormal.x) * restitution,
    y: (velocity.y - 2 * dot * unitNormal.y) * restitution,
  };
}

export function velocityFallbackNormal(velocity) {
  return normalize({ x: -velocity.x, y: -velocity.y }, { x: 1, y: 0 });
}

