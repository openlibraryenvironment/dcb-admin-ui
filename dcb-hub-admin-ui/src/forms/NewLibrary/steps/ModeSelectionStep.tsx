import { Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function ModeSelectionStep({
	setMode,
}: {
	setMode: (mode: "new" | "existing") => void;
}) {
	const { t } = useTranslation();
	return (
		<Stack
			spacing={3}
			sx={{
				alignItems: "center",
				py: 4,
			}}
		>
			<Typography variant="h5">
				{t("new.library.existing_or_new_system")}
			</Typography>
			<Stack direction="row" spacing={2}>
				<Button
					variant="outlined"
					size="large"
					onClick={() => setMode("existing")}
				>
					{t("new.library.use_existing")}
				</Button>
				<Button variant="contained" size="large" onClick={() => setMode("new")}>
					{t("new.library.create_new")}
				</Button>
			</Stack>
		</Stack>
	);
}
