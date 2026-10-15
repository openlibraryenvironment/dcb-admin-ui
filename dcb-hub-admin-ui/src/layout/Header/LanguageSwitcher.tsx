import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "react-i18next";

import { useLocaleStore } from "@hooks/useLocaleStore";
import {
	deploymentLocale,
	isLanguageChoice,
	LANGUAGE_CHOICES,
	type LanguageChoice,
} from "@helpers/locale";

// Endonyms, deliberately NOT translated: a reader looks for their own language in its own
// name. Each code is a resource i18next can resolve - en-GB and en-US are bundled in
// i18n.ts, es is fetched from /locales/es/application.json.
const ENDONYMS: Record<Exclude<LanguageChoice, "deployment">, string> = {
	"en-US": "English (United States)",
	"en-GB": "English (United Kingdom)",
	es: "Español",
};

interface LanguageSwitcherProps {
	/** Determines styling. Use "header" for dark navbars, or "default" for standard page backgrounds. */
	variant?: "header" | "default";
}

export default function LanguageSwitcher({
	variant = "default",
}: LanguageSwitcherProps) {
	const { t } = useTranslation();
	const choice = useLocaleStore((s) => s.choice);
	const setChoice = useLocaleStore((s) => s.setChoice);

	const handleChange = (event: SelectChangeEvent) => {
		if (isLanguageChoice(event.target.value)) setChoice(event.target.value);
	};

	const nameOf = (option: LanguageChoice) =>
		option === "deployment"
			? t("header.language_deployment_default", {
					language: ENDONYMS[deploymentLocale()],
				})
			: ENDONYMS[option];

	const label = String(t("header.language_switcher_title"));

	const headerStyles =
		variant === "header"
			? {
					"& .MuiInputLabel-root": { color: "primary.headerText" },
					"& .MuiInputLabel-root.Mui-focused": { color: "primary.headerText" },
					"& .MuiOutlinedInput-root": {
						color: "primary.headerText",
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: "primary.headerText",
						},
						"&:hover .MuiOutlinedInput-notchedOutline": {
							borderColor: "primary.headerText",
						},
						"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
							borderColor: "primary.headerText",
						},
					},
					"& .MuiSelect-icon": { color: "primary.headerText" },
				}
			: {};

	return (
		<FormControl
			size="small"
			sx={{
				minWidth: 120,
				...headerStyles,
			}}
		>
			<InputLabel id="language-select-menu-label">{label}</InputLabel>
			<Select
				labelId="language-select-menu-label"
				id="language-select-menu"
				value={choice}
				label={label}
				onChange={handleChange}
			>
				{LANGUAGE_CHOICES.map((option) => (
					<MenuItem
						key={option}
						value={option}
						lang={option === "deployment" ? undefined : option}
					>
						{nameOf(option)}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
