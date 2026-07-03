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
- `session-expiry.spec.ts` — a 401 GraphQL response redirects to `/logout?reason=session_expired` and actually clears the stored OIDC session (regression test for the `localStorage`/`sessionStorage` mismatch fixed in `src/main.tsx`).

Not covered: the real 15-minute idle-timeout path (`src/routes/__authenticated.tsx`, via `react-idle-timer`) isn't practically testable without either mocking the timer library's internals or making the timeout configurable for tests — `session-expiry.spec.ts` covers the other route into the same "session ended" state (a 401) instead.
