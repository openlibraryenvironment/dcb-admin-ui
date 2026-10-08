# Grids fed by `/sql`

Two grids in this application are fed by `dcb-service`'s named-SQL endpoint rather
than by GraphQL, and they crashed because of it.

## What the endpoint returns

`GET /sql?name=<name>` runs `src/main/resources/namedSql/<name>.sql` through
`GenericSelectService`, which reads the result set's own column metadata and returns
one `HashMap` per row under `hits`. **The shape is whatever the query selected.**

`errorOverview.sql` selects exactly five columns:

```
description   namedSql   total   mostRecent   earliest
```

and each of the 55 files under `namedSql/errors/` selects its own set — the
drill-downs typically `Date`, `Requester`, `Supplier`, `RequestId`, `RequestURL`,
`URL`.

**None of the 56 selects an `id`.** Where a row id appears at all it is interpolated
into a `concat()` for a URL, not exposed as a column.

## Why that crashed the page

MUI X does not tolerate a row without an id. `checkGridRowIdIsValid` does not warn:

```js
if (id == null) {
  throw new Error('MUI X: The Data Grid component requires all rows to have a
    unique `id` property. Alternatively, you can use the `getRowId` prop ...');
}
```

Both Request Errors grids passed `rows={records?.hits ?? []}` with no `getRowId`, so
the grid threw as soon as the query matched anything. `queryClient`'s `throwOnError`
sends everything that is not a 401 or a 503 to the router boundary, and
`defaultErrorComponent` renders the generic error page — so the symptom was not a
console message but "the Request Errors page is broken", for every consortium with
any error to show. An empty result worked fine, which is why it looked intermittent.

## The fix

`withRowIndexIds` adds `id: <index>` as the rows arrive. The index is the only key
available: the column set differs per query, so nothing else is common to all 56, and
two rows can be identical in every selected column — a count of the same description
under two named queries — so the id cannot be derived from the content either.

It is sound here because **both grids are read-only**: no selection, no row editing,
no optimistic update. Row identity therefore never has to survive a refetch, which is
the one thing an index-based id cannot do.

## If you add another `/sql`-backed grid

Use `withRowIndexIds`, and keep the grid read-only. If it ever needs selection or
editing, the id has to come from the data instead — which means adding a real id
column to the named SQL in `dcb-service` and using `getRowId` against it. A
positional id plus row editing is how you edit the wrong record after a sort.

## Audit of the other grids

All 53 `DataGrid` mount sites were checked. The other 51 are safe, and for one of
three reasons: their rows come from a GraphQL collection that selects `id`; they are
built locally with an explicit `id` (`ConsortiumDetails`, `VersionInfo`,
`CombinedEnvironmentComponent`, `parseClusteringAuditLog`, the identifiers grid's
`${member.id}-${index}`); or they are patron-request rows passed through from a
mutation's result. No other grid is fed an endpoint whose shape it does not control.

## A separate thing worth fixing upstream

`namedSql/errors/*.sql` interpolate a hardcoded
`libraries-dcb-hub-admin-scaffold-uat-git-production-knowint.vercel.app` URL into
their `URL` column. That is a dead preview deployment from the Next.js era, and it is
in `dcb-service`, not here. Raised rather than fixed: this repository cannot reach it.
