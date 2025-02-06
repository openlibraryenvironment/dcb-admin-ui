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
