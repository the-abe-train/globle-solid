# Globle Security Remediation Plan

Status: Draft for review  
Prepared: 2026-08-31  
Repositories in scope: `globle-solid`, `globle-capitals`, `mongo-gateway-globle`

## Checklist legend

- `[ ]` means the action remains to be completed.
- `[x]` means the action has been implemented and locally verified.
- **MEAT PROXY** means the action requires intervention from Abe/the human
  coder. This includes product decisions, access to production dashboards or
  provider consoles, secrets, deployment authorization, production data
  changes, external communications, and final acceptance.
- An unchecked item without **MEAT PROXY** can be implemented and prepared in
  the repositories without human-only access. Deployment still has its own
  explicitly marked **MEAT PROXY** checkpoint.

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

The `/answer` containment is implemented and locally verified in
`globle-solid`. It only serves the puzzle date currently available in the
requested IANA time zone. The same containment still needs to be ported to
`globle-capitals`, whose current answer endpoint accepts any scheduled date
through 2027-06-30 and logs answer material.

The account issue should be treated as high priority. The recommended design is
to establish a verified login session at each game origin, derive identity from
that session, and use signed server-to-server requests between the Cloudflare
Pages functions and the Mongo gateway. Neither an email parameter nor a header
that the browser can choose is authentication.

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
- [x] Implement local `/answer` date containment and focused tests.

### `globle-capitals`

- [x] Verify local `master` matches GitHub commit
      `42fa63736597ccbd01dd1c728c29d817029f3d96` from 2026-08-30.
- [x] Confirm that the browser receives encrypted answer indexes and includes
      the AES key and ordered primary-capital data.
- [x] Confirm that `/answer` accepts arbitrary scheduled dates through
      2027-06-30.
- [x] Confirm that answer indexes, ciphertext, decrypted answers, and key
      metadata are currently written to logs.
- [x] Confirm that account and daily-stat calls use the same unauthenticated
      shared gateway. Some Capitals calls go directly from the browser rather than
      through same-origin Cloudflare functions.
- [x] Confirm that `/sponsor?email=` has the same account-selection and signed
      token issue as Globle.
- [ ] Port the `globle-solid` `/answer` availability guard, method restriction,
      no-store response, browser-time-zone request, and tests to `globle-capitals`.
- [ ] Remove Capitals client/server logging of answer indexes, ciphertext,
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

- A player can read and change only their own account.
- Protected gateway routes cannot be called directly by an unauthenticated
  browser, script, or alternate origin.
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

## Phase 0: immediate containment and evidence preservation

Target: same day.

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
- [ ] **MEAT PROXY** — Review and accept the local-midnight/time-zone behavior,
      including the narrow adjacent-date limitation described below.
- [ ] **MEAT PROXY** — Approve and deploy the `globle-solid` containment.
- [ ] **MEAT PROXY** — Verify production returns `200` for the currently
      playable date and rejects unavailable scheduled dates.

#### `globle-capitals`

- [ ] Port every checked `globle-solid` answer-containment item above to the
      Capitals implementation.
- [ ] Add Capitals tests for current, past, future, malformed-date,
      invalid-time-zone, cache, and unsupported-method behavior.
- [ ] Remove verbose client logs that expose response bodies and decrypted
      capital records.
- [ ] Remove server logs that expose answer indexes or encryption-key metadata.
- [ ] **MEAT PROXY** — Review the Capitals behavior and approve deployment.
- [ ] **MEAT PROXY** — Verify the deployed Capitals endpoint rejects
      unavailable scheduled dates.

The time-zone guard preserves existing local-midnight behavior. A caller can
claim a different valid time zone, so the containment can expose an adjacent
calendar date when that date is genuinely live elsewhere in the world. It
limits enumeration to currently live dates instead of the entire future
schedule. A single official rollover time would remove even that narrow window
but would change current player-facing behavior in both games.

### Account containment

- [ ] **MEAT PROXY** — Choose one temporary containment option:
  1. Preferred: disable `PUT`, `POST`, and `DELETE` on `/account` and disable
     writes to `/dailyStats` while keeping local browser statistics working.
  2. Put protected gateway and proxy routes behind a short-lived Cloudflare
     Access policy for staff only, temporarily pausing player sync.
  3. Minimum only: disable account deletion, reduce the 50,000/hour rate limit,
     and alert on one source accessing multiple emails. This reduces abuse but
     does not fix unauthorized access.
- [ ] Implement the selected temporary behavior consistently in
      `globle-solid`, `globle-capitals`, and `mongo-gateway-globle`.
- [ ] Add a temporary account-sync notice in both game clients if sync is
      paused.
- [ ] Add tests proving disabled methods cannot reach the gateway or database.
- [ ] **MEAT PROXY** — Configure any required Cloudflare Access policy, route
      setting, or temporary production environment flag.
- [ ] **MEAT PROXY** — Approve and deploy temporary containment to all three
      services.

### Incident review

- [ ] **MEAT PROXY** — Preserve Cloudflare and Deno request logs before their
      retention windows expire.
- [ ] **MEAT PROXY** — Provide or authorize access to production logs for the
      investigation.
- [ ] Identify requests to `/account`, `/dailyStats`, `/twlAccount`,
      `/teachers`, and `/sponsor` involving many distinct emails from one source.
- [ ] Review successful account `PUT` and `DELETE` operations and unusual
      changes in `gamesWon`, streaks, `usedGuesses`, and `lastWin`.
- [ ] Review daily documents that changed repeatedly or contain impossible
      dates, answers, or guess sequences.
- [ ] **MEAT PROXY** — Confirm what database backup and point-in-time recovery
      facilities are available.
- [ ] Determine which corrupted records, if any, can be restored.
- [ ] **MEAT PROXY** — Approve any production restoration or data correction
      before it runs.
- [ ] **MEAT PROXY** — Record the disclosure timeline, communication with the
      reporter, deployed commits, and log-retention limits.
- [ ] **MEAT PROXY** — Do not ask the reporter to perform mutations against
      production; coordinate any additional validation privately.

## Phase 1: establish real user authentication

Target: begin immediately; deploy before re-enabling unrestricted account
writes.

### Architecture decisions

- [ ] **MEAT PROXY** — Approve server-verified sessions as the authentication
      direction for both Globle and Globle Capitals.
- [ ] **MEAT PROXY** — Choose session idle and absolute expiry periods.
- [ ] **MEAT PROXY** — Confirm whether users may link both Google and Discord to
      one TWL account.
- [ ] **MEAT PROXY** — Decide whether account deletion requires a fresh provider
      login and what confirmation UI is acceptable.

### Verified session implementation

- [ ] Verify Google credential signature, issuer, audience/client ID, expiry,
      nonce/state, and `email_verified` in a server-side endpoint.
- [ ] Exchange Discord OAuth codes server-side and obtain identity from
      Discord's API rather than trusting callback query parameters.
- [ ] Resolve or create the canonical TWL account using the provider's stable
      issuer and subject identifiers.
- [ ] Use `twlId` as the internal account identity; treat normalized email as a
      changeable attribute.
- [ ] Issue an opaque session identifier in a `Secure`, `HttpOnly`,
      `SameSite=Lax`, `Path=/`, `__Host-` cookie.
- [ ] Store only a hash of the session identifier server-side with provider,
      creation time, last-used time, idle expiry, absolute expiry, and revocation
      state.
- [ ] Add session rotation, logout, revocation, and expired-session cleanup.
- [ ] Add per-session CSRF protection to state-changing cookie-authenticated
      requests and verify `Origin` as an additional signal.
- [ ] Derive account ID and email from the verified session on every protected
      request; ignore or reject client-supplied identity fields.
- [ ] Update both games' Google and Discord flows to establish the new session.
- [ ] Update both games' account, daily-stat, subscription, teacher-status, and
      sponsor calls to use the session-bound same-origin API.
- [ ] Remove direct browser-to-gateway calls from `globle-capitals`.
- [ ] **MEAT PROXY** — Create or verify production Google and Discord OAuth
      configuration, callback URLs, client IDs, and secrets for both game origins.
- [ ] **MEAT PROXY** — Store provider and session secrets in the appropriate
      Cloudflare/Deno production secret stores.

### Cloudflare-to-gateway authentication

The signed canonical request should contain:

- authenticated `twlId`
- normalized email only while a legacy database lookup still requires it
- stable game ID
- HTTP method and canonical path
- SHA-256 digest of the body
- issued-at timestamp, short expiry, and unique nonce/request ID
- signing key ID

Implementation checklist:

- [ ] Define one versioned canonical request format shared by both game proxies
      and the gateway.
- [ ] Sign internal requests with an HMAC key stored only in Cloudflare and
      Deno deployment secrets.
- [ ] Verify signature, timestamp, body digest, game binding, key ID, and replay
      nonce at the gateway before routing.
- [ ] Reject unsigned, expired, replayed, body-modified, identity-modified, and
      wrong-game requests.
- [ ] Strip browser-provided internal authentication headers before constructing
      the signed request.
- [ ] Add short-overlap key rotation support.
- [ ] Add audit mode that reports would-be signature failures without initially
      blocking legitimate traffic.
- [ ] **MEAT PROXY** — Generate the production signing key using an approved
      secret-management method.
- [ ] **MEAT PROXY** — Install the signing key and key ID in all relevant
      Cloudflare Pages projects and the Deno gateway.
- [ ] **MEAT PROXY** — Decide whether to retain HMAC signing long term or migrate
      to Cloudflare Access service tokens/private service networking.

### Account-provider data migration

- [ ] Add a provider identity collection keyed by `(issuer, subject)` with a
      unique index.
- [ ] Implement one-time linking of existing records after a verified email
      match.
- [ ] Record completed migration and stop repeated email auto-linking once a
      verified provider identity exists.
- [ ] Implement conflict reporting rather than automatically merging ambiguous
      accounts.
- [ ] Keep Google and Discord identities separately linkable to one TWL account
      if the approved product decision permits it.
- [ ] Remove the public `fake` login method from production and restrict any
      replacement to isolated tests.
- [ ] Build a dry-run migration report containing counts and conflicts without
      exposing raw emails in normal logs.
- [ ] **MEAT PROXY** — Define the account-recovery policy for changed provider
      emails, lost providers, and identity conflicts.
- [ ] **MEAT PROXY** — Review the dry-run report and approve the production
      migration.
- [ ] **MEAT PROXY** — Approve rollback or manual resolution for each ambiguous
      account class.

## Phase 2: enforce object-level authorization on every route

Target: deploy with Phase 1 or immediately afterward.

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

- [ ] Protect every account method with verified identity and load records by
      authenticated `twlId`.
- [ ] Replace public account creation with authenticated account initialization.
- [ ] Replace broad account-stat replacement with narrowly scoped operations.
- [ ] Require recent reauthentication and explicit confirmation for account
      deletion.
- [ ] Derive daily-stat identity and allowed puzzle date from authenticated
      server state.
- [ ] Make `/twlAccount` internal-only and return a purpose-specific DTO.
- [ ] Make `/teachers` internal-only or self-only and return only capability
      booleans.
- [ ] Bind `/sponsor` to the authenticated `twlId`; never accept a target email
      and never log signed sponsor tokens.
- [ ] Protect account-linked subscriptions with a session or require explicit
      email verification for standalone newsletter subscriptions.
- [ ] Return `401` without a valid session and `403` when an authenticated
      principal lacks permission.
- [ ] Stop revealing whether another email has an account.
- [ ] Remove `_id`, `twlId`, provider metadata, login methods, subscription
      details, and other internal fields from general account responses unless a
      reviewed UI requirement needs them.
- [ ] Apply method allowlists at both games' Cloudflare layers and the gateway.
- [ ] Replace permissive Zod `.passthrough()` schemas on protected writes with
      strict schemas.
- [ ] Apply equivalent client and proxy changes to both `globle-solid` and
      `globle-capitals`.
- [ ] **MEAT PROXY** — Approve the minimal account, teacher, subscription, and
      sponsor response fields needed by each game's UI.

## Phase 3: redesign statistics writes

Target: after authenticated account access is stable.

- [ ] **MEAT PROXY** — Choose and document one statistics trust model:
  1. Casual, user-owned statistics: authenticate ownership, but allow players to
     sync and therefore forge their own totals.
  2. Trusted statistics: validate attempts and guesses server-side and derive
     aggregates from server-held events.

### Option A: casual, user-owned statistics

Complete these only if Option A is selected:

- [ ] Authenticate ownership while allowing each player to sync only their own
      statistics.
- [ ] Use a strict schema with maximum array and body sizes.
- [ ] Reject negative values, invalid dates, and unreasonable jumps.
- [ ] Add a version number and optimistic concurrency to prevent stale clients
      from overwriting newer data.
- [ ] Keep an append-only audit record or short history for recovery.
- [ ] Make daily writes idempotent with a unique
      `(twlId, gameId, puzzleDate)` key.
- [ ] Update both games to handle version conflicts and safe retries.

### Option B: trusted statistics

Complete these only if Option B is selected:

- [ ] Stop accepting aggregate totals from the browser.
- [ ] Create a server-side game attempt for the authenticated player and puzzle.
- [ ] Submit guesses to the server and have it determine correctness and
      proximity without returning the answer.
- [ ] Append validated guess and completion events.
- [ ] Derive games won, streaks, and guess distributions from those events.
- [ ] Make completion idempotent and reject attempts for closed puzzle dates.
- [ ] Retain enough event history to recompute aggregates.
- [ ] Implement the model for both country and capital answer datasets.

Option A prevents one player corrupting another player's data, but a player can
still forge their own totals. Option B also supplies the long-term fix for
same-day answer recovery and is a larger architectural change.

## Phase 4: answer architecture follow-up

- [ ] **MEAT PROXY** — Choose one long-term answer model for both games:
  1. Keep the casual client-side model, remove AES, and explicitly accept that
     the currently playable answer can be inspected. Continue serving only
     currently available dates.
  2. Move guess evaluation to the server so the browser never receives the
     answer before completion.
- [ ] **MEAT PROXY** — Decide whether both games retain local-midnight rollover
      or adopt one worldwide rollover time.
- [ ] If adopting worldwide rollover, define the official IANA time zone or UTC
      boundary and update answer selection, client countdowns, stored puzzle dates,
      and streak rules in both games.
- [ ] If keeping local rollover, document that a caller may claim another time
      zone and access an adjacent date already live elsewhere.
- [ ] If keeping client-side gameplay, remove AES and its key-management code so
      it is not presented as a security control.
- [ ] If adopting server-side gameplay, implement country and capital guess
      evaluation without returning answers before completion.
- [ ] **MEAT PROXY** — Approve player-facing communication for any rollover or
      gameplay behavior change.

Rotating `CRYPTO_KEY` without changing the architecture is not a security fix;
the replacement key would be published in the next client bundle.

## Phase 5: logging, monitoring, and operational hardening

- [ ] Remove logging of credentials, session cookies, internal signatures,
      ciphertext, answer indexes, decrypted answers, encryption-key metadata,
      sponsor JWTs, and complete account documents across all three repositories.
- [ ] Continue masking emails and add stable keyed hashes where abuse
      correlation is necessary.
- [ ] Log authenticated account ID, stable game ID, route, method, outcome,
      request ID, and coarse source metadata.
- [ ] Alert on repeated authorization failures, signature failures, replay
      attempts, multi-account access, unusual deletion volume, and large statistics
      changes.
- [ ] Reduce rate limits to route-appropriate values and key them by both
      session and source IP.
- [ ] Add database constraints and indexes for provider subjects, canonical
      account IDs, and per-day statistics uniqueness.
- [ ] Add automated backup verification and a documented restoration procedure.
- [ ] Reconcile `mongo-gateway-globle/SECURITY.md` with the implementation; it
      currently claims JWT verification exists while newer code states it was
      removed.
- [ ] Add a private security contact and coordinated-disclosure policy with
      response targets to all relevant public properties.
- [ ] **MEAT PROXY** — Choose production alert destinations and responsible
      responders.
- [ ] **MEAT PROXY** — Configure production log retention, monitoring, and alert
      integrations.
- [ ] **MEAT PROXY** — Confirm backup retention and recovery objectives.
- [ ] **MEAT PROXY** — Publish or approve the security contact and disclosure
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

### Internal request-signing tests

- [ ] Accept valid signatures from both game identities.
- [ ] Reject changed method, path, game ID, identity, or body.
- [ ] Reject expired timestamps and replayed nonces.
- [ ] Reject retired or unknown key IDs.
- [ ] Verify browser-provided internal headers are stripped.

### Statistics tests

- [ ] Write daily stats only for the authenticated account.
- [ ] Reject invalid dates, oversized guess lists, extra fields, and impossible
      values.
- [ ] Make duplicate requests idempotent.
- [ ] Prevent concurrent writes from silently losing newer data.
- [ ] Exercise account recovery from audit history or backup.
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
- [ ] `globle-capitals`: add and pass the equivalent current/past/future/input/
      method tests.
- [ ] `globle-capitals`: verify answer material and key metadata are absent from
      client and server logs.
- [ ] Add production smoke tests for both games that never request or reveal an
      unavailable answer value.

## Deployment sequence

- [ ] **MEAT PROXY** — Review the time-zone limitation and approve the
      `globle-solid` answer deployment.
- [ ] **MEAT PROXY** — Deploy and smoke-test `globle-solid` answer containment.
- [ ] Implement and locally verify the same containment in `globle-capitals`.
- [ ] **MEAT PROXY** — Approve, deploy, and smoke-test the Capitals containment.
- [ ] **MEAT PROXY** — Preserve production logs and choose temporary account
      containment.
- [ ] Implement and locally verify temporary containment in both clients and the
      gateway.
- [ ] **MEAT PROXY** — Deploy temporary containment to both games and the
      gateway.
- [ ] Implement provider verification and session creation without changing
      existing reads; prepare staff-account tests.
- [ ] **MEAT PROXY** — Configure production OAuth credentials/secrets, deploy
      the session path, and run staff-account acceptance tests.
- [ ] Implement signed Cloudflare-to-gateway requests and gateway verification
      in audit mode.
- [ ] **MEAT PROXY** — Install signing secrets, deploy audit mode, and confirm
      legitimate Globle and Capitals traffic signs correctly.
- [ ] Implement enforcement for reads and then writes; remove query-email
      compatibility paths.
- [ ] **MEAT PROXY** — Approve and deploy signature/session enforcement.
- [ ] Build and dry-run Google/Discord account-link migration.
- [ ] **MEAT PROXY** — Review conflicts and approve production migration.
- [ ] Lock down `/twlAccount`, `/teachers`, `/sponsor`, and `/subscribe` in code
      and tests.
- [ ] **MEAT PROXY** — Deploy adjacent-route lockdown and verify both games.
- [ ] Implement the selected statistics trust model.
- [ ] **MEAT PROXY** — Approve re-enabling account writes and deploy the selected
      statistics model.
- [ ] Remove compatibility code, old secrets, token logging, and stale security
      documentation.
- [ ] **MEAT PROXY** — Revoke retired production secrets and approve final
      cleanup deployment.
- [ ] **MEAT PROXY** — Commission or complete an independent authorization
      review before declaring remediation complete.

Use feature flags only to stage migration, not to leave unauthenticated fallback
paths available indefinitely.

- [ ] **MEAT PROXY** — Set a firm removal date for every compatibility path.

## Completion criteria

- [ ] No protected route accepts a client-selected target email or account ID.
- [ ] Every protected gateway request carries a verified, replay-resistant
      internal identity assertion.
- [ ] Cross-account read, write, and delete tests pass in CI for both games.
- [ ] Direct browser-to-gateway access is removed from Capitals protected flows.
- [ ] Daily statistics have a documented trust model and strict schema.
- [ ] Sponsor and subscription capabilities are bound to the authenticated
      account in both games.
- [ ] Future puzzle schedules cannot be enumerated in either game.
- [ ] Sensitive tokens and answer material are absent from application logs.
- [ ] Operational documentation matches deployed behavior.
- [ ] Relevant logs have been reviewed and any corrupted records have a
      restoration decision.
- [ ] **MEAT PROXY** — Accept the residual security risks and sign off that the
      remediation is complete.
