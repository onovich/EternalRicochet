import {
  createLeaderboardError,
  LEADERBOARD_CONTRACT,
  normalizeLeaderboardEntry,
  validateLeaderboardPayload,
} from "./contract.js";

export const LOCAL_LEADERBOARD_PROVIDER_MODES = Object.freeze({
  ENABLED: "enabled",
  DISABLED: "disabled",
  CONSENT_REQUIRED: "consent-required",
  UNAVAILABLE: "unavailable",
  REJECTED: "rejected",
});

export const LOCAL_LEADERBOARD_PROVIDER_CODES = Object.freeze({
  SUCCESS: "success",
  DISABLED: "disabled",
  CONSENT_REQUIRED: "consent-required",
  UNAVAILABLE: "unavailable",
  VALIDATION_FAILED: "validation-failed",
  DUPLICATE_CLIENT_NONCE: "duplicate-client-nonce",
  REJECTED: "rejected",
});

const MODE_FAILURE_CODES = Object.freeze({
  [LOCAL_LEADERBOARD_PROVIDER_MODES.DISABLED]: LOCAL_LEADERBOARD_PROVIDER_CODES.DISABLED,
  [LOCAL_LEADERBOARD_PROVIDER_MODES.CONSENT_REQUIRED]: LOCAL_LEADERBOARD_PROVIDER_CODES.CONSENT_REQUIRED,
  [LOCAL_LEADERBOARD_PROVIDER_MODES.UNAVAILABLE]: LOCAL_LEADERBOARD_PROVIDER_CODES.UNAVAILABLE,
});

const DEFAULT_NOW = () => new Date(0).toISOString();

export function createLocalLeaderboardProvider({
  mode = LOCAL_LEADERBOARD_PROVIDER_MODES.ENABLED,
  maxEntries = 10,
  now = DEFAULT_NOW,
  initialEntries = [],
} = {}) {
  const entryLimit = Math.max(1, Math.floor(Number(maxEntries)) || 10);
  const usedClientNonces = new Set();
  let currentMode = sanitizeMode(mode);
  let submissions = [];

  for (const payload of initialEntries) {
    const validation = validateLeaderboardPayload(withLocalSubmittedAt(payload, now));
    if (validation.valid) {
      addSubmission(validation.payload);
    }
  }

  return {
    providerId: LEADERBOARD_CONTRACT.providerMode,
    getMode: () => currentMode,
    setMode: (nextMode) => {
      currentMode = sanitizeMode(nextMode);
      return currentMode;
    },
    submit: (payload) => submit(payload),
    getEntries: () => getEntries(),
    reset: () => {
      submissions = [];
      usedClientNonces.clear();
    },
  };

  function submit(payload) {
    const blocked = getBlockedResult(currentMode);
    if (blocked) return blocked;

    const validation = validateLeaderboardPayload(withLocalSubmittedAt(payload, now));
    if (!validation.valid) {
      return createProviderResult({
        ok: false,
        code: LOCAL_LEADERBOARD_PROVIDER_CODES.VALIDATION_FAILED,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    if (currentMode === LOCAL_LEADERBOARD_PROVIDER_MODES.REJECTED) {
      return createProviderResult({
        ok: false,
        code: LOCAL_LEADERBOARD_PROVIDER_CODES.REJECTED,
        errors: [
          createLeaderboardError(
            LOCAL_LEADERBOARD_PROVIDER_CODES.REJECTED,
            "Local mock provider rejected the leaderboard submission.",
          ),
        ],
        warnings: validation.warnings,
      });
    }

    const clientNonce = validation.payload.clientNonce;
    if (clientNonce && usedClientNonces.has(clientNonce)) {
      return createProviderResult({
        ok: false,
        code: LOCAL_LEADERBOARD_PROVIDER_CODES.DUPLICATE_CLIENT_NONCE,
        errors: [
          createLeaderboardError(
            LOCAL_LEADERBOARD_PROVIDER_CODES.DUPLICATE_CLIENT_NONCE,
            "Client nonce has already been submitted to the local mock provider.",
            "clientNonce",
          ),
        ],
        warnings: validation.warnings,
      });
    }

    const entry = addSubmission(validation.payload);
    return createProviderResult({
      ok: true,
      code: LOCAL_LEADERBOARD_PROVIDER_CODES.SUCCESS,
      entry,
      entries: getRankedEntries(),
      warnings: validation.warnings,
    });
  }

  function getEntries() {
    const blocked = getBlockedResult(currentMode);
    if (blocked) return blocked;

    return createProviderResult({
      ok: true,
      code: LOCAL_LEADERBOARD_PROVIDER_CODES.SUCCESS,
      entries: getRankedEntries(),
    });
  }

  function addSubmission(payload) {
    submissions = [...submissions, payload].sort(compareSubmissions).slice(0, entryLimit);
    if (payload.clientNonce) {
      usedClientNonces.add(payload.clientNonce);
    }

    const rank = submissions.indexOf(payload) + 1;
    const normalized = normalizeLeaderboardEntry(payload, { rank });
    return normalized.entry;
  }

  function getRankedEntries() {
    return submissions
      .map((payload, index) => normalizeLeaderboardEntry(payload, { rank: index + 1 }).entry)
      .filter(Boolean);
  }
}

function getBlockedResult(mode) {
  const code = MODE_FAILURE_CODES[mode];
  if (!code) return null;

  return createProviderResult({
    ok: false,
    code,
    errors: [
      createLeaderboardError(code, `Local mock provider is ${code}.`),
    ],
  });
}

function createProviderResult({
  ok,
  code,
  entry = null,
  entries = [],
  errors = [],
  warnings = [],
}) {
  return {
    ok,
    code,
    provider: LEADERBOARD_CONTRACT.providerMode,
    entry,
    entries,
    errors,
    warnings,
  };
}

function withLocalSubmittedAt(payload, now) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  if (payload.submittedAt !== undefined) return payload;
  return {
    ...payload,
    submittedAt: now(),
  };
}

function compareSubmissions(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const submittedAt = a.submittedAt.localeCompare(b.submittedAt);
  if (submittedAt !== 0) return submittedAt;
  return (a.clientNonce || "").localeCompare(b.clientNonce || "");
}

function sanitizeMode(mode) {
  return Object.values(LOCAL_LEADERBOARD_PROVIDER_MODES).includes(mode)
    ? mode
    : LOCAL_LEADERBOARD_PROVIDER_MODES.ENABLED;
}
