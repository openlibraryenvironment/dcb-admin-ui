import { beforeEach, describe, expect, it } from "vitest";

import {
	MAX_REMEMBERED_VIEWS,
	rememberedView,
	useRememberedViewStore,
} from "./rememberedViewStore";
import { emptyView, type UrlView } from "@helpers/viewState/urlViewCodec";

const view = (overrides: Partial<UrlView> = {}): UrlView => ({
	...emptyView(),
	filters: [{ field: "status", operator: "is", values: ["CONFIRMED"] }],
	...overrides,
});

const { remember, forget } = useRememberedViewStore.getState();

beforeEach(() => {
	useRememberedViewStore.setState({ views: {} });
});

describe("the remembered view", () => {
	it("is read back as it was written", () => {
		remember("grid", view({ sort: [{ field: "title", direction: "asc" }] }));
		expect(rememberedView("grid")).toEqual(
			view({ sort: [{ field: "title", direction: "asc" }] }),
		);
	});

	it("never keeps the page: rows move between visits", () => {
		remember("grid", view({ page: 4, pageSize: 50 }));
		expect(rememberedView("grid")).toEqual(view({ pageSize: 50 }));
	});

	it("is forgotten when the reader is back at the defaults", () => {
		remember("grid", view());
		remember("grid", emptyView());
		expect(rememberedView("grid")).toBeUndefined();
		expect(useRememberedViewStore.getState().views).toEqual({});
	});

	it("is forgotten on Reset", () => {
		remember("grid", view());
		forget("grid");
		expect(rememberedView("grid")).toBeUndefined();
	});

	it(`keeps at most ${MAX_REMEMBERED_VIEWS} grids, dropping the one written longest ago`, () => {
		for (let i = 0; i <= MAX_REMEMBERED_VIEWS; i++)
			remember(`grid${i}`, view());
		const ids = Object.keys(useRememberedViewStore.getState().views);
		expect(ids).toHaveLength(MAX_REMEMBERED_VIEWS);
		expect(ids).not.toContain("grid0");
		expect(ids).toContain(`grid${MAX_REMEMBERED_VIEWS}`);
	});

	it("counts a grid written again as the newest", () => {
		for (let i = 0; i < MAX_REMEMBERED_VIEWS; i++) remember(`grid${i}`, view());
		remember("grid0", view());
		remember("another", view());
		const ids = Object.keys(useRememberedViewStore.getState().views);
		expect(ids).toContain("grid0");
		expect(ids).not.toContain("grid1");
	});

	it("is read through the codec, as a link is: storage is not trusted", () => {
		useRememberedViewStore.setState({
			views: {
				junk: "not a view" as unknown as UrlView,
				mixed: {
					...emptyView(),
					filters: [
						{ field: "bad field", operator: "is", values: ["x"] },
						{ field: "status", operator: "is", values: ["CONFIRMED"] },
					],
				},
			},
		});
		expect(rememberedView("junk")).toBeUndefined();
		expect(rememberedView("mixed")).toEqual(view());
	});
});
