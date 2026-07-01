export const LEADERBOARD_CONTRACT = Object.freeze({
  version: "leaderboard-contract-v1",
  scoreEra: "local-v1",
  providerMode: "local-mock",
  anonymousLabel: "LOCAL PLAYER",
  maxScore: 999999999,
  maxDisplayNameLength: 16,
  maxTextFieldLength: 64,
  maxRunDurationFrames: 60 * 60 * 60,
});

export const LEADERBOARD_ERROR_CODES = Object.freeze({
  INVALID_PAYLOAD: "invalid-payload",
  INVALID_CONTRACT_VERSION: "invalid-contract-version",
  INVALID_SCORE: "invalid-score",
  INVALID_DISPLAY_NAME: "invalid-display-name",
  INVALID_GAME_VERSION: "invalid-game-version",
  INVALID_BUILD_ID: "invalid-build-id",
  INVALID_SCORE_ERA: "invalid-score-era",
  INVALID_TIMESTAMP: "invalid-timestamp",
  INVALID_RUN_DURATION: "invalid-run-duration",
  INVALID_CLIENT_NONCE: "invalid-client-nonce",
  FORBIDDEN_FIELD: "forbidden-field",
  SUSPICIOUS_SCORE: "suspicious-score",
});

export const LEADERBOARD_FORBIDDEN_FIELDS = Object.freeze([
  "localStorage",
  "settings",
  "meta",
  "metaProgression",
  "upgrades",
  "credits",
  "totalCreditsEarned",
  "renderQuality",
  "audioMuted",
  "fullscreenPreferred",
  "deviceId",
  "fingerprint",
  "ip",
  "ipLocation",
  "analytics",
  "telemetry",
  "sessionReplay",
  "keyHistory",
  "pointerHistory",
  "serviceAccount",
  "apiKey",
  "credential",
  "secret",
]);

export function sanitizeDisplayName(value, {
  fallback = "",
  maxLength = LEADERBOARD_CONTRACT.maxDisplayNameLength,
} = {}) {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
  return cleaned || fallback;
}

export function validateLeaderboardPayload(payload, {
  contract = LEADERBOARD_CONTRACT,
} = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(payload)) {
    return {
      valid: false,
      errors: [
        createLeaderboardError(LEADERBOARD_ERROR_CODES.INVALID_PAYLOAD, "Payload must be an object."),
      ],
      warnings,
      payload: null,
    };
  }

  for (const field of LEADERBOARD_FORBIDDEN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      errors.push(
        createLeaderboardError(
          LEADERBOARD_ERROR_CODES.FORBIDDEN_FIELD,
          `${field} must not be included in leaderboard payloads.`,
          field,
        ),
      );
    }
  }

  if (payload.contractVersion !== contract.version) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_CONTRACT_VERSION,
        "Unsupported leaderboard contract version.",
        "contractVersion",
      ),
    );
  }

  const score = toInteger(payload.score);
  if (score === null || score < 0 || score > contract.maxScore) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_SCORE,
        "Score must be a finite non-negative integer within the contract range.",
        "score",
      ),
    );
  }

  const displayName = sanitizeDisplayName(payload.displayName);
  if (payload.displayName !== undefined && displayName.length === 0) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_DISPLAY_NAME,
        "Display name must contain visible characters or be omitted for anonymous play.",
        "displayName",
      ),
    );
  }

  const anonymousLabel = sanitizeDisplayName(payload.anonymousLabel, {
    fallback: contract.anonymousLabel,
  });
  const gameVersion = sanitizeTextField(payload.gameVersion);
  if (!gameVersion) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_GAME_VERSION,
        "Game version is required.",
        "gameVersion",
      ),
    );
  }

  const buildId = sanitizeTextField(payload.buildId);
  if (!buildId) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_BUILD_ID,
        "Build id is required.",
        "buildId",
      ),
    );
  }

  if (payload.scoreEra !== contract.scoreEra) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_SCORE_ERA,
        "Unsupported leaderboard score era.",
        "scoreEra",
      ),
    );
  }

  const submittedAt = normalizeTimestamp(payload.submittedAt);
  if (payload.submittedAt !== undefined && submittedAt === null) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_TIMESTAMP,
        "Submitted timestamp must be parseable when provided.",
        "submittedAt",
      ),
    );
  }

  const runDurationFrames =
    payload.runDurationFrames === undefined ? null : toInteger(payload.runDurationFrames);
  if (
    payload.runDurationFrames !== undefined &&
    (runDurationFrames === null ||
      runDurationFrames < 0 ||
      runDurationFrames > contract.maxRunDurationFrames)
  ) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_RUN_DURATION,
        "Run duration frames must be a bounded non-negative integer when provided.",
        "runDurationFrames",
      ),
    );
  }

  const clientNonce = sanitizeTextField(payload.clientNonce);
  if (payload.clientNonce !== undefined && !clientNonce) {
    errors.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.INVALID_CLIENT_NONCE,
        "Client nonce must be a short visible string when provided.",
        "clientNonce",
      ),
    );
  }

  if (score !== null && runDurationFrames !== null && score > 100000 && runDurationFrames < 60) {
    warnings.push(
      createLeaderboardError(
        LEADERBOARD_ERROR_CODES.SUSPICIOUS_SCORE,
        "Score is suspicious for the provided run duration; local contract does not enforce this.",
        "score",
      ),
    );
  }

  const normalized = errors.length
    ? null
    : {
        contractVersion: contract.version,
        score,
        displayName,
        anonymousLabel,
        submittedAt: submittedAt ?? new Date(0).toISOString(),
        gameVersion,
        buildId,
        runDurationFrames,
        clientNonce,
        scoreEra: contract.scoreEra,
      };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    payload: normalized,
  };
}

export function normalizeLeaderboardEntry(entry, { rank = 0, contract = LEADERBOARD_CONTRACT } = {}) {
  const validation = validateLeaderboardPayload(entry, { contract });
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings,
      entry: null,
    };
  }

  return {
    valid: true,
    errors: [],
    warnings: validation.warnings,
    entry: {
      rank: Math.max(0, toInteger(rank, { floor: true }) ?? 0),
      score: validation.payload.score,
      displayName: validation.payload.displayName || validation.payload.anonymousLabel,
      submittedAt: validation.payload.submittedAt,
      gameVersion: validation.payload.gameVersion,
      buildId: validation.payload.buildId,
      scoreEra: validation.payload.scoreEra,
      source: contract.providerMode,
    },
  };
}

export function createLeaderboardError(code, message, field = null) {
  return field ? { code, message, field } : { code, message };
}

function sanitizeTextField(value, maxLength = LEADERBOARD_CONTRACT.maxTextFieldLength) {
  return sanitizeDisplayName(value, { maxLength });
}

function normalizeTimestamp(value) {
  if (value === undefined || value === null || value === "") return null;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;
  return timestamp.toISOString();
}

function toInteger(value, { floor = false } = {}) {
  if (!Number.isFinite(Number(value))) return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return floor ? Math.floor(numeric) : null;
  return numeric;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
