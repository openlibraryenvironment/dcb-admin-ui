# The Insights view: its window and its scope

Why the date range control and the library scope are built the way they are. Both are
state in the URL, both have to be turned into something the statistics endpoints accept,
and each has a failure mode that is invisible in a diff.

Code: `src/helpers/insightsSearch.ts` (the view as the URL states it),
`src/helpers/insightsRange.ts` (windows), `src/helpers/insightsScope.ts` (scopes),
`src/hooks/useInsightsView.ts` (the writers), `src/queryOptions/libraries.ts`
(`insightsScopeOptionsQuery`), `src/routes/__authenticated/consortium/insights.tsx`.

## The window

The URL carries two plain dates, `from` and `to`. That is what `z.string().date()`
accepts, and it is what somebody reading a shared link can read. Every `/insights/*` date
parameter on `dcb-service` binds a `java.time.Instant`, so `customRangeToParams` converts
at the edge — local midnight to local end of day, because the day a reader picked is the
day in their own zone. A date-only string sent to `@QueryValue Instant` is not a window
the service can parse, and an instant written into the URL is rejected by the schema and
caught to `undefined`, which silently reverts the reader's choice to the preset.

### The control reports one end at a time

`DateRangePicker` fires `onChange` per click in the calendar and per date completed in
the field, not once per range. Three rules follow, and dropping any one of them makes the
control impossible to use at all — no range can be entered by calendar or by keyboard:

1. **Write each end as it arrives.** `resolveSearch` exposes `customEnds`, either end and
   possibly null, for the control; `custom` stays null until both are in, because half a
   window is not a window to query. A parent that only committed a complete pair discarded
   every first click.
2. **The `value` prop must be referentially stable.**
   `@mui/x-date-pickers/internals/hooks/useField/useFieldState.js` compares it with the
   last one it saw using `!==` and re-derives the editable sections when they differ. A
   fresh `[start, end]` array on each render therefore wipes whatever has been typed, and
   this dashboard re-renders as each of twenty panels settles — so entering a date by hand
   was a race against the queries. Hence the `pickerValue` memo.
3. **Never write null over an end already chosen.** While one end is mid-entry the field
   reports the pair as invalid. Writing null then drops the other end from the URL and
   triggers rule 2. `chosenDate()` is the three-way distinction: cleared, chosen, or
   mid-entry.

### Date order

`AdapterDayjs.formats.keyboardDate` is dayjs's localized `L` token, so the order the
fields read depends on the adapter's locale. The range picker sits inside
`DateLocalization` (`src/components/DateLocalization`), the one provider every date
picker uses, which takes that locale from the deployment's `VITE_LOCALE` and the user's
choice: `DD/MM/YYYY` for en-GB, `MM/DD/YYYY` for en-US. Hard-coding a locale here would
make `09/01/2026` a different day to the control than to a reader on the other one.

## The scope

The URL carries the _selection_ — `group:<id>,library:<id>` — and never the Host LMS codes
it resolves to. Storing codes would restore the figures and lose the chips, and a group
that gained a member would quietly mean something different on reload.

Resolving a selection into codes needs the library list, which is why
`insightsScopeOptionsQuery` sits on `allLibrariesQuery`'s key rather than fetching its
own copy: the route resolves the URL's scope in its loader and the selector renders the
same list, and they must be one cache entry. When the selector had a key of its own, the
page could not know the codes a scoped link named until a second copy of the list arrived
— so it asked every endpoint for the whole consortium first and corrected itself, which is
two rounds of the heaviest queries the service runs and a header showing the reader
somebody else's figures.

`throwOnError: false` is set on that query as the dashboard's own policy, not the key's: a
library list that fails costs the reader the scope control, and the twenty panels that
work should stay on screen. That is the same judgement `panelQuery` makes for each of them.

### The loader is a fast path, not the guarantee

The loader resolves the scope before anything is asked for, so a shared scoped link
arrives with its figures already cached. It cannot be relied on: its
`auth?.isAuthenticated` guard means it does not run until OIDC has restored the session,
which on a cold load it often has not. The component therefore gates on the same list —
until the codes are known, a link that names a library has no question to ask, and the
dashboard is not mounted. A link with no scope never waits.

The loader reads `location.search` rather than declaring `loaderDeps`. Declaring the scope
a dependency would re-run the loader, and so delay the chips on a round trip, every time
the reader changed the selection.
