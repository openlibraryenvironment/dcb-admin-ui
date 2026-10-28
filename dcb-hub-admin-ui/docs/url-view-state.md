# View state in the URL

A grid's filters, sort, page, page size and columns are written in its page's URL, in a form a
person can read and share. The same grammar is used by the other admin app and the discovery UI's
search; each carries its own copy of the codec, `src/helpers/viewState/urlViewCodec.ts`, and must
pass the shared cases in `src/helpers/viewState/url-view-state-fixtures.json`. That file is
compared across the repositories, so **change it in all three or not at all**.

```
/patronRequests/all?filters=status:SUBMITTED_TO_DCB,CONFIRMED&filters=title:contains:local+history
                   &sort=dateCreated:desc&page=2&pageSize=50&hide=id,sourceSystem
```

## The grammar

| State                   | Parameter             | Form                                                                                           | Left out when           |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| Filter                  | `filters`, repeated   | `field[:operator]:value`                                                                       | no filter               |
| Any of several values   | —                     | `status:A,B`                                                                                   | —                       |
| Combine filters with OR | `logic`               | `or`                                                                                           | AND, the default        |
| Sort                    | `sort`                | `field:asc` or `field:desc`, comma-separated; `none` for explicitly unsorted                   | the grid's default sort |
| Page                    | `page`                | **one-based**                                                                                  | the first page          |
| Page size               | `pageSize`            | one of the grid's options                                                                      | the grid's default      |
| Columns                 | `hide`, `show`        | comma-separated fields, relative to the grid's defaults                                        | nothing differs         |
| Pinned columns          | `pinLeft`, `pinRight` | comma-separated fields, in pinned order                                                        | nothing pinned          |
| Column order            | `order`               | the fewest leading fields that, followed by the rest in default order, give the reader's order | the default order       |
| Aggregation             | `agg`                 | `field:function`, comma-separated; `none` for explicitly none                                  | nothing aggregated      |

Field names are the grid's column `field`. Values are the server's values, never translated labels,
so a link means the same in every language.

Columns are pinned from the column menu, and moved with **Move left** and **Move right** there as
well as by dragging the header (WCAG 2.2 SC 2.5.7: no drag-only interaction). Pinned columns are not
part of `order`: pinning one does not write an order. A field the grid does not render is dropped
from either, and a column added later takes its default place.

`agg` is read only by a grid that holds every row client-side, where an aggregate totals the whole
list: catalogue metrics and a cluster's explanation (`aggregation: true` on the `GridViewSpec`). A
server-paged grid would total one page, so it neither reads nor writes `agg`. A function the
column's type is not offered is dropped.

Column widths, density and selection are never in the URL. Popups (the column menu, the filter
panel) render inside the grid's landmark or dialog, not at the end of `<body>`.

### Operators

The operator is left out for equality. Otherwise: `not`, `contains`, `phrase`, `notContains`,
`startsWith`, `endsWith`, `from` / `to` (on or after / on or before), `after`, `before`,
`between:<start>..<end>` (either end may be empty), `min` / `max` / `over` / `under` (`>=`, `<=`, `>`,
`<`), and `empty` / `notEmpty` / `last30Days` / `last90Days`, which take no value.

Each grid operator maps to one of these words; a word offered by more than one operator (`is` for
equals and any-of) is read back as whichever the column offers. A filter whose field or operator the
grid does not offer is dropped, as is a value of the wrong type for its column.

### Escaping

The codec reads values **after** the router has percent-decoded them, so its separators cannot be
percent-escapes:

- In a list of values, a comma inside a value is `\,` and a backslash is `\\`.
- An equality value that would read as something else is written with an explicit `is`:
  `note:is:empty`, `note:is:contains:x`. The codec checks its own output and only does this when the
  short form would decode differently.
- A `between` bound cannot contain `..`.

### Several grids on one page

A page's main grid uses the bare names. Any other prefixes every name: `notShown.filters=…`,
`notShown.page=2`. The namespaces in use:

| Namespace   | Grid                                                            |
| ----------- | --------------------------------------------------------------- |
| `notShown`  | A cluster's items that the standard availability check left out |
| `secondary` | A library's mappings for its second Host LMS                    |
| `audit`     | A patron request's audit log, on the request's page             |

## What never goes in a URL

Filters on a patron's barcode or a requester's note, and quick-search text, are kept in the tab's
history entry instead. A URL reaches host request logs, every asset's `Referer`, a shared desk's
browser history and wherever it is pasted.

A filter whose value is longer than a URL value may be is kept there too, so it still filters the
grid. The one that occurs is a pickup library with many locations: its value is every location's id.

Either way the grid still applies the filter after Back, Forward and a reload of that tab, and the
grid's `hasPrivate` says a copied link will not carry it.

Every grid with a URL has **Copy link to this view** in its toolbar. It first writes a filter still
waiting on the 500 ms debounce, so the link is the grid as shown, then copies the address. When a
private filter is in force, the confirmation says what the link leaves out.

## Where a view comes from

1. **The URL**, when it carries any of the grid's parameters. It is the view.
2. **The reader's last view of the grid**, when the URL carries nothing at all and the grid remembers.
   It is written into the address before the page loads, and the grid says "Showing your last view"
   with a Reset beside it.
3. **The grid's defaults** otherwise.

A link that carries anything else, such as an Insights drill-down's `q`, is a link: nothing is
restored over it. Filter typing reaches the address after 500 ms.

**Back.** The first change the reader makes on a visit adds one history entry; every later change
on the same visit replaces it. So Back once returns to the view the reader arrived with (the
defaults, their last view, or the link they opened) and Back again leaves the page. Typing and
paging never add entries, and Back from a record returns to the list as it was left. The entry
Back returns to is marked as the grid's, so it is not taken for a bare address and given the last
view in its place. DCB Admin for Libraries behaves the same.

The last view changes **only when the reader changes something**: a filter, the sort, the page size
or the columns. Opening a link, paging through it, pressing Back or opening a filter row without
finishing it never replaces it, so one drill-down
cannot overwrite somebody's working queue. The page is never remembered. Last views are kept per tab
in session storage, for at most 50 grids, and cleared at sign-out.

Which grids remember:

- **Yes:** the patron request tabs, the consortium-wide lists (libraries, locations, agencies, Host
  LMSs, groups, bibs, mappings, alarms, the data change log, the audit explorer, request errors,
  catalog metrics).
- **Yes, per library or group:** a library's request tabs, supplier requests, bibs, locations and
  mappings, and a group's patron and supplier requests. Each library and group has its own.
- **No:** one record's grids (a request's audit log; a cluster's items, identifiers, explanation and
  requesting history), the requests behind one error category, `/search`, and the libraries list on
  the home page. A bare search is a new search, and a landing page that reopened a stale filter would
  surprise.
- **No URL at all:** grids without a toolbar, which have nothing to share but their page: consortium
  contacts, a cluster's members and the onboarding list.

## Through sign-in

A link opened while signed out comes back to its view once the reader signs in. The whole address,
search and hash included, is carried as `/login?redirect=` and kept in session storage across the
identity provider's round trip. A page whose session ends on a refused request goes to
`/logout?redirect=` the same way, and signing in again from there returns to it.

Two things do not come back:

- **Private filters.** They live in the tab's history entry, and signing in is a new page load.
- **The page after the 30-minute idle sign-out.** That sign-out goes through the identity provider's
  logout, and the address is not sent there, so signing in again opens the home page.

`e2e/url-view-state.spec.ts`, "A view's link through sign-in", signs in against a stand-in identity
provider for both routes.

## Adding a grid

- Define the grid's `GridViewSpec` in `src/constants/dataGrid/gridViews.ts`: its id, default sort,
  page size and options, default columns, and whether it remembers (see above). A library's or a
  group's grid scopes it with `scopedView(spec, libraryId)`, in the route options and the component
  alike.
- A server grid's page query comes from `serverGridQuery` (`src/queryOptions/serverGrid.ts`), called
  by the loader and the component, with the key root the grid's edits invalidate.
- The route's `validateSearch` keeps the grid's parameters as they arrive. The hook reads them against
  the columns the grid actually renders, so a field or operator the grid does not offer is dropped.
- The route's `beforeLoad` throws `redirect` with what `rememberedViewRedirect`
  (`src/helpers/viewState/viewRoute.ts`) returns, when it returns anything. Its loader prefetches
  `defaultQueryModels`, which are the grid's defaults, or nothing when the URL carries a view.
- Route options outside the component are not code-split, so nothing they import, statically or
  dynamically, may reach MUI X. Reading a view needs the grid's columns and so MUI X; doing it in the
  first grid's loader split the shared grid chunk and added 18 to 27 KB gzipped. A linked view is
  fetched by the grid itself.
- Two more ways a route file costs bytes, each about 2 KB gzipped per route, measured when 20 routes
  did it at once. A component that reads `Route` (`Route.useSearch()`) imports the route module into
  its lazy chunk, and anything declared in the file that both the route options and the component use
  is split into a module of its own. Either way the route gets a chunk of its own, with its own
  preload list. So the component reads `useSearch({ from: "<route id>" })`, and a query factory or a
  view the two share lives in `src/queryOptions/gridQueries.ts` or `gridViews.ts`.
- The component calls `useGridView(spec, columns, search)` and passes its models and change
  handlers to the grid. The server query reads `appliedFilterModel`, which lags the panel by the
  debounce.
- A second grid on the page takes a `namespace`; the route validates it with
  `validateGridSearch(search, [namespace])` and restores every grid with `rememberedViewsRedirect`.
- A grid in a shared component (`MappingsGrid`, `OperatingWelcome`) reads the URL with
  `useSearch({ strict: false })`; its route still validates the parameters and restores the view.
- `src/helpers/viewState/gridRoutes.test.ts` fails for a grid route that misses either.

## Old links

Links written before this format still open the view they opened. A page number in an old link is
zero-based; it is read that way when the link is recognisably old (it carries a JSON filter list or a
JSON array), and otherwise one page earlier than before, with its filters and sort intact.

## In the address bar

`src/helpers/viewState/searchSerialiser.ts` is the router's `stringifySearch`. The router's default
parser is kept unchanged: it already reads a repeated key as an array, and it still reads every link
written in the old JSON form, so changing only the writer keeps old links working.

- An array is written as its key repeated, never as JSON. One element reads back as a plain string,
  so a list parameter's schema accepts a string or an array. An empty array is written as the key
  with no value (`series=`), which the list parameters read as an empty list, as they read `[]`.
- `:`, `,` and `/` are left raw and a space is written `+`; everything else is percent-encoded.
- A string is quoted as JSON only when the parser would otherwise read it as something else
  (`"123"`, `"true"`, `"[1]"`), as the default writer did. The writer asks the parser itself, so the
  two cannot disagree.
