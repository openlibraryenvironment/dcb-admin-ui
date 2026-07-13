import { useTheme } from "@mui/material";

// Validated categorical palette (dataviz skill reference instance). Light and dark
// are SELECTED sets, not an auto-flip: each was validated against its own surface.
// Fixed hue order - never cycle, never reassign by rank.
const CATEGORICAL_LIGHT = [
	"#2a78d6", // blue
	"#1baf7a", // aqua
	"#eda100", // yellow
	"#008300", // green
	"#4a3aa7", // violet
	"#e34948", // red
	"#e87ba4", // magenta
	"#eb6834", // orange
];

const CATEGORICAL_DARK = [
	"#3987e5", // blue
	"#199e70", // aqua
	"#c98500", // yellow
	"#008300", // green
	"#9085e9", // violet
	"#e66767", // red
	"#d55181", // magenta
	"#d95926", // orange
];

// Status palette - fixed, never themed. Ships with icon + label, never colour alone.
const STATUS = {
	good: "#0ca30c",
	warning: "#fab219",
	serious: "#ec835a",
	critical: "#d03b3b",
};

// Canonical DCB status order. A status is coloured by its POSITION here, modulo the
// palette length, so "LOANED" is always the same hue whether or not other series
// are plotted alongside it. Beyond 8 distinct series the skill says fold into
// "Other" / small multiples rather than inventing hues - the plot-builder caps
// selection accordingly.
const STATUS_ORDER = [
	"SUBMITTED_TO_DCB",
	"PATRON_VERIFIED",
	"RESOLVED",
	"REQUEST_PLACED_AT_SUPPLYING_AGENCY",
	"CONFIRMED",
	"REQUEST_PLACED_AT_BORROWING_AGENCY",
	"REQUEST_PLACED_AT_PICKUP_AGENCY",
	"RECEIVED_AT_PICKUP",
	"READY_FOR_PICKUP",
	"PICKUP_TRANSIT",
	"LOANED",
	"RETURN_TRANSIT",
	"COMPLETED",
	"FINALISED",
	"CANCELLED",
	"NO_ITEMS_SELECTABLE_AT_ANY_AGENCY",
	"ERROR",
];

export function useChartPalette() {
	const isDark = useTheme().palette.mode === "dark";
	const categorical = isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;

	return {
		categorical,
		status: STATUS,
		// Stable colour for a given status code, independent of selection order.
		colorForStatus: (status: string): string => {
			const idx = STATUS_ORDER.indexOf(status);
			const slot = idx >= 0 ? idx % categorical.length : 0;
			return categorical[slot];
		},
	};
}
