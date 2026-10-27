// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { DataGridPremium, Toolbar } from "@mui/x-data-grid-premium";

import GridViewNotice from "./GridViewNotice";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

const order: string[] = [];

const view = (hasPrivate = false) => ({
	restored: false,
	hasPrivate,
	reset: vi.fn<() => void>(),
	flush: vi.fn<() => Promise<void>>(async () => {
		order.push("flush");
	}),
});

const clipboard = (writeText: (text: string) => Promise<void>) =>
	vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

/** In a grid's toolbar, where it always renders: its button reads the grid's context. */
const renderInGrid = (notice: ReturnType<typeof view>) =>
	render(
		<DataGridPremium
			columns={[]}
			rows={[]}
			showToolbar
			slots={{
				toolbar: () => (
					<Toolbar>
						<GridViewNotice view={notice} />
					</Toolbar>
				),
			}}
		/>,
	);

// Uninitialised i18n renders the key, which is what these assert on
const copyButton = () =>
	screen.getByRole("button", { name: "ui.data_grid.saved_view.copy_link" });

describe("Copy link to this view", () => {
	it("writes a filter still waiting on the debounce before it copies the address", async () => {
		order.length = 0;
		const writeText = vi.fn<(text: string) => Promise<void>>(async () => {
			order.push("copy");
		});
		clipboard(writeText);
		renderInGrid(view());

		fireEvent.click(copyButton());

		expect(
			await screen.findByText("ui.data_grid.saved_view.link_copied"),
		).toBeInTheDocument();
		expect(order).toEqual(["flush", "copy"]);
		expect(writeText).toHaveBeenCalledWith(window.location.href);
		expect(screen.getByRole("status")).toHaveTextContent(
			"ui.data_grid.saved_view.link_copied",
		);
	});

	it("says what the link leaves out when a private filter is in force", async () => {
		clipboard(async () => {});
		renderInGrid(view(true));

		fireEvent.click(copyButton());

		expect(
			await screen.findByText("ui.data_grid.saved_view.link_copied_private"),
		).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent(
			"ui.data_grid.saved_view.link_copied_private",
		);
	});

	it("tells the reader where to copy it from when the clipboard refuses", async () => {
		clipboard(async () => {
			throw new Error("denied");
		});
		renderInGrid(view());

		fireEvent.click(copyButton());

		expect(
			await screen.findByText("ui.data_grid.saved_view.link_failed"),
		).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent(
			"ui.data_grid.saved_view.link_failed",
		);
	});
});
