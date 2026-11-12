import { describe, expect, it } from "vitest";

import { clusterMemberLabels } from "./clusterMemberLabels";

describe("clusterMemberLabels", () => {
	it("names a member by its title and its Host LMS", () => {
		expect(
			clusterMemberLabels(
				[{ id: "b1", title: "Alpha", sourceSystemId: "h1" }],
				[{ id: "h1", name: "Alpha LMS" }],
			).get("b1"),
		).toBe("Alpha · Alpha LMS");
	});

	it("falls back to the title alone when the Host LMS is unknown", () => {
		expect(
			clusterMemberLabels(
				[{ id: "b1", title: "Alpha", sourceSystemId: "h9" }],
				[],
			).get("b1"),
		).toBe("Alpha");
	});

	it("leaves out a member with no title, so it keeps its id", () => {
		expect(clusterMemberLabels([{ id: "b1" }], []).has("b1")).toBe(false);
	});
});
