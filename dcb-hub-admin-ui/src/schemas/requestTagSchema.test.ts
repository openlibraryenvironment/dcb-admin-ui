import { describe, expect, it } from "vitest";

import { buildRequestTagSchema } from "./requestTagSchema";

const t = (key: string) => key;

const schema = buildRequestTagSchema(t);

const valid = {
	code: "WRONG_EDITION",
	label: "Wrong edition",
	description: "",
};

describe("a request tag", () => {
	it("accepts a code, a label and no description", async () => {
		await expect(schema.validate(valid)).resolves.toBeTruthy();
	});

	it.each(["wrong_edition", "1ST_COPY", "X", "WRONG EDITION", "A".repeat(33)])(
		"refuses the code %s, which dcb-service would refuse",
		async (code) => {
			await expect(schema.validate({ ...valid, code })).rejects.toThrow(
				"consortium.request_tags.validation.code",
			);
		},
	);

	it("accepts the longest code dcb-service takes", async () => {
		await expect(
			schema.validate({ ...valid, code: "A".repeat(32) }),
		).resolves.toBeTruthy();
	});

	it("refuses a blank label and one over 64 characters", async () => {
		await expect(schema.validate({ ...valid, label: "   " })).rejects.toThrow(
			"ui.validation.required",
		);
		await expect(
			schema.validate({ ...valid, label: "x".repeat(65) }),
		).rejects.toThrow("ui.validation.max_length");
	});

	it("refuses a description over 200 characters", async () => {
		await expect(
			schema.validate({ ...valid, description: "x".repeat(201) }),
		).rejects.toThrow("ui.validation.max_length");
	});
});
