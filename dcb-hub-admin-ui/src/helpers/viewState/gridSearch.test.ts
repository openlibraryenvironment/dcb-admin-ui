import { describe, expect, it } from "vitest";

import { drillSearchSchema } from "@helpers/drillSearch";
import { validateGridSearch } from "./gridSearch";
import { VIEW_PARAMS } from "./urlViewCodec";

describe("a grid's parameters as a route validates them", () => {
	it("keeps text, numbers and repeated text, as the router parses them", () => {
		expect(
			validateGridSearch({
				filters: ["status:NEW", "title:contains:x"],
				sort: "title:asc",
				page: 3,
				hide: "id",
			}),
		).toEqual({
			filters: ["status:NEW", "title:contains:x"],
			sort: "title:asc",
			page: 3,
			hide: "id",
		});
	});

	it("drops what no form of the grammar can be, and leaves the route's own parameters alone", () => {
		expect(
			validateGridSearch({
				filters: { status: "NEW" },
				sort: [1, 2],
				page: null,
				q: "status:NEW",
			}),
		).toEqual({});
	});

	it("keeps at most twenty repeats of a parameter", () => {
		const filters = Array.from({ length: 30 }, (_, i) => `title:contains:${i}`);
		expect(validateGridSearch({ filters }).filters).toHaveLength(20);
	});
});

describe("reserved names", () => {
	it("a drill-down's parameters are never a grid's", () => {
		const drill = Object.keys(drillSearchSchema.shape);
		expect(
			drill.filter((key) => (VIEW_PARAMS as readonly string[]).includes(key)),
		).toEqual([]);
	});
});
