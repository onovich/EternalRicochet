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
| Firebase privacy and security | https://firebase.google.com/support/privacy | 2026-07-01 | Privacy/data boundary planning | Official Firebase privacy/security reference; not a substitute for legal review. |
| Service Worker API | https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API | 2026-07-01 | PWA offline/cache lane | MDN reference for service workers, secure contexts, caching, lifecycle, and request interception. |
| Web App Manifest | https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest | 2026-07-01 | PWA install metadata | MDN reference for manifest JSON, install metadata, and `<link rel="manifest">`. |
| GitHub Pages overview | https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages | 2026-07-01 | Current static hosting baseline | Official GitHub Pages hosting model reference. |
| GitHub Pages custom workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages | 2026-07-01 | Existing GitHub Actions deployment lane | Official reference for deploying Pages through Actions workflows. |
| GitHub Pages custom domains | https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages | 2026-07-01 | Current custom-domain hosting risk | Official reference for custom domain considerations. |
| Capacitor install | https://capacitorjs.com/docs/getting-started | 2026-07-01 | Native packaging lane | Official reference for adding Capacitor to an existing web app, native projects, and sync. |
| Capacitor environment setup | https://capacitorjs.com/docs/getting-started/environment-setup | 2026-07-01 | Native packaging prerequisites | Official reference for macOS/Xcode and Android Studio/SDK requirements. |
| Cordova overview | https://cordova.apache.org/docs/en/latest/guide/overview/index.html | 2026-07-01 | Native packaging alternative | Official reference for Cordova plugins, runtime, and workflows. |
| Cordova Android platform guide | https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html | 2026-07-01 | Android packaging prerequisites | Official reference for Android SDK/JDK/Gradle/CLI requirements. |
| Cordova iOS platform guide | https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html | 2026-07-01 | iOS packaging prerequisites | Official reference for macOS/Xcode/iOS SDK and App Store build requirements. |

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

### PWA / Offline Lane

- MDN documents service workers as event-driven workers that sit between the app, browser, and network, can intercept requests, and can cache resources for offline behavior. Project inference: a PWA/offline lane is not just metadata; it changes the request path for every cached asset and needs rollback/update tests.
- MDN documents service workers as available only in secure contexts, with localhost allowed for local development. Project inference: the current GitHub Pages/custom-domain production path is compatible only if HTTPS remains correctly configured.
- MDN documents the service worker install/activate lifecycle and cache cleanup timing. Project inference: a later PWA phase needs a versioned cache policy, cache cleanup smoke, and user-facing update expectations before shipping.
- MDN documents a web application manifest as a JSON file used by browsers for install metadata such as name and icon, and documents deploying it with `<link rel="manifest">`. Project inference: adding a manifest requires icon/splash/name decisions and should not be mixed with service-worker caching by default.

### Native Packaging Lane

- Official Capacitor docs say Capacitor can be added to an existing web app when it has `package.json`, a built web asset directory such as `dist` or `www`, and an `index.html` at the root of built assets. Project inference: Eternal Ricochet is structurally close to the web-asset prerequisite, but adding Capacitor would still introduce dependencies, config, native projects, and sync/build commands.
- Official Capacitor docs require platform environment setup. For iOS, Capacitor documents macOS plus Xcode and Xcode Command Line Tools; for Android, it documents Android Studio and an Android SDK installation. Project inference: native packaging cannot be validated by the current Windows-only web validation lane alone, especially for iOS.
- Official Cordova docs describe plugins as the bridge between Cordova and native components/device APIs, and note that plugins must be explicitly added. Project inference: a Cordova lane should be treated as a native runtime/tooling project, not a trivial static export.
- Official Cordova docs describe cross-platform CLI and platform-centered workflows, with platform-centered work carrying overwrite/maintenance concerns. Project inference: native packaging introduces source tree ownership questions and generated native output that should not be committed casually.
- Official Cordova Android/iOS guides document platform-specific tool requirements such as Android Studio/SDK/JDK/Gradle and macOS/Xcode/iOS SDK. Project inference: native packaging requires a hardware/OS/toolchain matrix and signing/release process before implementation.

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

## Privacy, Consent, And Data Boundary

This section defines a future leaderboard boundary. It is a product/engineering plan, not legal advice. A later implementation phase must still get user-approved privacy copy and any required legal review before network submission ships.

### Allowed Future Leaderboard Submission Fields

Submit only the smallest run result needed for a public leaderboard:

| Field | Purpose | Public? | Notes |
| --- | --- | --- | --- |
| `score` | Rank the completed run. | Yes | Integer from run settlement; reject negative, non-finite, and impossible values. |
| `displayName` or `anonymousId` | Show or group the entrant. | Display name yes; anonymous id no | Display name requires consent, length limit, profanity/moderation path, and optional anonymous default. |
| `submittedAt` | Sort/tiebreak and audit submissions. | Maybe | Prefer server timestamp where the provider supports it; client timestamp is advisory only. |
| `gameVersion` / `buildId` | Separate score eras after balance changes. | Maybe | Required before leaderboard launch because upgrades/balance can change score comparability. |
| `qualityTier` | Debug rendering/performance context. | No by default | Only include if needed for abuse/support, and disclose it. |
| `runDurationFrames` or `runDurationMs` | Basic anti-abuse sanity check. | No | Keep bounded and avoid detailed telemetry. |
| `clientNonce` | Duplicate submission defense. | No | Random per-run token; not a tracking id across sessions. |
| `appCheckToken` or provider attestation | Backend abuse resistance. | No | Provider-specific; disclose if it sends attestation material. |

### Do Not Submit Without Explicit Approval

The following must remain local-only unless a later user-approved phase names and justifies them:

- Full `localStorage` dumps.
- Upgrade inventory, credit balance, shop purchase history, or meta progression beyond a narrow score-era/version context.
- Settings such as audio/fullscreen/render preference unless needed for a disclosed support reason.
- Raw pointer/touch/key input history.
- Device identifiers, fingerprinting signals, hardware model, installed fonts, or persistent browser identifiers.
- IP-derived location claims stored in the game database.
- Analytics, telemetry, session replay, crash reporting, or performance monitoring.
- Personal data beyond the approved display name or intentionally anonymous id.
- Any Firebase Authentication account data unless accounts are separately approved.

### Consent And UI Requirements Before Submission

A future networked leaderboard phase must add all of these before the first write:

- A submit screen that clearly says scores will be sent to an external backend and may be publicly shown.
- A display-name field with anonymous play still available.
- A consent checkbox or equivalent explicit action for first submission.
- A link or modal with privacy copy: fields submitted, why, public visibility, retention expectation, deletion/removal path, and provider name.
- A moderation notice for names and suspicious scores.
- A network failure state that keeps local high score/meta progression intact.
- A local opt-out path that hides submission prompts.

### Moderation And Abuse Risks

| Risk | Example | Required Mitigation Before Launch |
| --- | --- | --- |
| Offensive display names | Slurs, threats, impersonation, links | Name length/character limits, filter or review queue, takedown path. |
| Forged scores | Modified client writes impossible values | Security rules, schema validation, score bounds, server timestamp, versioned eras, suspicious-score review. |
| Spam submissions | Repeated writes to inflate or flood leaderboard | Rate limits, per-run nonce, App Check, per-anonymous-id throttles where possible. |
| Backend quota abuse | Automated reads/writes exhaust free tier or billable quota | Conservative query shape, pagination/limit, App Check, budget alerts, launch cap. |
| Privacy surprise | User expects local-only play but score/name is uploaded | Explicit consent UI, no default upload, local-only fallback. |
| Moderation operations gap | User asks for name/score removal | Document owner, contact path, removal tooling, audit log. |

### Storage Boundary With Existing Local Data

Current local stores must remain separate:

- `eternalRicochetSettings`: render quality, audio mute, fullscreen preference.
- `eternalRicochetMeta`: credits and upgrades.
- `eternalRicochetHighScore`: local high score.

A future leaderboard client may read the completed run score and version/build metadata, but it must not upload these storage blobs directly. The leaderboard store must be its own backend collection/table with a narrow schema and must not become the source of truth for local upgrades or settings.

### Deletion, Retention, And Policy Open Questions

These must be answered before implementation:

- How can a user request display-name or score removal?
- Is a public score retained indefinitely, or expired after balance/version resets?
- Does the project need a contact email or moderation form before public release?
- Who can remove abusive entries, and where are moderation credentials stored?
- Is anonymous id resettable by the player?
- Does the chosen provider process IP/user-agent/attestation data, and how is that reflected in privacy copy?

## Lane Deep Dive: PWA Install / Offline

Implementation shape:

- Decide whether Phase 1 of PWA is manifest-only or includes service-worker caching.
- If manifest-only, add icons, theme colors, display mode, start URL, and install smoke without offline claims.
- If offline-capable, add a service worker with explicit cache names, versioning, update behavior, and rollback path.
- Decide whether to vendor current external CDN assets before any offline claim.

Current blockers:

- `index.html` still references Tailwind and Google Fonts through external CDN/network URLs.
- Current release smoke validates `dist` pathing but does not validate cache behavior or stale asset removal.
- There is no icon asset set or manifest metadata approved for app installation.

Privacy/data:

- PWA install/offline itself need not upload player data.
- Push notifications, background sync, or analytics must remain out of scope unless separately approved.

Moderation/abuse:

- No public content surface is introduced by PWA alone.
- Offline caches can preserve outdated UI/privacy copy, so update policy matters if later network features are added.

Deployment/credentials/cost:

- GitHub Pages can host a static manifest and service worker, but cache scope must match `/EternalRicochet/` and the custom domain path.
- No backend cost is introduced by install/offline alone.

Rollback:

- Manifest-only rollback is ordinary static rollback.
- Service-worker rollback must unregister or replace old caches; otherwise stale clients can continue serving older files.

Validation:

- Build and release gate smoke.
- Browser smoke for manifest installability signals where supported.
- Service-worker lifecycle smoke: first load, cached reload, update, old cache cleanup, offline page behavior, and unregister/rollback.

## Lane Deep Dive: Native Packaging With Capacitor/Cordova

Implementation shape:

- Pick one wrapper lane, or explicitly defer native packaging.
- Treat web build as source of truth and native projects as generated/platform artifacts unless a later phase defines ownership.
- Define app id, app name, icons, splash assets, orientation/fullscreen behavior, and store metadata.
- Create mobile hardware QA matrix before store distribution.

Current blockers:

- No approved app id, signing credentials, icons, store copy, privacy labels, or support policy.
- iOS packaging requires macOS/Xcode validation; current executor validation is web-first on Windows.
- Current app still relies on browser/CDN behavior that may differ inside WebViews.

Privacy/data:

- Native packaging alone should not upload data.
- Store privacy declarations may still be required if any network, analytics, ads, or leaderboard feature is present.

Moderation/abuse:

- Native packaging does not add public content, but if paired with leaderboards it inherits the same public-name and cheating risks.

Deployment/credentials/cost:

- Requires native toolchains and signing material outside the repository.
- App-store release introduces review, metadata, versioning, and rollback constraints outside GitHub Pages.

Rollback:

- Keep the hosted web release as the fallback distribution.
- Do not submit to stores until browser and native smoke both pass.
- If native validation fails, abandon the native lane without altering local web gameplay.

Validation:

- `npm run validate` for the web source before wrapping.
- Capacitor/Cordova sync/build smoke on approved host OS/toolchain.
- Android emulator/device smoke.
- iOS simulator/device smoke on macOS if iOS is in scope.
- Store packaging dry run only after signing and metadata are approved.

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
