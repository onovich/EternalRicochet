import { GAME_CONFIG } from "../../data/gameConfig.js";

export function resolveRenderQuality({
  search = "",
  config = GAME_CONFIG.renderQuality,
} = {}) {
  const requestedTier = getRequestedTier(search);
  const fallbackTier = config.defaultTier;
  const tier = hasTier(config, requestedTier) ? requestedTier : fallbackTier;

  return {
    tier,
    requestedTier: requestedTier || fallbackTier,
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
