export function createInputController({
  canvas,
  getGameState,
  getBulletActive,
  windowRef = window,
}) {
  const keys = { w: false, a: false, s: false, d: false, space: false };
  const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    leftDown: false,
    rightDown: false,
  };
  const isTouchDevice = "ontouchstart" in windowRef || windowRef.navigator.maxTouchPoints > 0;
  const leftStick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 };
  const rightStick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, isDragging: false };
  let mobileRecallTriggered = false;
  let pendingTouchShotAngle = null;

  function setKey(event, value) {
    const key = event.key.toLowerCase();
    if (key === "w" || event.key === "ArrowUp") keys.w = value;
    if (key === "a" || event.key === "ArrowLeft") keys.a = value;
    if (key === "s" || event.key === "ArrowDown") keys.s = value;
    if (key === "d" || event.key === "ArrowRight") keys.d = value;
    if (event.key === " ") keys.space = value;
  }

  windowRef.addEventListener("keydown", (event) => setKey(event, true));
  windowRef.addEventListener("keyup", (event) => setKey(event, false));
  windowRef.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  windowRef.addEventListener("mousedown", (event) => {
    if (event.button === 0) mouse.leftDown = true;
    if (event.button === 2) mouse.rightDown = true;
  });
  windowRef.addEventListener("mouseup", (event) => {
    if (event.button === 0) mouse.leftDown = false;
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
          pendingTouchShotAngle = Math.atan2(rightStick.y - rightStick.oy, rightStick.x - rightStick.ox);
        } else {
          mobileRecallTriggered = true;
        }
      }
    }
  });

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

  function consumeShootAngle(player) {
    if (getBulletActive()) return null;

    if (pendingTouchShotAngle !== null) {
      const angle = pendingTouchShotAngle;
      pendingTouchShotAngle = null;
      return angle;
    }

    if (mouse.leftDown) {
      mouse.leftDown = false;
      return Math.atan2(mouse.y - player.y, mouse.x - player.x);
    }

    return null;
  }

  function isRecallRequested() {
    return keys.space || mouse.rightDown || mobileRecallTriggered;
  }

  function clearRecallLatch() {
    mobileRecallTriggered = false;
  }

  function resetTransient() {
    mouse.leftDown = false;
    mouse.rightDown = false;
    mobileRecallTriggered = false;
    pendingTouchShotAngle = null;
  }

  function getAimState() {
    return { isTouchDevice, mouse, leftStick, rightStick };
  }

  return {
    getMoveVector,
    consumeShootAngle,
    isRecallRequested,
    clearRecallLatch,
    resetTransient,
    getAimState,
  };
}

