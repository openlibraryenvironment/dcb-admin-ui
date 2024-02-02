import { DataGrid, GridEventListener, GridFilterModel, GridSortModel, GridToolbar, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { DocumentNode, useQuery } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles'; // Import separately due to this issue https://github.com/vercel/next.js/issues/55663
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';

const StyledOverlay = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
}));

export default function ServerPaginationGrid({query, type, selectable, pageSize, columns, columnVisibilityModel, sortModel, noResultsMessage, noDataMessage, noDataTitle, searchPlaceholder, sortDirection, sortAttribute, coreType}: 
    {query: DocumentNode, type: string, selectable: boolean, pageSize: number, columns: any, columnVisibilityModel?: any, sortModel?: any, noResultsMessage?: string, noDataMessage?: string, 
     noDataTitle?: string, searchPlaceholder?: string, sortDirection: string, sortAttribute: string, coreType: string}) {
  // The core type differs from the regular type prop, because it is the 'core data type' - i.e. if type is CircStatus, details type is RefValueMappings
  // GraphQL data comes in an array that's named after the core type, which causes problems
  const [sortOptions, setSortOptions] = useState({field: "", direction: ""});
  const [filterOptions, setFilterOptions] = useState("");
  const router = useRouter();

  // TODO in future work:
  // Support filtering by date on Patron Requests
  // Multi-Filter GUI


  function CustomNoDataOverlay() {
        return (
            <StyledOverlay>
            <Box sx={{ mt: 1 }}>
                <Typography variant ="body1"> {noDataMessage} </Typography>
            </Box>
            </StyledOverlay>
        );
  }

  function CustomNoResultsOverlay() {
      return (
        <StyledOverlay>
        <Box sx={{ mt: 1 }}>
            <Typography variant ="body1"> {noResultsMessage} </Typography>
        </Box>
        </StyledOverlay>
    );
  }

  const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: pageSize,
  });
    
  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    // sortDirection and sortAttributes are our defaults, passed in from each instance. 
    // They are intended for use on first load, or if the sortModel value is ever null or undefined.
    setSortOptions({ field: sortModel[0]?.field ?? sortAttribute, direction: sortModel[0]?.sort?.toUpperCase() ?? sortDirection});
  }, [sortDirection, sortAttribute]);
  const onFilterChange = useCallback((filterModel: GridFilterModel) => {
    // We set filter defaults here: in the future these may also be extended.
    const field = filterModel?.items[0]?.field ?? "id";
    const operator = filterModel?.items[0]?.operator ?? "contains";
    const value = (filterModel?.items[0]?.value !== undefined && filterModel?.items[0]?.value !== null)
    ? filterModel?.items[0]?.value
    : "";
    //@ts-ignore: TypeScript hates this for some reason (thinks it's undefined when it isn't). To be fixed.
    const quickFilterValue = filterModel?.quickFilterValues[0] ?? "";
    // get search terms in the right format here
    const replacedValue = value.replaceAll(' ', '?') ?? "";
    // Question marks are used to replace spaces in search terms- see Lucene docs 
    // https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description
    // Lucene powers our server-side querying so we need to get expressions into the right syntax.

    // Here we switch on the filter operator. At present, we only support 'equals' and 'contains', but this can be extended.
    // Consult Lucene docs above for an idea of what's presently possible.
    switch (operator)
    {
      case "contains":
              // Handles the contains filter AND quick search
              // This can be adapted to remove defaults, which would let quick search be a primitive multi-filter builder

              // If operator is contains, either the contains filter or the quick search is active.
              if (filterModel?.quickFilterValues?.length == 0)
              {
                // Nothing in the quick filter values means that the contains filter is active.
                // OR that the search field has just been cleared
                if(filterModel?.items?.length == 0)
                {
                  setFilterOptions("");
                }
                else
                {
                  const newValue = (filterModel?.items[0]?.value) ?? "";
                  const replacedValue = newValue.replaceAll(' ', '?') ?? "";
                  // construct the true result here as it contains filter info
                  if (type == "circulationStatus")
                  {
                    setFilterOptions(`fromCategory: CirculationStatus && deleted: false && ${field}:${replacedValue}*`);
                  }
                  else
                  {
                    setFilterOptions(`${field}:*${replacedValue}*`);
                  }
                  // this will be used for differentiating between the two
                }
              }
              else
              {
                // Means quick search is active
                const sanitisedFilterValue = quickFilterValue.replaceAll(' ', '?') ?? "";
                // For now, search bar defaults to 'name' search. 
                // You can change this to be a very primitive multi-filter builder by removing the asterisks.
                // Now we switch on type to determine the correct final formulation
                switch(type)
                {
                  case "sourceBibs":
                    setFilterOptions(`sourceRecordId:${sanitisedFilterValue}`);
                    break;
                  case "patronRequests":
                    // Note that patron requests filtering by date needs special handling
                    setFilterOptions(`description:*${sanitisedFilterValue}*`);
                    break;
                  case "circulationStatus":
                    setFilterOptions(`fromCategory: CirculationStatus && deleted: false && fromContext:${sanitisedFilterValue}*`);
                    break;
                  case "referenceValueMappings":
                    setFilterOptions(`fromCategory:${sanitisedFilterValue}*`);
                    break;
                  case "agencies":
                  case "groups":
                  case "hostlmss":
                  case "locations":
                    setFilterOptions(`name:*${sanitisedFilterValue}*`);
                    break;
                  default:
                    setFilterOptions(`id:*${sanitisedFilterValue}`);
                    break;
                }
              }
              // this seems to work for contains search - test with University
              // as just 1 * will only get 14 or 6 results when there are actually 20 with university in the name
              break;
      case "equals":
              // Handles the 'equals' filter
              // This is for exact matches ONLY
              setFilterOptions(`${field}:${replacedValue}`);
              break;
      default:
        setFilterOptions(`${field}:${replacedValue}`);
    }
  }, [type]);

  // For multi filters:
  // sourceRecordId:843 AND id:80bf9c74-a5ae-56c9-8cfe-814220ee38a5
  // name:"Avila University" OR name:"Altoona Public Library"

    const sortField = sortOptions.direction !== "" ? sortOptions.field : sortAttribute;
    const direction = sortOptions.direction !== "" ? sortOptions.direction : sortDirection;
    const { loading, data, fetchMore } = useQuery(query, {
		variables: {
            // Fixes 'ghost page' issue.
            pageno: paginationModel.page,
            pagesize: paginationModel.pageSize,
            order: sortField,
            orderBy: direction, 
            query: (type === "circulationStatus" && filterOptions == "")
            ? `fromCategory: CirculationStatus && deleted: false`
            : filterOptions },
    });

  // Some API clients return undefined while loading
  // Following lines are here to prevent `rowCountState` from being undefined during the loading

  // the core type prop matches to the array name coming from GraphQL
  // so CircStatus' coreType is referenceValueMappings
  // thus avoiding the issue accessing the array that would otherwise occur.
  const [rowCountState, setRowCountState] = useState(
    data?.[coreType].totalSize || 0,
  );
  useEffect(() => {
    setRowCountState((prevRowCountState: any) =>
        data?.[coreType]?.totalSize !== undefined
        ? data?.[coreType]?.totalSize
        : prevRowCountState,
    );
  }, [data, setRowCountState, coreType]);

  // Listens for a row being clicked, passes through the params so they can be used to display the correct 'Details' page.
  // And formulate the correct URL
  // plurals are used for types to match URL structure.
  const handleRowClick: GridEventListener<'rowClick'> = (params) => {
      if (type !== "GroupDetails" && type !== "referenceValueMappings" && type !== "Audit" && type !== "circulationStatus") {
            router.push(`/${type}/${params?.row?.id}`)
      }
  };

  return (
    <div>
      <DataGrid
        // Makes sure scrollbars aren't visible
        sx={{
            ".MuiDataGrid-virtualScroller": {
                overflow: 'hidden'
            },
            border: '0'
        }}
        //DCB-396 (https://mui.com/x/react-data-grid/accessibility/#accessibility-changes-in-v7)
        experimentalFeatures={{ ariaV7: true }}
      	columns={columns}	
        rows={data?.[coreType]?.content ?? []}
        {...data}
        rowCount={rowCountState}
        loading={loading}
        checkboxSelection={selectable}
        disableRowSelectionOnClick 
        filterMode="server"
        onRowClick={handleRowClick}
        onFilterModelChange={onFilterChange}
        pageSizeOptions={[5, 10, 20, 30, 40, 50]}
        paginationModel={paginationModel}
        paginationMode="server"
        sortingMode="server"
        onSortModelChange={handleSortModelChange}
        onPaginationModelChange={setPaginationModel}
        autoHeight={true}
        slots={{
          toolbar: QuickSearchToolbar,
          noResultsOverlay: CustomNoResultsOverlay,
          noRowsOverlay: CustomNoDataOverlay
        }} 
        localeText={{
            toolbarQuickFilterPlaceholder: searchPlaceholder ?? "Search",
        }}
          // See examples here for what can be customised 
          // https://github.com/mui/mui-x/blob/next/packages/grid/x-data-grid/src/constants/localeTextConstants.ts
          // https://stackoverflow.com/questions/75697255/how-to-change-mui-datagrid-toolbar-label-and-input-placeholder-text 
        initialState={{
            columns: 
            {
                columnVisibilityModel
            },
            sorting:
            {
              sortModel
            }
            }} 
        slotProps={{
            toolbar: {
            showQuickFilter: true,
            }, }}
      />
      </div>
  );
}

function QuickSearchToolbar() {
    return (
      <Box
        sx={{
          p: 0.5,
          pb: 0,
        }}
      >
          <GridToolbar/>
        <GridToolbarQuickFilter
        debounceMs={100}
          quickFilterParser={(searchInput: string) =>
            searchInput
              .split(',')
              .map((value) => value.trim())
              .filter((value) => value !== '')
          }
        />
      </Box>
    );
  }