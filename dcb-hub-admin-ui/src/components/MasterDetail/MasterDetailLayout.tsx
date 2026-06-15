import { Box, Divider, Grid } from "@mui/material";

interface MasterDetailLayoutProps {
	children: React.ReactNode;
	width: number | string | undefined;
}

export default function MasterDetailLayout({
	children,
	width,
}: MasterDetailLayoutProps) {
	return (
		<Box>
			<Grid
				container
				spacing={{ xs: 1, md: 2 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				pl={13}
				sx={{
					py: 2,
					height: "100%",
					boxSizing: "border-box",
					position: "sticky",
					left: 0,
					width,
				}}
			>
				{children}
			</Grid>
			{/* UPGRADE: Use standard explicit Grid size naming parameters layout formats */}
			<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
				<Divider aria-hidden="true" />
			</Grid>
		</Box>
	);
}
