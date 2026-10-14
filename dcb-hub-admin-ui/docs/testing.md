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

### An unmocked operation is not a neutral default

It fails loudly only when the page depends on it. An operation wrapped in
`nonCriticalQuery` fails quietly: the page renders, and the gate measures a state no
user reaches. `LoadLocationForPRGrid` (the pickup-location lookup every patron request
grid fires per page) and `LoadAuditIncidence` (the audit explorer's incidence chart)
were unmocked, so both returned 404 on every gate run: seven patron request routes, two
group request routes and `/serviceInfo/auditExplorer`. The axe scan, the
missing-translation scan and route-health all measured a pickup-location column showing
its fallback and a chart that never rendered. `LoadHostLmsCodes` 404'd the same way and
did take its page down. Both are now in `MOCKS` in `e2e/fixtures/routes.ts`.

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

All of them, in one command:

```bash
npm run gates                        # every gate below, in order, with a summary table
npm run gates -- --skip=lighthouse   # ... without the slow, CPU-bound one
npm run gates -- --only=types,lint,unit
npm run gates -- --bail              # stop at the first failure
```

It exits 0 only if every gate it ran passed, 1 if any failed, and **2 without running
anything** if a port is still held — see below. Individually:

```bash
npx tsc --noEmit                     # types
npm run lint -- --max-warnings=0     # a warning is broken code
npx vitest run                       # NOT `npm run test`, which is watch mode
npm audit --omit=dev --audit-level=high
npm run build && npm run budget      # the per-chunk byte budget
npx playwright test                  # both viewport projects, port 4173
npm run e2e:base-path                # the app mounted at /dcb-admin, port 4203
npm run e2e:ki-bootstrap             # the bootloader artefact, port 4183
npm run e2e:container                # the production image in a browser, port 4213
npm run lighthouse                   # the payload budget, port 4193
```

### The requesting journeys

`StaffRequest`, `ExpeditedCheckout`, `QuickWalkUp` and `CombinedRequestingModal` are the
only write path into patron requests from this application, and the only place a patron
barcode is handled. They had no test of any kind until `e2e/requesting.spec.ts` and
`e2e/requesting-checkout.spec.ts`.

All three forms share `PatronValidationStep`, and each arrives at it differently:

| Form               | Entry                                                                                                                     | Steps                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Staff request      | the cluster type picker, first option                                                                                     | patron, request           |
| Expedited checkout | the cluster type picker, second option                                                                                    | patron, request, checkout |
| Quick walk-up      | NOT in the picker - it has no cluster context, so it arrives with `initialRequestType` set, from `/search` or an item row | patron, item, checkout    |

**Writing the first of these found a defect.** `PatronValidationStep` disables its Validate
button on `!agencyCode`, and `StaffRequest` passed `auth.user.profile.code` - the staff
member's own agency - where its two siblings pass the watched form field. The button stayed
disabled for any account whose token carries no `code`, whatever affiliated institution was
picked, and a consortium administrator is not affiliated with one.

#### Asserting that a barcode is NOT logged

The obvious two ways both pass against a leaking form, which is worse than having no test:

- `message.text()` renders an object argument as `JSHandle@error`, so a text assertion
  cannot see a barcode inside the object - and inside the object is exactly where it was.
- `arg.jsonValue()` on an `Error` returns nothing useful, because Error own properties are
  not enumerable; resolving it is also asynchronous, so the assertion can run first.

Wrapping `console.error` in an `addInitScript` and serializing its arguments in the page
sees what was actually passed. Verified failing against the leaking form, and the failure
output carried both `patronPrinciple` and the Bearer token. `axios` defines
`AxiosError.prototype.toJSON`, and the `config` it returns carries `data` - the request
body.

Each redaction test also asserts that something WAS logged, so it cannot pass by the
failure path never running.

### Valid YAML is not a valid pipeline

`.gitlab-ci.yml` parsing cleanly says nothing about whether GitLab will accept it. Several
constraints are checked when the pipeline is CREATED, so the file loads, `yaml.safe_load`
is happy, and the first push fails.

That happened on `expose_as`, which accepts only letters, digits, hyphens, underscores and
spaces:

```
jobs:verify_e2e:artifacts expose as can contain only letters, digits, '-', '_' and spaces
```

All five values added with the CI reporting work carried parentheses and one a comma.
Checking that the YAML parsed had been mistaken for checking that the config was valid -
the same substitution of a proxy for the thing itself that `docs/accessibility.md` records
under "Knowing what is covered".

`src/helpers/gitlabCiConfig.test.ts` now checks the charset, the 128-character limit, and
that `expose_as` only appears on a job that also keeps `artifacts:paths` - GitLab rejects
it otherwise, for a different reason with a different message. It reads the raw text rather
than parsing, so it needs no YAML dependency.

**It is not a substitute for a real lint.** `glab ci lint`, or the project
`/ci/lint` API endpoint, validates the whole schema and would have caught this without
anybody enumerating the rule. Neither is wired up here; that is the gate still missing for
CI configuration, and this test covers only the one rule that has actually bitten.

### The container gate

`npm run e2e:container` builds `docker/production/Dockerfile` and drives the running
image. It is the only gate that serves nginx's real headers, so it is the only one that
can see a missing `content-encoding`, a header that does not reach a location, or an
asset cached for the wrong length of time.

**The Content Security Policy itself is applied in every e2e test.** The shared fixture
(`e2e/fixtures/test.ts`) serves the application's documents with the policy read from
`docker/production/security-headers.conf`, and fails any test whose page reports a
violation - which is neither a failed request nor an exception, so nothing else sees
one. `e2e/content-security-policy.spec.ts` proves the collector fires. So a change to the
application that breaks the policy fails on every merge request, with no Docker.

It needs a Docker daemon. It removes its own container by name before starting, because
Playwright's teardown has been observed leaving one up, and a leftover container holds
4213 - at which point `reuseExistingServer` serves an image built from older code.

In CI, `verify_container` gets its daemon from a `docker:27-dind` service, which only runs
on a runner that permits privileged containers. Its script can start before dind is
listening - one run checked 4 seconds in and found nothing - so the job retries
`docker info` for about a minute before it fails, and then prints the daemon's own error:
an unreachable host, a refused connection and a missing privilege read differently there.

**Three defects on its first run, all of them invisible to every other gate:**

| Found                                          | Why nothing else could see it                                                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The production image could not be built at all | `.dockerignore` excluded `e2e/`, which two `src/` unit tests import fixture JSON from, and `npm run build` is `tsc && vite build`. Nothing built the image                                                          |
| `script-src <- eval` on every page load        | Zod 4 feature-detects its JIT with `Function("")`. It catches the refusal and falls back, so nothing breaks - but the browser still reports a violation. `z.config({ jitless: true })` is Zod's own switch for this |
| `/login` had no `h1`                           | It is not in `ROUTES` (it needs its own auth state), so route-health's one-h1 assertion never reached it                                                                                                            |

### Why `npm run gates` is sequential, and checks the ports first

**Every Playwright config's `webServer` builds, and all four builds write the same
`dist/`.** Two suites at once means one's build replaces the directory the other is
serving, which is a failure that reports numbers rather than an error. They also each
drive four Chromiums against one preview, and `workers: 4` is calibrated for exactly
that — see below.

And `reuseExistingServer` is on whenever `CI` is not set, so a preview left running by an
earlier run is not replaced, it is **used**: every result after that measures its frozen
`dist/` rather than your tree. The runner binds each port it will need before it starts
anything and refuses if one is held, because that failure otherwise looks like a passing
suite.

Exit codes, never output: Playwright's reporter writes ANSI escapes, and a `grep -c
failed` over it has already reported a suite with 25 failures as green once during this
project.

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

**In CI, the browser suites take turns.** `verify_e2e`, `verify_lighthouse`,
`verify_base_path`, `verify_ki_bootstrap` and `verify_container` share
`resource_group: browser-suites`, so GitLab runs one at a time. Each builds the application
and drives Chromium on the same `ki-onprem` runner, and `workers: 4` was measured on a
32-thread workstation, not there. Run together they produced the failure above as
retries: on 14 Oct 2026, `verify_e2e` reported three tests flaky on routes that are ready
in 0.5-1.0s locally, one of them timing out on `/serviceInfo/auditExplorer`'s static text,
which needs no network at all. Lighthouse's CPU-bound timings get a quiet machine for the
same reason. `verify_e2e` prints the runner's CPU count, cgroup CPU limit and memory first;
read those before changing `workers` for CI.

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
| `e2e/layout-shift.spec.ts`                                             | CLS on every route at 768x1024, at 0.10; see `docs/performance-budget.md`, "Layout shift on every route"                          | **Yes.** 21 route/viewport pairs over 0.05 on its first sweep, the worst at 0.3412                                 |
| `verify_supply_chain` (CI)                                             | `npm audit --omit=dev --audit-level=high`; see "The supply-chain gate" below                                                      | Started green: 0 findings on 2026-10-09                                                                            |
| `npm run lighthouse`                                                   | the payload budget, 750,000 B                                                                                                     | Yes — but see the caveat below                                                                                     |

## The supply-chain gate

A production dependency with a known high-severity advisory is a shipped defect, and
nothing was looking for one. `verify_supply_chain` runs `npm audit --omit=dev
--audit-level=high`. On 2026-10-09 that reported 0 vulnerabilities, so the job started
green rather than being switched off in its first week.

It audits **production dependencies only, at high severity and above**, deliberately.
The full audit over dev dependencies is dominated by transitive findings in build
tooling that never reaches a browser, and a gate that fires mostly on those is a gate
everybody routes around. Renovate (`renovate.json`) handles the ordinary upgrade
stream; this is the floor under it.

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

## Hooks are not the CI gates

`.husky/pre-commit` runs `lint-staged` on a developer's machine, over the files being
staged. It is a convenience, not a gate: the real checks are the `verify_*` jobs, which run
the whole suite over the whole tree. `.gitlab-ci.yml` therefore sets `HUSKY: "0"` for every
job.

That is not belt-and-braces, it is a fix. **The 2.0.0 release failed on it.** The release
job is the one job that makes a commit — `@semantic-release/git` writes `package.json`,
`CHANGELOG.md` and `release-info.json` — and husky ran `lint-staged` on that commit:

```
Error: ✖ lint-staged requires at least Git version 2.32.0.
  [cause]: 'git version 2.30.2'
husky - pre-commit script failed (code 1)
  pluginName: '@semantic-release/git'
```

`node:22.23.1-bullseye` ships git 2.30.2. semantic-release failed in `prepare`, so no tag
was pushed and nothing was half-released — but no release happened either.

It had never fired before because `.husky/pre-commit` was not on the `release` branch until
`main` was merged for 2.0.0. Husky's runner is `[ ! -f "$s" ] && exit 0`, so with no user
hook file the tracked shim is a no-op, and every release up to 1.58.1 committed happily.

**Do not fix this by bumping the image.** git 2.39 in bookworm would clear the version
check and hand you a quieter version of the same problem: `CHANGELOG.md` matches the
prettier glob in `.lintstagedrc.json`, so lint-staged would reformat, on every release, the
changelog semantic-release had generated seconds earlier — and the two would disagree
forever.

`HUSKY=0` is husky's own switch, honoured in both places it matters: `index.mjs` returns
early so `core.hooksPath` is never set, and the runner copied to `.husky/_/h` exits 0.
Verified against husky's own runner: the hook blocks a commit, and `HUSKY=0` skips it.

## A component test opts into a DOM

Vitest runs in the `node` environment by default, and all but five of the unit tests
want that: they are pure logic over helpers, constants and column definitions, and they
run in about eight seconds.

A test that renders a component needs a DOM, so it **opts in per file**:

```ts
// @vitest-environment jsdom
```

Setting `environment: "jsdom"` globally was rejected. It would change the environment
under 1,486 existing tests that were written and verified against `node`, for no benefit
to any of them - a large blast radius to buy nothing.

Three things follow from the opt-in:

- **jest-dom's matchers are registered globally** in `vitest.setup.ts`. The import only
  calls `expect.extend`, so it is harmless in `node`; a matcher nobody uses costs
  nothing. `types/testing-library.d.ts` is the matching reference for `tsc`, without
  which the component tests type-check red while passing.
- **Unmounting is explicit.** React Testing Library registers its own cleanup only when
  vitest's globals are on, and this repository imports `describe`/`it`/`expect`
  explicitly. So a component test calls `afterEach(cleanup)` itself.
- **MUI 9's `MenuItem` throws without a `MenuListContext`** - "MenuItems must be placed
  within Menu or MenuList". `GridToolbarExportContainer` supplies one through its
  `baseMenuList` slot, so a bare `MenuItem` is not a configuration the application ever
  renders; the test wraps in `MenuList` to match.

### What a DOM test is for, and what it is not

Playwright already asserts roles and accessible names in a real browser across 528
tests, which is stronger evidence than jsdom. The DOM tests exist for contracts that are
invisible in a diff and too small to justify a browser - the first of them pins which
export menu items close the menu, which `GridToolbarExportContainer` decides by cloning
children with a `hideMenu` callback rather than by wrapping their `onClick`.

**One of those five assertions was deleted for being unfalsifiable.** "Choosing a format
does not close the menu" can never fail, because `FormatMenuItem` does not destructure
`hideMenu` - the compiler holds that, not a test. A test that cannot fail is not a test,
and the fact now lives as a comment on the component.

---

## Coverage is a figure, not a gate

```bash
npm run coverage
```

Measured on 2026-10-07, over `src/**/*.{ts,tsx}`:

|            |                            |
| ---------- | -------------------------: |
| Statements | **23.85%** (1,890 / 7,922) |
| Branches   |     17.56% (1,152 / 6,557) |
| Functions  |       19.94% (528 / 2,647) |
| Lines      |     23.43% (1,726 / 7,364) |

**There is deliberately no threshold.** A number picked before anything was measured is
a number that gets lowered under pressure - the same ratchet the performance budget
warns about. Whether any of this becomes a gate is a decision to take against the
figure, not before it.

### `all: true` is load-bearing

Without it v8 reports only files a test actually loaded, so a module no test imports is
absent from the denominator rather than counted as 0%. The same run read **84.77%** of
statements that way, over 2,273 statements in a `src/` of about 90,000 lines - "coverage
of the code we already cover". The honest figure is a third of that. If this number ever
jumps without tests being written, check that `all` is still set.

---

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
