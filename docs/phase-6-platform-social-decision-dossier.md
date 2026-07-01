# Phase 6 Platform And Social Decision Dossier

Date: 2026-07-01
Workspace: `D:\WebProjects\EternalRicochet`
Phase: Phase 6 - Platform And Social Decision Dossier Slice
Status: in progress

## Executive Summary

Eternal Ricochet is currently a local-first static web game deployed through GitHub Pages. Phase 5 made the browser build release-ready with local settings, release smoke checks, and mobile viewport polish. The next roadmap items, especially global leaderboard, PWA/offline behavior, and native packaging, are not safe default implementation work because they affect privacy, consent, hosting, moderation, credentials, deployment, rollback, and long-term maintenance.

This dossier compares four lanes before implementation:

1. Keep local-only release and improve distribution/docs.
2. Add a managed-backend global leaderboard.
3. Add PWA install/offline behavior.
4. Add native packaging with Capacitor/Cordova, or defer native packaging.

No external service, account, credential, network call, service worker, manifest, native toolchain, runtime dependency, or gameplay change is added by this phase.

## Decision Criteria

| Criterion | Question To Answer | Why It Matters |
| --- | --- | --- |
| User value | What new player value does the lane unlock? | Avoids platform work that does not improve the game loop or release quality. |
| Privacy/data boundary | What data leaves the browser, and with what consent? | Leaderboards and analytics can turn a local game into a data-collecting service. |
| Moderation/abuse | Can players submit names, scores, spam, or hostile content? | Public scoreboards need abuse controls before launch. |
| Credentials/secrets | What private keys, service accounts, or signing material are needed? | Secrets must not enter the repository or GitHub Pages bundle. |
| Hosting/deployment impact | Does the current GitHub Pages flow still work? | The project already has a validated static deployment path. |
| Cost/quota | What official quota or billing constraint can affect release? | A public game can produce unexpected backend or store-review costs. |
| Rollback | Can the lane be disabled without corrupting local progress? | Platform failures should not break the playable game. |
| Validation | What smoke/manual checks prove the lane is safe? | Future implementation needs reproducible acceptance gates. |
| Maintenance | Who owns policy, provider updates, store releases, and support? | Platform features carry ongoing operational work. |

## Lane Comparison Matrix

| Lane | User Value | Main Implementation Work | Main Risks | Rollback Shape | Current Recommendation |
| --- | --- | --- | --- | --- | --- |
| Local-only release/docs | Lowest platform risk; keeps current playable release stable. | Improve release docs, validation scripts, and hosted-page instructions. | No global competition or install/offline experience. | Keep current GitHub Pages build; no data migration. | Candidate safe default if no social/platform approval is granted. |
| Managed-backend leaderboard | Adds global competition and replay motivation. | Choose provider, design submission/retrieval boundary, consent UI, moderation controls, server rules, deployment secrets, and score validation. | Privacy, cheating, abusive names, quota/billing, credentials, provider lock-in. | Disable submission UI; keep local high score and meta progression intact. | Needs explicit user approval and a narrow backend-only implementation phase. |
| PWA install/offline | Improves mobile browser launch and offline availability. | Manifest, icons, service worker cache strategy, update/rollback strategy, CDN asset decision, browser smoke. | Stale caches, external CDN incompatibility, user confusion on updates, browser differences. | Remove service worker registration and version caches carefully. | Defer until cache strategy and asset vendoring are decided. |
| Native packaging | Enables app-store style distribution and device-level packaging. | Choose Capacitor/Cordova/defer, wrap web build, configure app ids/icons/splash/signing, mobile QA, store metadata. | Signing credentials, app-store review, platform policy, webview quirks, release management. | Keep web release as source of truth; stop native lane before stores if validation fails. | Defer until web/PWA direction and mobile hardware QA are approved. |

## Source Citation Ledger

External platform claims must be backed by primary or official sources. Round 1 only establishes the ledger; Rounds 2-3 fill the official facts.

| Topic | Official Source URL | Date Checked | Used For | Notes |
| --- | --- | --- | --- | --- |
| Firebase / managed backend | TBD | TBD | Backend leaderboard lane | Fill from official Firebase docs/pricing/security docs. |
| PWA service worker | TBD | TBD | PWA install/offline lane | Fill from official browser/web platform docs. |
| Web App Manifest | TBD | TBD | PWA install metadata | Fill from MDN/W3C or browser official docs. |
| GitHub Pages | TBD | TBD | Current hosting/deployment lane | Fill from GitHub official docs. |
| Capacitor | TBD | TBD | Native packaging lane | Fill from Capacitor official docs. |
| Cordova | TBD | TBD | Native packaging alternative | Fill from Cordova official docs. |

## Current Project Baseline

- Runtime entry: `index.html` loads `src/main.js`.
- Build command: `npm run build`.
- Validation command: `npm run validate`.
- Production release gate: `npm run smoke:release`.
- Deployment: `.github/workflows/deploy.yml` builds `dist` and deploys it through GitHub Pages.
- Current release preferences are local-only: `eternalRicochetSettings`, `eternalRicochetMeta`, and `eternalRicochetHighScore`.
- Phase 5 accepted risk: external CDN references remain in `index.html`; no offline caching or asset vendoring was added.

## No-Go Until Decided

Do not implement any of the following until the user/planner explicitly approves the corresponding lane:

- Backend provider, project, database, auth mode, server rules, or credentials.
- Privacy copy and consent UX for any score submission or public display name.
- Moderation policy for public names, suspicious scores, spam, and takedown/removal.
- PWA cache strategy, asset vendoring strategy, manifest/icons, or service worker lifecycle.
- Native package lane, app id, signing credentials, store metadata, or mobile hardware QA matrix.

## Sections To Complete In Later Rounds

- Official platform facts and citations.
- Privacy/data boundary and consent details.
- Moderation and abuse model.
- Future architecture boundary for leaderboard submission/retrieval.
- Recommended next implementation phase and two alternatives.
- Final approval gates and validation matrix.
