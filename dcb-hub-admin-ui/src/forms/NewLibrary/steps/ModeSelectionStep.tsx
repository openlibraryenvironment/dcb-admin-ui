import {
	Alert,
	AlertTitle,
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
	hasConsortium,
	onCreateConsortium,
}: {
	setMode: (mode: Mode) => void;
	onCancel: () => void;
	/** Undefined while the check is still in flight - see the gate below. */
	hasConsortium?: boolean;
	onCreateConsortium?: () => void;
}) {
	const { t } = useTranslation();
	const [selectedValue, setSelectedValue] = useState<Mode>("existing");

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedValue(event.target.value as Mode);
	};

	/**
	 * A library is added to a consortium, and there is only ever one per DCB
	 * instance. On a fresh system the wizard used to run all the way through and
	 * produce a library attached to nothing, with the consortium page separately
	 * reporting "no consortium has been set up" and offering no way to fix it.
	 *
	 * Only blocks on a definite "no": while the query is pending, hasConsortium
	 * is undefined and the step behaves normally rather than accusing the user of
	 * an empty system that may not be empty.
	 */
	if (hasConsortium === false)
		return (
			<Stack spacing={3} sx={{ py: 2 }}>
				<Alert severity="warning">
					<AlertTitle>{t("consortium.new.required_title")}</AlertTitle>
					{t("consortium.new.required_body")}
				</Alert>
				<Stack direction="row" sx={{ justifyContent: "space-between" }}>
					<Button variant="outlined" onClick={onCancel}>
						{t("ui.actions.cancel")}
					</Button>
					{onCreateConsortium && (
						<Button variant="contained" onClick={onCreateConsortium}>
							{t("consortium.new.title")}
						</Button>
					)}
				</Stack>
			</Stack>
		);

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
