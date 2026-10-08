# Accessibility decisions

The conformance statement is `DCB_Admin_VPAT.md`. This is the reasoning behind the
decisions that are not obvious from the code — the ones a well-meaning refactor would
otherwise undo. Colour, contrast, motion and Windows High Contrast Mode are in
[theming.md](./theming.md); the gates that hold all of it are in [testing.md](./testing.md).

WCAG 2.2 AA is the floor and it is gated. Automated rules catch roughly a third of it, so
most of what follows is the other two-thirds.

---

## Landmarks and the skip link

There was no `<main>` on any route and no skip link. Measured from the top of `/libraries`:
three header buttons and then all twelve sidebar links — **fifteen tab stops** before the
first control on the page itself, on every navigation.

WCAG 2.4.1 is satisfiable by a skip link **or** by landmarks that let assistive technology
jump the repeated block. There were neither.

- `PageContainer` is the `<main>` for the 78 routes it wraps; `LoginLayout` carries one for
  the signed-out shell and `networkError` for itself.
- **`tabIndex={-1}` on that element is load-bearing.** A skip link whose target cannot take
  focus moves the viewport and leaves focus in the navigation, so the next Tab goes straight
  back into what the user was trying to skip.
- The skip link is **first in the DOM** so it is the first tab stop, and hidden by offset
  rather than `display: none` or `visibility: hidden` — both of those would remove it from
  the tab order it exists to be in.
- Both layouts wrap their two footer bands in **one** `<footer>`. Two `contentinfo`
  landmarks would themselves be a violation.

The application-wide axe gate could not see any of this: its tag list is the WCAG A+AA
ladder, and axe tags `landmark-one-main` and `region` as `best-practice`. `scanForLandmarks`
names those rules explicitly.

---

## Tabs that navigate are links

All six shared tab bars move between **routes**, and all six were `<Tab>` buttons with an
`onChange` calling `router.navigate`. A middle-click, a ctrl-click, "open in new tab" and
"copy link address" therefore did nothing, everywhere in the application.

`TabLink` is `createLink(Tab)`. Not `<Tab component={Link}>`, which renders correctly and
loses the router's typing on `to` — MUI's polymorphic overloads cannot see through to the
`to`/`params` pair. `CustomLinkButton` exists for the same reason.

`onChange` is removed wherever a tab became an anchor, or the router's own click handling
and a second `navigate()` both run for every selection.

**Be clear about what this does not buy.** They keep `role="tab"`, so they are still
announced as tabs and still absent from a screen reader's link list. Every browser
affordance a link has is now present; the ARIA semantics are unchanged. The authoring
practices would have cross-document navigation be a `nav` of links rather than a tablist at
all — a bigger change that would give up the scrollable overflow, the indicator and the
roving focus `Tabs` gets right today. Recorded so the next person weighing it has the
argument rather than rediscovering it.

`SetupRail` records the related failure: `createLink` around MUI's `StepButton` produced an
`<a role="tab">` with no `role="tablist"` parent, which the axe gate caught as a critical
`aria-required-parent`. That was about the **orphan**, not the combination — inside a real
`<Tabs>` the required parent exists.

`<Tab>` is not banned. The patron request detail page uses the tab pattern correctly, to
switch panels within one document, and those are buttons on purpose.
`components/tabsAreLinks.test.ts` carries that as a two-entry allow-list, because the
distinction is "do these tabs change the URL" and no pattern can see it.

---

## Visually hidden means MUI's `visuallyHidden`

Three components needed a visually-hidden element; two had copied MUI's recipe into an `sx`
prop, where **`width: 1` and `height: 1` stop meaning one pixel** — sx's sizing transform
reads any number ≤ 1 as a fraction, so both compile to `100%`. In `styled()`, where the
recipe comes from, the same two lines are 1px.

The result was three invisible file inputs pushing the branding form's document to **2221px
inside a 1280px viewport**, and the same fault on a visually-hidden `aria-live` region in the
setup rail. Neither was a narrow-viewport bug: both were true at desktop width and nothing
measured it.

All three now use MUI's own `visuallyHidden`, whose sizes are `'1px'` **strings** and cannot
be misread. `display: none` is not an alternative for any of them: the input is the labelled
control the visible button proxies for, and hiding it that way removes it from the
accessibility tree.

---

## Scrollable regions need a tab stop

Eleven of twelve `TableContainer`s cap their height, so they scroll, and none had a tab stop
— a keyboard-only user could not see past the rows that happened to fit. Fixed as a
`MuiTableContainer` theme default (`tabIndex: 0`) so the thirteenth is covered without
anybody knowing the rule exists.

The cost is a tab stop on a container that is not currently overflowing, which is what MUI's
own guidance accepts. The alternative is measuring overflow at runtime to decide
focusability, and nobody maintains that.

---

## Route boundaries are an accessibility concern

Six of 84 route files declared an `errorComponent`. The other 78 fell through to TanStack's
built-in default: an unstyled, untranslated panel printing raw error text. That was not
latent — the QueryClient's `throwOnError` sends every failure that is not a 401 or 503 to
exactly that boundary.

`GlobalError` and `NotFound` already existed and did the right thing; they are now the
router defaults, so a per-route component still wins where a route has a better answer.
`RoutePending` is a centred spinner rather than a dimension-matched skeleton on purpose: it
only appears after `defaultPendingMs` (1s), by which point the user needs telling something
is happening, and there is no single layout to match across 84 routes.

---

## Every route is titled

`index.html` sets one title and `PageContainer` was the only thing that changed it, so
the four routes that do not render it - `login`, `logout`, `maintenance` and
`networkError` - all read "DCB Admin". Browser history, tab switching and a screen
reader's page announcement were identical on each. **WCAG 2.4.2, Level A**, which the
VPAT claims; `/login` is also the page Lighthouse audits and the first page every user
sees.

`useDocumentTitle` is the one definition, used by `PageContainer` and by those four
routes directly. They reuse strings that already existed, so nothing here added
translation debt.

**Page name first, then a middot, then the app.** A tab strip and a screen reader's page
announcement both truncate from the right, so "DCB Admin | Libraries" told the reader the
same thing on all 85 routes. `dcb-admin-for-libraries` titles "Mappings · DCB Admin for
Libraries" and this now matches it. The old format also carried a trailing space, and a
blank title produced "DCB Admin | " with a dangling separator.

Proved by `e2e/page-titles.spec.ts`, which covers the three reachable untitled routes and
asserts that the title follows a navigation rather than being set once on load.

---

## A live region selector is not yours alone

The application declares ten `aria-live` regions. **Dependencies declare their own**, and
MUI X 9.15.0 started rendering an empty `role="status" aria-live="polite"` node inside
every chart surface. On the Insights dashboard that took `[aria-live="polite"]` from one
match to five, and broke three tests that had reasonably assumed the page had one.

The empty regions are harmless to a screen reader - an empty live region announces
nothing, and the axe gate stayed green. The damage was entirely to the tests.

So **an assertion about an announcement names the region it means.** The Insights
announcement carries `data-tid="insights-announcement"`, and the gate that has to keep
working - "the view change is announced once, not once per panel" - counts that id. A
per-panel regression still trips it, which a bare attribute selector could no longer
distinguish from a chart's own node.

One bare selector survives, in `bulk-functional-settings.spec.ts`: that page renders no
chart, so `getByRole("status")` is still unique there. Left alone deliberately rather
than changed while passing - but it is the next one to break if a chart ever lands on
that page.

---

## 320px finds what a desktop hides

The `narrow` Playwright project scans `accessibility.spec.ts` at 320px (WCAG 1.4.10
Reflow). Expanding the route table from 9 routes to 21 put eleven more pages in front
of it, and two defects fell out that no desktop scan could see. Both were already in
the application; neither is on a route anybody had scanned.

**A scrollable region with no tab stop** (`scrollable-region-focusable`, serious). MUI's
Alert gives its message slot `overflow: auto`, so an alert that fits on a desktop scrolls
at 320px - and a keyboard-only user cannot read past the first line. Fixed as a `MuiAlert`
default (`slotProps.message.tabIndex = 0`), the same shape as the `MuiTableContainer`
default above and accepting the same trade: a tab stop on a message that is not
currently overflowing.

**A target under 24x24** (`target-size`, serious, WCAG 2.5.8). The Request Errors
overview renders a Jira ticket link in a cell. An inline anchor's box is its line
height, about 20px, and that column narrows until the box is the whole target.
`display: inline-flex` with `minHeight: 24` gives it a box of its own; the row is 52px,
so nothing moves.

The general point: **a route added to the table is measured in five variants** - light,
dark, high contrast, the 8.71.0 surface and 320px - and the narrow one is where the
cheap desktop assumptions surface.

---

## Reaching a detail page

Every detail page in this application is reached through a grid row, and the grid
navigated on `onRowClick` alone. **`rowClick` is a pointer event and MUI X never raises it
for a keypress**, so a keyboard user could arrow to a row, press Enter and reach nothing.
WCAG 2.1.1, Level A, across the seventeen grid types that route - which is every entity
list in the product: libraries, patron requests, Host LMS, locations, agencies, groups,
bibs, audits and the data change log.

The axe gate scans `/libraries` and `/patronRequests/all` and passed both throughout. No
automated rule can tell that a pointer handler has no keyboard equivalent, which is why
this one survived a gate that was green. `e2e/grid-keyboard.spec.ts` walks the journey
instead, and all three of its assertions were seen failing first.

Two things changed, and they do different jobs:

- **`onCellKeyDown` on the grid** routes on Enter. It is the keyboard counterpart of
  `onRowClick`, resolving through the same `resolveRowClickPath`, with the same
  edit-mode guard, and it skips the detail-panel toggle field because that cell's Enter
  belongs to `DetailPanelToggle` (below). This is the mechanism that makes the journey
  work, and it is the same `cellKeyDown` event the toggles already use.
- **The leading visible cell is a link** (`withRowLink`). That is the semantics: assistive
  technology announces "link", the row gains a visible focus ring, and ctrl/cmd-click
  opens a new tab natively. It stops propagation so `onRowClick` does not navigate twice.

`noLinkStyle` and `color: inherit`, so no grid changes appearance: the affordance a
keyboard user needs is the focus ring, not a second underline in fifty grids. The link's
accessible name is the cell's own text, read in row and column context, which is what WCAG
2.4.4 means by "in context" - on `/libraries` that is the abbreviated name under its own
column header.

**Mirroring the cell's roving `tabIndex` onto the link was tried and rejected**, for the
same reason it was rejected for the detail toggles below: `GridCell` focuses a child only
if it matches `[tabindex="0"]`, so `params.tabIndex` makes every unfocused row's link
`tabindex="-1"` and tabbing then reaches none of them. Measured both ways. The link carries
no explicit `tabIndex`, and Enter is handled by `onCellKeyDown`, which is a public prop and
rests on none of MUI's focus internals.

---

## Detail panels are grid rows

MUI X renders an expanded detail panel as `role="none"` directly inside the grid's
`rowgroup`. `none` drops out of the accessibility tree, so everything focusable in a panel —
every link `RenderAttribute` draws — becomes a child of the rowgroup, which may only own rows.
axe reports it as `aria-required-children`, critical. It was found the first time the gate
opened a panel (Service Status), and it applied to every master-detail grid in the app,
because nothing had ever scanned one expanded.

`MasterDetailLayout` now supplies the missing structure once: a `row` holding a single
`gridcell` around the panel content. The rule that follows is that **nothing inside a panel
may carry `row` or `gridcell` itself** — a gridcell inside that gridcell is its own violation.
`MasterDetail` had ten such roles, placed by hand on individual `Grid`s; they are gone.

### The toggles work inside the grid's keyboard model

A data grid is **one** Tab stop; arrow keys move between cells inside it. That is the ARIA
grid pattern and MUI X enforces it with a roving `tabIndex`, so a Tab stop per row is not the
fix and would fight the grid. Before this, both toggles pinned `tabIndex={-1}`, and on Service
Status, measured in Chromium:

- Tab entered the grid on the "expand all" column header, where **Enter and Space did nothing** —
  expand-all had no keyboard path at all.
- ArrowDown reached a row's toggle cell and Space opened it, but Enter did nothing, and focus sat
  on the cell rather than the button, so no name or expanded state was announced.
- Labels were hardcoded "Open", "Close", "Expand All". axe passed all of it: it checks that a
  button has a name, not that it can be operated or is translated.

Now the row button carries a translated name that changes with its state, plus
`aria-expanded`, and `DetailPanelToggle` handles Enter through the grid's `cellKeyDown` event.
Space was already handled by the grid. Focus stays on the cell, as in MUI's own toggle. Giving
the button the cell's roving `tabIndex` was tried and rejected: the cell and its button become
two nested targets, and axe `target-size` failed the 50×52px cell at the 50×13px the button left
of it. The header button also stays `tabIndex={-1}`, because the grid ignores keys from
focusable header content, which would stop arrow navigation. `DetailPanelHeader` handles Enter
and Space through the grid's `columnHeaderKeyDown` event. Proved by `e2e/service-status.spec.ts` › "operates the
detail toggles from the keyboard"; every master-detail grid shares these two components.

---

## Language

**Two open defects, recorded here because neither is visible from the code and no gate can
see either.**

`index.html` hardcodes `<html lang="en">` and nothing ever updates it — `grep -rn
"documentElement" src` returns nothing. The language switcher offers Spanish, so choosing it
leaves the document declared as English and a screen reader reads Spanish with an English
voice. **WCAG 3.1.1, Level A.** axe's `html-has-lang` and `html-lang-valid` both pass,
because the attribute is present and syntactically valid; the gate is structurally incapable
of seeing this. The fix is an `i18n.on("languageChanged", …)` that writes
`document.documentElement.lang`, plus `lang="en-GB"` to match the bundled catalogue.

The Spanish catalogue is **1,326 of 2,349 strings — 56%**. The remainder falls back to en-GB
and renders inside a page declared as one language, unmarked: **WCAG 3.1.2, Level AA**.
Either finish it or withdraw the option for now; a half-translated console reads as an
unfinished product to exactly the buyers bilingual capability is meant to reassure.
