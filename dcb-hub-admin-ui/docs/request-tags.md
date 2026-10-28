# Request tags and notes

Consortium staff tag a patron request from the consortium's tag list, and read and write
notes on it. Libraries do the same in DCB Admin for Libraries. Both apps show a tag the
same way.

## Where they appear

| Where                                | What                                                                                                                                 | Needs                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| A request's General tab, at the top  | Its tags, and **Manage tags**, which takes focus to the tags section further down                                                    | `VITE_FEATURE_REQUEST_TAGS`                                          |
| A request's Notes tab                | Its notes. The tab is named with the count, "Notes (3)"                                                                              | `VITE_FEATURE_REQUEST_NOTES`                                         |
| A request's address                  | `?tab=notes` opens it on the Notes tab. Every tab has a name: `general`, `bib`, `supplying`, `borrowing`, `pickup`, `audit`, `notes` | —                                                                    |
| A patron request grid's detail panel | The row's tags, and a link to its notes, "2 notes"                                                                                   | either flag                                                          |
| A patron request grid                | A **Tags** column, hidden until shown, filterable by tag. A **Note text** filter                                                     | `VITE_FEATURE_REQUEST_TAG_AND_NOTE_SEARCH`, as well as the two above |

The detail panel fetches a row's tags and notes when it opens: one request each, per row
someone expands.

## Colour

A tag is shown in a theme palette colour: `default`, `primary`, `secondary`, `info`,
`success`, `warning` or `error`. A name, never a colour value, so it follows the theme in
use and keeps the theme's contrast. The label is always shown, so colour is never the only
signal (WCAG 1.4.1).

Until dcb-service stores a colour per tag, `src/helpers/tagColour.ts` gives the five tags
dcb-service seeds a starter colour, and every other tag `default`:

| Tag                | Colour      |
| ------------------ | ----------- |
| `DAMAGED`          | `error`     |
| `MISSING_PIECES`   | `warning`   |
| `PATRON_CONTACTED` | `info`      |
| `RETURN_DISPUTED`  | `secondary` |
| `SLOW_TO_SHIP`     | `primary`   |

dcb-service's request tag colour migration seeds the same names, so a starter tag looks
the same before and after a deployment starts storing colours. `tagColour.test.ts` holds
the two to each other. A stored colour wins over the starter one.

## Search, and the Tags column

The Tags column and the Note text filter send dcb-service's own search fields, so
`buildFilterQuery` has no special case for them:

| Filter                               | Sent                                        |
| ------------------------------------ | ------------------------------------------- |
| Tags is Damaged                      | `tagCode:DAMAGED`                           |
| Tags is any of Damaged, Slow to ship | `(tagCode:DAMAGED OR tagCode:SLOW_TO_SHIP)` |
| Tags is not Damaged                  | `*:* AND NOT (tagCode:DAMAGED)`             |
| Note text contains water damage      | `noteText:"water damage"`                   |

Note text goes as a quoted phrase. A bare term would have its spaces turned into `?` and
be parsed as a wildcard, which dcb-service does not read as a note search.

**Why the column has a flag of its own.** dcb-service 9.2.0 already returns `tags` on a
patron request, but fetches them one request at a time: an access check and a query per
row, so a 100-row page costs about 200 queries. The column waits for the dcb-service that
fetches a page's tags in one batch, and the search fields arrive in the same change. Both
are on dcb-service `feat/patron-request-tag-and-note-search` and in no release yet, so
the flag's capability row has `since: null`.
