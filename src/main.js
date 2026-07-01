import "./styles.css";
import { prepareDocument, ensureGameShell } from "./App.js";
import { GAME_CONFIG } from "./data/gameConfig.js";
import { runWhenDomReady } from "./logic/hooks/domReady.js";
import { createGameRuntime } from "./logic/engine/gameRuntime.js";
import { seedMetaStateFromSearch } from "./logic/engine/metaProgression.js";
import { registerServiceWorker } from "./logic/offline/serviceWorkerClient.js";

runWhenDomReady(() => {
  prepareDocument();
  ensureGameShell();
  if (import.meta.env.DEV) {
    seedMetaStateFromSearch({
      storage: window.localStorage,
      search: window.location.search,
      config: GAME_CONFIG.metaProgression,
    });
  }
  const runtime = createGameRuntime({ devMode: import.meta.env.DEV });
  if (import.meta.env.DEV) {
    const debugStateElement = document.createElement("script");
    debugStateElement.id = "eternal-ricochet-debug-state";
    debugStateElement.type = "application/json";
    debugStateElement.hidden = true;
    document.body.append(debugStateElement);
    const publishDebugState = () => {
      debugStateElement.textContent = JSON.stringify(runtime.getDebugState());
    };
    publishDebugState();
    window.setInterval(publishDebugState, 250);
    Object.defineProperty(window, "__ETERNAL_RICOCHET_DEV__", {
      value: Object.freeze({
        getState: () => runtime.getDebugState(),
      }),
      configurable: true,
    });
  }
  runtime.start();
  registerServiceWorker({
    runtime,
    enabled: import.meta.env.PROD,
  });
});
