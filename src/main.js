import "./styles.css";
import { prepareDocument, ensureGameShell } from "./App.js";
import { runWhenDomReady } from "./logic/hooks/domReady.js";
import { startGame } from "./logic/engine/legacyGame.js";

runWhenDomReady(() => {
  prepareDocument();
  ensureGameShell();
  startGame();
});
