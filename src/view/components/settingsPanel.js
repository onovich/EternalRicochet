export function createSettingsPanel({
  documentRef = document,
  settingsStore,
  wrapperElement,
  onChange = () => {},
} = {}) {
  const mainMenu = documentRef.getElementById("main-menu");
  const gameOverMenu = documentRef.getElementById("game-over-menu");
  const settingsMenu = documentRef.getElementById("settings-menu");
  const settingsStatus = documentRef.getElementById("settings-status");
  const qualityOptions = documentRef.getElementById("quality-options");
  const audioToggleButton = documentRef.getElementById("audio-toggle-btn");
  const fullscreenToggleButton = documentRef.getElementById("fullscreen-toggle-btn");
  const closeButton = documentRef.getElementById("close-settings-btn");
  const mainOpenButton = documentRef.getElementById("settings-btn");
  const gameOverOpenButton = documentRef.getElementById("gameover-settings-btn");
  let returnPanel = "main";

  function show(source = "main") {
    returnPanel = source;
    settingsStatus.innerText = "";
    mainMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
    settingsMenu.classList.remove("hidden");
    render();
  }

  function hide() {
    settingsMenu.classList.add("hidden");
    if (returnPanel === "gameover") {
      gameOverMenu.classList.remove("hidden");
    } else {
      mainMenu.classList.remove("hidden");
    }
  }

  function render() {
    const state = settingsStore.getState();
    for (const button of qualityOptions.querySelectorAll("[data-quality-option]")) {
      const selected = button.dataset.qualityOption === state.renderQuality;
      button.classList.toggle("border-cyan-300", selected);
      button.classList.toggle("bg-cyan-700/50", selected);
      button.classList.toggle("text-white", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    audioToggleButton.innerText = state.audioMuted ? "AUDIO MUTED" : "AUDIO ON";
    fullscreenToggleButton.innerText = getFullscreenLabel();
  }

  function setStatus(message) {
    settingsStatus.innerText = message;
  }

  function updateSettings(patch, message) {
    const result = settingsStore.update(patch);
    onChange(result.state);
    setStatus(result.saved ? message : "SAVE FAILED");
    render();
  }

  function getFullscreenLabel() {
    if (!hasFullscreenSupport()) return "FULLSCREEN N/A";
    return documentRef.fullscreenElement ? "EXIT FULLSCREEN" : "FULLSCREEN";
  }

  function hasFullscreenSupport() {
    return Boolean(wrapperElement?.requestFullscreen && documentRef.exitFullscreen);
  }

  async function toggleFullscreen() {
    if (!hasFullscreenSupport()) {
      updateSettings({ fullscreenPreferred: false }, "FULLSCREEN N/A");
      return;
    }

    try {
      if (documentRef.fullscreenElement) {
        await documentRef.exitFullscreen();
        updateSettings({ fullscreenPreferred: false }, "FULLSCREEN OFF");
      } else {
        await wrapperElement.requestFullscreen();
        updateSettings({ fullscreenPreferred: true }, "FULLSCREEN ON");
      }
    } catch {
      updateSettings({ fullscreenPreferred: false }, "FULLSCREEN BLOCKED");
    }
  }

  mainOpenButton.addEventListener("click", () => show("main"));
  gameOverOpenButton.addEventListener("click", () => show("gameover"));
  closeButton.addEventListener("click", hide);
  qualityOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quality-option]");
    if (!button) return;
    updateSettings({ renderQuality: button.dataset.qualityOption }, "QUALITY SAVED");
  });
  audioToggleButton.addEventListener("click", () => {
    updateSettings({ audioMuted: !settingsStore.getState().audioMuted }, "AUDIO SAVED");
  });
  fullscreenToggleButton.addEventListener("click", () => {
    void toggleFullscreen();
  });
  documentRef.addEventListener("fullscreenchange", render);

  render();
  return { show, hide, render };
}
