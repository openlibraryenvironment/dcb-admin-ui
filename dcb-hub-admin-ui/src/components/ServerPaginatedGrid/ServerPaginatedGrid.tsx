import { DataGrid, GridEventListener, GridFilterModel, GridSortModel, GridToolbar, GridToolbarQuickFilter, getGridStringOperators } from '@mui/x-data-grid';
import { DocumentNode, useQuery } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import Details from '@components/Details/Details';
// Import styled separately because of this issue https://github.com/vercel/next.js/issues/55663 - should be fixed in Next 13.5.5

const StyledOverlay = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
}));

export default function ServerPaginationGrid({query, type, selectable, pageSize, columns, columnVisibilityModel, sortModel, noResultsMessage, noDataMessage, noDataTitle, searchPlaceholder, sortDirection, sortAttribute}: 
    {query: DocumentNode, type: string, selectable: boolean, pageSize: number, columns: any, columnVisibilityModel?: any, sortModel?: any, noResultsMessage?: string, noDataMessage?: string, 
     noDataTitle?: string, searchPlaceholder?: string, sortDirection: string, sortAttribute: string}) {
  const [sortOptions, setSortOptions] = useState({field: "", direction: ""});
  const [filterOptions, setFilterOptions] = useState("");

  // GraphQL queries will now need to specify order and orderBy props to avoid Micronaut errors
  // As Micronaut sort direction does not support 'unsorted'
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
    console.log(sortModel);
    setSortOptions({ field: sortModel[0]?.field ?? sortAttribute, direction: sortModel[0]?.sort?.toUpperCase() ?? sortDirection});
  }, [sortDirection, sortAttribute]);
  const onFilterChange = useCallback((filterModel: GridFilterModel) => {
    console.log(filterModel);
    // We set filter defaults here: in the future these may also be extended.
    const field = filterModel?.items[0]?.field ?? "id";
    const operator = filterModel?.items[0]?.operator ?? "contains";
    const value = (filterModel?.items[0]?.value !== undefined && filterModel?.items[0]?.value !== null)
    ? filterModel?.items[0]?.value
    : "";
    //@ts-ignore: TypeScript hates this for some reason (thinks it's undefined when it isn't). To be fixed.
    const quickFilterValue = filterModel?.quickFilterValues[0] ?? "";
    // If either is blank, use the other (avoids jumbled up searches)
    const result = (value !== "" ? `${field}:${value}` : quickFilterValue) ?? "";
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
              // Filters supply the additional - quick search should default to name
              // Limit filters to what's available through Lucene graphQL https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description 
              // we can check quickFilterValues - if empty we're using filters, if not we can build filters through search bar
              // As such, search bar should probably let them build their own filters

              // If operator is contains, either the contains filter or the quick search is active.
              if (filterModel?.quickFilterValues?.length == 0)
              {
                // Nothing in the quick filter values means that the contains filter is active.
                // OR that the search field has just been cleared
                if(filterModel?.items?.length == 0)
                {
                  console.log("Nothing in either, load default");
                  setFilterOptions("");
                }
                else
                {
                  console.log("Search not active but the contains filter is");             
                  const newValue = (filterModel?.items[0]?.value) ?? "";
                  const replacedValue = newValue.replaceAll(' ', '?') ?? "";
                  console.log("RV" +replacedValue);
                  // construct the true result here as it contains filter info
                  // Note that patron requests filtering by date will require its own strategem for searching via timestamp
                  // Configure filter availability on PRequests accordingly
                  setFilterOptions(`${field}:*${replacedValue}*`);
                  // this will be used for differentiating between the two
                }
              }
              else
              {
                // Means quick search is active
                const sanitisedFilterValue = quickFilterValue.replaceAll(' ', '?') ?? "";
                console.log("QS val: "+sanitisedFilterValue+" and type"+type);
                // For now, search bar defaults to 'name' search. It's easy to switch on 'filter builder' by removing the pre-additions.
                // switch on type to determine the correct final formulation
                switch(type)
                {
                  case "sourceBibs":
                    setFilterOptions(`title:*${sanitisedFilterValue}*`);
                    break;
                  case "patronRequests":
                    // Note that patron requests filtering by date will require its own strategem for searching via timestamp
                    setFilterOptions(`description:*${sanitisedFilterValue}*`);
                    break;
                  case "agencies":
                  case "agencyGroups":
                  case "hostLms":
                  case "locations":
                    setFilterOptions(`name:*${sanitisedFilterValue}*`);
                    break;
                  default:
                    // contains doesn't really work for ids though - a more sensible default may be required
                    setFilterOptions(`id:*${sanitisedFilterValue}`);
                    break;
                }
              }
              console.log(`${result}*`)
              // this seems to work for contains search - test with University
              // as just 1 * will only get 14 or 6 results when there are actually 20 with university in the name
              // apply ? in place of spaces everywhere
              break;
      case "equals":
              // Handles the 'equals' filter
              // This is for exact matches ONLY
              console.log("Equals filter active",field, replacedValue);
              setFilterOptions(`${field}:${replacedValue}`);
              break;
      default:
        console.log("Defaulting.")
        setFilterOptions(`${field}:${replacedValue}`);
    }
  }, [type]);

  // For multi filters:
  // sourceRecordId:843 AND id:80bf9c74-a5ae-56c9-8cfe-814220ee38a5
  // name:"Avila University" OR name:"Altoona Public Library"
  // Contains operator is missing? - * after a word will do that 

    const sortField = sortOptions.direction !== "" ? sortOptions.field : sortAttribute;
    const direction = sortOptions.direction !== "" ? sortOptions.direction : sortDirection;
   
    // We need to remove the unsorted option - both visually and as the default

    const { loading, data, fetchMore } = useQuery(query, {
		variables: {
            // Fixes 'ghost page' issue.
            pageno: paginationModel.page,
            pagesize: paginationModel.pageSize,
            order: sortField,
            orderBy: direction, 
            query: filterOptions 
		},
    });

  // Some API clients return undefined while loading
  // Following lines are here to prevent `rowCountState` from being undefined during the loading
  const [rowCountState, setRowCountState] = useState(
    data?.[type].totalSize || 0,
  );
  useEffect(() => {
    setRowCountState((prevRowCountState: any) =>
        data?.[type]?.totalSize !== undefined
        ? data?.[type]?.totalSize
        : prevRowCountState,
    );
  }, [data, setRowCountState, type]);

  // For grid click-through, presently to the Details page.
  // Details will be changing to use parameterised links (i.e. requests/{requestId}) and so this will need to change too.

  const [showDetails, setShowDetails] = useState(false);
  const [idClicked, setIdClicked] = useState(42);
  
  const closeDetails = () => {
      setShowDetails(false);
  };

  // Listens for a row being clicked, passes through the params so they can be used to display the correct 'Details' panel.
  const handleRowClick: GridEventListener<'rowClick'> = (params) => {
      if (type !== "GroupDetails" && type !== "CirculationStatus" && type !== "All Mappings" && type !== "Audit") {
          setShowDetails(true);
          setIdClicked(params?.row?.id);
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
        rows={data?.[type]?.content ?? []}
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
     { showDetails ? <Details i={idClicked} content = {data?.[type]?.content ?? []} show={showDetails}  onClose={closeDetails} type={type} /> : null }
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