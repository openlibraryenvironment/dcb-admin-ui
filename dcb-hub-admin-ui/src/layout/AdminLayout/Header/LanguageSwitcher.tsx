import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "next-i18next";
import { useState } from "react";
// This component is currently unused due to us not presently supporting other languages.
// It has been maintained within the codebase because there is a high chance we will need to support other languages in the future.

export default function LanguageSwitcher() {
	const [language, setLanguage] = useState("");
	const handleChange = (event: SelectChangeEvent) => {
		setLanguage(event.target.value);
	};

	const { t, i18n } = useTranslation();
	const changeLanguage = (lng: any) => {
		i18n.changeLanguage(lng);
	};

	return (
		<FormControl sx={{ m: 1, minWidth: 120 }} size="small">
			<InputLabel id="language-select-menu-label">
				{t("header.language_switcher_title")}
			</InputLabel>
			<Select
				labelId="language-select-menu-label"
				id="language-select-menu"
				value={language}
				label={t("header.language_switcher_title")}
				onChange={handleChange}
			>
				<MenuItem value={10} onClick={() => changeLanguage("en")}>
					English
				</MenuItem>
				<MenuItem value={20} onClick={() => changeLanguage("es")}>
					Spanish
				</MenuItem>
			</Select>
		</FormControl>
	);
}
