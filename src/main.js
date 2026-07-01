import "./styles.css";
import { prepareDocument, ensureGameShell } from "./App.js";
import { runWhenDomReady } from "./logic/hooks/domReady.js";
import { createGameRuntime } from "./logic/engine/gameRuntime.js";

runWhenDomReady(() => {
  prepareDocument();
  ensureGameShell();
  createGameRuntime().start();
});
