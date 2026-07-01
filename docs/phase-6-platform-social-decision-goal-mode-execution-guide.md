# Phase 6 - Platform And Social Decision Dossier Slice Goal Mode Execution Guide

Date: 2026-07-01
Status: execution guide for the executor
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Round budget: 8 rounds, with rounds 1-5 for evidence and dossier work, rounds 6-7 for buffer fixes, and round 8 for final validation.

## 0. Direct Goal Prompt For The Executor

You are the Eternal Ricochet implementation executor. Use `$donextgoal` to execute this guide.

Goal: after Phase 5 made the browser release locally shippable, produce a decision-ready platform/social dossier for the next v2.0 direction. The original roadmap names Firebase global leaderboards, PWA packaging, and native mobile packaging, but those choices affect privacy, hosting, moderation, cost, credentials, deployment, and long-term maintenance. This phase must not implement those integrations. It should gather primary-source evidence, map options to this repository, document risks, define acceptance gates, and recommend the smallest safe next implementation phase for planner/user approval.

This is a documentation and architecture-prep slice. Keep the playable app behavior unchanged except for documentation/index updates if needed. Do not add external services, credentials, service workers, native packaging toolchains, or runtime network calls.

Each round must read this guide and relevant project docs first, run validation for touched files, commit and push after validation passes, and stop if validation, commit, or push fails.

## 1. Required Reading

- `README.md`
- `origin/design.md`
- `docs/phase-5-validation-report.md`
- `docs/phase-5-planner-check-report.md`
- `docs/release-readiness-checklist.md`
- `docs/phase-5-release-readiness-goal-mode-execution-guide.md`
- `.github/workflows/deploy.yml`
- `package.json`
- `index.html`
- `src/main.js`
- `.codex/project-ops-workflow.md`
- `.codex/project-git-workflow.md`

External research rules:

- Use current primary/official sources only for platform facts: Firebase, browser PWA/service worker, Web App Manifest, Capacitor/Cordova, GitHub Pages, and any other candidate platform.
- Cite source URLs and the date checked in the dossier.
- Do not rely on blog summaries for authoritative constraints when official docs exist.
- Do not create accounts, projects, credentials, API keys, service workers, app manifests, native packages, or cloud resources.

Current accepted facts:

- Phase 1 fixed the maintainable core and ricochet feel.
- Phase 2 added combo, obstacles, Shooter enemies, and projectiles.
- Phase 3 added local meta progression and upgrades.
- Phase 4 added performance metrics, stress seed, particle pool, quality tiers, and projectile trail feedback.
- Phase 5 added local settings, release gate smoke, and mobile browser polish.
- The remaining roadmap items are high-impact platform decisions, not safe default implementation work.

## 2. Scope

1. Platform/social decision dossier:
   - Create `docs/phase-6-platform-social-decision-dossier.md`.
   - Compare at least these lanes:
     - Keep local-only release and improve distribution/docs.
     - Add global leaderboard with Firebase or a comparable managed backend.
     - Add PWA install/offline behavior.
     - Add native packaging with Capacitor/Cordova or defer native packaging.
   - For each lane, record implementation steps, credentials/secrets, hosting/deployment impact, privacy/data handling, moderation/abuse risk, cost/quotas if official docs expose them, rollback risk, and validation needs.

2. Privacy and data boundary prep:
   - Define what data a future leaderboard would submit: score, player display name or anonymous id, timestamp, version/build, and any anti-abuse metadata.
   - Define what must not be submitted without explicit consent: localStorage dump, upgrade state beyond intended score context, device identifiers, IP-derived claims, analytics, or personal data.
   - Document required UI/privacy consent surfaces before any networked leaderboard phase.

3. Architecture proposal without integration:
   - Propose a small future boundary for leaderboard submission and score retrieval.
   - Keep it as documentation or pseudocode unless a tiny static type/shape document already matches repository style.
   - Do not add runtime network code, dependencies, environment variables, or generated clients.
   - Explain how future code should remain isolated from renderer, physics, meta progression, and settings storage.

4. PWA/native readiness assessment:
   - Assess whether the current external CDN use, GitHub Pages custom domain, asset pathing, release smoke, and settings/meta storage are compatible with PWA/offline or native packaging.
   - Identify blockers before adding a service worker, manifest, Capacitor, Cordova, or app-store workflow.
   - Do not add a manifest or service worker in this phase unless the planner explicitly approves later.

5. Recommendation and next-phase choices:
   - End with one recommended next implementation phase and two alternatives.
   - Mark which decision points require user approval before implementation.
   - Include a "No-Go until decided" section for credentials, privacy copy, moderation policy, backend provider, and PWA caching strategy.

## 3. Non-Scope

- Do not implement Firebase, Supabase, Cloudflare, custom backend, accounts, cloud saves, global leaderboard, analytics, telemetry, or network submission.
- Do not create cloud projects, credentials, API keys, environment files, secrets, or GitHub repository settings.
- Do not add service workers, app manifests, offline caching, install prompts, or PWA icons.
- Do not add Capacitor, Cordova, Electron, native app package tooling, mobile signing, or app-store metadata.
- Do not migrate to WebGL/Pixi/shaders or add rendering dependencies.
- Do not add gameplay content, enemies, weapons, maps, upgrades, currencies, shop changes, or economy balancing.
- Do not commit `dist/`, `node_modules/`, screenshots, temporary browser artifacts, or local PID files.

## 4. Per-Round Fixed Workflow

Every round reply must include:

- Round goal
- Completed changes
- Debug self-check
- Architecture self-check
- Validation commands and results
- Commit hash and push result
- Next round goal
- Whether a buffer round was consumed

Progression rules:

- Validation failed: do not commit, do not push, do not proceed.
- Validation passed but commit failed: do not proceed.
- Commit passed but push failed: do not proceed.
- Push passed: record commit hash and remote branch, then proceed.

## 5. Commit And Push Workflow

Prefer the project wrapper:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths <phase-relevant-files>
```

For docs-only rounds, at minimum run:

```powershell
git diff --check
npm run validate
```

For final validation also run:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
git status --short --branch
```

Do not stage unrelated files.

## 6. Round Plan

### Round 1: Establish Decision Matrix

- Create the dossier with a clear matrix structure and source-citation table.
- List the four lanes and the decision criteria.
- Run `git diff --check` and `npm run validate`.

### Rounds 2-3: Primary-Source Platform Research

- Use official docs to fill Firebase/backend, PWA/browser, GitHub Pages, and native packaging facts.
- Record source URLs, date checked, and uncertainty.
- Do not add dependencies or accounts.

### Round 4: Privacy, Abuse, And Data Boundary

- Define leaderboard data fields, consent requirements, moderation/abuse considerations, and storage boundaries.
- Document why existing local meta/settings storage must not be uploaded wholesale.

### Round 5: Architecture Recommendation

- Propose a future integration boundary and validation matrix for the recommended next implementation phase.
- Include one recommended next phase and two alternatives.
- Identify all user approval gates.

### Rounds 6-7: Buffer Fixes

- Use only for citation gaps, docs mismatches, validation failures, or unclear decision tables.
- Do not expand into implementation.

### Round 8: Final Validation And Report

- Run final validation:
  - `git diff --check`
  - `npm run validate`
  - `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
  - `git status --short --branch`
- Add `docs/phase-6-validation-report.md`.
- Update README with Phase 6 evidence and the pending user decision state.
- Commit and push final docs.
- Report back to planner thread `019f1952-5d38-7941-b681-7ff06c097a8d` with final commit, validation, recommendation, alternatives, and decision gates.

## 7. Debug Self-Check

Each round must answer:

- Is every platform claim backed by a primary official source or clearly marked as an inference?
- Can a future implementer tell exactly which decision is still pending?
- Did this round avoid creating accounts, credentials, network calls, service workers, manifests, native tooling, or new runtime dependencies?
- Does the current playable app remain unchanged?
- Did validation still pass after documentation changes?

## 8. Architecture Self-Check

Each round must answer:

- Does the proposed future social/platform boundary keep renderer, physics, meta progression, settings, and platform/network code separated?
- Are privacy, consent, moderation, and rollback concerns documented before implementation?
- Does the recommendation preserve GitHub Pages and current release validation unless explicitly changed in a later approved phase?
- Are external-service secrets and deployment settings kept out of the repository?
- Are unrelated files, generated outputs, and user changes left alone?

## 9. PASS Criteria

All must be true:

- `docs/phase-6-platform-social-decision-dossier.md` exists and compares local-only, backend leaderboard, PWA, and native packaging lanes.
- Dossier uses primary/official source URLs with date checked.
- Privacy/data boundary and consent requirements are documented.
- Moderation/abuse, deployment, rollback, cost/quota, and credential risks are documented where relevant.
- Future architecture boundary is described without runtime implementation.
- A recommended next implementation phase plus two alternatives are documented.
- User approval gates are explicit.
- No external services, credentials, service workers, manifests, native packaging tools, runtime network calls, or new dependencies were added.
- `git diff --check` PASS.
- `npm run validate` PASS.
- Project `Validate.cmd` PASS.
- README and final report accurately reflect Phase 6 output and pending decision state.
- All phase-relevant commits are pushed to `origin/main`.

## 10. Final Report Template

```text
Phase 6 execution completion report

Result: PASS / BLOCKED / PARTIAL
Commits:
- <hash> <message>

Completed docs:
- ...

Recommendation:
- Recommended next phase:
- Alternative A:
- Alternative B:

User decision gates:
- ...

Validation:
- <command>: <result>

Remaining risks:
- ...

Buffer rounds consumed:
- ...
```

