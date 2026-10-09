# Query error policy

Which failures replace the page, and which ones a component is expected to render itself.

## The default

`src/application.tsx` builds the `QueryClient` with

```ts
throwOnError: (error) => {
	const status = error?.response?.status;
	return status !== 401 && status !== 503;
},
```

so **every** query failure other than a 401 or a 503 is thrown to the route's
`errorComponent`, which `createRouter`'s `defaultErrorComponent` sets to `GlobalError`
for all 85 routes. That is deliberate: a route whose subject cannot be loaded has nothing
to show, and an unstyled TanStack default panel printing raw error text is worse than a
translated one.

A 401 or a 503 is _not_ thrown, because `handleServiceErrors` owns those: a 401 spends one
silent token renewal before tearing the session down, and a 503 navigates to
`/maintenance`. During the renewal window the query is in its error state and the
component renders, so a local `if (isError)` branch is the UI a user actually sees there.
Those branches are not dead code.

## The problem the default creates

The policy cannot tell the difference between a route's subject and a label beside it.

`/patronRequests/$id` has one primary query — `["patronRequest", id]` — and eight more that
exist only to turn codes into names: the patron's identity, the pickup location, the pickup
library, the patron's Host LMS, its agency, its library, and the supplying library. Under
the default, any one of those failing replaces the whole patron request with `GlobalError`.
The same shape appears wherever a component resolves something for display: a grid cell's
location name, a dropdown's options, a wizard step's agency list, the
`libraryUserProvisioningAvailable` capability probe.

This was not theoretical. `/mappings/allReferenceValue` fetched `LoadHostLmsCodes` for one
dropdown in the new-mapping form; in e2e that operation was unmocked, 404'd, and destroyed
the page about two seconds after load — which is why three export tests passed only by
finishing first. See the commit that added `throwOnError: false` there.

## The rule

A query whose data is not what the route is for spreads `nonCriticalQuery`
(`src/helpers/queryPolicy.ts`):

```ts
import { nonCriticalQuery } from "@helpers/queryPolicy";

const { data, isError } = useQuery({
	...nonCriticalQuery,
	queryKey: ["locationForGrid", locationId],
	queryFn: /* … */,
});
```

The component then handles its own failure, which is the point: the nineteen panels that
worked stay on screen. `panelQuery` in `src/helpers/statsApi.ts` is the Insights
dashboard's name for the same constant, kept because it reads better at its 25 call sites.

**Deciding which it is.** Ask what the route is _named_ for. On `/patronRequests/$id` the
patron request is primary and the pickup library's name is not. On `/locations/$locationId`
the location is primary. If the page is still worth showing with the data missing, the
query is non-critical.

## Retrying a fan-out

Separate policy, same file. `GET /items/availability` becomes one request per Host LMS to
third-party systems we do not own, so the client's default `retry: 1` doubles that fan-out
even for a 400 or a 404 that cannot succeed on a second attempt — and
`/search/$clusterId/items` fires two of them concurrently, so one mount was up to four
fan-outs. `lmsFanOutQuery` keeps the default's attempt budget for a 5xx or a network
failure and allows exactly one attempt for a 4xx. It is applied at all four
`/items/availability` call sites, and `src/helpers/queryPolicy.test.ts` pins both halves.

## One request per list page

The five patron request tabs each need one page of rows plus all four tab counts.
`/patronRequests/all` always had them in one aliased operation,
`GetPatronRequestDashboard`; the other four fetched their rows and then four separate
`LoadPatronRequestTotals`, so a cold visit to `/patronRequests/active` cost five requests
where one does. `patronRequestDashboardQuery` in `src/queryOptions/` is that one request,
and all five routes use it.

Its `allQuery` variable is the ROWS the page lists, not the "all" bucket — the document
was written for the one caller that happened to list everything. The factory's `select`
normalises the response to `{ rows, totalSize, counts }` so no route reads the alias and
nobody has to know.

**The trade.** Four requests became one, and with it the independent failure those four
had: the counts carried `nonCriticalQuery`, so a failing count used to leave the rows on
screen. Now a failure takes the page, which is the right answer anyway — the rows are what
the route is for, and they were in the same breath.

`totalSize` is the row total WITH the user's filters applied; `counts` are the bucket
totals without them. Both are needed: the tab bar shows unfiltered counts, and the filter
indicator compares the two.

## Gate

`e2e/degraded-data.spec.ts` mocks only a route's primary operations and asserts the page's
main content is still on screen after the crash window has passed. It fails on every one
of the call sites listed above if the policy is removed from them.
