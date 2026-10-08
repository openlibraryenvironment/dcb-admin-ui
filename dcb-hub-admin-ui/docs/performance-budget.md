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

| Chunk                           | gzipped | What it is                    |
| ------------------------------- | ------: | ----------------------------- |
| `exceljs.min.js`                |  276 KB | MUI X Premium's Excel export  |
| `DataGrid.js`                   |  213 KB | the Premium grid              |
| `BarChartPro.js`                |  105 KB | `x-charts-pro`, Insights only |
| `application.js`                |   77 KB | the app shell                 |
| `createMultiInputRangeField.js` |   67 KB | `x-date-pickers-pro`          |
| `i18n.js`                       |   50 KB | the translation catalogue     |
| `rasterizeHTML.js`              |   27 KB | the grid's print export       |

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

## Running them

```bash
npm run build          # tsc && vite build
npm run budget         # the chunk budget, over dist/assets
npm run lighthouse     # builds again on port 4193, then audits
```

In CI both live in `verify_lighthouse`, bytes first: the chunk budget is deterministic
and fails in seconds, so it runs before the three Lighthouse passes.
