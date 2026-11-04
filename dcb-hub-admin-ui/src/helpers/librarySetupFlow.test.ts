import { describe, expect, it } from "vitest";

import { HOST_LMS_CLASSES } from "@helpers/hostLmsClientConfig";
import {
	ilsKeyOf,
	newLibraryFlowState,
	newLibrarySearchSchema,
} from "./librarySetupFlow";
import { libraryFlowState } from "./librarySetup";

const ids = (state: { steps: { id: string }[] }) =>
	state.steps.map((step) => step.id);

describe("a library still being described", () => {
	it("asks for the system first, and offers nothing after it until it is answered", () => {
		const state = newLibraryFlowState({});

		expect(state.firstIncompleteStep).toBe("system");
		expect(
			state.steps.filter((step) => step.available).map((step) => step.id),
		).toEqual(["system"]);
	});

	it("opens the library's own details once the system is connected", () => {
		const state = newLibraryFlowState({ ils: "koha", hostLms: "KOHA1" });

		expect(state.firstIncompleteStep).toBe("profile");
		expect(state.steps.find((step) => step.id === "profile")?.available).toBe(
			true,
		);
		expect(state.steps.find((step) => step.id === "contacts")?.available).toBe(
			false,
		);
	});

	it("asks about numeric ranges only for Sierra and Polaris", () => {
		expect(ids(newLibraryFlowState({ ils: "sierra" }))).toContain(
			"numMappings",
		);
		expect(ids(newLibraryFlowState({ ils: "alma" }))).not.toContain(
			"numMappings",
		);
	});
});

describe("a library that exists", () => {
	const library = {
		id: "lib-1",
		fullName: "Example",
		shortName: "Example",
		abbreviatedName: "EX",
		address: "1 Main St",
		type: "PUBLIC",
		agencyCode: "EX",
		latitude: 1,
		longitude: 2,
		contacts: [],
		membership: [],
		agency: { hostLms: { id: "h1", lmsClientClass: HOST_LMS_CLASSES.alma } },
	};

	it("counts its Host LMS as the answer to the first two questions", () => {
		const state = libraryFlowState(library, {});

		expect(state.steps.slice(0, 2).map((step) => step.complete)).toEqual([
			true,
			true,
		]);
		expect(state.firstIncompleteStep).toBe("contacts");
	});

	it("leaves out what its system does not need", () => {
		expect(ids(libraryFlowState(library, {}))).not.toContain("numMappings");
	});
});

describe("the new-library URL", () => {
	// A stale or hand-typed link must not crash the page
	it("drops an unknown system and an over-long code rather than failing", () => {
		expect(
			newLibrarySearchSchema.parse({ ils: "dynix", hostLms: "x".repeat(65) }),
		).toEqual({ ils: undefined, hostLms: undefined });
	});

	it("names each client class by its key", () => {
		expect(ilsKeyOf(HOST_LMS_CLASSES.polaris)).toBe("polaris");
		expect(ilsKeyOf("org.example.Unknown")).toBeUndefined();
	});
});
