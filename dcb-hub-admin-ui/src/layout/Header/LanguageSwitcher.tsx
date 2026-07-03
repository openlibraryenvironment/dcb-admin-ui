import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "react-i18next";

// Supported UI languages. `label` is intentionally the endonym and is NOT translated.
const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Español" },
];

export default function LanguageSwitcher() {
	const { t, i18n } = useTranslation();

	// Normalise "en-GB" -> "en" so the value matches a MenuItem (avoids MUI's
	// out-of-range value warning). Falls back to the first supported language.
	const base = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];
	const current = LANGUAGES.some((l) => l.code === base)
		? base
		: LANGUAGES[0].code;

	const handleChange = (event: SelectChangeEvent) => {
		i18n.changeLanguage(event.target.value);
	};

	const label = String(t("header.language_switcher_title"));

	return (
		<FormControl
			size="small"
			sx={{
				minWidth: 120,
				// Contrast against the dark header bar (WCAG 2.2 AA).
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
			}}
		>
			<InputLabel id="language-select-menu-label">{label}</InputLabel>
			<Select
				labelId="language-select-menu-label"
				id="language-select-menu"
				value={current}
				label={label}
				onChange={handleChange}
			>
				{LANGUAGES.map((lng) => (
					<MenuItem key={lng.code} value={lng.code}>
						{lng.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
