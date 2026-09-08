# `auditIncidence` — what this app relies on

The Audit Explorer's incidence chart is aggregated **server-side**. dcb-service returns
buckets; the browser plots them. Do not reintroduce client-side bucketing.

## The contract

```graphql
auditIncidence(query: String, interval: String, start: String, end: String): AuditIncidence!

type AuditIncidence {
	interval: String!        # echoed back: HOUR | DAY | WEEK — label the axis from this
	totalSize: Int!          # total across the window, not the number of buckets
	buckets: [AuditIncidenceBucket!]!   # continuous, gap-filled, ascending
}

type AuditIncidenceBucket {
	bucketStart: String!     # ISO-8601 start of the interval, UTC
	count: Int!
}
```

Two things that matter when changing this screen:

- **`query` uses the same Lucene translation as `audits(query:)`.** That is deliberate. If
  the two diverged, the chart and the grid beneath it would disagree, which is the one
  thing this feature must not do.
- **The window is mandatory server-side.** Gap filling needs bounds to fill between, so
  omitting `start`/`end` does not mean "everything".

`buckets` is already continuous, so the chart renders quiet periods as zeroes without help.
The old `bucketTimestamps` helper and the 1000-row cap in `AuditIncidenceChart.tsx` are
gone; nothing here should count rows to decide whether the chart is trustworthy.

## Where the rest lives

The server-side design — the query→predicate translation, why the obvious single
`date_trunc` + `GROUP BY` is not buildable against `QueryService`, and the indexing in
`V8_72_002__audit_incidence_indexes.sql` — belongs to **dcb-service**, and is documented
there. It is not a frontend concern and the full write-up no longer lives in this repo.
