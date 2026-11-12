// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Step, StepLabel, Stepper } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { stepConnectorClasses } from "@mui/material/StepConnector";

import { getAppTheme } from "@/themes/openRS";
import { StatusStepConnector } from "./StatusStepConnector";

afterEach(cleanup);

const lineColours = (mode: "light" | "dark", failedAt: number | null) => {
	const theme = getAppTheme("openRS", mode);
	const { container } = render(
		<ThemeProvider theme={theme}>
			<Stepper
				activeStep={1}
				connector={<StatusStepConnector activeStep={1} stepError={failedAt} />}
			>
				{["One", "Two", "Three"].map((label) => (
					<Step key={label}>
						<StepLabel>{label}</StepLabel>
					</Step>
				))}
			</Stepper>
		</ThemeProvider>,
	);
	const colourOf = (element: Element) =>
		getComputedStyle(element).borderTopColor;
	return {
		theme,
		lines: Array.from(
			container.querySelectorAll(`.${stepConnectorClasses.line}`),
		).map(colourOf),
	};
};

const rgb = (hex: string) => {
	const value = parseInt(hex.replace("#", ""), 16);
	return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};

describe("StatusStepConnector", () => {
	it.each(["light", "dark"] as const)(
		"shows a failed step in the error colour, %s",
		(mode) => {
			const { theme, lines } = lineColours(mode, 1);
			expect(lines.at(-1)).toBe(rgb(theme.palette.error.main));
		},
	);

	it("shows a step not yet reached in the theme's secondary ink", () => {
		const { lines } = lineColours("light", null);
		expect(lines.at(-1)).not.toBe("rgb(234, 234, 240)");
	});
});
