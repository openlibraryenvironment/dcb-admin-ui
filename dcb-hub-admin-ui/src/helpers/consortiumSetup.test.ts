import { describe, expect, it } from "vitest";

import {
	CONSORTIUM_SETUP_STEPS,
	evaluateConsortiumSetup,
	hasDiscoveryBrand,
	isConsortiumSetupStepId,
	nextStep,
	previousStep,
	stepNumber,
	type ConsortiumSetupStepId,
} from "@helpers/consortiumSetup";

const consortium = (overrides: Record<string, unknown> = {}) => ({
	id: "c-1",
	name: "test-consortium",
	displayName: "Test Consortium",
	contacts: [],
	functionalSettings: [],
	...overrides,
});

const stepById = (
	state: ReturnType<typeof evaluateConsortiumSetup>,
	id: ConsortiumSetupStepId,
) => state.steps.find((step) => step.id === id)!;

describe("evaluateConsortiumSetup", () => {
	it("reports a fresh instance and sends the user to the consortium chapter", () => {
		// Appearance writes nothing, so it cannot be "outstanding" on data alone -
		// the first thing genuinely needing the user is the consortium record.
		const state = evaluateConsortiumSetup({ consortium: null });

		expect(state.isFresh).toBe(true);
		expect(state.isComplete).toBe(false);
		expect(state.firstIncompleteStep).toBe("appearance");
	});

	it("does not offer chapters that cannot be attempted without a consortium", () => {
		const state = evaluateConsortiumSetup({ consortium: null });

		expect(stepById(state, "consortium").available).toBe(true);
		for (const id of [
			"howItWorks",
			"contacts",
			"discovery",
			"libraries",
		] as const) {
			expect(stepById(state, id).available).toBe(false);
		}
	});

	it("counts an outstanding chapter only once the consortium exists", () => {
		const state = evaluateConsortiumSetup({
			consortium: consortium(),
			skipped: ["appearance"],
		});

		expect(state.firstIncompleteStep).toBe("howItWorks");
	});

	it("treats a skipped chapter as settled but never as complete", () => {
		const state = evaluateConsortiumSetup({
			consortium: consortium(),
			skipped: ["appearance", "howItWorks", "contacts", "discovery"],
		});

		const discovery = stepById(state, "discovery");
		expect(discovery.skipped).toBe(true);
		expect(discovery.complete).toBe(false);
		// Skipping settles it, so the flow moves on to the libraries.
		expect(state.firstIncompleteStep).toBe("libraries");
	});

	it("is complete when every chapter is done or settled", () => {
		const state = evaluateConsortiumSetup({
			consortium: consortium({
				contacts: [{ id: "p-1", email: "a@b.invalid" }],
				functionalSettings: [{ id: "f-1", name: "PICKUP_ANYWHERE" }],
				brandLogoUrl: "https://example.invalid/logo.png",
			}),
			libraryCount: 3,
			skipped: ["appearance"],
		});

		expect(state.isComplete).toBe(true);
		expect(state.firstIncompleteStep).toBeUndefined();
	});

	it("does not read an unconfigured consortium as branded", () => {
		// Every brand field is nullable, and the empty string is what an edit that
		// cleared a field leaves behind. Reading either as "branded" would mark the
		// chapter done for a consortium that has no mark at all.
		expect(hasDiscoveryBrand(consortium())).toBe(false);
		expect(hasDiscoveryBrand(consortium({ brandLogoUrl: null }))).toBe(false);
		expect(hasDiscoveryBrand(consortium({ patronWelcome: "   " }))).toBe(false);
		expect(hasDiscoveryBrand(consortium({ defaultThemeName: "kInt" }))).toBe(
			true,
		);
	});

	it("counts libraries, not the presence of the list", () => {
		const withNone = evaluateConsortiumSetup({
			consortium: consortium(),
			libraryCount: 0,
		});
		const withOne = evaluateConsortiumSetup({
			consortium: consortium(),
			libraryCount: 1,
		});

		expect(stepById(withNone, "libraries").complete).toBe(false);
		expect(stepById(withOne, "libraries").complete).toBe(true);
	});
});

describe("chapter order", () => {
	it("numbers chapters from one", () => {
		expect(stepNumber("appearance")).toBe(1);
		expect(stepNumber("libraries")).toBe(CONSORTIUM_SETUP_STEPS.length);
	});

	it("walks forwards and backwards without falling off either end", () => {
		expect(nextStep("appearance")).toBe("consortium");
		expect(nextStep("libraries")).toBeUndefined();
		expect(previousStep("consortium")).toBe("appearance");
		expect(previousStep("appearance")).toBeUndefined();
	});

	it("rejects a step id that is not one of ours", () => {
		// The route validates the URL segment through this, so a hand-typed or
		// bookmarked path cannot render a chapter that does not exist.
		expect(isConsortiumSetupStepId("discovery")).toBe(true);
		expect(isConsortiumSetupStepId("nonsense")).toBe(false);
		expect(isConsortiumSetupStepId(undefined)).toBe(false);
		expect(isConsortiumSetupStepId(3)).toBe(false);
	});
});
