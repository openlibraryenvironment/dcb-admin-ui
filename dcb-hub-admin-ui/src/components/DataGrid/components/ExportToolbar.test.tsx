// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MenuList } from "@mui/material";

import { FormatMenuItem, ScopeMenuItem } from "./ExportToolbar";

/**
 * GridToolbarExportContainer clones every direct child with a `hideMenu` callback and
 * does NOT wrap its onClick, so an item that does not call it leaves the menu open
 * after downloading. These two components exist to make that decision explicit, and
 * that decision is invisible in a diff - which is what this pins.
 *
 * Why a DOM test and not an e2e: the e2e proves the download, not which items close
 * the menu. docs/testing.md, "A component test opts into a DOM".
 */

// RTL's auto-cleanup registers itself only when vitest's globals are on, and this
// repository imports describe/it/expect explicitly. So unmounting is explicit.
afterEach(cleanup);

/**
 * MUI 9's MenuItem reads MenuListContext and throws without it - "MenuItems must be
 * placed within Menu or MenuList". GridToolbarExportContainer supplies that through
 * its baseMenuList slot, so rendering one bare is not a configuration these components
 * ever meet.
 */
const inMenu = (item: React.ReactElement) =>
	render(<MenuList>{item}</MenuList>);

describe("the chosen export format is in the accessible name", () => {
	it("names the selected format as selected", () => {
		inMenu(
			<FormatMenuItem
				label="CSV (comma separated)"
				selected
				selectedLabel="CSV (comma separated), selected"
				onSelect={() => {}}
			/>,
		);

		// The tick is painted, so a reader who cannot see it needs the name to say so.
		expect(
			screen.getByRole("menuitem", {
				name: "CSV (comma separated), selected",
			}),
		).toBeInTheDocument();
	});

	it("names an unselected format plainly", () => {
		inMenu(
			<FormatMenuItem
				label="TSV (tab separated)"
				selected={false}
				selectedLabel="TSV (tab separated), selected"
				onSelect={() => {}}
			/>,
		);

		expect(
			screen.getByRole("menuitem", { name: "TSV (tab separated)" }),
		).toBeInTheDocument();
	});
});

describe("which items close the menu", () => {
	it("choosing a format selects it", () => {
		// It cannot close the menu, and that is guaranteed by the signature rather
		// than by this test: FormatMenuItem does not destructure hideMenu, so a test
		// asserting "hideMenu was not called" could never fail. The fact lives in the
		// component, where the compiler holds it.
		const onSelect = vi.fn();
		inMenu(
			<FormatMenuItem
				label="CSV"
				selected={false}
				selectedLabel="CSV, selected"
				onSelect={onSelect}
			/>,
		);

		screen.getByRole("menuitem").click();

		expect(onSelect).toHaveBeenCalledOnce();
	});

	it("choosing a scope runs the export and closes it", () => {
		const hideMenu = vi.fn();
		const onRun = vi.fn();
		inMenu(
			<ScopeMenuItem
				label="All rows"
				icon={null}
				onRun={onRun}
				hideMenu={hideMenu}
			/>,
		);

		screen.getByRole("menuitem").click();

		expect(onRun).toHaveBeenCalledOnce();
		expect(hideMenu).toHaveBeenCalledOnce();
	});

	it("a disabled scope does neither", () => {
		const hideMenu = vi.fn();
		const onRun = vi.fn();
		inMenu(
			<ScopeMenuItem
				label="All rows"
				icon={null}
				disabled
				onRun={onRun}
				hideMenu={hideMenu}
			/>,
		);

		screen.getByRole("menuitem").click();

		expect(onRun).not.toHaveBeenCalled();
		expect(hideMenu).not.toHaveBeenCalled();
	});
});
