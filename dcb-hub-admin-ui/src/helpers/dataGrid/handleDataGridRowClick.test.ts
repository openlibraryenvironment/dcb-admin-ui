import { afterEach, describe, expect, it, vi } from "vitest";

import { configureAppBase } from "@helpers/appBase";
import type { DataGridType } from "@constants/dataGrid/types";
import { handleDataGridRowClick } from "./handleDataGridRowClick";

const ORIGIN = "https://mobius.example";

const click = (
	modifiers: { ctrlKey?: boolean; metaKey?: boolean } = {},
	type: DataGridType = "patronRequests",
) => {
	const navigate = vi.fn();
	handleDataGridRowClick({
		params: { row: { id: "abc" } } as any,
		event: { ctrlKey: false, metaKey: false, ...modifiers } as any,
		rowModesModel: {},
		type,
		navigate,
	});
	return navigate;
};

describe("handleDataGridRowClick destinations", () => {
	it("opens one Host LMS's catalog metrics from the catalog metrics grid", () => {
		expect(click({}, "catalogMetricsByHostLms")).toHaveBeenCalledWith({
			to: "/serviceInfo/catalogMetricsByHostLms/abc",
		});
	});
});

describe("handleDataGridRowClick under a deployment base", () => {
	afterEach(() => {
		configureAppBase("/");
		vi.unstubAllGlobals();
	});

	it("opens a new tab inside the base, not at the origin root", () => {
		configureAppBase("/dcb-admin/");
		const open = vi.fn();
		vi.stubGlobal("window", { location: { origin: ORIGIN }, open });

		click({ ctrlKey: true });

		expect(open).toHaveBeenCalledWith(
			`${ORIGIN}/dcb-admin/patronRequests/abc`,
			"_blank",
		);
	});

	it("leaves same-tab navigation to the router, which adds the base itself", () => {
		configureAppBase("/dcb-admin/");

		expect(click()).toHaveBeenCalledWith({ to: "/patronRequests/abc" });
	});
});
