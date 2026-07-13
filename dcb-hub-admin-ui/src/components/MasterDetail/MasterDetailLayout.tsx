import { Box, Divider, Grid } from "@mui/material";

interface MasterDetailLayoutProps {
	children: React.ReactNode;
	/**
	 * Width is passed down from the DataGrid API ref so the detail panel
	 * perfectly matches the viewport size.
	 */
	width: number | string | undefined;
}

export default function MasterDetailLayout({
	children,
	width,
}: MasterDetailLayoutProps) {
	return (
		<Box
			sx={{
				// Match the viewport width passed from the grid
				width,
				// Ensure content fits within the box without overflowing
				boxSizing: "border-box",
			}}
		>
			<Grid
				container
				spacing={2}
				// Force a 12-column grid across all standard breakpoints
				// This allows child components using `size={{ xs: 4, sm: 4, md: 4 }}`
				// to automatically wrap into 3 equal columns (12 / 4 = 3)
				columns={12}
				sx={{
					// Apply standard padding. The top/bottom padding ensures
					// breathing room, and the left padding indents the content
					// past the expansion icon.
					pl: 8,
					pr: 2,
					py: 2,
				}}
			>
				{children}
			</Grid>
			{/* The divider spans the full width of the container */}
			<Box sx={{ width: "100%", px: 2, pb: 1 }}>
				<Divider aria-hidden="true" />
			</Box>
		</Box>
	);
}
