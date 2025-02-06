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
