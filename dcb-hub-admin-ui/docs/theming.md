# Theming

`src/themes/openRS.ts` builds every theme this application can render: **six brands × three
modes**, each combined with a typeface, a text size and a spacing density chosen by the
user. This document is the argument behind that file. The file itself carries only what a
reader of a particular line could otherwise get wrong.

- `src/themes/openRS.ts` — the brand tokens, the component overrides, `getAppTheme`
- `src/themes/display.ts` — text size, density and motion vocabularies
- `src/themes/fonts.ts` — the typeface registry
- `src/themes/openRS.contrast.test.ts` — the gate that holds all of this to WCAG

---

## 1. The registry holds token sets, not built themes

`getAppTheme(name, mode, fontName, display)` **builds** a theme and caches it. It does not
take a prebuilt theme and overlay changes onto it, and that distinction is the single most
important thing to know before editing this file.

`createTheme(builtTheme, overrides)` deep-merges. It does **not** re-derive. MUI's own
guidance says only the first argument is formally processed and that you should pass a
single object; a built theme handed back in as the first argument brings its already-
resolved values with it. Three consequences, all of which this codebase has actually hit:

| Overlaying this…        | …does this                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typography.fontFamily` | changes a field nothing reads. Every variant already carries its own resolved `fontFamily`, so the page stays in the old face while the theme claims otherwise. This shipped once and an e2e gate caught it, not the unit test that asserted `typography.fontFamily` — that field was correct, and it was the only correct one. |
| `typography.fontSize`   | changes nothing visible. MUI derives its variants from it once, at build time.                                                                                                                                                                                                                                                  |
| `spacing`               | **breaks the application.** `theme.spacing` is a function; deep-merging `{ spacing: 6 }` replaces it with a number, and every `sx={{ p: 2 }}` then throws.                                                                                                                                                                      |

So the registry stores descriptors and `buildTheme` produces a theme from them. Measured at
roughly **0.26 ms per theme**, which is why nothing is prebuilt: a session touches a handful
of the 720 possible combinations, not all of them.

The cache key is `name:mode:font:textSize:density` — five fixed vocabularies, 720 ceiling,
no user input can add a 721st. Motion is deliberately **not** in the key; see §5.

### Text size scales the root, not `typography.fontSize`

For the reason above, and one more: this theme overrides `h1`–`h4` and fifteen custom
variants with explicit sizes, so even a correctly re-derived `fontSize` would move body copy
and leave every heading behind — a setting that half works, which is worse than one that
does not exist.

Instead the text-size preference sets the **root font size** and every typography value is
expressed in `rem`. Eleven were px literals and were converted; at a 16px root they render
identically, and now they scale together.

**This creates a rule for every component: a px font size opts that element out, silently.**
Ten `sx={{ fontSize: … }}` declarations did exactly that, six of them
`variant="h2" sx={{ fontSize: 32 }}` — restating the variant's own 2rem in px, so they
looked like no-ops and were not. Icons are the exception and stay in px: `fontSize` on an
MUI icon is its box, not text, and the five that remain are sized to something fixed (two
sit inside the 70px AppBar and would overflow it).

`display.test.ts` fails if a typography variant returns to px.

---

## 2. Where the brand tokens live, and why that is the wrong shape

Every semantic colour sits under `palette.primary`, so `theme.palette.primary.X` and
`sx={{ color: "primary.X" }}` resolve identically in every theme and mode. That property is
worth having and is why it was done.

It is still the wrong home. `primary` is a `PaletteColor` — an intensity ramp around one
hue, whose `light`, `dark` and `contrastText` MUI derives from `main` — and it is currently
carrying forty unrelated surfaces and inks. `sx={{ color: "primary.hover" }}` reads as a
shade of the brand colour and is a hover ground.

MUI's documented pattern for brand keys is a palette node of their own, which gives the same
resolution with none of the collision: `surface.sidebar`, `ink.navigation`. That is a
~240-reference change and has not been made. The four-times-duplicated module augmentation
**has** been collapsed into one `BrandTokens` interface, which is what turns the remaining
work from a rewrite into a rename.

The augmentation uses `interface X extends BrandTokens {}` with an eslint disable. That is
not laziness: TypeScript merges a declaration into MUI's own only through an `interface`, so
the type alias the rule prefers would not augment anything. The empty body is the mechanism.

---

## 3. A mid-tone brand colour cannot carry text

Two brands hit the same wall and it is worth stating once.

FOLIO's coral `#FF674C` gives white **2.88:1** and FOLIO's own dark blue 3.32:1 — no ink
passes AA on it. Koha's `#547D29` forces white labels at 4.84:1 and leaves no room for an
accent either side: nothing darker clears 3:1, nothing lighter is distinguishable from those
white labels.

The first answer was to darken the brand until it passed — FOLIO's coral was shipped 20%
darker as `#E52300`. A 20% shift is not a shade, and the one thing a brand theme has to get
right is the brand.

**The answer is to stop asking the accent to carry text.** Both brands now put their chrome
on `brandInk` (`#1A1A1A`) with white labels at 17.40:1, and use their real brand colour as
the selected-tab indicator:

|                       | on `#1A1A1A` |
| --------------------- | ------------ |
| FOLIO coral `#FF674C` | 6.05:1       |
| Koha green `#88B744`  | 7.38:1       |

Koha's `#88B744` is the colour that measured 2.05:1 on the old green bar and could not be
used at all. **On a darker bar a brand gets more of itself back, not less.**

### Why an indicator may be an accent where a label may not

WCAG 1.4.11 asks **3:1** of a graphical object against what sits beside it. WCAG 1.4.3 asks
**4.5:1** of text. That difference is the whole mechanism, and it is why `tabIndicator` is a
token with an assertion at the non-text threshold across all eighteen brand × mode
combinations.

It defaults to each brand's own `main`, so the four brands with no separate accent are
unchanged. High contrast deliberately opts out for FOLIO — its pale bar leaves coral at
2.44:1, and a user who has asked for maximum contrast is not the person to spend the brand's
last legible margin on.

That assertion found a real defect the day it was written: **Koha's indicator was its own tab
bar colour, 1.00:1**, while the token's comment claimed active state was "carried by the Tabs
indicator". It was carried by bold weight alone.

### Hover grounds are text grounds

`headerHover` and `headerActive` are derived from `header` by `lighten()`, which moves the
bar **towards** its own white label — so the affordance and the legibility pull against each
other and the right amount is per-brand.

The first attempt keyed off `getLuminance(header) < 0.5`. That is useless here: every header
is dark, from `#000000` to `#005EB8`, so the branch always took one side — and taking the
dark side lifted mid-dark bars by 0.28, dropping Evergreen's pressed state to 3.97:1 and NHS
blue's to 3.61:1. Both under AA, on text that had been fine before.

`liftWithin` therefore makes the constraint the answer: try the boldest lift first, take the
first that keeps the header text above the same floor the contrast gate holds it to. A
near-black bar takes the full 0.28 (white still 6.91:1); NHS blue settles at 0.16 for 4.65:1.

The contrast gate now includes both hover grounds, which is what turned a plausible-looking
heuristic into two named failures with numbers attached.

---

## 4. `blueAndWhite` is the NHS palette

Its tokens, variable names and comments are the NHS identity; only the theme's id is
neutral. Every other brand is named for its owner. If the rename is a deliberate trademark
decision it should be recorded as one, because the next person will otherwise "fix" the
inconsistency.

---

## 5. Display preferences

Text size, spacing and animation, plus the typeface picker, all per user and all in
`localStorage`. There is no user-preferences API yet; the sign-out purge in
`helpers/appBase.ts` clears them with everything else the app owns.

`mode` holds **null for "follow my device"**, and `useResolvedMode` is the only place that
resolves it. Two properties matter:

- **Contrast outranks colour scheme.** Asking the OS for more contrast is an accessibility
  request; answering it with dark mode because the user also asked for dark answers the
  smaller of the two. This application has a high-contrast theme and, before this, never
  offered it to the people who had already said they needed one.
- **Subscribed, not sampled.** The previous store read `prefers-color-scheme` once at module
  scope and immediately persisted the answer as a concrete choice, so the OS switching at
  sunset did nothing — and nothing on the next visit either.

`resetDisplay` deliberately leaves the brand theme alone: that is a deployment's identity,
not an accessibility setting, and resetting it would surprise somebody who only wanted their
text size back.

### Motion is CSS, not a theme value

`system` writes no attribute at all, so `@media (prefers-reduced-motion: reduce)` answers the
default case on first paint with no JavaScript. An explicit choice stamps `data-motion` on
`<html>`; `:not([data-motion="full"])` is what lets a user override an OS setting that is not
theirs — a shared workstation is exactly where that matters.

Expressing it this way also reaches animations MUI knows nothing about, and keeps motion out
of the theme cache key.

**`!important` is correct in those two rules and nowhere else in this application.** MUI's
transition components write `transition-duration` as an inline style at runtime, and no
stylesheet rule beats an inline declaration by specificity. `0.01ms` rather than `0`: a zero
duration skips `transitionend`, and MUI's own transition callbacks wait on it.

---

## 6. Windows High Contrast Mode

Not the same thing as the high-contrast palette on `/settings`. That is a scheme a user opts
into and this application controls. WHCM is the operating system's `forced-colors: active`,
where the OS discards author colours wholesale, and which many low-vision users run
permanently. Nothing the theme decides about colour reaches them. What reaches them is
whether a control still has a **boundary** once its background has been thrown away.

`enhanceHighContrast` wraps `createTheme` — it takes a built theme and returns an enhanced
copy — and adds `@media (forced-colors: active)` rules to 21 components. It **composes**
rather than replaces: each slot becomes `[ourOverride, itsHcmRule]`, so the components this
theme already styles keep everything it says about them. Applied to every brand and mode,
because forced colours are orthogonal to which palette was chosen, and with the default
tokens, which must be CSS system colour keywords.

**It is not sufficient on its own.** Measured under forced colours, a contained button
computed to background white, colour black, `border: 0px none` — pixel-identical to the body
text beside it. MUI says "this is a control" with a fill, and a fill is exactly what forced
colours discards; the enhancer gives `MuiButtonBase` a focus outline and nothing more. The
`MuiButton` override adds `border: 1px solid ButtonBorder` under the same media query.

**Cost:** the enhancer is +13.4 KB on every page load, about 2% of the payload.

---

## 7. Adding a brand

1. Add its token set beside the others, spreading `openRSLight` / `openRSDark` /
   `openRSHighContrast`.
2. Add it to `THEME_TOKENS`. Nothing else — the contrast gate is driven by
   `THEME_NAMES × THEME_MODES`, so a new brand is measured the moment it exists. That
   property is what makes adding one safe.
3. If its accent cannot carry text, give it `brandInk` chrome and put the accent on
   `tabIndicator`. See §3.
4. Run `npx vitest run src/themes`. Failures name the token pair, both colours and the ratio.

A brand whose tokens cannot pass has not earned its place; fix the tokens rather than the
threshold.

## The discovery preview

The Setup chapter's preview draws the discovery app from the values in the form rather than
framing the live app, which would need its origin reachable from the console and a
frame-ancestors decision for the sake of a thumbnail. It is an approximation and says so on
screen.

It follows symposia-ui's arrangement (symposia-ui/docs/brand-chain.md). The consortium's name
and its square icon sit in the app bar, which the discovery app shows on every screen. The
landing plate carries the logo, the task line and the welcome sentence. **A consortium with no
logo shows no mark**: the name is not set large in its place, and no other mark is borrowed.

Every image passes `isValidLogoUrl`, the check symposia-ui runs on read and dcb-service runs on
write, so the preview cannot show an image the patron app would refuse. The arrangement is
`previewArrangement` in `src/constants/discoveryBranding.ts`, which is where it is tested. The
no-photograph gradient is kept in step with symposia-ui/docs/hero-canvas.md by hand.
