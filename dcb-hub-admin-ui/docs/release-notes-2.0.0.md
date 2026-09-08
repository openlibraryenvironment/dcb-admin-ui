# DCB Admin 2.0.0 — release notes

DCB Admin is rebuilt. The version is 2.0.0 because the framework underneath it changed, not
because the console was redesigned: your routes, your data and your workflows are where you
left them, and a good deal has been added around them.

**208 commits since 1.58.1** — 37 features, 52 fixes, 807 files.

---

## 1. What changed underneath

|               | 1.x                 | 2.0                                          |
| ------------- | ------------------- | -------------------------------------------- |
| Framework     | Next.js             | **Vite 8** + React 19                        |
| Routing       | Next pages          | **TanStack Router** 1.170, file-based, typed |
| Server state  | mixed               | **TanStack Query** 5                         |
| Artefact      | Next.js server      | **static bundle served by nginx**            |
| Configuration | baked at build time | **read at runtime** from `inject_env.json`   |
| Language      | TypeScript 5        | TypeScript 6                                 |
| Components    | MUI 5               | MUI 9, X Data Grid Premium 9                 |

The consequences that matter to whoever deploys it are in §2. Everything else in this
document is what you get for them.

---

## 2. Before you upgrade

**The deployment artefact is different.** DCB Admin is now a static bundle. The container is
nginx serving `dist/`, not a Node server, and it listens on port 80 at `/`.

**Configuration moved from build time to runtime.** `NEXT_PUBLIC_*` variables baked into a
1.x bundle have no equivalent. The container renders `inject_env.json` from its environment
at start-up (`docker/production/docker-entrypoint.sh`), so **one image serves every
environment**. Set these:

```
VITE_KEYCLOAK_URL                  the realm, e.g. https://keycloak…/realms/dcb-hub
VITE_KEYCLOAK_ID                   this app's OIDC client — NOT the libraries app's
VITE_DCB_API_BASE                  dcb-service
VITE_DCB_SEARCH_BASE               dcb-locate
VITE_MUI_X_LICENSE_KEY             or the grids carry a watermark
VITE_DCB_ADMIN_FOR_LIBRARIES_URL   optional; where DCB Admin for Libraries is mounted
```

Plus the seven feature flags in §3, all of which default to off.

**`VITE_DCB_ADMIN_FOR_LIBRARIES_URL` is new.** DCB Admin now refuses non-consortium
accounts. A library account that signs in is told it is in the wrong application, and with
this set it is handed a link to the right one instead of a dead end.

**The base path is baked in, and only the base path.** Hostnames, backends and Keycloak are
runtime config, so one artefact serves every environment mounted at the same place. A
different mount point (`/dcb-admin` rather than `/`) needs its own build. See
[deployment.md](./deployment.md).

**If you serve from S3 or a CDN, read the cache rules.** Assets are content-hashed and may
be cached forever; `index.html` and `ki-bootstrap.js` never may. Getting this wrong
white-screens tabs that were open across a deploy. `docs/deployment.md` has the three-pass
sync and the reasoning.

**Keycloak:** each application needs its own client. If DCB Admin and DCB Admin for
Libraries share an origin, they must not share a client id — the stored session is keyed on
`authority` + `client_id`.

---

## 3. Feature flags, and what each one requires

Several 2.0 features need a dcb-service newer than 8.71.0. They are **off unless explicitly
set to `true`**, and an environment that has never heard of a flag hides the feature.

**This is not cosmetic gating.** Four of the seven change the GraphQL _document_ the app
sends. A field the server has never heard of is not a null — it is a validation error that
fails the whole operation. Switching one on too early does not hide a button, it breaks the
pages that query it.

| Flag                                     | Feature                                                                 | Requires                                       |
| ---------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| `VITE_FEATURE_CONSORTIUM_BRANDING`       | Consortium branding tab, brand image uploads, setup's Discovery chapter | dcb-service **9.0.0**                          |
| `VITE_FEATURE_NCIP_ONBOARDING`           | DCB NCIP onboarding workflow                                            | dcb-service **9.0.0**                          |
| `VITE_FEATURE_INSIGHTS`                  | Statistics and Insights                                                 | dcb-service **9.0.0**                          |
| `VITE_FEATURE_LOCAL_HOLDS`               | Per-agency maximum local holds                                          | dcb-service **after 9.0.0** — unreleased       |
| `VITE_FEATURE_CONSORTIUM_SUPPORT_URL`    | Consortium patron support link                                          | dcb-service **after 9.0.0** — unreleased       |
| `VITE_FEATURE_LIBRARY_USER_PROVISIONING` | Library accounts tab                                                    | dcb-service **after 9.0.0** — unreleased       |
| `VITE_FEATURE_AUDIT_EXPLORER`            | Audit explorer                                                          | **no dcb-service** — not released, not on main |

### Running against dcb-service 8.71.0

**Set none of them on.** Every capability above needs 9.0.0 or later. This is not a
conservative default, it is the only correct configuration: 8.71.0 has none of these
surfaces.

Everything else in this release works on 8.71.0, which is most of it — the rebuild, the
setup flow, the new library workflow, exports, filters, theming, accessibility and the
display preferences are all version-independent.

**Consortium branding still displays.** The branding flag has a documented fallback: with it
off, the app selects the pre-migration `headerImageUrl` / `aboutImageUrl` columns that
8.71.0 does have, so your marks render as before. What you lose is the four fields 9.0.0
_added_ and the form for editing them.

### When you upgrade dcb-service to 9.0.0

Turn on exactly three: `CONSORTIUM_BRANDING`, `NCIP_ONBOARDING`, `INSIGHTS`. The other four
stay off until a dcb-service release ships them.

There is deliberately **no single "v9" flag**. The seven capabilities landed at three
different thresholds, so one switch would be a lie about four of them and turning it on at
the upgrade would break the consortium form and the library settings tab.

### How this is kept honest

`src/constants/serviceCapabilities.ts` is a registry, not a comment, and
`serviceCapabilities.test.ts` checks every `since` against the committed
`schema.v8.71.0.graphqls` and `schema.v9.0.0.graphqls`. The day someone commits the schema
of a release that ships one of the four unreleased capabilities, that test fails and names
the flag whose threshold needs setting.

The **Service info** panel shows each capability against the dcb-service actually answering,
so you can see what a deployment supports rather than inferring it.

---

## 4. What's new

### Setup and onboarding

- **First-run configuration reframed as a guided conversation** — one door into consortium
  setup, a rail consistent with the rest of the console, a running count of what is left,
  and a finished setup that opens at the inventory rather than back at step one.
- **A way out of setup**, and a guard on unsaved work.
- **Resumable new-library workflow**, with **ILS-specific steps** rather than one form for
  every system, and the ability to **add a library from DCB Admin** directly.
- **DCB NCIP onboarding** and **invitation auth profiles** _(NCIP onboarding is flagged —
  see §3)_.

### Libraries and requests

- **New export wizard**, and export improvements throughout.
- **Pickup library filter**, plus filter-panel improvements.
- **Row selection is gated on grids that have a bulk action** — no more selecting rows that
  do nothing.
- **Per-agency maximum local holds** _(flagged)_.
- **Library accounts tab**, so consortium staff provision accounts here _(flagged)_.

### Insights

- **Statistics and Insights** _(flagged)_, including collection, partner and supply figures
  that the backend already returned and nothing rendered.
- **Audit explorer** _(flagged; see the warning in §3 — no dcb-service implements it yet)_.

### Environment and consortium

- **Environment information has a tab of its own**, separate from onboarding.
- **Consortium patron-facing brand form**, with **upload or CDN for every brand image**, and
  uploads that happen **on save rather than on pick** _(flagged)_.
- **Consortium patron support link** _(flagged)_.
- Branding now follows the merged brand columns and **no longer fetches uploader PII**.

### Access

- **Non-consortium accounts are barred from DCB Admin**, and the dead role-handling code
  around that is gone.
- A library account is told **it is in the wrong application**, not that it lacks access —
  with a link to the right one where the deployment provides it.

---

## 5. Appearance and accessibility

**Six brands × three modes × five typefaces**, each combined with a text size and a spacing
density chosen by the user:

- Brands: openRS, Evergreen, Koha, FOLIO, blue-and-white, MOBIUS
- Modes: light, dark, high contrast
- Typefaces: Roboto, system, Atkinson Hyperlegible, Inter, Lexend

New in 2.0:

- **Display preferences** — text size, spacing density, animation, typeface, and "match my
  device", which honours the OS _contrast_ preference as well as its colour scheme.
- **Windows High Contrast Mode** support, which is a different thing from the high-contrast
  palette and reaches users the palette never did.
- **FOLIO and Koha keep their real brand colours**, on a near-black chrome bar rather than
  by darkening the brand until it passed contrast.

Accessibility work in this release is gated, not asserted:

- axe over every reachable route in **light, dark and high contrast**, zero violations
- landmark and skip-link checks that the WCAG tag list cannot see
- reflow at **320px**
- every navigating tab is a real link — middle-click, ctrl-click and "copy link address"
  work throughout, which they did not in 1.x
- contrast asserted per token across all 18 brand × mode combinations

The conformance statement is [DCB_Admin_VPAT.md](./DCB_Admin_VPAT.md); the reasoning is in
[accessibility.md](./accessibility.md) and [theming.md](./theming.md).

---

## 6. Security and delivery

- **Security headers**, including a CSP, served on every location by the container.
- **Compression** enabled for the served bundle.
- **Runtime configuration** rather than build-time, so no secrets or environment detail are
  baked into the JavaScript.
- **KI bootloader adapter** — the same artefact can mount at a host root under the shared
  front-end bootloader.
- A **Lighthouse payload budget** enforced as a gate.

---

## 7. Known limitations

- **Spanish is 1,326 of 2,349 strings (56%).** Untranslated text falls back to en-GB.
- **`<html lang>` is not updated** when the language is changed, so a screen reader reads
  Spanish with an English voice (WCAG 3.1.1). Both of these need a product decision:
  finish the catalogue or withdraw the option for now.
- **`VITE_FEATURE_AUDIT_EXPLORER` has no backend anywhere.** Do not switch it on expecting
  it to work.
- **There is no user-preferences API yet.** Display preferences live in the browser, per
  device, and are cleared on sign-out.
- **The deployment's default brand cannot be set from dcb-service.** Each user picks a
  theme; a deployment cannot yet declare its own.

---

## 8. Checking what you deployed

The served page names its own version, so you can confirm a deploy without opening a
content-hashed chunk:

```bash
curl -s https://<host>/<base>/index.html | grep dcb-admin-version
```

The footer shows the same version and release date, and the **Service info** panel shows the
dcb-service it is talking to along with which capabilities that version supports.
