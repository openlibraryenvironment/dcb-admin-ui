import { Box } from "@mui/material";
import {
	GridToolbar,
	GridToolbarContainer,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-pro";

export default function QuickSearchToolbar() {
	return (
		<Box
			sx={{
				p: 0.5,
				pb: 0,
			}}
		>
			<GridToolbarContainer>
				<GridToolbar />
			</GridToolbarContainer>
			<GridToolbarQuickFilter
				debounceMs={100}
				quickFilterParser={(searchInput: string) =>
					searchInput
						.split(",")
						.map((value) => value.trim())
						.filter((value) => value !== "")
				}
			/>
		</Box>
	);
}
