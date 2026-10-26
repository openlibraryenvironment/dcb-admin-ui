# Performance budget

Two gates, and neither is enough on its own.

## Lighthouse measures pages

`lighthouserc.js` audits `/login` and `/consortium/insights` and asserts
`total-byte-weight`, CLS, the accessibility and best-practices scores, with TBT, LCP
and the performance score as warnings. What it asserts is what **those two pages
fetch**.

Bytes are the assertion that holds the line, because they do not vary with the
runner's CPU the way every score-based threshold does. The scores that do are
warnings, and the file says why against each one.

**Never re-baseline a budget to make a build pass.** A number re-derived to sit just
above today's bundle ratchets, and three of those in a row is how a bundle doubles.
Exceeding it means cutting weight or bringing a written argument.

| Page                   | Measured (2026-10-22) |   Limit |
| ---------------------- | --------------------: | ------: |
| `/login`               |    550,617 B, 98 reqs | 635,000 |
| `/consortium/insights` |   792,296 B, 138 reqs | 910,000 |

Both carry ~15% headroom, the ratio `symposia-ui` uses: enough to absorb ordinary
feature work, tight enough to trip on a heavyweight dependency.

### `npm run lighthouse` is a script, not Lighthouse CI

`scripts/lighthouse.mjs` reads `lighthouserc.js` the way `lhci autorun` did: the server
command and its ready pattern, the URLs, three runs of each, the settings and the
assertions. It runs Lighthouse's own CLI against Playwright's Chromium and judges each
assertion on the median of the three runs. It writes `.lighthouseci/manifest.json` and
`assertion-results.json` in the shape the release report reads, and fails on an `error`
assertion that misses. It also refuses a setting or an aggregation method it would
otherwise ignore.

It replaced `@lhci/cli` 0.15.1 on 2026-10-26. That was lhci's latest release, there had
been none since June 2025, and it pinned Lighthouse 12.6.1. It brought 277 packages and
16 of the 18 advisories `npm audit` reported here. Lighthouse 13.5.0 added 84 packages
and no advisory.

Measured on one build, both on Chromium 156:

| Measure                                     | lhci (Lighthouse 12.6.1) | Runner (Lighthouse 13.5.0) |
| ------------------------------------------- | -----------------------: | -------------------------: |
| `total-byte-weight`, `/login`               |                  583,251 |                    583,251 |
| `total-byte-weight`, `/consortium/insights` |                  828,541 |                    828,541 |
| CLS, accessibility, best practices, SEO     |                     same |                       same |
| The step, start to finish                   |                    132 s |                  136-143 s |

The bytes, the layout shift and every score that does not depend on the CPU are
identical. The timings move about as much between two runs of the same tool on the same
build: `/login` LCP read 1,346 ms and 1,884 ms on the runner. One looks like Lighthouse
13 itself: `/consortium/insights` LCP read 2,581 ms in both of its runs against 1,830 on
12, inside the 4,500 ms warning.

`onlyCategories` keeps the four categories the release report explains. Lighthouse 13
adds agentic browsing, which nothing here asserts.

## The bundle budget measures what every page loads, and the chunks around it

`bundle-budget.json`, checked by `scripts/check-bundle-budget.mjs` after a
`BUNDLE_BUDGET=1` build, which writes the Vite manifest the check reads. It checks two
things, reports every finding, and fails the build on one (see "Advisory, with one hard
limit" below):

- **What every page loads first**: the entry, the app shell it boots (`main.tsx` imports
  `application.tsx`), and everything they import statically. That is what a user pays on
  every visit before any route code. It is a sum of files, so a bundler regrouping them
  cannot fail it, and a feature that stays in its own route never touches it.
- **A named chunk outside the first load** over its number, or one above 15,000 bytes with
  no number. That is how a heavy new dependency, or an accidental split of a shared chunk,
  arrives with a number beside it.

**The total of everything emitted is printed, and is not a budget.** It was one from
2026-10-07 to 2026-10-22, and in that time it failed only on ordinary feature work, and
never on anything the checks above did not also catch. Every feature adds bytes to it,
including routes a user may never open, so with a 2% margin it failed about once a
release and could not say where the weight was. dcb-admin-for-libraries reached the same
conclusion first and reports its total the same way.

The first-load figure was first measured on 2026-10-22 when this replaced the total, on
rolldown 1.1.4: `main` 431,749 bytes gzipped across 132 files, `final-checks` 441,692
across 140. On rolldown 1.2.15 the same branch measures 337,995 across 73. Of what
that branch first added, 2.6 KB was route modules pulled into every page because their
components read `Route.useSearch()` or `Route.useParams()` (see "The eager route graph"
below). Loading the support reference's copy button lazily was tried and measured
worse: the bundler split MUI's popper, button and portal into separate shared chunks,
and the first load grew by a further 3.8 KB.

Lighthouse cannot see a chunk no audited page fetches, and this application is mostly
such chunks: measured on 2026-10-22 it shipped **1,566 KB gzipped across 326 chunks**,
of which the Lighthouse budget on `/login` covered 551 KB. The heaviest single thing in
the artefact sat outside every gate in the repository until this budget existed:

| Chunk                 | gzipped | What it is                    |
| --------------------- | ------: | ----------------------------- |
| `exceljs.min.js`      |  276 KB | MUI X Premium's Excel export  |
| `DataGrid.js`         |  215 KB | the Premium grid              |
| `BarChartPro.js`      |  108 KB | `x-charts-pro`, Insights only |
| `application.js`      |  106 KB | the app shell                 |
| `DateLocalization.js` |   68 KB | `x-date-pickers-pro`          |
| `i18n.js`             |   51 KB | the translation catalogue     |
| `rasterizeHTML.js`    |   27 KB | the grid's print export       |

Outside the first load, the budget names every chunk above 15,000 bytes, so new weight
arrives with a number beside it rather than silently. A chunk over its number, an
unbudgeted chunk above the threshold, a budgeted chunk that is no longer built, or one
that has moved into the first load are all reported as warnings.

### Advisory, with one hard limit

From 2026-10-26 the budget reports and does not block, with one exception: the build
fails when the first load is more than `firstLoad.blockAbovePercent` (5%) over its
budget. At 361,076 that limit is 379,129 bytes gzipped. Anything over the budget but
under the limit prints a warning with the size, the overrun and the limit, and the gate
passes. A chunk over its own number, and every bookkeeping finding, is a warning only.

Decided by the tech lead on 2026-10-26, after three measured raises in four days
(2026-10-23 and two on 2026-10-26). Five per cent of the first load is about 18 KB
gzipped. That is above a feature's flag reader or route definition, and above the whole
2026-10-26 dependency upgrade (+15,164), which would have passed with a warning. The rule is `firstLoadVerdict` in `scripts/budget-verdict.ts`, tested by
`src/helpers/budgetVerdict.test.ts`.

The raises below still apply. A warning is the prompt to measure the cost and record it
here, so the number keeps meaning "what every page should load".

### When the bundler regroups chunks

A bundler upgrade can fail this gate without adding a byte, because chunk names are
what the budget keys on and the bundler chooses them. vite 8.1.3 -> 8.3.5 (rolldown
1.1.4 -> 1.2.15) did exactly that on 2026-10-22. Built from identical source, one
build with each bundler:

| Measure                                  |      rolldown 1.1.4 |     rolldown 1.2.15 |
| ---------------------------------------- | ------------------: | ------------------: |
| total, gzipped                           |         1,663,514 B |         1,565,634 B |
| `application.js` static closure          | 458 KB / 131 chunks |  362 KB / 66 chunks |
| `/login` total-byte-weight               | 663,180 B, 163 reqs |  550,617 B, 98 reqs |
| `/consortium/insights` total-byte-weight | 905,816 B, 203 reqs | 792,296 B, 138 reqs |

`application.js` went from 77 KB to 106 KB because `Match.js`, `useThemeStore.js` and
eleven smaller chunks, all already in its static closure, were merged into it. `main.js`
became `request.js` and `useThemeStore.css` became `application.css` with the same
contents. Most route chunks shrank by about 4.5 KB each.

Everything that measures what users download was **lowered** to bank the saving:
`/login` from 750,000 to 635,000 and Insights from 1,000,000 to 910,000, and the first-load
budget from 450,600 to 344,800, re-derived from 337,995 measured. Left where they
were, those limits would have admitted 85 KB, 199 KB and 208 KB of new weight without a
word.

The per-chunk numbers that failed on this regroup were the shell's, and the first-load
sum has replaced them, so a regroup inside the first load no longer fails anything; a
named chunk outside it still can. The check that distinguishes a regroup from new weight
is the one above: build the same commit with each bundler and compare the first load and
the total.

### When a feature costs every page

A number is raised only by the measured cost of a named feature that has to be where it
is, after anything that did not have to be there has moved. It is never re-derived from
today's build, because that spends the headroom too.

On 2026-10-23 per-deployment Insights pages and panels (`VITE_INSIGHTS_PAGES`,
`VITE_INSIGHTS_PANELS`) put the first load 785 over and `useInsightsView.js` 134 over.
Most of the first-load cost was not needed there: `featureFlags.ts`, which every page
loads, imported the whole panel vocabulary. Moving it out, to `insightsPanelFlags.ts`,
recovered 562. What remained is the page check the sidebar makes on every page:

| Measure (gzipped, LF checkout) | Before the feature | With it, split | Raised by | Budget            |
| ------------------------------ | -----------------: | -------------: | --------: | ----------------- |
| First load                     |            344,627 |        345,023 |      +396 | 344,800 → 345,196 |
| `useInsightsView.js`           |             28,887 |         29,688 |      +801 | 29,100 → 29,901   |

Both keep the headroom they had: 173 and 213. Measure on a fresh checkout. A working
copy holding CRLF files builds a few hundred bytes heavier than CI does.

On 2026-10-26 three dcb-service 9.2.0 request features (the request tag list, notes on
a request, and who placed it) put the first load 448 over. None of it could move:

- The Request tags page's route definition (+334). This application loads every
  route's definition, loader and pending skeleton eagerly. Changing that is a
  code-splitting decision for every route, not one for this feature.
- The three capability rows and their flag readers (+221). Every document that
  selects a 9.2.0 field and the Feature availability panel consult them.
- The request page's work (+161 net). This is mostly the patron request grid fragment
  reading its flag, because the grids' dashboard query loads on the home page.

| Measure (gzipped, LF, no `.env`) |  Before |   After | Raised by | Budget            |
| -------------------------------- | ------: | ------: | --------: | ----------------- |
| First load                       | 360,092 | 360,808 |      +716 | 360,360 → 361,076 |

It keeps the headroom it had: 268.

### When an upgrade costs every page

The same rule, for a dependency rather than a feature: raise by the measured cost of
the named upgrade, net of anything the same upgrade saved, and only after checking the
weight cannot move.

On 2026-10-26 the dependency upgrade put the first load 14,946 over its budget,
`DataGrid.js` 1,609 over and `DateLocalization.js` 717 over. Each package was measured
on its own against the build before it:

| Upgrade                                 | First load | `DataGrid.js` | `DateLocalization.js` |
| --------------------------------------- | ---------: | ------------: | --------------------: |
| React 19.2.7 → 19.3.1                   |     +8,832 |            -5 |                    -1 |
| zod 4.4.3 → 4.6.6                       |     +7,029 |             0 |                     0 |
| MUI 9.4.0 → 9.5.0, lab beta.9 → beta.10 |       +574 |            -2 |                  +343 |
| MUI X 9.15.0 → 9.16.0                   |        +76 |        +3,571 |                  +421 |
| Patch and tooling releases              |     -1,444 |           +25 |                    -9 |
| The whole upgrade, measured together    |    +15,164 |        +3,588 |                  +764 |

None of it could move:

- React DOM's production client grew from 94,758 to 110,528 bytes gzipped (View
  Transitions, Fragment refs), and every page loads it.
- zod 4.6.6 carries the fix for GHSA-mrhx-c7xc-m3w5, and the route schemas that
  `validateSearch` needs keep it on every page. `zod/mini` would cost about 17 KB less
  for the same schemas; that is the lever if the first load has to come down.
- MUI X 9.16 fixes a memory leak on row updates and the grid popovers' ARIA roles, and
  moves in lockstep with `dcb-admin-for-libraries`.

| Measure (gzipped, LF, no `.env`) |  Before |   After | Raised by | Budget            |
| -------------------------------- | ------: | ------: | --------: | ----------------- |
| First load                       | 344,978 | 360,142 |   +15,164 | 345,196 → 360,360 |
| `DataGrid.js`                    | 216,121 | 219,709 |    +3,588 | 218,100 → 221,688 |
| `DateLocalization.js`            |  68,353 |  69,117 |      +764 | 68,400 → 69,164   |

Each keeps the headroom it had: 218, 1,979 and 47. A local `.env` adds about 500 bytes
to the first load, because Vite inlines every `VITE_*` value into the feature flags.
Measure without it.

### What this is telling us to do

`exceljs` and `rasterizeHTML` are 303 KB gzipped — 18% of the artefact — and both come
from `@mui/x-data-grid-premium`. The grids now use Premium's Excel export (see
`docs/mappings-export.md`), so `exceljs` has become a used feature rather than dead
weight; `rasterizeHTML` backs the print export and is worth checking for whether print
is reachable at all. `dcb-admin-for-libraries` and `symposia-ui` both record the same
two chunks and the same question: they leave entirely on `DataGridPro`.

For comparison, on the same date: `dcb-admin-for-libraries` budgets 1,252 KB and
`symposia-ui` 1,040 KB. This application ships MUI X Premium's grid, charts **and**
pickers where those ship one grid, which is most of the difference — and is the number
to aim at rather than to declare.

### The eager route graph

`routeTree.gen.ts` statically imports all 85 route definitions, and those pull
`schemas`, `axios`, `dayjs` and the bundled locale catalogue with them. That is why
nothing paints on `/login` until a large graph has been fetched, parsed and executed:
about 800 ms of script evaluation unthrottled, which a desktop staff console absorbs
and a phone would not. Hand-written `codeSplitting` groups move the weight around
without removing any; the experiment and its numbers are recorded in `vite.config.mts`.
The bundler's own deduplication did remove some (see above), but the graph is still
eager. The first-load budget stops it growing; it does not fix it.

A route's options stay in that graph while its component is split out, so a component
that reads `Route.useSearch()`, `Route.useParams()` or `Route.fullPath` ties the two back
together, and the route gets a chunk of its own in the first load, about 2 KB each. Read
them by route id instead: `useSearch({ from: "/__authenticated/…/" })`,
`useParams({ from: … })`, `useNavigate({ from: "/…/" })`.

### `i18n.js` has no number of its own

About 46 KB of `i18n.js`'s 50 KB is `src/locales/en-GB/application.json`, imported
statically by `src/i18n.ts`. A number on that chunk caps how many strings the application
has, and ordinary feature work breaks it: the catalogue grew from 31.4 KB on 2026-08-12 to
47.8 KB on 2026-10-12, about 7.5 KB a month, and a budget set on 2026-10-07 failed five
days later on new Host LMS strings. Nobody decides whether a label is worth its bytes, so
the only responses were to stop writing interface text or to raise the number — and a
number raised whenever it fails measures nothing.

So it is listed under `unbounded` in `bundle-budget.json`: required to exist, with no
limit of its own, and left out of the first load's sum for the same reason. What a limit
would have protected is covered where it is measured properly:

- **What users download** — Lighthouse's `total-byte-weight` on `/login`, which is
  deterministic and counts the catalogue with everything else that page loads.
- **Strings that reach users as raw keys** — not a size problem at all. See
  `docs/i18n.md`.

If `/login` nears its byte budget, loading each area's strings with its routes is the
measured option: the shell needs about 6 KB of the 46, and `hostlms`, `insights` and
`setup` are about 19 KB that every page loads today.

## Layout shift on every route

Lighthouse asserts CLS at 0.05, but only on its two pages. The other 52 routes had no
CLS gate, and a sweep of them at tablet width found 21 route/viewport pairs over that
budget, the worst at **0.3412**, seven times it. Both causes were invisible at the
1280px viewport the rest of the e2e suite runs at, which is why nothing had reported
them:

- **A footer in view when a page's content arrives moves when it does.** The shell is a
  flex column of {header, row, footer}. With a minimum height on the shell, a short
  loading state puts the footer inside the first viewport, and a long page arriving
  moves it a full viewport down. Measured on `/libraries/$libraryId` at 768x1024:

  | `minHeight` on               | Footer top      | CLS    |
  | ---------------------------- | --------------- | ------ |
  | the shell (`100vh`)          | 752px -> 2112px | 0.3412 |
  | the shell (`100vh` + header) | 822px -> 2112px | 0.2794 |
  | the row                      | 1094px, no move | 0.0147 |

  A 272px-tall element fully in view moving a full viewport is 0.266 of the first figure.

  The first fix put `100vh` on the row, which kept the footer below the fold on **every**
  page. That left 417-697px of empty page under a short grid, the gap growing with the
  viewport, to protect four routes: with the shell holding the minimum instead, 65 of 69
  routes stayed under budget. So the shell holds it again, and the four hold the
  viewport themselves:

  | Route                    | How                                         |
  | ------------------------ | ------------------------------------------- |
  | `/libraries/$libraryId`  | `PageLoading` while the record loads        |
  | `/patronRequests/$id`    | `PageLoading` while the record loads        |
  | `/bibs/$bibId`           | `PageLoading` while the record loads        |
  | `/consortium/onboarding` | `VIEWPORT_BELOW_HEADER` on its body, always |

  A reservation is only right where the loaded page is longer than the viewport.
  Putting it on every `Loading` instead was measured at 15 routes over budget: a short
  page's footer rises into view when its data lands, which is the same shift upwards.
  Onboarding holds it after loading too, because its height arrives with a fan-out over
  every library and lands either side of the fold, so the footer must stay below it
  either way. `e2e/footer-position.spec.ts` holds the other side: a short page's footer
  sits at the foot of the viewport. The signed-out shell (`LoginLayout`: `/login`,
  `/logout`, `/maintenance`) works the same way, and that spec measures its CLS too,
  since `/login` and `/logout` are not in `ROUTES`.

- **A section that renders nothing while loading pushes down what is below it.**
  `OnboardingStats` returned `null` until the data landed, then appeared above the grid
  and moved it 151px. It now renders its heading and three placeholder tiles in the
  same typography. `/consortium/onboarding` at 768x1024 went from 0.069 to 0.020.

- **A grid's pagination bar moved when its first rows landed.** An empty grid holds a
  400px minimum while it loads, then resizes to its rows, and the bar at its foot went
  with it, on 22 of the 69 routes. Each was under budget, but a control that moves under
  the pointer is a mis-click. `DataGrid` now hides the bar until there are rows to page
  through, so it is added rather than moved, and `layout-shift.spec.ts` fails if a bar is
  ever a shift source.

  It is `vh` and not `dvh`: `dvh` changes as a mobile URL bar hides and would shift the
  page on scroll.

- **A route whose loading branch rendered different chrome from its loaded branch**
  inserted 77px of breadcrumbs and title above the page when the data landed.

`e2e/layout-shift.spec.ts` now asserts CLS on every route the suite can render.

### Why 0.10 and not 0.05

0.05 is the budget, and this is not a re-baseline of it: the gate did not exist, so
there was no number to ratchet. 0.10 catches the class of defect above without firing
on contention. Measured after the fixes, 54 routes x 2 viewports, twice, at the suite's
4 workers:

| Measure               | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| worst route           | 0.0749 (`/libraries/$libraryId`, its attribute grid growing) |
| routes over 0.05      | 7                                                            |
| routes over 0.08      | 0                                                            |
| run-to-run delta, max | 0.0187                                                       |

So 0.10 sits above the worst route plus the worst observed noise, and below everything
the sweep found. **The seven routes between 0.05 and 0.0749 are open work:** each is
content growing in its own place, and wants a skeleton matching the incoming content.

### Why 768x1024

The suite's default is 1280x800 and the `narrow` project is 320px. At both, the footer
sits below the fold for a different reason and the defect does not appear. A tablet is
also the one form factor a library desk actually uses that nothing here was measuring.

## Running them

```bash
BUNDLE_BUDGET=1 VITE_PUBLIC_URL=/ npm run build   # tsc && vite build, with the manifest
npm run budget         # the first load and the named chunks, over dist/
npm run lighthouse     # builds again on port 4193, then audits
```

In CI both live in `verify_lighthouse`, bytes first: the bundle budget is deterministic
and fails in seconds, so it runs before the three Lighthouse passes. A deployment build
leaves `BUNDLE_BUDGET` unset, so no manifest ships.
