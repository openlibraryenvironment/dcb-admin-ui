import { useTranslation } from "react-i18next";
import {
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Stack,
	Typography,
} from "@mui/material";

import { useThemeStore } from "@hooks/useThemeStore";
import { FONTS, FONT_NAMES, type FontName } from "@themes/fonts";

/**
 * Choosing the reading typeface — W-6.
 *
 * A radio group rather than a select, because each option carries a sample and a sentence
 * saying who it is for, and because a radio group is one arrow-key journey with the
 * current value announced. Five options is well inside the size where a list beats a
 * dropdown.
 *
 * Each option's sample sentence is painted IN its own family. That is the whole point of
 * the control - a name alone tells nobody whether they can read it - and it is also what
 * makes the browser fetch that woff2, which is why the fetch is deliberately tied to the
 * picker being on screen rather than to application start.
 */
export default function FontPicker() {
	const { t } = useTranslation();

	const fontName = useThemeStore((s) => s.fontName);
	const setFontName = useThemeStore((s) => s.setFontName);

	return (
		<FormControl>
			<FormLabel id="font-name-label" sx={{ mb: 1 }}>
				{t("theme.font_label")}
			</FormLabel>
			<RadioGroup
				aria-labelledby="font-name-label"
				name="font-name"
				value={fontName}
				onChange={(event) => setFontName(event.target.value as FontName)}
			>
				{FONT_NAMES.map((name) => (
					<FormControlLabel
						key={name}
						value={name}
						control={<Radio />}
						sx={{ alignItems: "flex-start", mb: 1.5 }}
						label={
							<Stack sx={{ pt: 0.5 }}>
								<Typography
									component="span"
									sx={{ fontFamily: FONTS[name].stack, fontWeight: 500 }}
								>
									{t(FONTS[name].labelKey)}
								</Typography>
								<Typography
									component="span"
									variant="body2"
									sx={{ color: "text.secondary" }}
								>
									{t(FONTS[name].descriptionKey)}
								</Typography>
								{/* aria-hidden: the sample is a visual demonstration of the
								    shapes, and read aloud it is one more copy of a pangram
								    between every option. The name and the description above
								    are what a screen-reader user needs. */}
								<Typography
									component="span"
									aria-hidden="true"
									sx={{ fontFamily: FONTS[name].stack, mt: 0.25 }}
								>
									{t("theme.font_sample")}
								</Typography>
							</Stack>
						}
					/>
				))}
			</RadioGroup>
		</FormControl>
	);
}
