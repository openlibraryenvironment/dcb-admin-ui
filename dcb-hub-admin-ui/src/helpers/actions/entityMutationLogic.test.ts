import { describe, expect, it } from "vitest";
import {
	changedRowFields,
	readDeleteOutcome,
} from "@helpers/actions/entityMutationLogic";
import { ENTITY_REGISTRY } from "@constants/entityRegistry";

describe("changedRowFields", () => {
	it("sends only what changed", () => {
		expect(
			changedRowFields(
				{ id: "1", name: "New", code: "SAME" },
				{ id: "1", name: "Old", code: "SAME" },
			),
		).toEqual({ name: "New" });
	});

	it("sends nothing when nothing changed", () => {
		const row = { id: "1", name: "Same" };
		expect(changedRowFields(row, { ...row })).toEqual({});
	});

	it("sends a field cleared to an empty string", () => {
		// Clearing a value is a change; skipping falsy values would make fields
		// impossible to blank out.
		expect(
			changedRowFields({ id: "1", note: "" }, { id: "1", note: "x" }),
		).toEqual({ note: "" });
	});

	it("sends a field toggled to false", () => {
		expect(
			changedRowFields(
				{ id: "1", isPickup: false },
				{ id: "1", isPickup: true },
			),
		).toEqual({ isPickup: false });
	});

	it("sends a field cleared to null", () => {
		expect(
			changedRowFields({ id: "1", localId: null }, { id: "1", localId: "9" }),
		).toEqual({ localId: null });
	});

	it("ignores fields the new row does not carry", () => {
		expect(changedRowFields({ id: "1" }, { id: "1", stale: "gone" })).toEqual(
			{},
		);
	});

	it("feeds normaliseUpdateFields the shape it expects", () => {
		// The contacts grid edits `role` as the rendered object; the diff has to
		// surface it so the registry can reduce it to a name.
		const changed = changedRowFields(
			{ id: "1", role: { name: "SUPPORT" } },
			{ id: "1", role: { name: "ADMIN" } },
		);
		expect(
			ENTITY_REGISTRY.consortiumContact.normaliseUpdateFields!(changed),
		).toEqual({ role: "SUPPORT" });
	});
});

describe("readDeleteOutcome", () => {
	it("treats an explicit success as success", () => {
		expect(
			readDeleteOutcome({ deleteLibrary: { success: true } }, "deleteLibrary"),
		).toEqual({ success: true, message: undefined });
	});

	it("treats an explicit failure as failure, and keeps the reason", () => {
		// A 200 with success:false is the server declining. Nothing in the
		// request layer throws for it, so this is the only place it is caught.
		expect(
			readDeleteOutcome(
				{ deleteLibrary: { success: false, message: "Still has locations" } },
				"deleteLibrary",
			),
		).toEqual({ success: false, message: "Still has locations" });
	});

	it("treats a response with no success field as success", () => {
		expect(readDeleteOutcome({ deleteLibrary: {} }, "deleteLibrary")).toEqual({
			success: true,
			message: undefined,
		});
	});

	it("reads the field the registry names, not the mutation name", () => {
		const response = {
			deleteContact: { success: false, message: "no" },
			deleteConsortiumContact: { success: true },
		};
		expect(
			readDeleteOutcome(
				response,
				ENTITY_REGISTRY.consortiumContact.deleteOperation,
			).success,
		).toBe(false);
	});

	it("does not blow up on an empty or absent response", () => {
		expect(readDeleteOutcome(undefined, "deleteLibrary").success).toBe(true);
		expect(readDeleteOutcome({}, "deleteLibrary").success).toBe(true);
	});

	it("succeeds when the entity declares no delete response field", () => {
		expect(readDeleteOutcome({ anything: 1 }, undefined)).toEqual({
			success: true,
		});
	});
});
