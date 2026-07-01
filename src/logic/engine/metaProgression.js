import { GAME_CONFIG } from "../../data/gameConfig.js";

const DEFAULT_STORAGE = Object.freeze({
  getItem() {
    return null;
  },
  setItem() {},
});

export function createDefaultMetaState(config = GAME_CONFIG.metaProgression) {
  return {
    schemaVersion: config.schemaVersion,
    credits: 0,
    totalCreditsEarned: 0,
    upgrades: Object.fromEntries(getUpgradeEntries(config).map(([id]) => [id, 0])),
  };
}

export function calculateCreditsEarned(score, config = GAME_CONFIG.metaProgression) {
  const safeScore = clampInteger(score, 0, Number.MAX_SAFE_INTEGER);
  return Math.floor(safeScore / config.creditsPerScore);
}

export function getUpgradeCost(upgradeId, state, config = GAME_CONFIG.metaProgression) {
  const upgrade = getUpgradeConfig(upgradeId, config);
  if (!upgrade) return null;

  const level = getUpgradeLevel(upgradeId, state, config);
  if (level >= upgrade.maxLevel) return null;
  return upgrade.baseCost + level * upgrade.costStep;
}

export function getUpgradeLevel(upgradeId, state, config = GAME_CONFIG.metaProgression) {
  const upgrade = getUpgradeConfig(upgradeId, config);
  if (!upgrade) return 0;
  return clampInteger(state?.upgrades?.[upgradeId], 0, upgrade.maxLevel);
}

export function sanitizeMetaState(candidate, config = GAME_CONFIG.metaProgression) {
  const defaults = createDefaultMetaState(config);
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return defaults;
  }

  const sanitized = {
    schemaVersion: config.schemaVersion,
    credits: clampInteger(candidate.credits, 0, config.maxCredits),
    totalCreditsEarned: clampInteger(candidate.totalCreditsEarned, 0, config.maxCredits),
    upgrades: { ...defaults.upgrades },
  };

  const candidateUpgrades =
    candidate.upgrades && typeof candidate.upgrades === "object" && !Array.isArray(candidate.upgrades)
      ? candidate.upgrades
      : {};

  for (const [id, upgrade] of getUpgradeEntries(config)) {
    sanitized.upgrades[id] = clampInteger(candidateUpgrades[id], 0, upgrade.maxLevel);
  }

  if (sanitized.totalCreditsEarned < sanitized.credits) {
    sanitized.totalCreditsEarned = sanitized.credits;
  }

  return sanitized;
}

export function readMetaState(storage = DEFAULT_STORAGE, config = GAME_CONFIG.metaProgression) {
  try {
    const raw = storage.getItem(config.storageKey);
    if (!raw) return createDefaultMetaState(config);
    return sanitizeMetaState(JSON.parse(raw), config);
  } catch {
    return createDefaultMetaState(config);
  }
}

export function readHighScore(storage = DEFAULT_STORAGE, config = GAME_CONFIG.metaProgression) {
  try {
    return clampInteger(storage.getItem(config.highScoreKey), 0, config.maxHighScore);
  } catch {
    return 0;
  }
}

export function writeHighScore(storage = DEFAULT_STORAGE, score, config = GAME_CONFIG.metaProgression) {
  const sanitized = clampInteger(score, 0, config.maxHighScore);
  try {
    storage.setItem(config.highScoreKey, String(sanitized));
  } catch {
    return { highScore: sanitized, saved: false };
  }
  return { highScore: sanitized, saved: true };
}

export function writeMetaState(storage = DEFAULT_STORAGE, state, config = GAME_CONFIG.metaProgression) {
  const sanitized = sanitizeMetaState(state, config);
  try {
    storage.setItem(config.storageKey, JSON.stringify(sanitized));
  } catch {
    return { state: sanitized, saved: false };
  }
  return { state: sanitized, saved: true };
}

export function awardCredits(state, score, config = GAME_CONFIG.metaProgression) {
  const sanitized = sanitizeMetaState(state, config);
  const earned = calculateCreditsEarned(score, config);
  const credits = clampInteger(sanitized.credits + earned, 0, config.maxCredits);
  const totalCreditsEarned = clampInteger(sanitized.totalCreditsEarned + earned, 0, config.maxCredits);

  return {
    earned,
    state: {
      ...sanitized,
      credits,
      totalCreditsEarned: Math.max(totalCreditsEarned, credits),
    },
  };
}

export function purchaseUpgrade(state, upgradeId, config = GAME_CONFIG.metaProgression) {
  const sanitized = sanitizeMetaState(state, config);
  const upgrade = getUpgradeConfig(upgradeId, config);
  if (!upgrade) {
    return { purchased: false, reason: "unknown-upgrade", state: sanitized };
  }

  const level = getUpgradeLevel(upgradeId, sanitized, config);
  if (level >= upgrade.maxLevel) {
    return { purchased: false, reason: "max-level", state: sanitized };
  }

  const cost = getUpgradeCost(upgradeId, sanitized, config);
  if (sanitized.credits < cost) {
    return { purchased: false, reason: "insufficient-credits", cost, state: sanitized };
  }

  return {
    purchased: true,
    reason: "purchased",
    cost,
    state: {
      ...sanitized,
      credits: sanitized.credits - cost,
      upgrades: {
        ...sanitized.upgrades,
        [upgradeId]: level + 1,
      },
    },
  };
}

export function createEffectiveRunConfig(metaState, baseConfig = GAME_CONFIG) {
  const state = sanitizeMetaState(metaState, baseConfig.metaProgression);
  const upgrades = baseConfig.metaProgression.upgrades;
  const gravityLevel = getUpgradeLevel("gravityRecall", state, baseConfig.metaProgression);
  const piercerLevel = getUpgradeLevel("armorPiercer", state, baseConfig.metaProgression);
  const shieldLevel = getUpgradeLevel("energyShield", state, baseConfig.metaProgression);

  return {
    ...baseConfig,
    player: {
      ...baseConfig.player,
      hp: baseConfig.player.hp + shieldLevel * upgrades.energyShield.hpPerLevel,
    },
    bullet: {
      ...baseConfig.bullet,
      recallForce:
        baseConfig.bullet.recallForce + gravityLevel * upgrades.gravityRecall.recallForcePerLevel,
      killDamping: Math.min(
        upgrades.armorPiercer.maxKillDamping,
        baseConfig.bullet.killDamping + piercerLevel * upgrades.armorPiercer.killDampingBonusPerLevel,
      ),
    },
  };
}

export function seedMetaStateFromSearch({
  storage = DEFAULT_STORAGE,
  search = "",
  config = GAME_CONFIG.metaProgression,
} = {}) {
  const params = new URLSearchParams(search);
  if (params.get("erSeedMeta") !== "1") return null;

  const state = createDefaultMetaState(config);
  state.credits = clampInteger(params.get("credits"), 0, config.maxCredits);
  state.totalCreditsEarned = state.credits;
  for (const [id, upgrade] of getUpgradeEntries(config)) {
    state.upgrades[id] = clampInteger(params.get(id), 0, upgrade.maxLevel);
  }

  return writeMetaState(storage, state, config);
}

export function createMetaProgressionStore({
  storage = DEFAULT_STORAGE,
  config = GAME_CONFIG.metaProgression,
} = {}) {
  let state = readMetaState(storage, config);

  function save(nextState) {
    const result = writeMetaState(storage, nextState, config);
    state = result.state;
    return result;
  }

  return {
    getState: () => state,
    reload: () => {
      state = readMetaState(storage, config);
      return state;
    },
    save,
    awardScore: (score) => {
      const result = awardCredits(state, score, config);
      const saveResult = save(result.state);
      return { earned: result.earned, state: saveResult.state, saved: saveResult.saved };
    },
    purchase: (upgradeId) => {
      const result = purchaseUpgrade(state, upgradeId, config);
      if (!result.purchased) return result;
      const saveResult = save(result.state);
      return { ...result, state: saveResult.state, saved: saveResult.saved };
    },
  };
}

export function createRunSettlement(store) {
  let settled = false;
  let lastResult = null;

  return {
    reset: () => {
      settled = false;
      lastResult = null;
    },
    settleScore: (score) => {
      if (settled) {
        return { ...lastResult, alreadySettled: true };
      }
      const result = store.awardScore(score);
      settled = true;
      lastResult = {
        earned: result.earned,
        state: result.state,
        saved: result.saved,
      };
      return { ...lastResult, alreadySettled: false };
    },
  };
}

function getUpgradeEntries(config) {
  return Object.entries(config.upgrades);
}

function getUpgradeConfig(upgradeId, config) {
  return config.upgrades[upgradeId] ?? null;
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(Number(value))) return min;
  return Math.max(min, Math.min(max, Math.floor(Number(value))));
}
