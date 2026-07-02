export function createInputController({
  canvas,
  getGameState,
  getBulletActive,
  windowRef = window,
}) {
  const keys = { w: false, a: false, s: false, d: false, space: false, r: false };
  const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    leftDown: false,
    rightDown: false,
  };
  const isTouchDevice = "ontouchstart" in windowRef || windowRef.navigator.maxTouchPoints > 0;
  const leftStick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 };
  const rightStick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, isDragging: false };
  let recallTriggered = false;
  let dashTriggered = false;
  let ultimateTriggered = false;
  let mouseChargeFrames = 0;
  let touchChargeFrames = 0;
  let pendingMouseShot = null;
  let pendingTouchShot = null;

  function setKey(event, value) {
    const key = event.key.toLowerCase();
    if (key === "w" || event.key === "ArrowUp") keys.w = value;
    if (key === "a" || event.key === "ArrowLeft") keys.a = value;
    if (key === "s" || event.key === "ArrowDown") keys.s = value;
    if (key === "d" || event.key === "ArrowRight") keys.d = value;
    if (event.key === " ") keys.space = value;
    if (key === "r") keys.r = value;
    if (key === "r" && value) recallTriggered = true;
    if (event.key === " " && value && !event.repeat) dashTriggered = true;
    if (key === "f" && value && !event.repeat) ultimateTriggered = true;
  }

  windowRef.addEventListener("keydown", (event) => setKey(event, true));
  windowRef.addEventListener("keyup", (event) => setKey(event, false));
  windowRef.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  windowRef.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
      if (mouse.leftDown) return;
      mouse.leftDown = true;
      mouseChargeFrames = 0;
    }
    if (event.button === 2) {
      mouse.rightDown = true;
      recallTriggered = true;
    }
  });
  windowRef.addEventListener("mouseup", (event) => {
    if (event.button === 0 && mouse.leftDown) {
      pendingMouseShot = { chargeFrames: mouseChargeFrames };
      mouse.leftDown = false;
      mouseChargeFrames = 0;
    }
    if (event.button === 2) mouse.rightDown = false;
  });
  windowRef.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (event.button === 0) {
      if (mouse.leftDown) return;
      mouse.leftDown = true;
      mouseChargeFrames = 0;
    }
    if (event.button === 2) {
      mouse.rightDown = true;
      recallTriggered = true;
    }
  });
  windowRef.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") return;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (event.button === 0 && mouse.leftDown) {
      pendingMouseShot = { chargeFrames: mouseChargeFrames };
      mouse.leftDown = false;
      mouseChargeFrames = 0;
    }
    if (event.button === 2) mouse.rightDown = false;
  });
  windowRef.addEventListener("contextmenu", (event) => event.preventDefault());

  windowRef.addEventListener("touchstart", (event) => {
    if (getGameState() !== "PLAYING") return;
    for (const touch of event.changedTouches) {
      if (touch.clientX < windowRef.innerWidth / 2) {
        leftStick.active = true;
        leftStick.id = touch.identifier;
        leftStick.ox = touch.clientX;
        leftStick.oy = touch.clientY;
        leftStick.x = touch.clientX;
        leftStick.y = touch.clientY;
      } else {
        rightStick.active = true;
        rightStick.id = touch.identifier;
        rightStick.ox = touch.clientX;
        rightStick.oy = touch.clientY;
        rightStick.x = touch.clientX;
        rightStick.y = touch.clientY;
        rightStick.isDragging = false;
        touchChargeFrames = 0;
      }
    }
  });

  windowRef.addEventListener(
    "touchmove",
    (event) => {
      if (getGameState() !== "PLAYING") return;
      event.preventDefault();
      for (const touch of event.changedTouches) {
        if (leftStick.active && touch.identifier === leftStick.id) {
          leftStick.x = touch.clientX;
          leftStick.y = touch.clientY;
          let dx = leftStick.x - leftStick.ox;
          let dy = leftStick.y - leftStick.oy;
          const dist = Math.hypot(dx, dy);
          const maxDist = 40;
          if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
          }
          leftStick.dx = dx / maxDist;
          leftStick.dy = dy / maxDist;
        }
        if (rightStick.active && touch.identifier === rightStick.id) {
          rightStick.x = touch.clientX;
          rightStick.y = touch.clientY;
          const dist = Math.hypot(rightStick.x - rightStick.ox, rightStick.y - rightStick.oy);
          if (dist > 15) rightStick.isDragging = true;
        }
      }
    },
    { passive: false },
  );

  windowRef.addEventListener("touchend", (event) => {
    for (const touch of event.changedTouches) {
      if (leftStick.active && touch.identifier === leftStick.id) {
        leftStick.active = false;
        leftStick.dx = 0;
        leftStick.dy = 0;
      }
      if (rightStick.active && touch.identifier === rightStick.id) {
        rightStick.active = false;
        if (rightStick.isDragging) {
          if (!getBulletActive()) {
            pendingTouchShot = {
              angle: Math.atan2(rightStick.y - rightStick.oy, rightStick.x - rightStick.ox),
              chargeFrames: touchChargeFrames,
            };
          }
        } else {
          recallTriggered = true;
        }
        touchChargeFrames = 0;
      }
    }
  });

  function updateCharge() {
    if (getGameState() !== "PLAYING") return;
    if (mouse.leftDown) mouseChargeFrames += 1;
    if (rightStick.active && rightStick.isDragging) touchChargeFrames += 1;
  }

  function getMoveVector() {
    let moveX = 0;
    let moveY = 0;
    if (keys.w) moveY -= 1;
    if (keys.s) moveY += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;

    if (leftStick.active) {
      moveX = leftStick.dx;
      moveY = leftStick.dy;
    }

    const len = Math.hypot(moveX, moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }
    return { x: moveX, y: moveY };
  }

  function consumeShot(player, chargeConfig) {
    if (getBulletActive()) {
      pendingMouseShot = null;
      pendingTouchShot = null;
      return null;
    }

    if (pendingTouchShot !== null) {
      const shot = {
        angle: pendingTouchShot.angle,
        source: "touch",
        ...resolveCharge(pendingTouchShot.chargeFrames, chargeConfig),
      };
      pendingTouchShot = null;
      return shot;
    }

    if (pendingMouseShot) {
      const chargeFrames = pendingMouseShot.chargeFrames;
      pendingMouseShot = null;
      return {
        angle: Math.atan2(mouse.y - player.y, mouse.x - player.x),
        source: "mouse",
        ...resolveCharge(chargeFrames, chargeConfig),
      };
    }

    return null;
  }

  function isRecallRequested() {
    return keys.r || mouse.rightDown || recallTriggered;
  }

  function clearRecallLatch() {
    recallTriggered = false;
  }

  function consumeUltimate() {
    const requested = ultimateTriggered;
    ultimateTriggered = false;
    return requested;
  }

  function consumeDash() {
    const requested = dashTriggered;
    dashTriggered = false;
    return requested;
  }

  function resetTransient() {
    mouse.leftDown = false;
    mouse.rightDown = false;
    recallTriggered = false;
    dashTriggered = false;
    ultimateTriggered = false;
    pendingMouseShot = null;
    pendingTouchShot = null;
    mouseChargeFrames = 0;
    touchChargeFrames = 0;
  }

  function getAimState() {
    return { isTouchDevice, mouse, leftStick, rightStick };
  }

  function getChargeState() {
    if (mouse.leftDown) {
      return { active: true, frames: mouseChargeFrames, source: "mouse" };
    }
    if (rightStick.active && rightStick.isDragging) {
      return { active: true, frames: touchChargeFrames, source: "touch" };
    }
    return { active: false, frames: 0, source: null };
  }

  function getAimDirection(player) {
    const aim = getAimState();
    if (aim.isTouchDevice && aim.rightStick.active && aim.rightStick.isDragging) {
      return normalizeVector({
        x: aim.rightStick.x - aim.rightStick.ox,
        y: aim.rightStick.y - aim.rightStick.oy,
      });
    }
    return normalizeVector({ x: aim.mouse.x - player.x, y: aim.mouse.y - player.y });
  }

  return {
    getMoveVector,
    consumeShot,
    consumeShootAngle: (player) => consumeShot(player)?.angle ?? null,
    isRecallRequested,
    clearRecallLatch,
    consumeUltimate,
    consumeDash,
    resetTransient,
    getAimState,
    getAimDirection,
    getChargeState,
    updateCharge,
  };
}

function resolveCharge(frames, config = {}) {
  const framesToMax = Math.max(1, Number(config.framesToMax ?? 1));
  const minPower = Number(config.minPower ?? 0);
  const maxPower = Number(config.maxPower ?? 1);
  const ratio = Math.min(1, Math.max(0, Number(frames) / framesToMax));
  return {
    chargeFrames: Math.max(0, Number(frames) || 0),
    chargeRatio: ratio,
    chargePower: minPower + ratio * (maxPower - minPower),
  };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= Number.EPSILON) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}
