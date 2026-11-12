// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";

import "@/i18n";
import ChartFigure from "./ChartFigure";

afterEach(cleanup);

const renderFigure = (categories: string[], values: (number | null)[]) =>
	render(
		<ChartFigure
			label="Requests by reason"
			categoryLabel="Reason"
			categories={categories}
			series={[
				{ label: "Requests", values },
				{
					label: "Hours",
					values: values.map((value) => (value === null ? null : value * 2)),
					format: (value) => `${value} h`,
				},
			]}
		>
			<svg data-testid="chart" />
		</ChartFigure>,
	);

describe("ChartFigure", () => {
	it("names the figure and keeps the table closed until asked", () => {
		renderFigure(["Lost", "Damaged"], [3, 1]);

		expect(
			screen.getByRole("figure", { name: "Requests by reason" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /requests by reason/i }),
		).toHaveAttribute("aria-expanded", "false");
	});

	it("shows the numbers the chart draws, one row per category", () => {
		renderFigure(["Lost", "Damaged"], [1234, null]);

		fireEvent.click(
			screen.getByRole("button", { name: /requests by reason/i }),
		);

		const table = screen.getByRole("table", { name: "Requests by reason" });
		expect(
			within(table)
				.getAllByRole("columnheader")
				.map((cell) => cell.textContent),
		).toEqual(["Reason", "Requests", "Hours"]);
		const rows = within(table).getAllByRole("row").slice(1);
		expect(rows.map((row) => row.textContent)).toEqual([
			"Lost1,2342468 h",
			"Damaged——",
		]);
		expect(
			within(rows[0]).getByRole("rowheader", { name: "Lost" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /requests by reason/i }),
		).toHaveAttribute("aria-expanded", "true");
	});

	it("pages a long table at a hundred rows", () => {
		const categories = Array.from({ length: 250 }, (_, i) => `Day ${i + 1}`);
		renderFigure(
			categories,
			categories.map((_, i) => i),
		);

		fireEvent.click(
			screen.getByRole("button", { name: /requests by reason/i }),
		);
		expect(screen.getAllByRole("row")).toHaveLength(101);

		fireEvent.click(screen.getByRole("button", { name: /next page/i }));
		expect(screen.getByRole("rowheader", { name: "Day 101" })).toBeVisible();
	});
});
