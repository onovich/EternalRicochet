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

External platform claims must be backed by primary or official sources. Date checked is the date this dossier used the source, not a guarantee that the source will remain unchanged.

| Topic | Official Source URL | Date Checked | Used For | Notes |
| --- | --- | --- | --- | --- |
| Firebase pricing | https://firebase.google.com/pricing | 2026-07-01 | Backend leaderboard lane cost/quota planning | Official pricing/plans page; exact cost depends on chosen Firebase products and usage. |
| Cloud Firestore security rules | https://firebase.google.com/docs/firestore/security/get-started | 2026-07-01 | Leaderboard write/read authorization | Used as official evidence that Firestore access must be protected by security rules. |
| Firebase App Check | https://firebase.google.com/docs/app-check | 2026-07-01 | Abuse resistance for backend resources | Used as official evidence for app-origin abuse protection planning. |
| Firebase API keys | https://firebase.google.com/docs/projects/api-keys | 2026-07-01 | Credential/secrets boundary | Used to distinguish browser config identifiers from server/admin secrets and to require key restrictions/rules. |
| PWA service worker | TBD | TBD | PWA install/offline lane | Fill from official browser/web platform docs. |
| Web App Manifest | TBD | TBD | PWA install metadata | Fill from MDN/W3C or browser official docs. |
| GitHub Pages overview | https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages | 2026-07-01 | Current static hosting baseline | Official GitHub Pages hosting model reference. |
| GitHub Pages custom workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages | 2026-07-01 | Existing GitHub Actions deployment lane | Official reference for deploying Pages through Actions workflows. |
| GitHub Pages custom domains | https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages | 2026-07-01 | Current custom-domain hosting risk | Official reference for custom domain considerations. |
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

## Official Facts Checked So Far

### Current Static Hosting Lane

- Official GitHub docs describe GitHub Pages as static site hosting. Project inference: Eternal Ricochet's current Vite build and `dist` artifact are aligned with static hosting because there is no server runtime in the deployed app.
- Official GitHub docs support deploying GitHub Pages with custom workflows. Project inference: the existing `.github/workflows/deploy.yml` remains the safest deployment baseline for local-only and frontend-only lanes.
- Official GitHub docs cover custom domains for Pages. Project inference: any PWA or native wrapper must preserve the currently documented `/EternalRicochet/` asset path and custom-domain behavior, or explicitly replace that deployment assumption in a later approved phase.

### Managed Backend / Leaderboard Lane

- Official Firebase pricing is product- and usage-dependent. Project inference: a global leaderboard needs a quota/billing review before launch, even if the initial usage might fit a free tier.
- Official Firestore documentation requires access control through security rules. Project inference: public leaderboard writes must not be added until rules define who can submit, which fields are allowed, score bounds, rate limiting strategy, and read visibility.
- Official Firebase App Check documentation positions App Check as a way to help protect backend resources from abuse by unauthorized clients. Project inference: App Check can reduce casual abuse for a browser leaderboard, but it is not a full anti-cheat or moderation solution.
- Official Firebase API key documentation distinguishes Firebase web API keys from traditional server secrets, while still documenting key management/restriction concerns. Project inference: browser Firebase config can be public only after security rules, App Check, and key restrictions are intentionally designed; service-account/admin credentials must never be committed or shipped.

## Lane Deep Dive: Local-Only Release / Docs

Implementation shape:

- Keep current GitHub Pages deployment.
- Keep all score, high score, settings, and meta progression in local storage.
- Improve README/release checklist only; no new runtime behavior.

Privacy/data:

- No gameplay or identity data leaves the browser.
- No consent UI is required beyond current local-only behavior, but README/release notes should keep stating that progress is local.

Moderation/abuse:

- No public user content surface exists.
- Cheating affects only the local player.

Deployment/credentials/cost:

- Uses the existing GitHub Actions Pages workflow.
- No new credentials, backend billing, service rules, or app-store assets.

Rollback:

- No data migration is required; rollback is ordinary static-site rollback.

Validation:

- `npm run validate`
- GitHub Pages deployment check
- Browser smoke for menu/start/settings/gameplay

## Lane Deep Dive: Managed Backend Leaderboard

Implementation shape:

- Choose provider and data model before code.
- Add a tiny platform boundary for submitting a run result and fetching ranked results.
- Keep local high score and meta progression as the offline fallback.
- Add consent UI before the first network submission.

Candidate Firebase work items:

- Create Firebase project outside this repository.
- Choose Firestore or Realtime Database, then document rules and indexes.
- Configure web app credentials intentionally; do not commit service-account/admin credentials.
- Define App Check posture and abuse limits.
- Create rollback switch to hide submission UI and keep local-only play working.

Privacy/data:

- Network submission changes the product from local-only to data-collecting.
- Required consent must name the submitted fields, public display behavior, retention expectation, and removal/moderation path.

Moderation/abuse:

- Public display names can contain offensive text, impersonation, spam, or links.
- Scores can be forged by modified clients unless server-side verification or conservative trust limits are designed.
- App Check and rules help with resource abuse but do not prove a score is legitimate.

Deployment/credentials/cost:

- GitHub Pages can still host the static frontend, but backend provider config, rules, quotas, and billing become release dependencies.
- Any admin tooling or moderation workflow must run outside the public client bundle.

Rollback:

- Disable submission/fetch UI through a local feature flag or build-time config.
- Preserve local high score and meta progression regardless of backend state.
- Keep backend writes isolated so deleting a provider config cannot break the core game loop.

Validation:

- Unit smoke for payload validation and consent gating.
- Browser smoke with network disabled or mocked provider failure.
- Provider rules test or emulator/manual rules verification in the future implementation phase.
- Production build scan to ensure no server/admin secrets are bundled.

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
