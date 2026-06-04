import { Box, Typography } from "@mui/material";

interface OverlayType {
	noDataMessage?: string;
	noDataTitle?: string;
	noDataLink?: string;
	noResultsMessage?: string;
}

export function NoResultsOverlay({ noResultsMessage }: OverlayType) {
	return (
		<Box
			sx={{
				mt: 1,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
			}}>
			<Typography variant="body1"> {noResultsMessage} </Typography>
		</Box>
	);
}
