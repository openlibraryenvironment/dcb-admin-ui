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

## The chunk budget measures the artefact

`bundle-budget.json`, checked by `scripts/check-bundle-budget.mjs` after a build.
Lighthouse cannot see a chunk no audited page fetches, and this application is mostly
such chunks: measured on 2026-10-07 it shipped **1,650 KB gzipped across 382 chunks**,
of which the Lighthouse budget covered 750 KB. The heaviest single thing in the
artefact sat outside every gate in the repository:

| Chunk                 | gzipped | What it is                    |
| --------------------- | ------: | ----------------------------- |
| `exceljs.min.js`      |  276 KB | MUI X Premium's Excel export  |
| `DataGrid.js`         |  213 KB | the Premium grid              |
| `BarChartPro.js`      |  105 KB | `x-charts-pro`, Insights only |
| `application.js`      |   77 KB | the app shell                 |
| `DateLocalization.js` |   67 KB | `x-date-pickers-pro`          |
| `i18n.js`             |   50 KB | the translation catalogue     |
| `rasterizeHTML.js`    |   27 KB | the grid's print export       |

The budget names every chunk above 15,000 bytes, so new weight arrives with a number
beside it rather than silently. A chunk over its number, an unbudgeted chunk above
the threshold, or a budgeted chunk that is no longer built all fail the gate.

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
nothing paints on `/login` until a large graph has been fetched, parsed and executed,
and why reshaping chunks moves the weight around without removing any — the
experiment and its numbers are recorded in `vite.config.mts`. This budget stops it
growing; it does not fix it.

### `i18n.js` has no number of its own

About 46 KB of `i18n.js`'s 50 KB is `src/locales/en-GB/application.json`, imported
statically by `src/i18n.ts`. A number on that chunk caps how many strings the application
has, and ordinary feature work breaks it: the catalogue grew from 31.4 KB on 2026-08-12 to
47.8 KB on 2026-10-12, about 7.5 KB a month, and a budget set on 2026-10-07 failed five
days later on new Host LMS strings. Nobody decides whether a label is worth its bytes, so
the only responses were to stop writing interface text or to raise the number — and a
number raised whenever it fails measures nothing.

So it is listed under `unbounded` in `bundle-budget.json`: still counted in the total, and
still required to exist, but with no limit of its own. What a limit would have protected
is covered where it is measured properly:

- **What users download** — Lighthouse's `total-byte-weight` on `/login`, which is
  deterministic and counts the catalogue with everything else that page loads.
- **Accidental bulk** — a second catalogue, or an asset inlined into the chunk — the total.
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
npm run build          # tsc && vite build
npm run budget         # the chunk budget, over dist/assets
npm run lighthouse     # builds again on port 4193, then audits
```

In CI both live in `verify_lighthouse`, bytes first: the chunk budget is deterministic
and fails in seconds, so it runs before the three Lighthouse passes.
