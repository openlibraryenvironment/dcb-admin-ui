import { Box } from "@mui/material";
import {
	GridToolbarColumnsButton,
	GridToolbarContainer,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-premium";

export function ColumnsAndSearchToolbar() {
	return (
		<GridToolbarContainer>
			<GridToolbarQuickFilter />
			<Box sx={{ flexGrow: 1 }} />
			<GridToolbarColumnsButton />
		</GridToolbarContainer>
	);
}

// V8 implementation
// import { Box, Toolbar } from "@mui/material";
// import { ColumnsPanelTrigger, QuickFilter } from "@mui/x-data-grid-premium";

// export function ColumnsAndSearchToolbar() {
// 	return (
// 		<Toolbar>
// 			<QuickFilter />
// 			<Box sx={{ flexGrow: 1 }} />
// 			<ColumnsPanelTrigger />
// 		</Toolbar>
// 	);
// }
