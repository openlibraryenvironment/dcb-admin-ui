import { ErrorOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { useRouter } from "@tanstack/react-router";

interface ErrorProps {
	title: string;
	message: string;
	description?: string;
	action: string;
	goBack?: string;
	/**
	 * What the primary button does, when navigating to `goBack` is not it.
	 *
	 * Replaces a `reload?: boolean` that hardcoded location.reload() - a full
	 * document load, which is the wrong recovery for a failed query and the only
	 * one the shared component offered.
	 */
	onAction?: () => void;
	/** A second, lower-emphasis button. The route error boundary needs both. */
	secondary?: { label: string; onClick: () => void };
}
export default function Error({
	title,
	message,
	description,
	action,
	goBack,
	onAction,
	secondary,
}: ErrorProps) {
	const actionLink = goBack ? goBack : "/";
	const router = useRouter();
	const theme = useTheme();

	const handleReturn = () => {
		router.navigate({ to: actionLink });
	};
	return (
		<Box
			// A route replacing its content with an error page is a status change, and it
			// was silent. Assertive rather than polite: the thing the user asked for did
			// not happen. WCAG 4.1.3.
			role="alert"
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				flex: "1",
				minHeight: "0",
			}}
		>
			<Stack
				direction="column"
				spacing={2}
				sx={{
					alignItems: "center",
					alignSelf: "center",
				}}
			>
				<ErrorOutlined
					sx={{ fontSize: 200 }}
					htmlColor={theme.palette.primary.exclamationIcon}
				/>
				<Typography variant="h1">{title}</Typography>
				<Typography variant="componentSubheading" sx={{ fontWeight: "bold" }}>
					{message}
				</Typography>
				<Typography variant="attributeText">{description}</Typography>
				<Button
					variant="contained"
					onClick={onAction ?? handleReturn}
					size="large"
				>
					{action}
				</Button>
				{secondary ? (
					<Button variant="text" onClick={secondary.onClick} size="large">
						{secondary.label}
					</Button>
				) : null}
			</Stack>
		</Box>
	);
}
