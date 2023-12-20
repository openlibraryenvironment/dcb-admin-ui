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

export default function ServerPaginationGrid({query, type, selectable, pageSize, columns, columnVisibilityModel, noResultsMessage, noDataMessage, noDataTitle }: 
    {query: DocumentNode, type: string, selectable: boolean, pageSize: number, columns: any, columnVisibilityModel?: any, noResultsMessage?: string, noDataMessage?: string, noDataTitle?: string}) {
  const [sortOptions, setSortOptions] = useState({field: "id", direction: "asc"});
  const [filterOptions, setFilterOptions] = useState("");

  const filterOperators = getGridStringOperators().filter(({ value }) =>
  ['equals' /* add more over time */ ].includes(value),
  );

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
    // Currently not working due to lack of support for it on the server - only supports specifying field sort not order
    setSortOptions({ field: sortModel[0]?.field, direction: sortModel[0]?.sort ?? "asc"});
  }, []);
  const onFilterChange = useCallback((filterModel: GridFilterModel) => {
    const field = filterModel?.items[0]?.field;
    const value = (filterModel?.items[0]?.value !== undefined && filterModel?.items[0]?.value !== null)
    ? filterModel?.items[0]?.value
    : "";
    //@ts-ignore: TypeScript hates this for some reason (thinks it's undefined when it isn't). To be fixed.
    const quickFilterValue = filterModel?.quickFilterValues[0] ?? "";
    // If either is blank, use the other (avoids jumbled up searches)
    const result = value !== "" ? `${field}:${value}` : quickFilterValue;
    setFilterOptions(result);
  }, []);
  // For multi filters:
  // sourceRecordId:843 AND id:80bf9c74-a5ae-56c9-8cfe-814220ee38a5
  
    const { loading, data, fetchMore } = useQuery(query, {
		variables: {
            pageno: paginationModel.page === 0 ? 0 : paginationModel.page + 1,
            pagesize: paginationModel.pageSize,
            order: sortOptions.field || 'id', // This will need server-side changes to make it work properly in future.
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
            }
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
        pageSizeOptions={[10]}
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
          toolbarQuickFilterPlaceholder: "e.g. sourceRecordId:12345",
        }}
          // See examples here for what can be customised 
          // https://github.com/mui/mui-x/blob/next/packages/grid/x-data-grid/src/constants/localeTextConstants.ts
          // https://stackoverflow.com/questions/75697255/how-to-change-mui-datagrid-toolbar-label-and-input-placeholder-text 
        initialState={{
            columns: 
            {
                columnVisibilityModel
            },
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