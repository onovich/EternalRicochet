import "./styles.css";
import { prepareDocument, ensureGameShell } from "./App.js";
import { runWhenDomReady } from "./logic/hooks/domReady.js";
import { createGameRuntime } from "./logic/engine/gameRuntime.js";

runWhenDomReady(() => {
  prepareDocument();
  ensureGameShell();
  const runtime = createGameRuntime();
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
});
