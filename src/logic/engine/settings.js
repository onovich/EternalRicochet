import { GAME_CONFIG } from "../../data/gameConfig.js";

const DEFAULT_STORAGE = Object.freeze({
  getItem() {
    return null;
  },
  setItem() {},
});

export function createDefaultSettings(config = GAME_CONFIG.settings) {
  return {
    schemaVersion: config.schemaVersion,
    renderQuality: config.defaultRenderQuality,
    audioMuted: config.defaultAudioMuted,
    fullscreenPreferred: config.defaultFullscreenPreferred,
  };
}

export function sanitizeSettings(candidate, config = GAME_CONFIG.settings) {
  const defaults = createDefaultSettings(config);
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return defaults;
  }

  return {
    schemaVersion: config.schemaVersion,
    renderQuality: sanitizeRenderQuality(candidate.renderQuality, config),
    audioMuted: sanitizeBoolean(candidate.audioMuted, config.defaultAudioMuted),
    fullscreenPreferred: sanitizeBoolean(
      candidate.fullscreenPreferred,
      config.defaultFullscreenPreferred,
    ),
  };
}

export function readSettings(storage = DEFAULT_STORAGE, config = GAME_CONFIG.settings) {
  try {
    const raw = storage.getItem(config.storageKey);
    if (!raw) return createDefaultSettings(config);
    return sanitizeSettings(JSON.parse(raw), config);
  } catch {
    return createDefaultSettings(config);
  }
}

export function writeSettings(storage = DEFAULT_STORAGE, state, config = GAME_CONFIG.settings) {
  const sanitized = sanitizeSettings(state, config);
  try {
    storage.setItem(config.storageKey, JSON.stringify(sanitized));
  } catch {
    return { state: sanitized, saved: false };
  }
  return { state: sanitized, saved: true };
}

export function createSettingsStore({
  storage = DEFAULT_STORAGE,
  config = GAME_CONFIG.settings,
} = {}) {
  let state = readSettings(storage, config);

  function save(nextState) {
    const result = writeSettings(storage, nextState, config);
    state = result.state;
    return result;
  }

  return {
    getState: () => state,
    reload: () => {
      state = readSettings(storage, config);
      return state;
    },
    save,
    update: (patch) => save({ ...state, ...patch }),
  };
}

function sanitizeRenderQuality(value, config) {
  const tiers = Object.keys(GAME_CONFIG.renderQuality.tiers);
  return tiers.includes(value) ? value : config.defaultRenderQuality;
}

function sanitizeBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
