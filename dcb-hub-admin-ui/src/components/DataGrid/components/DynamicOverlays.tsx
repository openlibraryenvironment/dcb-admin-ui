import { Box, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

type OverlayType = {
	noDataMessage?: string;
	noDataTitle?: string;
	noDataLink?: string;
	noResultsMessage?: string;
};

const StyledOverlay = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
}));

export function CustomNoDataOverlay({
	noDataMessage,
	noDataTitle,
	noDataLink,
}: OverlayType) {
	return (
		<StyledOverlay>
			<Box sx={{ mt: 1 }}>
				{noDataTitle ? (
					<Typography variant="body1"> {noDataTitle} </Typography>
				) : null}

				{noDataLink ? (
					<Link href={noDataLink}> {noDataMessage} </Link>
				) : (
					<Typography variant="body1"> {noDataMessage} </Typography>
				)}
			</Box>
		</StyledOverlay>
	);
}

export function CustomNoResultsOverlay({ noResultsMessage }: OverlayType) {
	return (
		<StyledOverlay>
			<Box sx={{ mt: 1 }}>
				<Typography variant="body1"> {noResultsMessage} </Typography>
			</Box>
		</StyledOverlay>
	);
}
