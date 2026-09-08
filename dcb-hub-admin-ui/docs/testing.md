# E2E testing (Playwright)

`e2e/` holds Playwright specs covering core application flows. This replaced the old `cypress/` suite, which had gone stale during the Next.js → Vite migration (its `login` command depended on `next-auth`'s session-cookie format, which no longer matches the app's current `react-oidc-context`/Keycloak auth).

## Running

```bash
npm run e2e       # headless run
npm run e2e:ui     # interactive UI mode
```

`playwright.config.ts`'s `webServer` runs `npm run build && npm run preview` before tests start (production-equivalent build, not the dev server) and reuses an already-running preview server locally (`reuseExistingServer: !process.env.CI`).

## Auth: seeding a session instead of driving real Keycloak

The app reads its OIDC session via `oidc-client-ts`'s `WebStorageStateStore`, which stores a serialized `User` object in `localStorage` under the key `oidc.user:<VITE_KEYCLOAK_URL>:<VITE_KEYCLOAK_ID>` (see `src/main.tsx`). Rather than driving a real Keycloak login flow, `e2e/fixtures/auth.ts`'s `seedAuth(page)` seeds that key directly via `page.addInitScript()` before the app's own scripts run, so `react-oidc-context`'s `useAuth()` sees an already-authenticated session on first render. `.env.e2e` is the single source of truth for the `VITE_KEYCLOAK_URL`/`VITE_KEYCLOAK_ID` values baked into both the test build (via `playwright.config.ts`'s `webServer.env`) and the seeded storage key — they have to match exactly, or the app won't find the seeded session.

The seeded user's `expires_at` is set ~1 year in the future so `automaticSilentRenew` never schedules a renewal attempt against the fake (`.invalid` TLD, guaranteed non-resolving) Keycloak URL during a test run.

```ts
import { seedAuth, ADMIN_ROLES, READ_ONLY_ROLES } from "./fixtures/auth";

test.beforeEach(async ({ page }) => {
	await seedAuth(page); // defaults to ADMIN_ROLES
	// or: await seedAuth(page, { roles: READ_ONLY_ROLES });
});
```

Omit `seedAuth` entirely in a test to exercise the unauthenticated/login-redirect path.

## Mocking GraphQL

All GraphQL traffic goes through a single `POST {VITE_DCB_API_BASE}/graphql` endpoint. `e2e/fixtures/graphql-mocks.ts`'s `mockGraphQL(page, mocks)` registers one `page.route` handler that inspects each request's `operationName` (matching graphql-request's request shape) and fulfills with the corresponding fixture:

```ts
import { mockGraphQL } from "./fixtures/graphql-mocks";
import libraries from "./fixtures-data/libraries.json";

await mockGraphQL(page, {
	LoadLibraries: libraries,
	LoadConsortiumHeader: consortiumBasics, // Header.tsx fires this on every authenticated page
});
```

Any operation not listed falls through to `route.continue()` (a real network request against the fake `.invalid` API base), so an unmocked query fails loudly and visibly rather than hanging silently.

## What's covered

- `auth.spec.ts` — unauthenticated redirect to `/login` (with the intended destination preserved via `?redirect=`), seeded-auth session landing on the authenticated home page.
- `sidebar.spec.ts` — nav items render, active-page `aria-current`/`aria-disabled` state, click-through navigation, collapsed state persisting across reload without a remount flash.
- `libraries-list.spec.ts` — grid loads mocked rows, the filter panel opens, row click navigates to detail.
- `library-detail.spec.ts` — detail fields render from the mocked query, tab navigation between sub-pages.
- `new-library.spec.ts` — the New Library wizard's mode-selection step, required-field validation blocking progression, cancel.
- `dcb-ncip-onboarding.spec.ts` — admin-only access, failed-readiness blocking, policy review, invitation issuance and token disposal after navigation.
- `session-expiry.spec.ts` — a 401 GraphQL response redirects to `/logout?reason=session_expired` and actually clears the stored OIDC session (regression test for the `localStorage`/`sessionStorage` mismatch fixed in `src/main.tsx`).

Not covered: the real 15-minute idle-timeout path (`src/routes/__authenticated.tsx`, via `react-idle-timer`) isn't practically testable without either mocking the timer library's internals or making the timeout configurable for tests — `session-expiry.spec.ts` covers the other route into the same "session ended" state (a 401) instead.

## DCB NCIP onboarding manual pass

Confirm invitation review shows the default authentication profile and allowed profile set, and that
the issued request carries both values.

Use a disposable ORS Appliance and invitation. Never paste tokens into notes or logs.

1. As a non-admin, confirm **DCB NCIP Onboarding** is absent from **Service info** and direct navigation to `/serviceInfo/dcbNcipOnboarding` redirects.
2. As `ADMIN`, open the page. Confirm failed readiness checks give safe remediation without URLs containing credentials or key material, and invitation controls stay hidden.
3. Complete the DCB deployment configuration, refresh, and confirm every check passes and the advertised DCB base URL is correct.
4. Confirm policy validation requires Host LMS code, Agency code, expected symbol, borrowing or supplying, and supplying when ingest is enabled.
5. Review the policy, issue once, and confirm the base URL, token and expiry countdown appear. Refresh or leave the page and confirm the token is gone.
6. In ORS **Integrations → Connect to DCB**, validate without consuming the token, then explicitly redeem it. Confirm membership is active immediately.
7. Confirm DCB created the expected HostLMS, Agency, Library and selected Locations, and reciprocal NCIP/JWT calls succeed.
8. Let another invitation expire and confirm it cannot be copied or redeemed; issue a replacement.

---

# The gates

A gate here is a check that fails a build. This section records what each one exists for and,
where it applies, what it actually caught — because a guard never seen to fail is not a
guard, and knowing which ones have earned their keep is how you decide what to trust.

## Running them

```bash
npx tsc --noEmit                     # types
npm run lint -- --max-warnings=0     # a warning is broken code
npx vitest run                       # NOT `npm run test`, which is watch mode
npx playwright test                  # both viewport projects
npm run e2e:base-path                # the app mounted at /dcb-admin, port 4203
npm run e2e:ki-bootstrap             # the bootloader artefact
npm run lighthouse                   # the payload budget
```

Read the **exit code**, not a grep of the output. Playwright's reporter writes ANSI escapes,
and a `grep -c failed` over it has already reported a suite with 25 failures as green once
during this project.

## Parallelism, and why `workers` is pinned

`playwright.config.ts` sets `workers: 4` against a default that gave 16 on a 32-thread
machine. All of them drive their own Chromium against **one** `vite preview` serving an
application that boots its whole router before it paints. The server and the CPU both
saturate and correct assertions fail with `element(s) not found`.

Measured on unmodified `main`, full suite:

```
16 workers   21 failed / 108 passed   1.8 min
 4 workers    0 failed / 129 passed   2.0 min
```

Twelve seconds, for the difference between a suite that is evidence and one that is noise.
`expect.timeout` is 10s for the same reason. **Neither is a retry** — `retries: 2` in CI
already hides this, which is why it went unnoticed there, and a retry that masks contention
masks a real regression just as readily.

If a run fails en masse with `ERR_CONNECTION_REFUSED` on 4173, look for an orphaned preview
server before reading a single assertion: `--strictPort` correctly refuses to start when one
still holds the port, and the result reads as a catastrophic regression.

## What each gate is for

| Gate                                                                   | Guards                                                                                                                            | Has it caught something?                                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `themes/openRS.contrast.test.ts`                                       | every token pairing, 18 brand × mode combinations, at AA or AAA; the tab indicator at the non-text 3:1; hover and pressed grounds | **Yes, repeatedly.** An invisible Koha tab indicator (1.00:1); two brands whose pressed header state fell under AA |
| `themes/display.test.ts`                                               | text size actually moves the scale; a typography variant returning to px                                                          | Yes — it is the guard that makes the px→rem conversion permanent                                                   |
| `e2e/accessibility.spec.ts`                                            | axe over every unavoidable route, light/dark/high-contrast, plus the 8.71.0 surface                                               | Yes — six controls with no accessible name, before this work                                                       |
| `scanForLandmarks` (same file)                                         | `landmark-one-main`, `region`, `bypass` — rules the WCAG tag list **cannot see**, because axe tags them `best-practice`           | **Yes.** No `<main>` on any route, no `<footer>`, 15 tab stops to reach page content                               |
| `expectNoHorizontalScroll` in `fixtures/axe.ts` + the `narrow` project | WCAG 1.4.10 reflow at 320px. axe cannot see reflow at all                                                                         | **Yes, on its first run.** Two visually-hidden elements 100% wide, and a serious `scrollable-region-focusable`     |
| `e2e/forced-colors.spec.ts`                                            | Windows High Contrast Mode                                                                                                        | **Yes.** Contained buttons with no boundary at all                                                                 |
| `e2e/display-preferences.spec.ts`                                      | that preferences reach the rendered page, read from computed styles                                                               | Yes — this class of feature fails by changing a theme value nothing reads                                          |
| `e2e/system-preferences.spec.ts`                                       | `prefers-contrast` and `prefers-color-scheme` reaching the theme                                                                  | Written after the fact for a claim that had no end-to-end evidence                                                 |
| `helpers/chunkReload.test.ts`                                          | the single reload, and the refusal to loop                                                                                        | The loop is the failure it exists to prevent                                                                       |
| `helpers/nginxConfig.test.ts`                                          | every nginx `location` re-includes the security headers                                                                           | Verified failing against the exact regression (a new location with its own `Cache-Control`)                        |
| `components/tabsAreLinks.test.ts`                                      | navigating tabs are anchors, across all six bars                                                                                  | Source-level; the e2e suite proves three of the six                                                                |
| `e2e-base-path/navigation.spec.ts`                                     | the app mounted at `/dcb-admin`, which is how it ships and the one configuration every other spec does not run                    | Verified failing against a root build and against a root-absolute `inject_env.json` fetch                          |
| the co-hosting block in the same file                                  | storage namespaced by the base rather than as `root`; `inject_env.json` fetched under the base                                    | Verified failing against a root-absolute fetch — the sibling app's config sits at the origin root                  |
| `npm run lighthouse`                                                   | the payload budget, 750,000 B                                                                                                     | Yes — but see the caveat below                                                                                     |

## Guards on the guards

Several gates assert that their own setup took effect. These are not ceremony; each replaced
a silent false pass.

- `expectPaintedScheme` — a "passing" dark run could otherwise be a second light run.
- The first test in `forced-colors.spec.ts` — `test.use({ forcedColors: "active" })` at file
  scope **silently does not take**. The option is accepted, the run is green, and
  `matchMedia` reports false inside the page. `page.emulateMedia` in a `beforeEach` works.
  Two tests "passed" against an ordinary render before this guard existed.
- `tabsAreLinks.test.ts` asserts it found at least six tab bars, and that every entry in its
  allow-list still exists. A glob matching nothing passes everything.

## What the gates do not reach

**Everything they measure is `vite preview` or a mocked page.** Nothing renders the
container, and two real defects lived in exactly that gap:

- the image served **1,576 KB uncompressed** where the budget approved 665 KB, because the
  budget audits a preview server that compresses and Cloudflare compresses at the edge;
- the Content Security Policy blocked **40 font loads per session**, which the config test
  and `curl` both missed — a CSP failure is not a failed request and not an exception.

Both were found by building the image and driving it in a browser. **A CI step that does
that, and fails on any `securitypolicyviolation`, is the highest-value gate still missing.**

Also not covered: real Keycloak flows (silent renewal, session expiry, logout) are mocked
throughout, and the CSP's `frame-ancestors 'self'` was reasoned from the code rather than
exercised against a live identity provider.
