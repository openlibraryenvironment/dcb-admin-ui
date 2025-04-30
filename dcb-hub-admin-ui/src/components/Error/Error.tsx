import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import { ErrorOutline } from "@mui/icons-material";

interface ErrorProps {
	title: string;
	message: string;
	description?: string;
	action: string;
	goBack?: string;
	reload?: boolean;
}
export default function Error({
	title,
	message,
	description,
	action,
	goBack,
	reload,
}: ErrorProps) {
	const actionLink = goBack ? goBack : "/";
	const router = useRouter();
	const theme = useTheme();

	const handleReturn = () => {
		router.push(actionLink);
	};
	const handleReload = () => {
		location.reload();
	};
	return (
		<Box
			display="flex"
			alignItems="center"
			justifyContent="center"
			width="100%" // Takes the full width of the content area
			height="100%"
			flex="1" // Takes up the available space in the flex container
			minHeight="0" // Override minHeight to allow the Box to shrink if necessary
		>
			<Stack
				direction="column"
				alignItems={"center"}
				alignSelf={"center"}
				spacing={2}
			>
				<ErrorOutline
					sx={{ size: 200 }}
					htmlColor={theme.palette.primary.exclamationIcon}
				/>
				<Typography variant="h1">{title}</Typography>
				<Typography variant="componentSubheading" sx={{ fontWeight: "bold" }}>
					{message}
				</Typography>
				<Typography variant="attributeText">{description}</Typography>
				<Button
					variant="contained"
					onClick={reload ? handleReload : handleReturn}
					size="large"
				>
					{action}
				</Button>
			</Stack>
		</Box>
	);
}
