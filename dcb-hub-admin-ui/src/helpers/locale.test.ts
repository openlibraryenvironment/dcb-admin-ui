import { afterEach, describe, expect, it, vi } from "vitest";

import {
	DEFAULT_LOCALE,
	deploymentLocale,
	resolveFormatLocale,
	resolveLanguage,
} from "@helpers/locale";

const deployedWith = (locale?: string) =>
	vi.stubGlobal("window", { __APP_ENV__: { VITE_LOCALE: locale } });

describe("the deployment's locale", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("is en-GB when VITE_LOCALE is unset, as the interface text always was", () => {
		deployedWith(undefined);
		expect(deploymentLocale()).toBe("en-GB");
		deployedWith("");
		expect(deploymentLocale()).toBe(DEFAULT_LOCALE);
	});

	it("is whatever VITE_LOCALE names, when it names a supported locale", () => {
		deployedWith("en-US");
		expect(deploymentLocale()).toBe("en-US");
	});

	it("falls back, and says so, when VITE_LOCALE names anything else", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		deployedWith("fr-FR");

		expect(deploymentLocale()).toBe("en-GB");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("fr-FR"));
	});
});

describe("a user's choice", () => {
	it("follows the deployment until the user picks something else", () => {
		expect(resolveLanguage("deployment", "en-GB")).toBe("en-GB");
		expect(resolveLanguage("en-US", "en-GB")).toBe("en-US");
		expect(resolveLanguage("es", "en-GB")).toBe("es");
	});

	it("formats dates in the chosen English, and in the deployment's for Spanish", () => {
		expect(resolveFormatLocale("en-US", "en-GB")).toBe("en-US");
		expect(resolveFormatLocale("deployment", "en-GB")).toBe("en-GB");
		expect(resolveFormatLocale("es", "en-GB")).toBe("en-GB");
	});
});
