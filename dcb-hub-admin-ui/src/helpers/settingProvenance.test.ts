import { describe, expect, it } from "vitest";

import { canRevert, provenanceOf } from "./settingProvenance";

describe("where a resolved setting's value came from", () => {
	it("reports a value set at this scope as set here", () => {
		expect(
			provenanceOf({ source: "LIBRARY", sourceName: "Alpha", inherited: false }),
		).toBe("set_here");
	});

	it("reports a value from a broader scope as inherited", () => {
		expect(
			provenanceOf({ source: "CONSORTIUM", sourceName: "MOBIUS", inherited: true }),
		).toBe("inherited_from");
	});

	it("distinguishes 'nobody has decided' from 'the consortium said no'", () => {
		// The state most easily collapsed into the one above, and the one that matters
		// most. A setting the consortium has switched off is a decision an administrator
		// can go and look at; a setting nobody has an opinion about is one still to be
		// taken, and showing them the same way is why nobody can tell which is which.
		expect(provenanceOf({ source: null, inherited: false })).toBe("undecided");
		expect(
			provenanceOf({ source: "CONSORTIUM", sourceName: "MOBIUS", inherited: true }),
		).not.toBe("undecided");
	});
});

describe("whether reverting to inherited can do anything", () => {
	it("offers the revert only where an override exists at this scope", () => {
		expect(
			canRevert({ source: "LIBRARY", sourceName: "Alpha", inherited: false }),
		).toBe(true);
	});

	it("does not offer it for a value that is already inherited", () => {
		// The mutation would correctly report no change, which reads as a broken button.
		expect(
			canRevert({ source: "CONSORTIUM", sourceName: "MOBIUS", inherited: true }),
		).toBe(false);
	});

	it("does not offer it when no level has decided", () => {
		// There is nothing above to fall back to, so the offer would be a lie about the
		// chain rather than only a no-op.
		expect(canRevert({ source: null, inherited: false })).toBe(false);
	});
});
