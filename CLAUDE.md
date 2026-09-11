# dcb-admin-ui — agent notes

Consortium-facing administration UI for DCB. React 19, TanStack Router + Query, MUI 9 / MUI X 9, Vite 8, Vitest 4, GraphQL against `dcb-service`.

`CONTRIBUTING.md` in this directory is the team's own document on standards, formatting, linting and pre-commit checks. It outranks this file.

## Non-negotiables

1. **Correct** — the simplest code that is obviously right; surgical changes.
2. **Scales** — 20,000,000 bib records, hundreds of member libraries. No unpaged grid, no unbounded list. State the bound.
3. **Secure by design** — no PII or credential in a URL, query string, log line or analytics event. Identity from verified claims, never client input.
4. **Accessible** — WCAG 2.2 AA is the floor, enforced by a failing axe gate, never asserted in prose.
5. **Evidenced** — name the test, gate or budget that proves the claim.

## Things you will get wrong without being told

**The application is in `dcb-hub-admin-ui/`, not the repository root.** The root holds only `CONTRIBUTING.md`, `README.md`, `LICENSE`, `docker-compose.yml` and `renovate.json`. Every `npm` command, every config file and every source path is one level down. A command run at the root fails in a way that reads like a broken install.

**Versions here, read before writing an API from memory.** React 19.2.7, MUI 9.1.2, MUI X 9.12.0, TanStack Router 1.170.17, Query 5.101.2, TypeScript 6.0.3, Vite 8.1.3, Vitest 4.1.9, Playwright 1.61.1. This estate runs ahead of most training data, so read the installed types or copy a working usage from this repo. **MUI X is pinned in lockstep with `dcb-admin-for-libraries`** — those packages share `x-license` and `x-internals`, and a mixed set is a runtime hazard, not untidiness. Bump both repos together or neither.

**`npm run test` is watch mode and will hang the run forever.** The script is bare `vitest`. Use `npx vitest run`.

**GraphQL types are generated.** Touch a `.ts` GraphQL document and you must run `npm run codegen` and commit the result. `src/graphql/schemaConformance.test.ts` gates the documents against a committed 8.71.0 schema.

**A field the server does not declare is a validation error, not a null.** That is why per-capability version flags change the *document* rather than filtering the response, and why there is no single "v9" flag: the capabilities cross three different version thresholds. A schema change in `dcb-service` is a full-stack change — update this consumer in the same change, or say which PR follows.

**Releases run from the `release` branch, not `main`.** `semantic-release` is configured with `"branches": ["release"]` and commits `package.json`, `CHANGELOG.md` and `release-info.json` back with `[skip ci]`. Merging to `main` releases nothing, and conventional-commit format is not optional because commit messages *are* the release notes.

**Preview ports are a workspace allocation, not a preference:** 4173 e2e, 4183 bootloader, 4193 Lighthouse, 4203 base-path. Always `--strictPort` — without it vite silently increments onto a neighbouring repo's port and the gate measures somebody else's app.

**Two ways a green e2e suite is not a green e2e suite,** both met here on 2026-09-08:

- `webServer.command` is `npm run build && npm run preview` against a 120s timeout. A cold `tsc && vite build` uses most of it, so under load the preview never starts and *every* spec fails against a dead port. It reads exactly like the application being broken. Run `npm run build` first. `netstat` is the tell: nothing LISTENING, only `SYN_SENT`.
- `workers` is pinned to 4 deliberately. At 16 the axe suite raced itself, 21 failed against 0 at four workers. **A failure count that changes between runs is not a defect in your diff** — confirm at `--workers=1` before believing it. `retries: 2` in CI hides this.

**Lighthouse measures whatever is in `dist/`; it does not build.** Running it after a source change without `npm run build:vite` audits the previous build. `total-byte-weight` (750 KB) and CLS (0.05) are deterministic and trustworthy; TBT and LCP are measured on the real CPU and are worthless on a loaded machine. **Never re-baseline a budget to make a build pass.**

**Secret scanning runs in CI** (`verify_secrets`, gitleaks) with `.gitleaks-baseline.json` holding the 21 findings that predate the job. A new secret fails the pipeline. Deleting the offending line does not un-leak a credential; only rotating it does.

**Every user-facing string goes through `react-i18next`**, including `aria-label`, error text and empty states.
