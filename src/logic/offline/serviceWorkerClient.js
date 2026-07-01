const HOSTED_BASE = "/EternalRicochet/";
const UPDATE_READY_COPY = "A new version is ready. Refresh when you are ready.";
const UPDATE_DEFERRED_COPY = "A new version is ready after this run.";

export function registerServiceWorker({
  windowRef = window,
  documentRef = document,
  runtime,
  enabled = false,
  serviceWorkerUrl = `${HOSTED_BASE}service-worker.js`,
  scope = HOSTED_BASE,
} = {}) {
  const serviceWorker = windowRef.navigator?.serviceWorker;
  if (!enabled) return createRegistrationResult("disabled");
  if (!serviceWorker) return createRegistrationResult("unsupported");
  if (!isTrustedContext(windowRef)) return createRegistrationResult("insecure-context");

  const updatePrompt = createUpdatePrompt({ documentRef, runtime });
  const controller = {
    registration: null,
    serviceWorker,
    waitingWorker: null,
    dismissed: false,
    pendingReload: false,
    prompt: updatePrompt,
  };

  serviceWorker.addEventListener("controllerchange", () => {
    if (!controller.pendingReload) return;
    controller.pendingReload = false;
    windowRef.location.reload();
  });

  serviceWorker
    .register(serviceWorkerUrl, { scope })
    .then((registration) => {
      controller.registration = registration;
      watchRegistration(registration, controller);
      if (registration.waiting && serviceWorker.controller) {
        setWaitingWorker(registration.waiting, controller);
      }
      registration.update?.().catch(() => {});
    })
    .catch(() => {
      updatePrompt.hide();
    });

  updatePrompt.onRefresh(() => {
    if (!controller.waitingWorker) return;
    controller.pendingReload = true;
    controller.waitingWorker.postMessage({ type: "SKIP_WAITING" });
  });
  updatePrompt.onLater(() => {
    controller.dismissed = true;
    updatePrompt.hide();
  });

  windowRef.setInterval(() => {
    if (!controller.waitingWorker || controller.dismissed) return;
    updateWaitingPrompt(controller);
  }, 750);

  return createRegistrationResult("registering", controller);
}

function watchRegistration(registration, controller) {
  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state === "installed" && controller.serviceWorker.controller) {
        setWaitingWorker(registration.waiting ?? installingWorker, controller);
      }
    });
  });
}

function setWaitingWorker(worker, controller) {
  controller.waitingWorker = worker;
  controller.dismissed = false;
  updateWaitingPrompt(controller);
}

function updateWaitingPrompt(controller) {
  const gameState = controller.prompt.getGameState();
  if (gameState === "PLAYING") {
    controller.prompt.hide();
    controller.prompt.setDeferredCopy(UPDATE_DEFERRED_COPY);
    return;
  }

  controller.prompt.show({ message: UPDATE_READY_COPY });
}

function createUpdatePrompt({ documentRef, runtime }) {
  const wrapper = documentRef.getElementById("game-wrapper") ?? documentRef.body;
  const panel = documentRef.createElement("div");
  panel.id = "offline-update-status";
  panel.className = "hidden";
  panel.setAttribute("role", "status");
  panel.setAttribute("aria-live", "polite");
  panel.innerHTML = `
    <div class="offline-update-message"></div>
    <div class="offline-update-actions">
      <button type="button" data-offline-action="refresh">Refresh now</button>
      <button type="button" data-offline-action="later">Later</button>
    </div>
  `;
  wrapper.append(panel);

  const messageElement = panel.querySelector(".offline-update-message");
  const refreshButton = panel.querySelector('[data-offline-action="refresh"]');
  const laterButton = panel.querySelector('[data-offline-action="later"]');
  let refreshHandler = () => {};
  let laterHandler = () => {};
  let deferredCopy = UPDATE_DEFERRED_COPY;

  refreshButton.addEventListener("click", () => refreshHandler());
  laterButton.addEventListener("click", () => laterHandler());

  return {
    show({ message }) {
      messageElement.innerText = message;
      panel.classList.remove("hidden");
    },
    hide() {
      panel.classList.add("hidden");
    },
    setDeferredCopy(message) {
      deferredCopy = message;
      panel.dataset.deferredMessage = deferredCopy;
    },
    onRefresh(handler) {
      refreshHandler = handler;
    },
    onLater(handler) {
      laterHandler = handler;
    },
    getGameState() {
      return runtime?.getState?.()?.gameState ?? "MENU";
    },
  };
}

function isTrustedContext(windowRef) {
  if (windowRef.isSecureContext) return true;
  const hostname = windowRef.location?.hostname ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function createRegistrationResult(status, controller = null) {
  return Object.freeze({ status, controller });
}
