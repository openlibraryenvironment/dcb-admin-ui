# Large grid exports

How the "filtered" and "all" export scopes behave on a patron request grid holding
tens or hundreds of thousands of rows, and why the code is shaped the way it is.

Code: `src/helpers/dataGrid/fetchExportPages.ts` (paging, auth, retry),
`src/helpers/dataGrid/serialiseExportRows.ts` (serialisation),
`src/hooks/useGridExport.ts` (the export engine every server-driven grid uses).

## What an export costs

A server-fetched export pages the grid's whole result set at 1000 rows per
request, sequentially. For 100,000 patron requests that is 100 requests; for
300,000 it is 300.

Each of those requests is expensive on `dcb-service`, for two reasons that live
there rather than here:

- **Offset paging.** `DataFetchers.getPatronRequestsDataFetcher` builds
  `Pageable.from(pageno, pagesize)`, which is `OFFSET n LIMIT 1000`. Page 200
  makes Postgres walk and discard 200,000 rows, so the total cost of an export
  grows with the square of the dataset. The `Page` return type also issues a
  `COUNT(*)` over the filtered set on every request.
- **N+1 on nested fields.** `suppliers`, `clusterRecord` and `requestingIdentity`
  are wired to per-row data fetchers with no batching, and the export query asks
  for all three. A 1000-row page is roughly 3,001 database round trips.

Keyset pagination, a `Slice` return type on the export path, and DataLoader
batching would each cut this substantially. All three are `dcb-service` changes.

## Why the export outlives its access token

An export large enough to matter runs for longer than a Keycloak access token
lives. In 2.0 the bearer token was read once, when the component rendered,
and reused for every page. `automaticSilentRenew` replaced the token on schedule,
the running loop never saw it, and every request after the expiry returned 401.

The export path calls `graphql-request` directly rather than going through
TanStack Query, so it never reaches the session recovery in `application.tsx`,
which is wired to `QueryCache` and `MutationCache` only. The 401 landed in a
`catch` that discarded every page already fetched.

That failed at a **fraction** of the dataset rather than at a fixed row count,
because it is a wall-clock limit divided by a total run time. Users reported
exports dying around 30-40%, which puts the full run at roughly 13-17 minutes
against a five-minute token lifetime.

`fetchExportPages` resolves the token per request and spends one silent renewal
on a 401 before giving up. `useGridExport` prefers the token that renewal
returned until React has pushed it into the router context, which is a render
later than `signinSilent()` resolving.

## Why a page is retried

Three hundred sequential requests, some of them slow deep pages, make one
transient failure likely rather than exceptional. A transport error, a 429 or a
5xx is retried up to three times with exponential backoff. A 4xx is not: a
malformed query will not fix itself.

## Why rows are not accumulated

Each page is serialised to text and the rows behind it are released immediately.
Accumulating the whole result set meant four live copies at peak: the raw rows,
their flattened form, a single contiguous string of the file, and the Blob. At
the top of the range that alone can exhaust the tab.

## What is deliberately not done

- **Concurrency.** Paging is sequential. Fetching pages in parallel would cut
  wall clock roughly in proportion, but it multiplies the N+1 load on
  `dcb-service` by the same factor. That is a decision to take with a
  measurement, not a default.
- **Resuming a failed export.** A failure still discards the run. Retry and
  renewal remove the causes we have seen; partial-file recovery would need a
  stable sort key the backend does not currently page on.
