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
import {
	ContrastOutlined,
	DarkModeOutlined,
	LightModeOutlined,
} from "@mui/icons-material";

import { useThemeStore } from "@hooks/useThemeStore";
import FontPicker from "./FontPicker";
import {
	THEME_MODES,
	THEME_NAMES,
	type ThemeMode,
	type ThemeName,
} from "@themes/openRS";

const MODE_ICON: Record<ThemeMode, React.ReactNode> = {
	light: <LightModeOutlined fontSize="small" />,
	dark: <DarkModeOutlined fontSize="small" />,
	highContrast: <ContrastOutlined fontSize="small" />,
};

interface ThemeControlsProps {
	/**
	 * Whether to offer the typeface. Off by default so the existing profile page is
	 * unchanged; the setup flow and /settings turn it on.
	 */
	showFont?: boolean;
}

/**
 * Three independent appearance choices: the brand theme, the light/dark/high-contrast
 * mode, and the reading typeface.
 *
 * <h2>Radio groups, not toggle button groups</h2>
 *
 * All three are the same kind of question — pick exactly one from a short fixed list — and
 * they now look like it. The first version drew two of them as `ToggleButtonGroup` and the
 * third as a `RadioGroup`, which made one panel ask the same thing three ways.
 *
 * A radio group is also the better control here on its own merits: it is the native
 * single-choice idiom, one arrow-key journey with the current value announced, and it has
 * room for a label per option rather than whatever fits in a segmented button. A toggle
 * button group reads as a set of independent switches even when it is `exclusive`, and its
 * selected state is carried almost entirely by fill colour — which is what made the
 * selected toggle fail contrast in every brand before it was patched.
 *
 * All three persist through useThemeStore and drive the ThemeProvider in App.
 */
export default function ThemeControls({
	showFont = false,
}: ThemeControlsProps = {}) {
	const { t } = useTranslation();

	const themeName = useThemeStore((s) => s.themeName);
	const setThemeName = useThemeStore((s) => s.setThemeName);
	const mode = useThemeStore((s) => s.mode);
	const setMode = useThemeStore((s) => s.setMode);

	return (
		<Stack direction="column" spacing={3} sx={{ pl: 2, pt: 1 }}>
			<FormControl>
				<FormLabel id="theme-name-label" sx={{ mb: 1 }}>
					{t("theme.theme_label")}
				</FormLabel>
				<RadioGroup
					aria-labelledby="theme-name-label"
					name="theme-name"
					value={themeName}
					onChange={(event) => setThemeName(event.target.value as ThemeName)}
				>
					{THEME_NAMES.map((name) => (
						<FormControlLabel
							key={name}
							value={name}
							control={<Radio />}
							label={t(`theme.themes.${name}`)}
						/>
					))}
				</RadioGroup>
			</FormControl>

			<FormControl>
				<FormLabel id="theme-mode-label" sx={{ mb: 1 }}>
					{t("theme.mode_label")}
				</FormLabel>
				<RadioGroup
					aria-labelledby="theme-mode-label"
					name="theme-mode"
					value={mode}
					onChange={(event) => setMode(event.target.value as ThemeMode)}
				>
					{THEME_MODES.map((m) => (
						<FormControlLabel
							key={m}
							value={m}
							control={<Radio />}
							label={
								// The icon is decorative and aria-hidden: the label beside it
								// already says "Light", and an unlabelled icon read aloud
								// between every option is noise.
								<Stack
									direction="row"
									spacing={1}
									sx={{ alignItems: "center" }}
								>
									<Stack aria-hidden="true" sx={{ display: "flex" }}>
										{MODE_ICON[m]}
									</Stack>
									<Typography component="span">
										{t(`theme.modes.${m}`)}
									</Typography>
								</Stack>
							}
						/>
					))}
				</RadioGroup>
			</FormControl>

			{showFont && <FontPicker />}
		</Stack>
	);
}
