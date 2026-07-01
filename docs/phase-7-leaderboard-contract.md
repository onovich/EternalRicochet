# Phase 7 Local Leaderboard Contract

Date: 2026-07-01
Status: implemented local-only prototype
Scope: local contract, pure helpers, and local mock provider only

## Goal

This contract defines the smallest local-only leaderboard boundary that can be tested before any backend, account, public leaderboard, service worker, native package, analytics, or provider SDK is approved.

The current game remains local-first:

- Local high score is read and written by `readHighScore` / `writeHighScore` in `src/logic/engine/metaProgression.js`.
- Meta progression is stored under `eternalRicochetMeta`.
- Settings are stored under `eternalRicochetSettings`.
- Phase 7 must not upload, serialize, or couple any of those stores to a leaderboard payload.

## Module Placement

Provider-agnostic helpers live under:

```text
src/logic/leaderboard/
```

Implemented files:

- `contract.js`: pure constants, display-name sanitization, payload validation, entry normalization, and error helpers.
- `mockProvider.js`: in-memory local mocked provider that consumes `contract.js` and simulates approved states.
- `copy.js`: deterministic consent and failure-state copy constants.

These modules must not import gameplay runtime, renderer, physics, HUD, audio, settings, meta progression, storage, DOM, network APIs, or provider SDKs.

## Contract Versions

| Name | Value | Notes |
| --- | --- | --- |
| Contract version | `leaderboard-contract-v1` | Included in every payload and normalized entry. |
| Score era | `local-v1` | Separates this local contract from future balance/provider eras. |
| Provider mode | `local-mock` | Makes mock results distinguishable from future backend results. |

## Submission Payload Shape

The future submit path should accept a narrow object like this:

```js
{
  contractVersion: "leaderboard-contract-v1",
  score: 1234,
  displayName: "ACE",
  anonymousLabel: "LOCAL PLAYER",
  submittedAt: "2026-07-01T12:00:00.000Z",
  gameVersion: "0.1.0",
  buildId: "local-dev",
  runDurationFrames: 3600,
  clientNonce: "local-run-001",
  scoreEra: "local-v1"
}
```

Field rules:

| Field | Required | Rule |
| --- | --- | --- |
| `contractVersion` | Yes | Must equal `leaderboard-contract-v1`. |
| `score` | Yes | Integer from `0` through `999999999`. |
| `displayName` | No | Sanitized to a visible name or omitted. |
| `anonymousLabel` | No | Fallback label when display name is empty. |
| `submittedAt` | No | ISO-like local timestamp; future backend should prefer server time. |
| `gameVersion` | Yes | String identifying game package version. |
| `buildId` | Yes | String identifying build/source context. |
| `runDurationFrames` | No | Non-negative integer for coarse sanity checks only. |
| `clientNonce` | No | Short per-run duplicate guard; not a tracking id. |
| `scoreEra` | Yes | Must equal an approved era such as `local-v1`. |

## Retrieval Entry Shape

Mocked retrieval should return normalized entries shaped like this:

```js
{
  rank: 1,
  score: 1234,
  displayName: "ACE",
  submittedAt: "2026-07-01T12:00:00.000Z",
  gameVersion: "0.1.0",
  buildId: "local-dev",
  scoreEra: "local-v1",
  source: "local-mock"
}
```

Retrieval entries are display records only. They must not contain local settings, credits, upgrades, localStorage snapshots, device ids, or analytics.

## Rejected Data

The contract explicitly rejects or ignores these fields:

- Full localStorage dumps.
- `eternalRicochetMeta`, credits, upgrade inventory, shop purchase history, or raw settlement state.
- `eternalRicochetSettings`, render quality, audio preference, fullscreen preference, or input preferences.
- Device identifiers, browser fingerprinting fields, hardware model, installed fonts, IP-derived location claims, or persistent tracking ids.
- Analytics, telemetry, session replay, crash traces, pointer/touch/key histories, or performance traces.
- Personal data beyond a user-provided display name.
- Provider credentials, API keys, service-account fields, or moderation secrets.

## Consent Boundary

The local mock may validate consent states, but it must not add a live public submission UI.

Required future UI/copy before any backend submission:

- State that leaderboard submission is optional.
- State that a score and display name may be publicly visible.
- Provide anonymous/local-only play as the default safe path.
- Explain the exact fields to be submitted.
- Explain failure behavior: local high score and credits remain intact.
- Explain moderation/removal path before public names are accepted.

## Implemented Helper Boundary

`src/logic/leaderboard/contract.js` exports:

- `LEADERBOARD_CONTRACT`, with contract version `leaderboard-contract-v1`, score era `local-v1`, provider mode `local-mock`, max score, text limits, and anonymous label.
- `LEADERBOARD_ERROR_CODES`, with validation, forbidden-field, and suspicious-score warning codes.
- `LEADERBOARD_FORBIDDEN_FIELDS`, listing local data and tracking/credential fields that must not enter payloads.
- `sanitizeDisplayName`, `validateLeaderboardPayload`, `normalizeLeaderboardEntry`, and `createLeaderboardError`.

The helper module is deterministic and does not import DOM, storage, network, renderer, physics, runtime, settings, meta progression, or high score modules.

## Implemented Mock Provider Boundary

`src/logic/leaderboard/mockProvider.js` exports:

- `LOCAL_LEADERBOARD_PROVIDER_MODES`: `enabled`, `disabled`, `consent-required`, `unavailable`, and `rejected`.
- `LOCAL_LEADERBOARD_PROVIDER_CODES`: `success`, `disabled`, `consent-required`, `unavailable`, `validation-failed`, `duplicate-client-nonce`, and `rejected`.
- `createLocalLeaderboardProvider`, an in-memory mock with `submit`, `getEntries`, `setMode`, `getMode`, and `reset`.

The mock provider validates payloads through `contract.js`, sorts accepted local entries by score, rejects duplicate accepted `clientNonce` values, supports seeded entries for smoke tests, and never persists public leaderboard data.

## Consent And Failure Copy

`src/logic/leaderboard/copy.js` exports deterministic copy for:

- Local-only prototype state.
- Future consent requirement.
- Public display warning.
- Disabled state.
- Unavailable state.
- Validation failure.
- Duplicate/rejected state.
- Privacy boundary.

No live public submission UI was added in Phase 7.

## Failure States

The local mock provider must support these states with stable result codes:

| Code | Meaning |
| --- | --- |
| `success` | Payload accepted by local mock. |
| `disabled` | Leaderboard feature is intentionally disabled. |
| `consent-required` | Submission attempted without consent. |
| `validation-failed` | Payload failed contract validation. |
| `rejected` | Provider policy rejected a valid-shaped payload. |
| `duplicate-client-nonce` | `clientNonce` was already accepted by the local mock. |
| `unavailable` | Provider is unavailable; local game state must continue. |

## Smoke Coverage

`npm run smoke:logic` covers:

- Display-name sanitization, empty names, overlong names, integer score requirements, max score, invalid timestamps, invalid run durations, invalid client nonce, forbidden fields, stale/unsupported contract identifiers, and suspicious-score warnings.
- Normalized display entries and anonymous fallback labels.
- Mock provider success, disabled, consent-required, unavailable, rejected, validation-failed, duplicate nonce, seeded entries, capacity trimming, reset, and no-network/static boundary checks.
- Copy key stability and local-only/privacy/failure message coverage.
- Separation from runtime, settings, meta progression, local high score storage, provider SDKs, service workers, and network APIs.

## Future Implementation Notes

- Runtime/gameplay can create a run result, but leaderboard code must not calculate or rebalance scores.
- The mock provider can hold entries in memory for smoke tests, but Phase 7 must not persist public leaderboard data.
- Local high score persistence remains separate and unaffected.
- Future backend work must add provider rules, consent UI, moderation policy, quota/billing owner, and rollback switch before network writes.

## Round 1 Decision

Use `src/logic/leaderboard/` for Phase 7 helpers because it is a new provider-agnostic logic boundary and avoids placing platform concerns in `src/logic/engine/`, `src/view/`, or persistence modules.
