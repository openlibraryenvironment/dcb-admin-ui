import { useTranslation } from "react-i18next";
import {
	FormControl,
	FormLabel,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import {
	ContrastOutlined,
	DarkModeOutlined,
	LightModeOutlined,
} from "@mui/icons-material";

import { useThemeStore } from "@hooks/useThemeStore";
import {
	THEME_MODES,
	THEME_NAMES,
	type ThemeMode,
	type ThemeName,
} from "@themes/openRS";

const MODE_ICON: Record<ThemeMode, React.ReactNode> = {
	light: <LightModeOutlined fontSize="small" sx={{ mr: 1 }} />,
	dark: <DarkModeOutlined fontSize="small" sx={{ mr: 1 }} />,
	highContrast: <ContrastOutlined fontSize="small" sx={{ mr: 1 }} />,
};

// Two independent axes: the brand theme, and the light/dark/high-contrast mode.
// Both persist via useThemeStore and drive the ThemeProvider in App.
export default function ThemeControls() {
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
				<ToggleButtonGroup
					aria-labelledby="theme-name-label"
					exclusive
					color="primary"
					value={themeName}
					onChange={(_, next: ThemeName | null) => next && setThemeName(next)}
				>
					{THEME_NAMES.map((name) => (
						<ToggleButton key={name} value={name}>
							{t(`theme.themes.${name}`)}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			</FormControl>

			<FormControl>
				<FormLabel id="theme-mode-label" sx={{ mb: 1 }}>
					{t("theme.mode_label")}
				</FormLabel>
				<ToggleButtonGroup
					aria-labelledby="theme-mode-label"
					exclusive
					color="primary"
					value={mode}
					onChange={(_, next: ThemeMode | null) => next && setMode(next)}
				>
					{THEME_MODES.map((m) => (
						<ToggleButton key={m} value={m}>
							{MODE_ICON[m]}
							{t(`theme.modes.${m}`)}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			</FormControl>
		</Stack>
	);
}
