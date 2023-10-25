import Details from "@components/Details/Details";
import Link from "@components/Link/Link";
import { Box, Typography } from "@mui/material";
import { styled } from '@mui/material/styles';
// Import styled separately because of this issue https://github.com/vercel/next.js/issues/55663 - should be fixed in Next 13.5.5
import { DataGrid as MUIDataGrid, GridToolbar, GridEventListener } from "@mui/x-data-grid";
import { useState } from "react";
// This is our generic DataGrid component. Customisation can be carried out either on the props, or within this component based on type.
// For editing, see here https://mui.com/x/react-data-grid/editing/#confirm-before-saving 
const StyledOverlay = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
}));


export default function DataGrid<T extends Object>({
    data = [],
	columns,
    type,
    selectable,
    slots,
    noDataTitle,
    noDataMessage,
    noDataLink,
}: {
	data: Array<T>;
	columns: any; 
    type: string;
    selectable: boolean;
    slots?: any;
    noDataTitle?: string;
    noDataMessage?: any;
    noDataLink?: any;
}) {
    // When passing a type into DataGrid, use the singular - 'Group' not Groups etc.
    // This ensures consistency with Details.
    // The slots prop allows for customisation https://mui.com/x/react-data-grid/components/ 

    // State management variables for the Details panel.


    // This overlay displays when there is no data in the grid.
    // It takes a title, message, and if needed a link for the user to take action.
    // These must be supplied as props for each usage of the DataGrid that wishes to use them,
    // or a blank screen will be displayed.
    function CustomNoDataOverlay() {
        return (
            <StyledOverlay>
            <Box sx={{ mt: 1 }}>
                <Typography variant="body1"> {noDataTitle} </Typography>
                {noDataLink? <Link href={noDataLink}> {noDataMessage} </Link> : 
                <Typography variant ="body1"> {noDataMessage} </Typography>}
            </Box>
            </StyledOverlay>
        );
    }

    const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState(42);
	
	const closeDetails = () => {
		setShowDetails(false);
	};

    // Listens for a row being clicked, passes through the params so they can be used to display the correct 'Details' panel.
    const handleRowClick: GridEventListener<'rowClick'> = (params) => {
        if (type != "GroupDetails")
        {
            setShowDetails(true);
            setIdClicked(params?.row?.id);
        }
	  };


    return (
        // may have to fix height for no data overlay to display
        <div>
        <MUIDataGrid
        sx={{
            ".MuiDataGrid-virtualScroller": {
                overflow: 'hidden'
            }
        }}
            //DCB-396 (https://mui.com/x/react-data-grid/accessibility/#accessibility-changes-in-v7)
            experimentalFeatures={{ ariaV7: true }}
            // determines whether we allow row selection
            checkboxSelection={selectable}
            // These variables have been commented out until server-side pagination is working.
            // For server-side filtering - we'd need to implement our own onFilterChange handler. Similar practice for sorting https://mui.com/x/react-data-grid/sorting/#server-side-sorting
            // filterMode="server"
            // onFilterModelChange={onFilterChange}
            // paginationMode: will be set to server permanently once server-side pagination is working.
            // paginationMode = "server"
            // we can also have a custom pagination component, see here for details https://mui.com/x/react-data-grid/components/#pagination 
            // Currently set to default until server side pagination is working.
            pagination
            autoHeight={true}
            onRowClick={handleRowClick}
            disableRowSelectionOnClick  
            initialState={{
                    filter: {
                            // initiate the filter models here
                            filterModel: {
                            items: [],
                            quickFilterExcludeHiddenColumns: true,
                            },
                            },
                    pagination: {
                                paginationModel: { pageSize: 25, page: 0 },
                    },
                    }} 
            // if we don't want to filter by a column, set filterable to false (turned on by default)
            columns= {columns}
            // we can make our own custom toolbar if necessary, potentially extending the default GridToolbar. Just pass it in here
            rows={data ?? []}  
            // And if we ever need to distinguish between no data and no results (i.e. from search) we'd just pass different overlays here.
            slots={{toolbar: GridToolbar, noRowsOverlay: CustomNoDataOverlay, 
                noResultsOverlay: CustomNoDataOverlay}}
            // and we can also pass a custom footer component in 'slots'. This might work for NewGroup or addAgency buttons
            slotProps={{
                toolbar: {
                showQuickFilter: true,
                },
        }}></MUIDataGrid> 
        	{/* // conditional rendering to only show details when clicked on.
	        // Our data has been passed down through the content prop, along with the associated id as the i prop.
	        // This means we can find what we need in the array in Details.tsx and display only the relevant information for a given request.
	        // We also pass down type to indicate that we need the 'Request' details only.  */}
        { showDetails ? <Details i={idClicked} content = {data ?? []} show={showDetails}  onClose={closeDetails} type={type} /> : null }
        </div>
 
    )
}


// This custom toolbar allows for multi-search (i.e. searching for two+ things, separated by a comma)

// function QuickSearchToolbar() {
//   return (
//     <Box
//       sx={{
//         p: 0.5,
//         pb: 0,
//       }}
//     >
//         <GridToolbar/>
//       <GridToolbarQuickFilter
//         quickFilterParser={(searchInput: string) =>
//           searchInput
//             .split(',')
//             .map((value) => value.trim())
//             .filter((value) => value !== '')
//         }
//       />
//     </Box>
//   );
// }
