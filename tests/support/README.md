# Isolated test suites

## Table of contents

- [Run the suites](#run-the-suites)
- [Isolation and coverage](#isolation-and-coverage)

## Run the suites

Run `pnpm exec vitest run` followed by `pnpm exec playwright test` from this checkout.
Both commands accept native file/name selections. The puzzle-date Playwright config
uses the same harness. Browser tests require the installed Playwright Chromium.

## Isolation and coverage

Vitest includes unit, security and harness checks, ignores dotenv files and rejects
unmocked fetch calls. Playwright starts a dedicated loopback Vite server with an
empty inherited environment, a synthetic encryption key and its own port. It does
not reuse an already running server. Browser fixtures block external requests and
service workers; server-side fetch is replaced by a closed list of synthetic
responses. Unknown outbound requests are recorded and fail browser fixture teardown.

The real answer, account, daily-stat and membership HTTP handlers execute locally.
Only their external gateway/vendor dependencies are substituted. Membership tests
use reserved example.test identities. These tests verify UI and HTTP behavior;
the gateway fixture is not evidence of real database persistence or vendor access.
No production credentials, databases or account state are required.
