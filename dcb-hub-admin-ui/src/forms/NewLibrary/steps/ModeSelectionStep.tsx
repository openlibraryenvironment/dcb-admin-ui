import {
	Button,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Stack,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Mode = "new" | "existing";

export default function ModeSelectionStep({
	setMode,
	onCancel,
}: {
	setMode: (mode: Mode) => void;
	onCancel: () => void;
}) {
	const { t } = useTranslation();
	const [selectedValue, setSelectedValue] = useState<Mode>("existing");

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedValue(event.target.value as Mode);
	};

	return (
		<Stack spacing={3} sx={{ py: 2 }}>
			<FormControl component="fieldset">
				<Stack spacing={1} direction="column">
					<FormLabel component="legend">
						<Typography variant="hitCount">
							{t("new.library.existing_or_new_system")}
						</Typography>
					</FormLabel>
					<RadioGroup
						aria-label={t("new.library.existing_or_new_system")}
						name="library-mode-group"
						value={selectedValue}
						onChange={handleRadioChange}
					>
						<Stack spacing={1}>
							<FormControlLabel
								value="existing"
								control={<Radio />}
								label={
									<>
										<Typography variant="body1">
											{t("new.library.use_existing")}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{t("new.library.use_existing_description")}
										</Typography>
									</>
								}
							/>
							<FormControlLabel
								value="new"
								control={<Radio />}
								label={
									<>
										<Typography variant="body1">
											{t("new.library.create_new")}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{t("new.library.create_new_description")}
										</Typography>
									</>
								}
							/>
						</Stack>
					</RadioGroup>
				</Stack>
			</FormControl>
			<Stack direction="row" sx={{ justifyContent: "space-between" }}>
				<Button variant="outlined" onClick={onCancel}>
					{t("ui.actions.cancel")}
				</Button>
				<Button variant="contained" onClick={() => setMode(selectedValue)}>
					{t("ui.actions.continue")}
				</Button>
			</Stack>
		</Stack>
	);
}
