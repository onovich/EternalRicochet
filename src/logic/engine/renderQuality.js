import { GAME_CONFIG } from "../../data/gameConfig.js";

export function resolveRenderQuality({
  search = "",
  config = GAME_CONFIG.renderQuality,
  settings = null,
  devMode = false,
} = {}) {
  const urlTier = devMode ? getRequestedTier(search) : "";
  const settingsTier = settings?.renderQuality ?? "";
  const fallbackTier = config.defaultTier;
  const tier = hasTier(config, urlTier)
    ? urlTier
    : hasTier(config, settingsTier)
      ? settingsTier
      : fallbackTier;

  return {
    tier,
    requestedTier: urlTier || settingsTier || fallbackTier,
    source: getQualitySource({ config, urlTier, settingsTier }),
    profile: getRenderQualityProfile(tier, config),
  };
}

export function getRenderQualityProfile(tier, config = GAME_CONFIG.renderQuality) {
  const fallback = config.tiers[config.defaultTier] ?? {};
  const selected = config.tiers[tier] ?? fallback;
  return { ...fallback, ...selected };
}

function getRequestedTier(search) {
  try {
    return new URLSearchParams(search).get("erQuality") ?? "";
  } catch {
    return "";
  }
}

function hasTier(config, tier) {
  return Boolean(tier) && Object.prototype.hasOwnProperty.call(config.tiers, tier);
}

function getQualitySource({ config, urlTier, settingsTier }) {
  if (hasTier(config, urlTier)) return "url";
  if (hasTier(config, settingsTier)) return "settings";
  return "default";
}
