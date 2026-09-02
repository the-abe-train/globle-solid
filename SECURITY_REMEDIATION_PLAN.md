# Globle Security Remediation Plan

Status: In progress — answer restriction deployed; direct account remediation
and monorepo migration planned

Prepared: 2026-08-31  
Legacy repositories in scope: `globle-solid`, `globle-capitals`,
`mongo-gateway-globle`

Target implementation: Globle and Globle Capitals in the Trainwreck Labs
monorepo as SolidStart applications

## Checklist legend

- `[ ]` means the action remains to be completed.
- `[x]` means the implementation is verified or the documented decision/action
  is complete.
- **MEAT PROXY** means the action requires intervention from Abe/the human
  coder. This includes product decisions, access to production dashboards or
  provider consoles, secrets, deployment authorization, production data
  changes, external communications, and final acceptance.
- An unchecked item without **MEAT PROXY** can be implemented and prepared in
  the repositories without human-only access. Deployment still has its own
  explicitly marked **MEAT PROXY** checkpoint.

### User-experience flags

- **UX CHANGE** means the item intentionally changes something a player can
  see, do, or rely on, such as login, account sync, gameplay, rollover, or an
  on-screen message.
- **UX RISK** means no user-visible change is intended, but a bad migration,
  configuration, or rollout could cause sign-in failures, missing statistics,
  lost benefits, errors, or downtime.
- An unchecked item with neither flag is expected to have no user-experience
  impact. This convention applies to every to-do in this document, including
  tests, documentation, incident review, and internal observability work.

## Executive summary

The investigation confirmed two classes of issue across both games:

1. Answer encryption is client-side obfuscation. A player can recover any
   ciphertext the server makes available because the browser also receives the
   decryption key and ordered answer data.
2. Account identity is not authenticated. The shared gateway treats an email
   query parameter as the authenticated user, while several routes accept an
   email directly without even that middleware. This permits unauthorized
   reads, statistics changes, daily-result changes, sponsor-token generation,
   and account deletion.

The `/answer` restriction is deployed and verified in both games. Each endpoint
only serves the puzzle date currently available in the requested IANA time
zone, and the Capitals answer-material logging has been removed. Production
smoke checks on 2026-08-31 returned `200` for the current Toronto puzzle date
and `404` for a future scheduled date in both games.

The remaining account issue is real but bounded by the product context. Players
can currently target another account if they know its email, but the affected
data is game statistics, daily-result records, account metadata, and
subscription/teacher capabilities—not medical, financial, safety-critical, or
competitive-prize data. There is no evidence that MongoDB credentials are
committed or delivered to browsers. Players being able to edit only their own
casual statistics is an accepted product property; cross-account access is the
security boundary that must be fixed.

The chosen delivery strategy is a direct cutover. The games will move into the
Trainwreck Labs monorepo, be rewritten with SolidStart, adopt that repository's
server-verified authentication and authorization practices, and stop using the
separate Mongo gateway. Work is expected to begin in the next implementation
session, with the migration targeted within roughly one month. If that schedule
materially slips, the residual legacy risk should be reviewed again.

Decision recorded 2026-08-31: **MEAT PROXY** understands and accepts the short
period in which the existing account APIs remain available until the direct
cutover.

### Priority summary

1. **Required in the direct remediation:** establish a verified session, derive
   account ownership on the server, prevent cross-account reads/writes/deletes,
   bind sponsor and account-linked subscription actions to that identity, and
   remove logs that may contain OAuth secrets or signed sponsor tokens.
2. **Required at cutover:** migrate existing identities safely, remove all game
   traffic to `mongo-gateway-globle`, revoke its credentials, and retire it.
3. **Useful but non-blocking:** advanced monitoring, broad historical
   forensics, optimistic concurrency, recovery history, and a long-term change
   to the client-visible answer model. These should not delay the ownership fix
   or monorepo migration.

## Confirmed scope by repository

### `globle-solid`

- [x] Confirm that the browser receives encrypted answer indexes and includes
      the AES key and ordered country data.
- [x] Confirm that the previous `/answer` implementation accepted arbitrary
      scheduled dates.
- [x] Confirm that `/account` and `/dailyStats` Cloudflare functions forward
      browser-selected identity and bodies to the shared gateway.
- [x] Confirm that `/sponsor?email=` can select another account when generating
      a signed NitroPay token.
- [x] Implement the local `/answer` date restriction and focused tests.

### `globle-capitals`

- [x] Verify local `master` matches GitHub commit
      `42fa63736597ccbd01dd1c728c29d817029f3d96` from 2026-08-30.
- [x] Confirm that the browser receives encrypted answer indexes and includes
      the AES key and ordered primary-capital data.
- [x] Confirm that `/answer` accepts arbitrary scheduled dates through
      2027-06-30.
- [x] Confirm that answer indexes, ciphertext, decrypted answers, and key
      metadata were written to logs before the Phase 0 cleanup.
- [x] Confirm that account and daily-stat calls use the same unauthenticated
      shared gateway. Some Capitals calls go directly from the browser rather than
      through same-origin Cloudflare functions.
- [x] Confirm that `/sponsor?email=` has the same account-selection and signed
      token issue as Globle.
- [x] Port the `globle-solid` `/answer` availability guard, method restriction,
      no-store response, browser-time-zone request, and tests to `globle-capitals`.
- [x] Remove Capitals client/server logging of answer indexes, ciphertext,
      decrypted answers, and encryption-key metadata.

### `mongo-gateway-globle`

- [x] Confirm that account middleware treats `?email=` as the authenticated
      identity and does not verify a provider credential.
- [x] Confirm unauthorized read, replace, create, and delete paths on
      `/account`.
- [x] Confirm unauthenticated daily-stat upserts on `/dailyStats`.
- [x] Confirm adjacent exposure on `/twlAccount`, `/teachers`, `/subscribe`, and
      the data used by both games' `/sponsor` functions.

## Goals

- A player can read and change only their own account; changing their own casual
  statistics remains an accepted product behavior.
- Protected data operations derive identity from a verified server session and
  cannot be redirected to another player by supplying an email or account ID.
- The separate Mongo gateway is retired after cutover, and its credentials are
  revoked.
- Email addresses are account attributes, not authorization credentials.
- Both games use the same authentication and authorization contract.
- Statistics writes have an explicitly documented trust level.
- Sensitive account and subscription fields are returned only where needed.
- Authentication failures are observable without logging tokens or personal
  data unnecessarily.
- Existing Google and Discord users can migrate without losing statistics.

## Non-goals

- Client-side encryption will not be treated as a security boundary.
- CORS, `Referer`, `Origin`, `X-Game-Name`, and rate limiting will not be treated
  as authentication.
- The first account-authentication release does not need to make casual game
  results cheat-proof. Trustworthy competitive statistics require separate
  server-side gameplay validation.

## Phase 0: answer restriction and initial review

Status: answer work complete and deployed.

### Answer endpoints

#### `globle-solid`

- [x] Allow `GET` only.
- [x] Require a `YYYY-MM-DD` puzzle date.
- [x] Resolve the current date in the browser-provided IANA time zone, with the
      Cloudflare request time zone or UTC as fallback.
- [x] Return `404` for a date that is not currently available in that time zone.
- [x] Return `400` for an invalid time zone or missing date.
- [x] Add `Cache-Control: no-store`.
- [x] Stop logging plaintext answer indexes and ciphertext.
- [x] Add unit coverage for current, past, future, invalid-time-zone, and method
      behavior.
- [x] **MEAT PROXY** — Review and accept the local-midnight/time-zone behavior,
      including the narrow adjacent-date limitation described below.
- [x] **UX RISK** — **MEAT PROXY** — Approve and deploy the `globle-solid`
      answer restriction.
- [x] **MEAT PROXY** — Verify production returns `200` for the currently
      playable date and rejects unavailable scheduled dates.

#### `globle-capitals`

- [x] Port every checked `globle-solid` answer-restriction item above to the
      Capitals implementation.
- [x] Add Capitals tests for current, past, future, malformed-date,
      invalid-time-zone, cache, and unsupported-method behavior.
- [x] Remove verbose client logs that expose response bodies and decrypted
      capital records.
- [x] Remove server logs that expose answer indexes or encryption-key metadata.
- [x] **MEAT PROXY** — Review and accept the Capitals local-midnight/time-zone
      behavior.
- [x] **UX RISK** — **MEAT PROXY** — Approve the Capitals deployment.
- [x] **MEAT PROXY** — Verify the deployed Capitals endpoint rejects
      unavailable scheduled dates.

The time-zone guard preserves existing local-midnight behavior. A caller can
claim a different valid time zone, so the restriction can expose an adjacent
calendar date when that date is genuinely live elsewhere in the world. It
limits enumeration to currently live dates instead of the entire future
schedule. A single official rollover time would remove even that narrow window
but would change current player-facing behavior in both games.

Decision recorded 2026-08-31: **MEAT PROXY** approved retaining local-midnight
rollover in both games and accepted the adjacent-date limitation above.

Deployment record, 2026-08-31:

- `globle-solid` local `master` is clean and matches `origin/master` at
  `0f6566c`; **MEAT PROXY** confirmed that revision is deployed.
- `globle-capitals` local `master` is clean and matches `origin/master` at
  `5ff0ab9`; **MEAT PROXY** confirmed that revision is deployed.
- `mongo-gateway-globle` local `main` is clean and matches `origin/main` at
  `6119560`; **MEAT PROXY** confirmed that revision is deployed.
- Read-only production checks returned `200` for
  `/answer?day=2026-08-31&timeZone=America/Toronto` and `404` for
  `/answer?day=2027-06-30&timeZone=America/Toronto` on both game origins.

### Direct delivery path

- [x] **UX CHANGE** — **MEAT PROXY** — Choose direct remediation and cutover for
      the legacy account, daily-stat, sponsor, and subscription APIs.
- [x] **MEAT PROXY** — Accept the bounded short-term risk that email remains the
      legacy account selector while implementation and migration proceed.
- [ ] **MEAT PROXY** — Reassess this decision if direct remediation or the
      monorepo cutover is delayed materially beyond the planned month.

### Proportionate incident follow-up

There is currently no evidence of exploitation beyond the reporter's
non-destructive testing. A broad forensic project is not a release blocker for
this product. Perform a targeted review if logs are readily available or if an
account anomaly is reported.

- [ ] **MEAT PROXY** — Preserve currently available Cloudflare and Deno logs if
      doing so is low effort and does not delay direct remediation.
- [ ] Check for obvious multi-account enumeration, unusual account deletion,
      or large statistics changes from one source.
- [ ] Review and restore individual records only if the targeted check or a
      player report identifies likely corruption.
- [ ] **MEAT PROXY** — Record the disclosure, deployed answer revisions, direct
      remediation decision, and planned monorepo migration.
- [ ] **MEAT PROXY** — Keep any additional reporter validation non-destructive
      and coordinated privately.

## Phase 1: establish real user authentication in the monorepo

Target: begin in the next implementation session and ship with the SolidStart
cutover. Do not reproduce the legacy email-as-identity contract in the new
applications.

### Architecture decisions

- [x] **UX CHANGE** — **MEAT PROXY** — Approve server-verified sessions as the authentication
      direction for both Globle and Globle Capitals.
- [ ] **UX CHANGE** — **MEAT PROXY** — Choose session idle and absolute expiry periods.
- [ ] **UX CHANGE** — **MEAT PROXY** — Confirm whether users may link both Google and Discord to
      one TWL account.
- [ ] **UX CHANGE** — **MEAT PROXY** — Decide whether account deletion requires a fresh provider
      login and what confirmation UI is acceptable.

### Verified session implementation

- [ ] **UX RISK** — Verify Google credential signature, issuer, audience/client ID, expiry,
      nonce/state, and `email_verified` in a server-side endpoint.
- [ ] **UX RISK** — Exchange Discord OAuth codes server-side and obtain identity from
      Discord's API rather than trusting callback query parameters.
- [ ] **UX RISK** — Resolve or create the canonical TWL account using the provider's stable
      issuer and subject identifiers.
- [ ] **UX RISK** — Use `twlId` as the internal account identity; treat normalized
      email as a changeable attribute.
- [ ] **UX RISK** — Issue an opaque session identifier in a `Secure`, `HttpOnly`,
      `SameSite=Lax`, `Path=/`, `__Host-` cookie.
- [ ] Store only a hash of the session identifier server-side with provider,
      creation time, last-used time, idle expiry, absolute expiry, and revocation
      state.
- [ ] **UX CHANGE** — Add session rotation, logout, revocation, and expired-session cleanup.
- [ ] **UX RISK** — Add per-session CSRF protection to state-changing cookie-authenticated
      requests and verify `Origin` as an additional signal.
- [ ] **UX RISK** — Derive account ID and email from the verified session on every protected
      request; ignore or reject client-supplied identity fields.
- [ ] **UX CHANGE** — Update both games' Google and Discord flows to establish the new session.
- [ ] **UX RISK** — Update both games' account, daily-stat, subscription, teacher-status, and
      sponsor calls to use the session-bound same-origin API.
- [ ] **UX RISK** — Remove direct browser-to-gateway calls from `globle-capitals`.
- [ ] **UX RISK** — **MEAT PROXY** — Create or verify production Google and Discord OAuth
      configuration, callback URLs, client IDs, and secrets for both game origins.
- [ ] **UX RISK** — **MEAT PROXY** — Store provider and session secrets in the
      monorepo's approved production secret store.

### Mongo gateway retirement

The separate Deno Mongo gateway is not part of the target architecture. Do not
spend migration time designing a permanent signing protocol for a component
that will be removed. The SolidStart server layer should call the monorepo's
approved data-access code directly and derive player identity from the verified
session.

- [ ] **UX RISK** — Move required account, statistics, teacher, subscription,
      and sponsor data access behind SolidStart server routes/actions.
- [ ] **UX RISK** — Ensure no browser bundle receives MongoDB credentials,
      internal service credentials, or a reusable privileged API key.
- [ ] **UX RISK** — Remove all direct browser-to-gateway calls, including the
      existing Capitals flows.
- [ ] **UX RISK** — Stop new traffic to `mongo-gateway-globle` after the
      SolidStart cutover is verified.
- [ ] **UX RISK** — **MEAT PROXY** — Revoke the gateway's MongoDB and integration
      secrets and retire the Deno deployment.

### Account-provider data migration

- [ ] **UX RISK** — Add a provider identity collection keyed by `(issuer, subject)` with a
      unique index.
- [ ] **UX RISK** — Implement one-time linking of existing records after a verified email
      match.
- [ ] **UX RISK** — Record completed migration and stop repeated email auto-linking once a
      verified provider identity exists.
- [ ] **UX CHANGE** — Implement conflict reporting rather than automatically merging ambiguous
      accounts.
- [ ] **UX CHANGE** — Keep Google and Discord identities separately linkable to one TWL account
      if the approved product decision permits it.
- [ ] **UX RISK** — Remove the public `fake` login method from production and restrict any
      replacement to isolated tests.
- [ ] Build a dry-run migration report containing counts and conflicts without
      exposing raw emails in normal logs.
- [ ] **UX CHANGE** — **MEAT PROXY** — Define the account-recovery policy for changed provider
      emails, lost providers, and identity conflicts.
- [ ] **UX RISK** — **MEAT PROXY** — Review the dry-run report and approve the production
      migration.
- [ ] **UX RISK** — **MEAT PROXY** — Approve rollback or manual resolution for each ambiguous
      account class.

## Phase 2: enforce object-level authorization on every route

Target: deploy with the authenticated SolidStart routes. Cross-account access,
not self-editing of casual statistics, is the boundary this phase must enforce.

| Route                  | Current behavior                                   | Required behavior                                                                                       |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GET /account`         | Trusts `?email=` and returns the account document  | Require session; load by authenticated `twlId`; return a minimal account DTO                            |
| `POST /account`        | Creates data for `?email=`                         | Remove from public API or create only for the authenticated session                                     |
| `PUT /account`         | Replaces statistics for `?email=`                  | Replace with narrowly scoped authenticated operations; never accept target identity                     |
| `DELETE /account`      | Deletes the account selected by `?email=`          | Require recent reauthentication and explicit confirmation; delete authenticated account only            |
| `PUT/POST /dailyStats` | Trusts body email and all result fields            | Require session; derive identity and allowed date; validate a strict schema                             |
| `GET /twlAccount`      | Returns central account by email                   | Make internal-only; return only fields required by the caller                                           |
| `GET /teachers`        | Exposes teacher/subscriber status by email or ID   | Make internal-only or self-only; return a boolean capability, not identifiers                           |
| `GET /sponsor`         | Accepts arbitrary email and signs a NitroPay token | Require session; derive `twlId`; never accept email; stop logging signed tokens                         |
| `POST /subscribe`      | Accepts arbitrary email                            | Require session for account-linked subscriptions, or add explicit email verification and abuse controls |
| `GET /answer`          | Returns encrypted answer data                      | Enforce current availability in both games; consider official rollover or server-side scoring           |

Route-hardening checklist:

- [ ] **UX CHANGE** — Protect every account method with verified identity and load records by
      authenticated `twlId`.
- [ ] **UX CHANGE** — Replace public account creation with authenticated account initialization.
- [ ] **UX RISK** — Replace broad account-stat replacement with narrowly scoped operations.
- [ ] **UX CHANGE** — Require recent reauthentication and explicit confirmation for account
      deletion.
- [ ] **UX RISK** — Derive daily-stat identity and allowed puzzle date from authenticated
      server state.
- [ ] **UX RISK** — Make `/twlAccount` internal-only and return a purpose-specific DTO.
- [ ] **UX RISK** — Make `/teachers` internal-only or self-only and return only capability
      booleans.
- [ ] **UX RISK** — Bind `/sponsor` to the authenticated `twlId`; never accept a target email
      and never log signed sponsor tokens.
- [ ] **UX CHANGE** — Protect account-linked subscriptions with a session or require explicit
      email verification for standalone newsletter subscriptions.
- [ ] **UX CHANGE** — Return `401` without a valid session and `403` when an authenticated
      principal lacks permission.
- [ ] **UX CHANGE** — Stop revealing whether another email has an account.
- [ ] **UX RISK** — Remove `_id`, `twlId`, provider metadata, login methods, subscription
      details, and other internal fields from general account responses unless a
      reviewed UI requirement needs them.
- [ ] **UX RISK** — Apply method allowlists at the SolidStart server routes and
      the data-access boundary.
- [ ] **UX RISK** — Replace permissive Zod `.passthrough()` schemas on protected writes with
      strict schemas.
- [ ] **UX RISK** — Apply equivalent client and server-route changes to both
      replacement applications.
- [ ] **UX RISK** — **MEAT PROXY** — Approve the minimal account, teacher, subscription, and
      sponsor response fields needed by each game's UI.

## Phase 3: redesign statistics writes

Target: ship a proportionate casual-statistics model with authenticated account
ownership. Prevent one player from targeting another player; do not build a
competitive anti-cheat system for this free daily game.

- [x] **UX CHANGE** — **MEAT PROXY** — Select casual, user-owned statistics:
      authenticate ownership while accepting that a player can alter their own
      totals.

Required for the security boundary and cutover:

- [ ] **UX RISK** — Authenticate ownership while allowing each player to sync only their own
      statistics.
- [ ] **UX RISK** — Use a strict schema with maximum array and body sizes.
- [ ] **UX RISK** — Reject negative values, invalid dates, and unreasonable jumps.
- [ ] **UX RISK** — Make daily writes idempotent with a unique
      `(twlId, gameId, puzzleDate)` key.

Reliability improvements that are useful but do not block the security cutover:

- [ ] **UX RISK** — Add a version number and optimistic concurrency to prevent stale clients
      from overwriting newer data.
- [ ] Keep a short history if low-cost recovery from accidental overwrites is
      desired.
- [ ] **UX CHANGE** — Update both games to handle version conflicts and safe retries.

Trusted server-side gameplay, validated guess events, and cheat-resistant
leaderboard statistics are explicitly out of scope unless the product later
adds prizes, shared rankings, competition, or another reason that one player's
self-edited statistics could affect other people.

## Phase 4: answer architecture follow-up

Priority: low. The deployed date restriction prevents future-schedule
enumeration. Recovering the currently playable answer remains possible in the
casual client-side model, but doing so affects only the player who chooses to
spoil their own game.

- [ ] **UX CHANGE** — **MEAT PROXY** — Choose one long-term answer model for both games:
  1. Keep the casual client-side model, remove AES, and explicitly accept that
     the currently playable answer can be inspected. Continue serving only
     currently available dates.
  2. Move guess evaluation to the server so the browser never receives the
     answer before completion.
- [x] **MEAT PROXY** — Decide that both games retain local-midnight rollover.
- [x] **UX CHANGE — NOT SELECTED:** worldwide rollover work is not applicable
      because local-midnight rollover was retained.
- [x] With local rollover retained, document that a caller may claim another time
      zone and access an adjacent date already live elsewhere.
- [ ] **UX RISK** — If keeping client-side gameplay, remove AES and its key-management code so
      it is not presented as a security control.
- [ ] **UX CHANGE** — If adopting server-side gameplay, implement country and capital guess
      evaluation without returning answers before completion.
- [ ] **UX CHANGE** — **MEAT PROXY** — Approve player-facing communication for any rollover or
      gameplay behavior change.

Rotating `CRYPTO_KEY` without changing the architecture is not a security fix;
the replacement key would be published in the next client bundle.

## Phase 5: logging, monitoring, and operational hardening

Keep operations proportionate to a free casual game. Removing secrets and
tokens from logs is a near-term code cleanup; a large monitoring or forensic
program is not required before migration.

Near-term cleanup:

- [ ] Remove the Discord OAuth `FormData` logs that may include
      `client_secret`, the complete Discord user-response logs, and generated
      sponsor JWT logs from both games.
- [ ] Remove any remaining logging of credentials, session cookies,
      ciphertext, answer indexes, decrypted answers, encryption-key metadata,
      and complete account documents in the legacy and replacement code.

Post-cutover hardening, not a migration blocker unless already supplied by the
monorepo's established practices:

- [ ] Continue masking emails and add stable keyed hashes where abuse
      correlation is necessary.
- [ ] Log authenticated account ID, stable game ID, route, method, outcome,
      request ID, and coarse source metadata.
- [ ] **UX RISK** — Add lightweight alerting for repeated authorization failures,
      multi-account access, or unusual deletion volume if the monorepo's
      existing observability makes this inexpensive.
- [ ] **UX RISK** — Reduce rate limits to route-appropriate values and key them by both
      session and source IP.
- [ ] **UX RISK** — Add database constraints and indexes for provider subjects, canonical
      account IDs, and per-day statistics uniqueness.
- [ ] **UX RISK** — Add automated backup verification and a documented restoration procedure.
- [ ] Reconcile `mongo-gateway-globle/SECURITY.md` with the implementation; it
      currently claims JWT verification exists while newer code states it was
      removed.
- [ ] **UX CHANGE** — Add a private security contact and coordinated-disclosure policy with
      response targets to all relevant public properties.
- [ ] **MEAT PROXY** — Choose production alert destinations and responsible
      responders.
- [ ] **UX RISK** — **MEAT PROXY** — Configure production log retention, monitoring, and alert
      integrations.
- [ ] **UX RISK** — **MEAT PROXY** — Confirm backup retention and recovery objectives.
- [ ] **UX CHANGE** — **MEAT PROXY** — Publish or approve the security contact and disclosure
      policy.

## Test plan

### Authentication and session tests

- [ ] Reject missing, malformed, expired, wrong-audience, and wrong-issuer
      provider tokens.
- [ ] Verify a provider token creates a session bound to its provider subject.
- [ ] Verify session expiry, rotation, logout, and revocation.
- [ ] Reject state-changing requests without a valid CSRF token.
- [ ] Verify the public `fake` login method is unavailable in production.
- [ ] Run equivalent login/session suites against both game origins.

### Authorization tests

- [ ] Verify an unauthenticated request cannot read, update, or delete any
      account.
- [ ] Verify Player A cannot read, update, delete, or infer Player B's account
      even when Player B's email and ID are known.
- [ ] Verify a different email in query parameters, headers, or JSON does not
      change the target account.
- [ ] Verify `/twlAccount`, `/teachers`, and raw gateway endpoints reject direct
      public requests.
- [ ] Verify each game's `/sponsor` signs only the authenticated player's ID.
- [ ] Verify Capitals no longer calls protected gateway routes directly from the
      browser.

### Gateway-retirement tests

- [ ] Verify neither game makes browser requests to the Deno Mongo gateway.
- [ ] Verify all migrated account and statistics operations use authenticated
      SolidStart server routes/actions.
- [ ] Verify production remains functional after the gateway is denied new
      traffic and then retired.

### Statistics tests

- [ ] Write daily stats only for the authenticated account.
- [ ] Reject invalid dates, oversized guess lists, extra fields, and impossible
      values.
- [ ] Make duplicate requests idempotent.
- [ ] Prevent concurrent writes from silently losing newer data.
- [ ] If short history is implemented, exercise recovery from it.
- [ ] Run the same ownership and concurrency contract against Globle and
      Capitals data.

### Answer tests

- [x] `globle-solid`: current date in the selected time zone returns an
      encrypted answer.
- [x] `globle-solid`: past and future dates return `404`.
- [x] `globle-solid`: invalid time zones and malformed dates are rejected.
- [x] `globle-solid`: non-GET methods return `405`.
- [x] `globle-solid`: answer material is no longer written by the answer
      function.
- [x] `globle-capitals`: add and pass the equivalent current/past/future/input/
      method tests.
- [x] `globle-capitals`: verify answer material and key metadata are absent from
      client and server logs.
- [ ] Add production smoke tests for both games that never request or reveal an
      unavailable answer value.

## Deployment sequence

- [x] **MEAT PROXY** — Review and accept the time-zone limitation for both games.
- [x] **UX RISK** — **MEAT PROXY** — Approve, deploy, and smoke-test the
      `globle-solid` answer restriction.
- [x] Implement and locally verify the same answer restriction in
      `globle-capitals`.
- [x] **UX RISK** — **MEAT PROXY** — Approve, deploy, and smoke-test the
      Capitals answer restriction.
- [x] **MEAT PROXY** — Accept continued legacy API operation until direct
      remediation and cutover.
- [ ] Remove sensitive OAuth, user-response, and sponsor-token logging in both
      legacy games and carry the cleanup into the monorepo implementations.
- [ ] **UX CHANGE** — Build the SolidStart Globle and Capitals applications in
      the Trainwreck Labs monorepo using its established session and data-access
      practices.
- [ ] **UX RISK** — Implement provider verification, session creation, and
      authenticated account ownership before connecting migrated account data.
- [ ] **UX RISK** — Implement same-origin account, casual-statistics,
      subscription, teacher, and sponsor routes that derive identity from the
      verified session.
- [ ] **UX RISK** — Build and dry-run the Google/Discord identity and account-data
      migration.
- [ ] **UX RISK** — **MEAT PROXY** — Review conflicts and approve production migration.
- [ ] Run the authentication, cross-account authorization, casual-statistics,
      answer, and gateway-retirement tests in this plan.
- [ ] **UX CHANGE** — **MEAT PROXY** — Configure production providers and
      secrets, approve the cutover, and run staff-account acceptance tests on
      both games.
- [ ] **UX RISK** — Cut both game origins over to the monorepo applications and
      verify gameplay, ads, login, sync, subscription, and sponsor behavior.
- [ ] **UX RISK** — Remove compatibility code and direct gateway traffic after
      the cutover is stable.
- [ ] **UX RISK** — **MEAT PROXY** — Revoke retired Mongo gateway and integration
      secrets, remove the Deno deployment, and approve final cleanup.
- [ ] **MEAT PROXY** — Reassess the accepted short-term risk if the migration
      has not shipped within roughly one month.

## Completion criteria

- [ ] No protected route accepts a client-selected target email or account ID.
- [ ] Protected account operations derive identity from a verified monorepo
      session.
- [ ] Cross-account read, write, and delete tests pass in CI for both games.
- [ ] Neither game sends browser or server traffic to the retired Mongo gateway.
- [x] Daily statistics use the documented casual, user-owned trust model.
- [ ] Daily-statistic writes are owner-bound and use a strict schema.
- [ ] Sponsor and subscription capabilities are bound to the authenticated
      account in both games.
- [ ] Future puzzle schedules cannot be enumerated in either game.
- [ ] Sensitive tokens and answer material are absent from application logs.
- [ ] Mongo gateway and retired integration credentials have been revoked.
- [ ] Operational documentation matches deployed behavior.
- [ ] Any account anomaly discovered during targeted review has a restoration
      decision; absent an anomaly, broad historical forensics is not required.
- [ ] **MEAT PROXY** — Accept the residual security risks and sign off that the
      remediation is complete.
