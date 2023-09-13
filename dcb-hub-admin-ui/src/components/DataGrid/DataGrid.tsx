import Details from "@components/Details/Details";
import { DataGrid as MUIDataGrid, GridToolbar, GridEventListener } from "@mui/x-data-grid";
import { useState } from "react";

// This is our generic DataGrid component. Customisation can be carried out either on the props, or within this component based on type.
// For editing, see here https://mui.com/x/react-data-grid/editing/#confirm-before-saving 

export default function DataGrid<T extends Object>({
    data = [],
	columns,
    type,
    selectable,
    slots
}: {
	data: Array<T>;
	columns: any; 
    type: string;
    selectable: boolean;
    slots?: any;
}) {
    // When passing a type into DataGrid, use the singular - 'Group' not Groups etc.
    // This ensures consistency with Details.
    // The slots prop allows for customisation https://mui.com/x/react-data-grid/components/ 

    // State management variables for the Details panel.
    const [showDetails, setShowDetails] = useState(false);
	const [idClicked, setIdClicked] = useState(42);
	
	const closeDetails = () => {
		setShowDetails(false);
	};

    // Listens for a row being clicked, passes through the params so they can be used to display the correct 'Details' panel.
    const handleRowClick: GridEventListener<'rowClick'> = (params) => {
		setShowDetails(true);
		setIdClicked(params?.row?.id);
	  };

    return (
        <div>
        <MUIDataGrid
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
            slots={{toolbar: GridToolbar,}}
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

// // function QuickSearchToolbar() {
//   return (
//     <Box
//       sx={{
//         p: 0.5,
//         pb: 0,
//       }}
//     >
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
