import {
	GridToolbarContainer,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-premium";

export default function SearchOnlyToolbar() {
	return (
		<GridToolbarContainer>
			<GridToolbarQuickFilter />
		</GridToolbarContainer>
	);
}

// import { Toolbar } from "@mui/material";
// import { QuickFilter } from "@mui/x-data-grid-premium";

// export default function SearchOnlyToolbar() {
// 	return (
// 		<Toolbar>
// 			<QuickFilter />
// 		</Toolbar>
// 	);
// }
