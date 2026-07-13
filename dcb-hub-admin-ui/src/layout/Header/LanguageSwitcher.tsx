import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "react-i18next";

// Supported UI languages. `label` is intentionally the endonym and is NOT translated.
// `code` must match a resource i18next can actually resolve: "en-GB" is bundled in
// i18n.ts, "es" is fetched from /locales/es/application.json. A bare "en" resolves to
// neither and only rendered by falling through to fallbackLng, after a wasted 404.
const LANGUAGES = [
	{ code: "en-GB", label: "English" },
	{ code: "es", label: "Español" },
];

interface LanguageSwitcherProps {
	/** Determines styling. Use "header" for dark navbars, or "default" for standard page backgrounds. */
	variant?: "header" | "default";
}

export default function LanguageSwitcher({
	variant = "default",
}: LanguageSwitcherProps) {
	const { t, i18n } = useTranslation();

	// Match on the base subtag so any regional variant ("en-US", "es-MX") still
	// selects the right entry, but always hand the Select a full supported code.
	const base = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];
	const current =
		LANGUAGES.find((l) => l.code.split("-")[0] === base)?.code ??
		LANGUAGES[0].code;

	const handleChange = (event: SelectChangeEvent) => {
		i18n.changeLanguage(event.target.value);
	};

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
