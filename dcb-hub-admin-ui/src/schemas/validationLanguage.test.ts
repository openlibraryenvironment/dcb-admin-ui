import { afterAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { newConsortiumSchema } from "./newConsortiumSchema";
import { newLibrarySchema } from "./newLibrarySchema";

// A stand-in language, so the test does not depend on what any real translation says
const PROBE = "zz";

describe("validation messages", () => {
	afterAll(() => i18n.changeLanguage("en-GB"));

	it("are in the language in use when validation runs, not when the schema loaded", async () => {
		i18n.addResourceBundle(
			PROBE,
			"application",
			{
				ui: {
					validation: {
						required: "ZZ {{field}}",
						not_a_number: "ZZ# {{field}}",
					},
				},
				consortium: { name: "zz-name" },
				libraries: { primaryLocation: { latitude: "zz-lat" } },
			},
			true,
			true,
		);
		await i18n.changeLanguage(PROBE);

		const consortium = newConsortiumSchema.safeParse({ name: "" });
		expect(
			consortium.error?.issues.find((i) => i.path[0] === "name")?.message,
		).toBe("ZZ zz-name");

		// Through the coordinate helper, which took an already-translated label
		const library = newLibrarySchema.safeParse({ latitude: "north" });
		expect(
			library.error?.issues.find((i) => i.path[0] === "latitude")?.message,
		).toBe("ZZ# zz-lat");
	});
});
