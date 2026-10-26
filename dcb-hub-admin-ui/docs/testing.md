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

### Preview ports

Several OpenRS front ends are developed side by side, and Playwright's
`reuseExistingServer`, on whenever `CI` is unset, does not start a server when something
already answers on its port: it uses that one. While every repo bound vite's default 4173,
a preview one repo left running served another repo's tests, and one suite ran against a
different application and redirected to its identity provider. So every gate has a port
of its own, `41<gate><repo>`:

| Repo                      | e2e  | bootloader | Lighthouse | base-path | container |
| ------------------------- | ---- | ---------- | ---------- | --------- | --------- |
| this one                  | 4173 | 4183       | 4193       | 4203      | 4213      |
| `dcb-admin-for-libraries` | 4174 | 4184       | 4194       | 4204      | -         |
| the discovery UI          | 4175 | 4185       | 4195       | -         | -         |

Every vite preview passes `--strictPort`. Without it vite does not fail on a taken port, it
moves to the next free one, which is a neighbour's, and the gate measures another
application: a failure that reports a number rather than an error. Lighthouse's own
preview, `scripts/preview-for-lighthouse.mjs`, fails on a taken port by itself.

## Where the pipeline runs

Every job runs on the `ki-onprem` runner and nothing else. The tag is set once, in
`default:`, and no job names another or opts out of the defaults.
`src/helpers/gitlabCiConfig.test.ts` fails if a job names any other runner, an empty tag
list, or `inherit:`, so a new job cannot quietly reach a different runner.

What the repository cannot enforce is which runners may take a job tagged `ki-onprem`. Keep
instance runners turned off for this project, in Settings > CI/CD > Runners, and register
the tag on no other runner.

`ki-onprem` bind-mounts the host's Docker socket into every container, so a `docker:dind`
service started with its defaults fails with "device or resource busy" and its daemon exits.
`verify_container` therefore gives dind a socket of its own, as `symposia-service` does.

The runner needs to reach:

- gitlab.com, for the API calls in `report`;
- the npm registry;
- Docker Hub, `mcr.microsoft.com` and `registry.gitlab.com` for job images, and Docker Hub
  for the image's base;
- `download.docker.com`, for the Docker client in `verify_container`;
- `harbor.k-int.com`, and the S3 and R2 buckets the deploys write to.

## What each pipeline runs

There is one pipeline per event. A push to a branch with an open merge request runs the
merge request's pipeline, not a second one beside it. Each job says which pipelines it
joins through the rule sets at the top of `.gitlab-ci.yml`:

- `quick` is every pipeline but a schedule.
- `gate` is a merge request, and `main` and `release` once a merge lands.
- `app` is `gate`, except that a merge request has to change something the app is built
  or tested from.

| Pipeline                                          | Runs                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A typical merge request, changing `src/`          | `verify_quality`, `verify_secrets`, `verify_supply_chain`, `verify_e2e`, `verify_lighthouse`, `verify_base_path`                           |
| A merge request changing only docs or Markdown    | `verify_quality`, `verify_secrets`, `verify_supply_chain`                                                                                  |
| ...that also changes the image's files            | adds `verify_container`                                                                                                                    |
| A push to a branch with no merge request          | `verify_quality`, `verify_secrets`                                                                                                         |
| `main`                                            | the merge request's checks, then `build`, the `:next` image and the dev deploys                                                            |
| `release`                                         | every check including `verify_container`, then the release report, the release, the versioned bundle, the image and the production deploys |
| The nightly schedule                              | `verify_supply_chain` and `nightly_flake_hunt`, below                                                                                      |
| Run by hand with `ON_DEMAND_REPORT` set to `true` | every check, including `verify_container`, then the release report. Nothing ships                                                          |

Nothing that ships runs unless every check before it passed, and nothing ships from a
scheduled pipeline. The release report runs only on `release` and on demand, below.

`src/helpers/ciChangePaths.test.ts` keeps the `app` path list whole. Every tracked file is
either on it or on a short list of files that cannot change what a browser gate tests:
docs, Markdown, the local hooks, and a few root files. A file on neither fails the test, so
a new kind of file cannot quietly skip the browser gates.

## Nightly

A scheduled pipeline on `main` runs two jobs and nothing else:

- **`verify_supply_chain`**, because an advisory can land against code nobody has
  changed. On a merge request it only sees advisories that exist when someone pushes.
- **`nightly_flake_hunt`**, the whole browser suite three times over with no retries. A
  test that passes only sometimes fails here, where the merge gate's `retries: 2` would
  have retried it into a pass. `FLAKE_REPEAT` sets the count. The job itself always
  succeeds, so the release report can fetch its results, and `nightly_flake_verdict`
  fails the pipeline when it found failures.

Nothing ships from a schedule, and the release report does not run. Every job that deploys
or publishes says `$CI_PIPELINE_SOURCE != "schedule"`. The container gate excludes
schedules too, because GitLab treats `changes` as true in a pipeline no push created.

**The schedule itself is set in GitLab, not in this file:** CI/CD > Schedules, target
branch `main`, once a night. A failed scheduled pipeline emails the schedule's owner, so
make the owner someone who will read it.

## The release report

`reports/release-report.html` says what every check in a pipeline found, for a reader who
does not read code. In order:

1. **A verdict**, and under it **Needs attention**: each thing a reader should act on, in a
   sentence. That covers a failed check, a statement due for review, and a VPAT or manual
   evaluation older than six months or naming an older version than the build. It also
   covers a missing licence declaration, a base image whose tag moves, an offered language
   that is incompletely translated, and tests that passed only on retry or failed in the
   last nightly flake hunt.
2. **Requirements**, with each one's Secure by Design principles and EN 301 549 clause.
3. **Compatibility**: the dcb-service schemas this build is checked against, and which
   release and environment variable each feature needs.
4. **What changed**: the conventional commits since the last release tag, and this
   build's figures against the last release's report.
5. **Accessibility**, page by page and criterion by criterion, with each criterion's
   EN 301 549 clause, the gaps the VPAT states, and how current it is.
6. **Security**: the headers the image sends, npm's advisory counts, the secret scan, the
   licences of what ships and of the product, and the image's base, digest and tags.
   Software bills of materials (SBOMs) are left out until the organisation's SBOM policy
   is agreed, and the report says so.
7. **Privacy**: the privacy tests, and the names of what the browser stores after a
   patron is validated. Names only: no value is ever recorded.
8. **Browser support**, then **languages**, with how complete each translation is.
9. **Speed**, then **test reliability**, then **every check** and any failed test.

The `report` job builds it after the verify stage, whether or not the checks passed, on
`release` and in a pipeline run on demand (below); a merge request does not make one. Job
artifacts expire, so `.releaserc.json` also attaches it to each GitLab Release, where it
stays, at the permanent path `release-report.html`. So
`/-/releases/permalink/latest/downloads/release-report.html` on the project always opens
the latest release's report, and `/-/releases/<tag>/downloads/release-report.html` a given
one. `src/helpers/releaseConfig.test.ts` fails if that path changes.

It reads what the checks leave in `reports/`:

- how each job ended, in `reports/status/`, written by `.records_status`;
- Playwright's JSON report and the JUnit files;
- `reports/bundle-budget.json`, written by `npm run budget`;
- `reports/npm-audit.json` and `reports/licences.json`, written by `verify_supply_chain`.
  The licence check, `scripts/check-licences.mjs`, is a gate there: a production library
  under a licence not on its allow-list fails it;
- `reports/image.json`, the base image's digest, written by `verify_container`;
- `gitleaks.sarif`, from `verify_secrets`;
- `.lighthouseci/`.

The `report` job also fetches two files with its job token, and goes on without either:
the last release's `release-report.json`, for the figures to compare with, and the last
nightly flake hunt's JUnit file. GitLab returns artifacts only from a job that succeeded,
so `nightly_flake_hunt` always succeeds and leaves a marker when tests failed.
`nightly_flake_verdict` then fails the nightly pipeline.

The rest it reads from the repository, through `scripts/report-facts.ts`. That covers the
capability registry, `docs/DCB_Admin_VPAT.md`, the security headers, the Dockerfile,
`LICENSE` and the locale files, plus the git history for what changed.
`src/helpers/reportFacts.test.ts` holds each reader to its source. The capability reader
is checked against the registry itself, so a change of format there fails a test rather
than the report.

To make one locally, run `npm run gates` and then `npm run report`. Without the status
files a local run reports every check as not run, but the accessibility, speed and test
sections are complete.

What it says comes from beside the checks themselves, so it changes when they do:

- **Each accessibility test** says what it checks, and which WCAG success criteria it is
  evidence for, through `covers()` in `e2e/fixtures/coverage.ts`. A page scan also names
  its page and its view: light, dark or high contrast. Phone width comes from the
  `narrow` project, which runs the same suite at 320px.
  `src/helpers/e2eCoverage.test.ts` fails when an accessibility test does not
  say what it covers, names a criterion WCAG does not have, or places a scan in a view the
  report has no column for.
- **Each axe scan** attaches every rule's outcome and the criteria the rule tests
  (`attachRuleOutcomes` in `e2e/fixtures/axe.ts`). That is how a criterion is reported as
  checked automatically. Rules axe could not decide are left out, because this gate
  asserts on violations alone.
- **Each pipeline check** is explained in `scripts/gates.json`.
  `src/helpers/gateCatalogue.test.ts` fails when a `verify_*` job has no entry.
- **A criterion nothing automated checks** is reported as assessed by hand, with the
  conformance `docs/DCB_Admin_VPAT.md` states for it. The report reads that from the
  VPAT's tables, so each row must open with its criterion in bold and give its
  conformance in the next cell.

The report shows evidence beside the VPAT's claim and never merges the two. Where they
disagree, the VPAT is out of date: update it, citing the test, as for 2.3.3 in October 2026.

### The report on demand

Every release pipeline makes the report and attaches it to the release. To make one at any
other time, for a bid, a customer or a PO review, run a pipeline by hand:

1. In GitLab, open Build > Pipelines and choose **Run pipeline**.
2. Choose the branch, or a release tag such as `v2.2.0`.
3. Set `ON_DEMAND_REPORT` to `true`. The form offers it with its description.
4. When the pipeline finishes, the `report` job's **Release report** artifact is the page.
   It expires after a month like any artifact, so press **Keep** on the job to keep it.

Such a run includes every check, including the container gate, and nothing that builds a
release, publishes an image or deploys.
`src/helpers/onDemandReport.test.ts` fails if a job that ships does not exclude it. On a
tag the report names the version. A tag made before this change carries the older pipeline
file, so it cannot be reported on this way.

Set the variable only on a pipeline you run by hand. Set as a project variable, it would
turn every pipeline into a report run, and nothing would ship.

`e2e/release-report.spec.ts` holds the report to WCAG 2.2 AA in both colour schemes,
because it is offered as accessibility evidence.

### The requirement catalogue

The report opens with **Requirements**: what this application is required to do, and the
evidence this pipeline produced for each. A tender question is answered from it, so it is
written for a buyer to read. The catalogue is `scripts/requirements.json`. Each entry has an
ID made of its area and a number (`PRIV-01`), the area, one sentence, and its evidence:

- `checks`: pipeline checks, by job name in `scripts/gates.json`;
- `e2e`: browser tests tagged through `proves()` in `e2e/fixtures/coverage.ts`, the way
  `covers()` tags accessibility tests;
- `unit`: unit tests, by file and `describe` block, read from the Vitest JUnit file;
- `accessibility`: the WCAG 2.2 AA section, which keeps its own criterion-by-criterion
  structure;
- `statement`: something assessed by hand, with the date it was last reviewed. After
  12 months the report says it is due for review;
- `standards`: reserved for the clause numbers of other standards a requirement answers.

A requirement **passes only when all of its automated evidence ran and passed**. If some ran
and passed and the rest did not run, as on a docs-only merge request, it is "partly run".
With no automated evidence, it is "assessed by hand", and never a pass.

`reports/release-report.json` holds the same results as data, and each GitLab Release
carries it beside the page. Anything that reads the results, such as a tender matrix or a
dashboard, should read that file, not the HTML.

Two tests keep the catalogue honest. `src/helpers/requirementsCatalogue.test.ts` fails when:

- a requirement has no evidence;
- it names a check the pipeline does not have;
- a check is claimed by no requirement;
- a unit-test reference matches no `describe` block;
- a statement is undated or dated in the future.

`src/helpers/e2eCoverage.test.ts` fails when a browser test names a requirement that does
not say browser tests evidence it, or when such a requirement has no tagged test.

**This file is public.** Only `main` and `release` are mirrored to GitHub, and this file is on
both. So it holds requirements any buyer could be told, written without a customer's name.
A tender's own numbered requirements, and how they map onto these, are kept outside this
repository.

To add a requirement, give it the next number in its area. Then point it at evidence that
already exists, or add that evidence in the same change. Evidence should be specific: a
blanket tag on a broad test proves nothing in particular.

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

**It is not a substitute for a real lint,** which is the next section.

### The pipeline config lint

A merge request pipeline proves the config for a merge request and nothing else. GitLab
checks `needs`, `dependencies` and stages only for the jobs a pipeline contains, so a
mistake in a job that exists only on `release` is first seen on release day, when the
pipeline that should cut the release fails to be created.

`src/helpers/pipelineSimulation.test.ts` works out, from each job's own `rules`, the
pipeline GitLab would create for a push to `main`, a push to `release`, a merge request, a
push to a branch with no merge request, the nightly schedule and a run on demand. It fails if
a job in any of them needs or depends on a job that pipeline may not contain, or on a job in
a later stage, or sits in a stage `stages` does not declare. It needs no token, so it runs in
`verify_quality` on every pipeline.

What it does not do:

- **It evaluates only the rule syntax this file uses:** `$VAR`, `==`, `!=`, `=~`, `!~`,
  `&&` and `||`. Anything else, such as parentheses, fails the test rather than being
  guessed at.
- **It cannot know `changes`.** A job behind one may or may not be in a push or merge request
  pipeline, so a job that needs it must mark the need `optional`.
- **It is not GitLab's validator.** It does not check keywords, values or limits.

GitLab's own lint is a local command. Run it before merging a change to `.gitlab-ci.yml`:

```bash
GITLAB_CI_LINT_TOKEN=<a personal access token> npm run ci:lint
```

`scripts/ci-lint.mjs` sends the file to GitLab's lint endpoint
(`POST /projects/:id/ci/lint`), simulating a push to `main` and to `release`. It prints the
jobs each would run, stage by stage, and fails if either is invalid. The token is your own,
with scope `read_api`, or `api` if GitLab refuses that: GitLab's docs do not say which the
endpoint needs.

**Why it is not a pipeline job.** `CI_JOB_TOKEN` cannot call the endpoint, so a job needs a
project access token held as a CI/CD variable. That variable has to be unprotected to reach
a merge request pipeline, which exposes it to every branch's jobs, and it lapses within a
year. It ran as `verify_ci_config` until 2026-10-26, and failed whenever it ran on a merge
request because the variable never reached it.

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

**In CI it runs on every release, and otherwise only when what it alone guards changes:**
`docker/**`, `.dockerignore`, `e2e-container/**` or its Playwright config, and the files that
decide whether `npm run build` passes inside the image: `tsconfig.json`, `package.json`, the
lockfile and `vite.config.mts`. On 2026-10-23 a `tsconfig.json` change had left the image
unable to build, because the configs it added import a fixture the build context excludes. A merge request
compares against its target branch, and `main` against the previous push. Nothing else
can change the headers, compression or caching it checks, so every other pipeline would
pay for an image build it cannot use. The release publishes the image to Harbor, so the
release pipeline always tests the image it ships.

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

### One build per browser job

Each browser job builds the application once. `verify_lighthouse` makes the byte budget's
build, checks it, then runs Lighthouse against it with `USE_EXISTING_BUILD=1`. The flag
only adds `dist/.vite/manifest.json`, which no page fetches. `verify_base_path` runs the
base-path suite, which builds under `/dcb-admin/`, then the bootloader suite against that
build with `USE_EXISTING_BUILD=1`. Both reach the router base through
`import.meta.env.BASE_URL`, so the two builds they used to make were the same build.

The two suites in one job keep separate folders, `test-results/<suite>` and
`playwright-report/<suite>`, because Playwright empties its output folder when a run
starts. Their JUnit files are in `reports/`, which Playwright never empties.

Locally, `npm run gates` still runs each suite with its own build: without the flag, every
config builds first.

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
`verify_base_path` and `verify_container` share `resource_group: browser-suites`, so GitLab
runs one at a time. Each builds the application once and drives Chromium on the same `ki-onprem` runner, and `workers: 4` was measured on a
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
forever. The CI image has since moved to `node:24.21.0-bookworm`, with git 2.39, for other reasons; `HUSKY=0` is still what keeps the hook out of the release, not the git version.

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

**Before the container gate, everything they measured was `vite preview` or a mocked
page.** Two real defects lived in exactly that gap:

- the image served **1,576 KB uncompressed** where the budget approved 665 KB, because the
  budget audits a preview server that compresses and Cloudflare compresses at the edge;
- the Content Security Policy blocked **40 font loads per session**, which the config test
  and `curl` both missed — a CSP failure is not a failed request and not an exception.

Both were found by building the image and driving it in a browser, which `verify_container`
now does.

Also not covered: real Keycloak flows (silent renewal, session expiry, logout) are mocked
throughout, and the CSP's `frame-ancestors 'self'` was reasoned from the code rather than
exercised against a live identity provider.
