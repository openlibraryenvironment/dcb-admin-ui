# `auditIncidence` aggregation (dcb-service)

> **Status: DONE.** Shipped on `audit-explorer`. The client-side stopgap
> (`bucketTimestamps` + a 1000-row cap in `AuditIncidenceChart.tsx`) is gone;
> Postgres does the aggregation and the browser receives buckets.

## Why

The Audit Explorer lets operators search patron-request audits by brief
description ("Virtual checkout failed", "Read timeout", …) and monitor their
**incidence over time**. Incidence is a `GROUP BY time_bucket` aggregate over
the whole matching set. Doing it in the browser meant:

- transferring up to 1000 rows per view, and
- covering only the most recent 1000 events when a signal is more frequent.

Both are gone now that Postgres does the aggregation and returns a handful of
buckets.

## GraphQL contract (as shipped)

```graphql
type AuditIncidenceBucket {
	"ISO-8601 start of the interval (UTC)."
	bucketStart: String!
	count: Int!
}

type AuditIncidence {
	"Echoed back so the client can label the axis: HOUR | DAY | WEEK."
	interval: String!
	"Total matching audits across the whole window (sum of bucket counts)."
	totalSize: Int!
	"Continuous, gap-filled, ascending by bucketStart."
	buckets: [AuditIncidenceBucket!]!
}

extend type Query {
	auditIncidence(
		"Same Lucene semantics as audits(query:). Reuses the SAME translation."
		query: String
		"HOUR | DAY | WEEK. Default DAY."
		interval: String
		"ISO-8601 inclusive lower bound. Optional."
		start: String
		"ISO-8601 exclusive upper bound. Optional."
		end: String
	): AuditIncidence!
}
```

The `query` argument flows through the identical query→predicate translation the
`audits(query:, …)` resolver uses. If the two diverged, the chart and the grid
beneath it would disagree — the one thing this feature cannot do.

## How it is built, and why not the obvious way

The original plan here said: run the shared specification inside one `date_trunc`

- `GROUP BY`. **That is not buildable.** `QueryService` returns a Micronaut Data
  `QuerySpecification` — a JPA criteria lambda — and Micronaut Data's criteria
  implementation rejects `groupBy`/`having`
  (`AbstractPersistentEntityQuery#groupBy` throws "Not supported operation!",
  still the case in the 5.0.4 this build resolves). The aggregate cannot be
  expressed through the criteria API at all.

`AuditIncidenceService` therefore lets the framework render the shared
specification into SQL exactly as it would for `findAll(spec, …)` — via
`PersistentEntityQuery#build` with the repository's own `AnnotationMetadata`, so
the dialect and the `$n` parameter format match — and wraps that rendering in the
aggregate:

```sql
WITH matched(audit_date) AS ( <framework-rendered predicate, projecting audit_date> ),
bucketed AS (
	SELECT date_trunc('<unit>', audit_date) AS bucket_start, count(*) AS bucket_count
	FROM matched WHERE audit_date IS NOT NULL <window> GROUP BY 1
),
bounds AS (
	SELECT coalesce(<lo>, min(bucket_start)) AS lo,
	       coalesce(<hi>, max(bucket_start)) AS hi FROM bucketed
)
SELECT series.bucket_start, coalesce(bucketed.bucket_count, 0)
FROM bounds
CROSS JOIN LATERAL generate_series(bounds.lo, bounds.hi, interval '1 <unit>') AS series(bucket_start)
LEFT JOIN bucketed ON bucketed.bucket_start = series.bucket_start
ORDER BY 1 LIMIT <cap>;
```

The predicate and its bound parameters are the framework's; only the bucketing
around them is hand written. One statement, one round trip, and the JVM never
sees an audit row — the result is bounded by bucket count, never by audit-row
count. The projected column is reached positionally through the CTE's
`matched(audit_date)` alias list, so whatever the framework names it is
irrelevant.

Other notes:

- **`interval` is validated against a server-side enum** (`AuditIncidenceInterval`)
  which owns the `date_trunc` literal. The raw client string never reaches SQL.
  Unknown value → rejected, never silently defaulted.
- **Gap-filled server-side** via `generate_series`, so a quiet period renders as a
  flat line rather than a hole. An explicit `start` gap-fills from the requested
  edge rather than the first matching audit.
- **`end` is exclusive**, so the last bucket is the one holding the final instant
  before it — hence the `- interval '1 microsecond'` step back in the upper bound.
- **Bucket cap.** `generate_series` with HOUR over a multi-year window would ask
  for tens of thousands of rows. The series is capped and _exceeding it is
  reported_, not silently truncated — a quietly clipped chart is worse than an
  error.

### Two corrections to the original plan

1. **No `AT TIME ZONE 'UTC'`.** `audit_date` is `timestamp` _without_ time zone
   holding UTC `Instant`s, so `date_trunc` is already UTC. Applying
   `AT TIME ZONE 'UTC'` would convert it to `timestamptz` and re-render it in the
   session zone — introducing exactly the drift it was meant to prevent.

2. **The description filter was not `contains`.** The grid sent `containsPhrase`
   → `briefDescription:"…"`, which the Lucene bridge compiles to
   **`brief_description = '…'`**, not `ILIKE`. The "Any timeout" and "Any failure"
   preset chips therefore matched nothing. Fixed on the frontend by switching the
   search box and column to the wildcard `contains` operator (`*term*` → `ILIKE
'%term%'`); leading wildcards are supported —
   `QueryService.allowLeadingWildcard` defaults to true.

## The window is mandatory, not a nicety

Unbounded, the aggregate covers all history. Two things break:

- **It exceeds the bucket ceiling.** DAY over more than ~2.7 years of history is
  more than 1000 buckets and the query is _rejected_. Measured against four years
  of seeded history, HOUR and DAY were both refused and only WEEK returned. That is
  a calendar threshold, not a row-count one — it would fire with a thousand rows.
- **Cost scales with the table, not the window.**

So the chart always sends `start`/`end` (default 90 days) and offers 7d / 30d /
90d / 1y. Combinations over the ceiling are disabled in the UI rather than sent and
refused. Measured at 2M rows over four years:

| Window      | Result             |
| ----------- | ------------------ |
| unbounded   | **rejected**       |
| 7d / HOUR   | 48 ms, 168 buckets |
| 30d / DAY   | 79 ms, 31 buckets  |
| 90d / DAY   | 97 ms, 90 buckets  |
| 365d / WEEK | 215 ms, 53 buckets |

## Indexing (`V8_72_002__audit_incidence_indexes.sql`)

Two indexes, both plain `CREATE INDEX IF NOT EXISTS`, matching every other index
migration in this repo. Numbers below are from a table matching
`patron_request_audit`'s real DDL seeded with **5M rows** (1.2 GB heap) over three
years, on Postgres 18.

**btree on `audit_date`** — there was none at all. It does _not_ serve the chart
aggregation (at 8% selectivity the planner prefers a parallel sequential scan); it
serves the grid's default page, `ORDER BY audit_date DESC LIMIT 50`:
**245 ms → 0.61 ms**. Builds in ~1 s and costs 107 MB.

**`pg_trgm` GIN on `brief_description`, `fastupdate = off`** — the only index type
that can serve the `ILIKE '%term%'` the Lucene bridge emits, since a leading
wildcard rules out a btree. Inside a 90-day window it cuts both ways:

| 90-day windowed aggregate          | no GIN | with GIN   |
| ---------------------------------- | ------ | ---------- |
| selective term (213 matching rows) | 209 ms | **1.0 ms** |
| common term (500k matching rows)   | 202 ms | **278 ms** |

Without it the plan is always a parallel sequential scan, so cost is flat at
~205 ms regardless of selectivity _and grows with the table_ — ~1.4 s at 40M rows on
every query. With it, selective searches are 209× faster and the common preset chips
are 1.4× slower. Ad-hoc hunting for specific error text is the point of an audit
explorer, so the 209× case decides it. `fastupdate = off` keeps insert latency flat
rather than letting some unlucky INSERT pay to flush a pending list. Build ~11 s,
278 MB.

**No btree on `brief_description`.** It cannot help the ILIKE path (measured: still
a sequential scan with one present) and the explorer no longer sends equality.

### Why not `CREATE INDEX CONCURRENTLY`

It was implemented, benchmarked, and then removed. Plain `CREATE INDEX` takes a
`SHARE` lock that blocks writes for the whole build — measured at 5M rows, an INSERT
issued 3 s into the GIN build waited **8.23 s** against a **0.13 s** baseline, while
the same INSERT during a CONCURRENT build took 0.13 s. Reads are unaffected
throughout.

That protects nothing here. **Production is AWS Fargate and only deploys inside a
maintenance window**, so there is no patron-facing writer to block. Against zero
benefit, CONCURRENTLY costs:

- **A 3.4× longer build** (5M rows: 10.9 s → 37.4 s for the GIN; ~76 s → ~260 s
  extrapolated to 40M) — it lengthens the very maintenance window it cannot help,
  and risks tripping the Fargate health-check grace period into a restart loop.
- **A global config change.** It cannot run in a transaction, and
  `executeInTransaction=false` alone is not enough: Flyway holds its schema-history
  lock as an open transaction on a second connection, and CONCURRENTLY waits for
  every concurrent transaction to finish, so the deploy _hangs forever_ on
  `Lock / virtualxid` rather than failing. Verified in both directions. Fixing it
  needs `flyway.postgresql.transactional.lock=false`, which changes lock behaviour
  for all ~100 existing migrations to serve one statement.
- **Loss of atomic rollback**, which matters most when you are inside a bounded
  window working through a checklist.
- **A silent failure mode.** A failed concurrent build leaves an `INVALID` index that
  the planner ignores and `IF NOT EXISTS` then keeps forever — a permanently slow
  explorer with no error anywhere.

For the record, the lock property itself is safe: `PostgreSQLAdvisoryLockTemplate`
picks between `pg_try_advisory_xact_lock(n)` and `pg_try_advisory_lock(n)` on the
_same_ lock number, so mutual exclusion between concurrent migration runs is fully
preserved either way. It was the right fix for the hang; the hang was just not worth
having in the first place.

**If DCB ever moves to rolling deploys under live traffic, revisit this decision
first** — every line of the argument above flips.

## Frontend

- `schema.graphqls` mirrors the types above; `npm run codegen` run.
- `getAuditIncidence.ts` now sends `auditIncidence(query, interval, start, end)`.
- `AuditIncidenceChart.tsx`: `bucketTimestamps`, `AUDIT_INCIDENCE_CAP` and the
  "capped" caption are gone. Because Postgres aggregates the whole set, the bucket
  width must be chosen _before_ the data arrives rather than derived from its span,
  so the chart gained window and bucket-width toggles; the echoed `interval` labels
  the axis.
