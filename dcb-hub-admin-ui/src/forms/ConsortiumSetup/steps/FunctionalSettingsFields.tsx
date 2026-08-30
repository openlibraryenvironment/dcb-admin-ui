import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import {
	Alert,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormLabel,
	Stack,
	Typography,
} from "@mui/material";

import { CONSORTIUM_FUNCTIONAL_SETTINGS } from "@constants/functionalSettings";
import type { NewConsortiumFormValues } from "@schemas/newConsortiumSchema";

interface FunctionalSettingsFieldsProps {
	showExplanation?: boolean;
}

/**
 * How requesting should behave — extracted from `NewConsortium.tsx` for W-7.
 *
 * Each setting carries the sentence that says what it DOES, not just its enum name.
 * `OWN_LIBRARY_BORROWING` means nothing to somebody standing up their first consortium;
 * "let a patron borrow a copy their own library already holds" is a question they can
 * answer. The same sentence is what gets stored as the setting's description, so what the
 * consortium reads on the settings page a year later is what they were told when they
 * chose it.
 */
export default function FunctionalSettingsFields({
	showExplanation = true,
}: FunctionalSettingsFieldsProps) {
	const { t } = useTranslation();
	const { control } = useFormContext<NewConsortiumFormValues>();

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			{showExplanation && (
				<Typography>{t("consortium.new.settings_explanation")}</Typography>
			)}

			<FormControl component="fieldset" sx={{ width: "100%" }}>
				<FormLabel component="legend">
					<Typography variant="hitCount">
						{t("consortium.new.settings_legend")}
					</Typography>
				</FormLabel>
				<FormGroup>
					<Stack spacing={1} sx={{ mt: 1 }}>
						{CONSORTIUM_FUNCTIONAL_SETTINGS.map((setting) => (
							<Controller
								key={setting.name}
								name={`functionalSettings.${setting.name}`}
								control={control}
								render={({ field }) => (
									<FormControlLabel
										sx={{ alignItems: "flex-start" }}
										control={
											<Checkbox
												{...field}
												id={`functional-setting-${setting.name}`}
												checked={field.value === true}
												onChange={(event) =>
													field.onChange(event.target.checked)
												}
											/>
										}
										label={
											<>
												<Typography variant="body1">
													{t(setting.labelKey)}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{t(setting.descriptionKey)}
												</Typography>
											</>
										}
									/>
								)}
							/>
						))}
					</Stack>
				</FormGroup>
			</FormControl>

			<Alert severity="info">{t("consortium.new.settings_changeable")}</Alert>
		</Stack>
	);
}
