# Right-to-left

**This application does not support a right-to-left language today, and nothing here
claims it does.** What this records is the position, so a bid can state it accurately
and so the cost of changing it does not quietly grow.

## Where it stands

| | |
| --- | --- |
| Theme `direction` | not set |
| `dir` on `<html>` | not set |
| `stylis-plugin-rtl` | not a dependency (`stylis` is present, as an emotion dependency) |
| Locales shipped | `en-GB` only |
| Physical CSS properties in `sx`/`styled`/theme | **0** — converted, and a lint rule holds it |

## What MUI would need

The supported route is three things: `createTheme({ direction: "rtl" })`, `dir="rtl"`
on the document element, and an emotion `CacheProvider` whose cache uses
`stylis-plugin-rtl`. The plugin rewrites physical declarations at the CSS layer, so
`margin-left` becomes `margin-right` and `text-align: left` becomes `right`.

## Why logical properties anyway

The plugin would flip `marginLeft`, so converting was not strictly required. Two
reasons it was done:

- **It works without the plugin.** `marginInlineStart` already does the right thing in
  a `dir="rtl"` subtree, so a future switch is a theme change rather than a build-chain
  change plus a sweep of every `sx` in the tree.
- **It says what was meant.** "Start" is the intent; "left" is an implementation of it
  that happens to be correct in one direction.

Fifty call sites were converted — the longhands (`marginLeft`, `paddingRight`,
`borderLeft`…) and MUI's physical shorthands (`ml`, `mr`, `pl`, `pr`). `textAlign:
"center"` was left alone: it is direction-neutral.

`no-restricted-syntax` in `eslint.config.mjs` now rejects all ten names. It was seen
failing on a probe carrying `marginLeft` and `pr` before being recorded here.

## What is still in the way

Converting properties was the cheap part. These are not done, and are the real estimate
if a bid needs RTL:

- **Directional icons.** `ChevronRight`, `ArrowBack`, the sidebar collapse toggle and
  the breadcrumb separator all point one way. MUI ships no logical icon set, so each
  needs flipping under `theme.direction`.
- **MUI X DataGrid.** It supports RTL, but this application mounts it on fifty surfaces
  with custom toolbars, pinned columns and a detail panel. Supported is not the same as
  tested.
- **Charts.** `x-charts-pro` axis placement and the legend are laid out left-to-right.
- **A gate.** Without a Playwright project running `dir="rtl"`, any of the above rots
  on the first change after it ships.

## What to say in a bid

"The stack supports right-to-left; it is not currently enabled or tested." That is
accurate in both directions, and it is the sentence `tender.md` asks for rather than a
claim or a denial.
