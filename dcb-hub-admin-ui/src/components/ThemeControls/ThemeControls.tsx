import { useTranslation } from "react-i18next";
import {
	Button,
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
	DevicesOutlined,
	LightModeOutlined,
	RestartAltOutlined,
} from "@mui/icons-material";

import { useThemeStore } from "@hooks/useThemeStore";
import FontPicker from "./FontPicker";
import {
	THEME_MODES,
	THEME_NAMES,
	type ThemeMode,
	type ThemeName,
} from "@themes/openRS";
import {
	DENSITIES,
	MOTIONS,
	TEXT_SIZES,
	type Density,
	type Motion,
	type TextSize,
} from "@themes/display";

/**
 * "Match my device" is the ABSENCE of a stored mode, not a fourth mode.
 *
 * The store holds null for it and `useResolvedMode` is what turns that into light, dark or
 * high contrast. A radio group cannot carry null as a value, so it round-trips through this
 * sentinel and nowhere else - the store never sees the string.
 */
const SYSTEM_MODE = "system" as const;

const MODE_ICON: Record<ThemeMode | typeof SYSTEM_MODE, React.ReactNode> = {
	system: <DevicesOutlined fontSize="small" />,
	light: <LightModeOutlined fontSize="small" />,
	dark: <DarkModeOutlined fontSize="small" />,
	highContrast: <ContrastOutlined fontSize="small" />,
};

/**
 * Every appearance choice this application offers, all per user and all persisted.
 *
 * Radio groups throughout, because all of them ask the same kind of question - pick one
 * from a short fixed list - and a toggle group carries its selected state almost entirely
 * by fill colour, which is what made it fail contrast in every brand.
 *
 * Why text size, spacing and animation exist at all: docs/theming.md section 5.
 */
export default function ThemeControls() {
	const { t } = useTranslation();

	const themeName = useThemeStore((s) => s.themeName);
	const setThemeName = useThemeStore((s) => s.setThemeName);
	const mode = useThemeStore((s) => s.mode);
	const setMode = useThemeStore((s) => s.setMode);
	const textSize = useThemeStore((s) => s.textSize);
	const setTextSize = useThemeStore((s) => s.setTextSize);
	const density = useThemeStore((s) => s.density);
	const setDensity = useThemeStore((s) => s.setDensity);
	const motion = useThemeStore((s) => s.motion);
	const setMotion = useThemeStore((s) => s.setMotion);
	const resetDisplay = useThemeStore((s) => s.resetDisplay);

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
					value={mode ?? SYSTEM_MODE}
					onChange={(event) =>
						setMode(
							event.target.value === SYSTEM_MODE
								? null
								: (event.target.value as ThemeMode),
						)
					}
				>
					{[SYSTEM_MODE, ...THEME_MODES].map((m) => (
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

			<FontPicker />

			<FormControl>
				<FormLabel id="text-size-label" sx={{ mb: 1 }}>
					{t("theme.text_size_label")}
				</FormLabel>
				<RadioGroup
					aria-labelledby="text-size-label"
					name="text-size"
					value={textSize}
					onChange={(event) => setTextSize(event.target.value as TextSize)}
				>
					{TEXT_SIZES.map((size) => (
						<FormControlLabel
							key={size}
							value={size}
							control={<Radio />}
							label={t(`theme.text_sizes.${size}`)}
						/>
					))}
				</RadioGroup>
			</FormControl>

			<FormControl>
				<FormLabel id="density-label" sx={{ mb: 1 }}>
					{t("theme.density_label")}
				</FormLabel>
				<RadioGroup
					aria-labelledby="density-label"
					name="density"
					value={density}
					onChange={(event) => setDensity(event.target.value as Density)}
				>
					{DENSITIES.map((option) => (
						<FormControlLabel
							key={option}
							value={option}
							control={<Radio />}
							label={t(`theme.densities.${option}`)}
						/>
					))}
				</RadioGroup>
			</FormControl>

			<FormControl>
				<FormLabel id="motion-label" sx={{ mb: 1 }}>
					{t("theme.motion_label")}
				</FormLabel>
				<RadioGroup
					aria-labelledby="motion-label"
					name="motion"
					value={motion}
					onChange={(event) => setMotion(event.target.value as Motion)}
				>
					{MOTIONS.map((option) => (
						<FormControlLabel
							key={option}
							value={option}
							control={<Radio />}
							label={t(`theme.motions.${option}`)}
						/>
					))}
				</RadioGroup>
			</FormControl>

			{/*
			 * The way back. Somebody who has made the interface unreadable while
			 * experimenting needs an escape that does not require reading the thing
			 * they have just broken - which is why this is a plainly-labelled
			 * button and not an icon.
			 *
			 * It leaves the brand theme alone: that is a deployment's identity
			 * rather than an accessibility setting, and resetting it would surprise
			 * somebody who only wanted their text size back.
			 */}
			<Stack direction="row">
				<Button
					variant="outlined"
					startIcon={<RestartAltOutlined />}
					onClick={resetDisplay}
				>
					{t("theme.reset")}
				</Button>
			</Stack>
		</Stack>
	);
}
