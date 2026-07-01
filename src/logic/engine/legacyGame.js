import { createGameRuntime } from "./gameRuntime.js";

export { createGameRuntime };

export function startGame() {
  const runtime = createGameRuntime();
  runtime.start();
  return runtime;
}
