import {
	GridToolbarContainer,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-pro";

export default function SearchOnlyToolbar() {
	return (
		<GridToolbarContainer>
			<GridToolbarQuickFilter />
		</GridToolbarContainer>
	);
}
