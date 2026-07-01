export const LEADERBOARD_COPY_KEYS = Object.freeze({
  LOCAL_ONLY: "local-only",
  CONSENT_REQUIRED: "consent-required",
  PUBLIC_DISPLAY_WARNING: "public-display-warning",
  DISABLED: "disabled",
  UNAVAILABLE: "unavailable",
  VALIDATION_FAILED: "validation-failed",
  DUPLICATE_REJECTED: "duplicate-rejected",
  PRIVACY_BOUNDARY: "privacy-boundary",
});

export const LEADERBOARD_COPY = Object.freeze({
  [LEADERBOARD_COPY_KEYS.LOCAL_ONLY]: Object.freeze({
    title: "Local leaderboard prototype",
    body:
      "This build only validates and mocks leaderboard submissions locally. Scores are not uploaded.",
  }),
  [LEADERBOARD_COPY_KEYS.CONSENT_REQUIRED]: Object.freeze({
    title: "Share score?",
    body:
      "Future public submissions must be optional and require consent before sending a score or display name.",
  }),
  [LEADERBOARD_COPY_KEYS.PUBLIC_DISPLAY_WARNING]: Object.freeze({
    title: "Public display warning",
    body:
      "A submitted display name and score may be visible to other players after a real leaderboard is approved.",
  }),
  [LEADERBOARD_COPY_KEYS.DISABLED]: Object.freeze({
    title: "Leaderboard disabled",
    body:
      "Leaderboard submission is unavailable in this build. Local high score storage remains separate.",
  }),
  [LEADERBOARD_COPY_KEYS.UNAVAILABLE]: Object.freeze({
    title: "Leaderboard unavailable",
    body:
      "The leaderboard provider could not be reached. Keep playing; local score handling is unchanged.",
  }),
  [LEADERBOARD_COPY_KEYS.VALIDATION_FAILED]: Object.freeze({
    title: "Score not submitted",
    body:
      "The score payload did not match the local leaderboard contract and was rejected before submission.",
  }),
  [LEADERBOARD_COPY_KEYS.DUPLICATE_REJECTED]: Object.freeze({
    title: "Duplicate score ignored",
    body:
      "This run already has a local submission nonce, so the mock provider rejected the duplicate.",
  }),
  [LEADERBOARD_COPY_KEYS.PRIVACY_BOUNDARY]: Object.freeze({
    title: "Privacy boundary",
    body:
      "Do not include localStorage, upgrades, settings, device identifiers, analytics, telemetry, or credentials.",
  }),
});

export function getLeaderboardCopy(key) {
  return LEADERBOARD_COPY[key] ?? LEADERBOARD_COPY[LEADERBOARD_COPY_KEYS.LOCAL_ONLY];
}
