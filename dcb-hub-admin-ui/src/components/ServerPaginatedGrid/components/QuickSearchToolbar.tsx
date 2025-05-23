import { Box } from "@mui/material";
import {
	GridToolbar,
	GridToolbarContainer,
	GridToolbarQuickFilter,
} from "@mui/x-data-grid-premium";

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

// import { Box } from "@mui/material";
// import {
// 	QuickFilter,
// 	QuickFilterClear,
// 	QuickFilterControl,
// 	QuickFilterTrigger,
// } from "@mui/x-data-grid-premium";

// export default function QuickSearchToolbar() {
// 	return (
// 		<Box
// 			sx={{
// 				p: 0.5,
// 				pb: 0,
// 			}}
// 		>
// 			<QuickFilter
// 				debounceMs={100}
// 				quickFilterParser={(searchInput: string) =>
// 					searchInput
// 						.split(",")
// 						.map((value) => value.trim())
// 						.filter((value) => value !== "")
// 				}
// 			>
// 				<QuickFilterTrigger />
// 				<QuickFilterControl />
// 				<QuickFilterClear />
// 			</QuickFilter>
// 		</Box>
// 	);
// }
