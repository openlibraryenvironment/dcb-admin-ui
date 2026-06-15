import { useTranslation } from "react-i18next";
import { Button, Stack } from "@mui/material";

export default function LanguageSwitcher() {
	const { i18n } = useTranslation();

	// Not sure what UX will look like during the change
	const handleLanguageChange = (languageCode: string) => {
		i18n.changeLanguage(languageCode);
	};

	return (
		<Stack direction="row" spacing={1}>
			<Button
				variant={i18n.language === "en-GB" ? "contained" : "outlined"}
				onClick={() => handleLanguageChange("en-GB")}
			>
				English {/** TODO */}
			</Button>
			<Button
				variant={i18n.language === "es" ? "contained" : "outlined"}
				onClick={() => handleLanguageChange("es")}
			>
				Español {/** TODO */}
			</Button>
		</Stack>
	);
}
