import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import {
	KOHA_MAX_BRANCH_CODE_LENGTH,
	locationLocalIdSchema,
} from "./locationLocalIdSchema";

const validate = (localId: string, ils: string) =>
	locationLocalIdSchema().validate(localId, { context: { ils } });

describe("a pickup location's localId", () => {
	it("is required for a Koha location, as the server refuses one without it", async () => {
		await expect(validate("", "Koha")).rejects.toThrow(
			i18n.t("ui.validation.required", { field: i18n.t("locations.local_id") }),
		);
	});

	it("is at most ten characters for Koha, the length of a branch code", async () => {
		await expect(validate("BRANCH-NORTH", "Koha")).rejects.toThrow(
			i18n.t("ui.validation.locations.local_id_koha"),
		);
		await expect(
			validate("A".repeat(KOHA_MAX_BRANCH_CODE_LENGTH), "Koha"),
		).resolves.toBeDefined();
	});

	it("accepts a Koha branch code", async () => {
		await expect(validate("BRANCH-N", "Koha")).resolves.toBe("BRANCH-N");
	});

	it("stays optional for Sierra", async () => {
		await expect(validate("", "Sierra")).resolves.toBeDefined();
	});

	it("still demands a UUID for FOLIO", async () => {
		await expect(validate("BRANCH-N", "FOLIO")).rejects.toThrow(
			i18n.t("ui.validation.locations.local_id_folio"),
		);
	});
});
