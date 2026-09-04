import { beforeEach, describe, expect, it } from "vitest";

import { useConsortiumInfoStore } from "./consortiumInfoStore";

/**
 * This store is a deliberate cache of PUBLIC server data, kept so the signed-out screens
 * can still say whose deployment this is. That is why its key survives the sign-out purge.
 *
 * The exemption assumed a consortium always exists. It does not - one can be deleted, or a
 * deployment rebuilt - and the header only ever wrote to the store on success, so a name
 * outlived the record it described with no way for the application to clear it.
 */
describe("consortium info store", () => {
	beforeEach(() => {
		useConsortiumInfoStore.getState().resetConsortiumStore();
	});

	it("starts on a name that reads sensibly before any consortium exists", () => {
		expect(useConsortiumInfoStore.getState().displayName).toBe(
			"OpenRS Consortium",
		);
	});

	it("returns to that name when the consortium is gone", () => {
		const store = useConsortiumInfoStore.getState();

		store.setName("Old Consortium");
		store.setDisplayName("Old Consortium");
		store.setHeaderImageURL("https://example.invalid/old.png");
		store.setCatalogueSearchURL("https://old.example.invalid");

		expect(useConsortiumInfoStore.getState().displayName).toBe(
			"Old Consortium",
		);

		useConsortiumInfoStore.getState().resetConsortiumStore();

		const after = useConsortiumInfoStore.getState();
		expect(after.displayName).toBe("OpenRS Consortium");
		expect(after.name).toBe("OpenRS Consortium");
		expect(after.headerImageURL).toBe("");
		expect(after.catalogueSearchURL).toBe("");
	});

	it("resets to the DEFAULT name, not to an empty one", () => {
		// The state being restored is "no consortium yet", which is exactly where a first
		// run starts. A blank header is not the answer to that - it looks broken rather
		// than new.
		useConsortiumInfoStore.getState().setDisplayName("Something");
		useConsortiumInfoStore.getState().resetConsortiumStore();

		expect(useConsortiumInfoStore.getState().displayName).not.toBe("");
	});
});
