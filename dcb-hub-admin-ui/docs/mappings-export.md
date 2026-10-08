# Exporting mappings, and importing them again

A mappings export exists to be edited and uploaded again. That round trip is a
contract with `dcb-service`, and this is where the argument for it lives; the code
carries only the contract itself, in `src/constants/mappingImportContract.ts`.

## What dcb-service requires

`DCBConfigurationService.parseFile` reads an uploaded mappings file in three steps:

1. It reads the header row and compares each cell with its own expected header at
   the same index, using `equalsIgnoreCase`. The first mismatch throws
   `FileUploadValidationException` and the upload is refused.
2. It reads every data cell **by index** — `line[0]` through `line[5]`.
3. It refuses any of those first six cells that is blank.

The expected headers are:

| Type                     | Header row, in order                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| Reference value mappings | `fromContext`, `fromCategory`, `fromValue`, `toContext`, `toCategory`, `toValue` |
| Numeric range mappings   | `context`, `domain`, `lowerBound`, `upperBound`, `toValue`, `toContext`          |

So the header names and their order are the whole contract, and a file that merely
reorders its columns imports the wrong values under the right names rather than
failing.

## What was broken

Between the June and July 2026 grid migration (`46daf41b`, `290735d8`) and this
change, the export wrote the grid's own display names in the grid's own column
order. For reference value mappings that produced:

```
Category   From context   From value   To context   To value   Last imported   To category
```

against a parser wanting `fromContext` first. Four faults at once:

- every header was a display name, so the upload was refused at column 1;
- `fromCategory` and `fromContext` were swapped;
- `toCategory` and `toValue` were swapped;
- `lastImported`, which the importer does not accept, sat at index 5 — exactly
  where `toValue` has to be.

A consortium reported it as "to reimport we have to change the orders and names of
the columns for it to be accepted", which is precisely the four faults, by hand,
on every export.

## What the code does now

`GridExportConfig.roundTrip` names the import contract a grid's export must keep.
The three mappings grids set it from `MAPPING_IMPORT_COLUMNS`, keyed on the
`coreType` their export config already carries, so a grid cannot name a contract
that does not match the collection it lists.

With it set, the toolbar's CSV and TSV exports write the importer's header names in
the importer's order. Two consequences are deliberate:

- **`current` no longer uses MUI's own exporter on these grids.** MUI writes
  `colDef.headerName` as the header and offers no way to override it, so the page
  scope reads its rows off the grid api (`getSortedRows()`, which on a
  server-paginated grid is the loaded page) and goes through the same serialiser as
  every other scope. All three delimited exports of a mappings grid are one shape.
- **`valueLabelMaps` is dropped.** A round-trip file carries the codes the importer
  matches on, not the labels a reader prefers.

The export wizard still exports whatever columns the user picks, with display
names: an explicit column choice is the user's and wins.

## Formats

| Format | Scopes                 | Headers                          | Re-importable |
| ------ | ---------------------- | -------------------------------- | ------------- |
| TSV    | current, filtered, all | importer's, on a round-trip grid | yes           |
| CSV    | current, filtered, all | importer's, on a round-trip grid | yes           |
| Excel  | current page only      | the grid's display names         | no            |

Excel goes through MUI X Premium's `exportDataAsExcel`, which only sees the rows the
grid holds — hence "Excel (current page)" rather than a silent single page of a
dataset somebody asked for all of. Building a workbook from our own paged fetch
would mean importing exceljs directly, and the only copy in the tree is
`@mui/x-internal-exceljs-fork`: an internal package, not an API. The importer
accepts only `.csv` and `.tsv`, so an `.xlsx` can never go back in and is for
reading.

TSV remains the default format. What changed is that the choice is visible in the
menu and reachable in one click; before this it was hardcoded at every call site,
and CSV existed only inside the wizard, which also defaults to TSV.

## Filtering the consortium-wide grid

`fromContext` and `toContext` on the reference value mapping columns, and `context`
on the numeric range columns, carried `filterable: false`. On the consortium-wide
grids that left no way to narrow to one library, and therefore no way to export one
library's mappings — reported as "We no longer see the From Context filter when
exporting". It was an oversight rather than a limit: `processGridFilterModel` builds
a field-agnostic `field:value` Lucene clause, `Upload.tsx` already queries
`fromContext:` directly, and the per-library numeric range column set had the filter
enabled the whole time.

`sortable` is deliberately left alone. Filtering is proven by the queries above;
server-side sorting on those columns is not, and a broken `order` is a 500.

## The tests

| Test                                                  | What it holds                                                                            |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/constants/mappingImportContract.test.ts`         | the contract matches `getExpectedHeaders`, and every field is a real grid column         |
| `src/helpers/dataGrid/mappingExportRoundTrip.test.ts` | a serialised row lands under the header that names it, with no blank and no extra column |
| `e2e/mappings-export.spec.ts`                         | the downloaded bytes, for TSV and CSV, and that From context is filterable               |

Six of these fail against the pre-change export shape, which is how they were
checked.
