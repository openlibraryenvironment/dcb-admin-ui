import { describe, expect, it } from "vitest";

import {
	CONSORTIUM_SETUP_STEPS,
	evaluateConsortiumSetup,
	hasDiscoveryBrand,
	isConsortiumSetupStepId,
	nextStep,
	previousStep,
	setupEntryPoint,
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
		// The first OUTSTANDING chapter is the consortium record - appearance is optional
		// and never outstanding - but a fresh deployment still opens at the beginning.
		expect(state.firstIncompleteStep).toBe("consortium");
		expect(state.resumeStep).toBe("appearance");
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

describe("the appearance chapter", () => {
	// The bug this covers: appearance used to count "the user skipped past it" as done,
	// and skips live in browser localStorage. A brand new deployment opened in a browser
	// that had been through setup before therefore claimed the chapter was already
	// finished - while the same consortium on a colleague's machine claimed it was not.
	it("is never complete, and never outstanding, whatever the browser remembers", () => {
		const fresh = evaluateConsortiumSetup({ consortium: null });
		const appearance = fresh.steps.find((step) => step.id === "appearance");

		expect(appearance?.optional).toBe(true);
		expect(appearance?.complete).toBe(false);
		expect(appearance?.skipped).toBe(false);
		expect(fresh.firstIncompleteStep).not.toBe("appearance");
	});

	it("ignores a stale skip left over from a previous deployment", () => {
		const withStaleSkip = evaluateConsortiumSetup({
			consortium: null,
			skipped: ["appearance"],
		});
		const appearance = withStaleSkip.steps.find((s) => s.id === "appearance");

		// The whole point: browser state cannot make a new system look part-configured.
		expect(appearance?.complete).toBe(false);
		expect(appearance?.skipped).toBe(false);
	});

	it("does not hold setup open once everything else is done", () => {
		const done = evaluateConsortiumSetup({
			consortium: {
				functionalSettings: [{ name: "PICKUP_ANYWHERE" }],
				contacts: [{ id: "1" }],
				brandLogoUrl: "https://example.invalid/logo.png",
			},
			libraryCount: 1,
		});

		// An optional chapter that counted as outstanding would leave the banner up for
		// the life of the deployment, asking for work that does not exist.
		expect(done.isComplete).toBe(true);
		expect(done.firstIncompleteStep).toBeUndefined();
		expect(done.resumeStep).toBe("appearance");
	});
});

describe("progress", () => {
	const configured = {
		functionalSettings: [{ name: "PICKUP_ANYWHERE" }],
		contacts: [{ id: "1" }],
		brandLogoUrl: "https://example.invalid/logo.png",
	};

	it("counts the five chapters that can hold setup open, not all six", () => {
		// Appearance writes nothing and can never be outstanding. Counting it would put a
		// finished consortium permanently at five sixths.
		const state = evaluateConsortiumSetup({ consortium: null });

		expect(state.progress.total).toBe(5);
		expect(state.progress.settled).toBe(0);
		expect(state.progress.percent).toBe(0);
	});

	it("does not shrink the denominator to what is reachable today", () => {
		// A fresh instance can only attempt one chapter; it still has five to do. A
		// denominator of 1 here would show 100% the moment the consortium was created and
		// then jump backwards to 20%.
		const fresh = evaluateConsortiumSetup({ consortium: null });
		const started = evaluateConsortiumSetup({ consortium: consortium() });

		expect(fresh.progress.total).toBe(started.progress.total);
		expect(started.progress.settled).toBe(1);
		expect(started.progress.percent).toBe(20);
	});

	it("reaches 100 exactly when nothing is outstanding", () => {
		const state = evaluateConsortiumSetup({
			consortium: consortium(configured),
			libraryCount: 1,
		});

		expect(state.isComplete).toBe(true);
		expect(state.progress.percent).toBe(100);
	});

	it("reports a skip as settled but never as complete", () => {
		// The distinction the finish screen exists to preserve: "4 of 5 done" when one of
		// them was passed over is how a half-configured consortium gets signed off.
		const state = evaluateConsortiumSetup({
			consortium: consortium({
				functionalSettings: [{ name: "PICKUP_ANYWHERE" }],
				contacts: [{ id: "1" }],
			}),
			libraryCount: 1,
			skipped: ["discovery"],
		});

		expect(state.isComplete).toBe(true);
		expect(state.progress.complete).toBe(4);
		expect(state.progress.skipped).toBe(1);
		expect(state.progress.settled).toBe(5);
		expect(state.progress.percent).toBe(100);
	});

	it("counts a skipped chapter that was later filled in once, as complete", () => {
		const state = evaluateConsortiumSetup({
			consortium: consortium(configured),
			libraryCount: 1,
			// The skip is still in browser storage; the branding is now really there.
			skipped: ["discovery"],
		});

		expect(state.progress.complete).toBe(5);
		expect(state.progress.skipped).toBe(0);
	});
});

describe("where /setup opens", () => {
	it("sends a fresh instance to the start of the flow", () => {
		const state = evaluateConsortiumSetup({ consortium: null });

		expect(setupEntryPoint(state)).toEqual({
			kind: "chapter",
			step: "appearance",
		});
	});

	it("resumes a partly-done instance at the outstanding chapter", () => {
		const state = evaluateConsortiumSetup({ consortium: consortium() });

		expect(setupEntryPoint(state)).toEqual({
			kind: "chapter",
			step: "howItWorks",
		});
	});

	it("sends a finished instance to the inventory, not back to chapter one", () => {
		// The defect: somebody opening setup from the Consortium tab to change a logo met
		// a page about their own colour scheme and had to find the rail to get anywhere.
		const state = evaluateConsortiumSetup({
			consortium: consortium({
				functionalSettings: [{ name: "PICKUP_ANYWHERE" }],
				contacts: [{ id: "1" }],
				brandLogoUrl: "https://example.invalid/logo.png",
			}),
			libraryCount: 1,
		});

		expect(setupEntryPoint(state)).toEqual({ kind: "finish" });
	});
});
