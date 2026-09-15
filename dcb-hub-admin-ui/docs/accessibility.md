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

**One open defect in the same component, which no gate can see.** `DetailPanelToggle` sets
`tabIndex={-1}` on its button, so a keyboard user cannot reach it by tabbing, and its
`aria-label` is a hardcoded "Open"/"Close" rather than a translated string. axe passes both:
it checks that the button has a name, not whether it can be reached or is translated.

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
