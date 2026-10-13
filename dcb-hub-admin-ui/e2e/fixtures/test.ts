import { test as base, expect } from "@playwright/test";

/** What the application's missingKeyHandler records - src/helpers/i18nMissingKeys.ts. */
type MissingKey = { language: string; namespace: string; key: string };
type WithCollector = Window & {
	__I18N_MISSING__?: MissingKey[];
	__e2eMissingKey?: (entry: MissingKey) => Promise<void>;
};

/**
 * Every test fails if anything it opened rendered a translation key the catalogue does
 * not carry. e2e/i18n-missing.spec.ts covers each route's first render; this covers the
 * dialogs, errors and validation a journey reaches. docs/i18n.md.
 */
export const test = base.extend<{ missingTranslations: void }>({
	missingTranslations: [
		async ({ context }, use) => {
			const recorded: MissingKey[] = [];
			await context.exposeBinding(
				"__e2eMissingKey",
				(_source, entry: MissingKey) => {
					recorded.push(entry);
				},
			);
			// The collector lives on window, which every navigation replaces, so push is
			// wrapped as the application assigns the array. The array is never created here:
			// its presence is what i18n-missing.spec.ts reads as "the collector is armed".
			await context.addInitScript(() => {
				const w = window as WithCollector;
				let store: MissingKey[] | undefined;
				Object.defineProperty(w, "__I18N_MISSING__", {
					configurable: true,
					get: () => store,
					set(value: MissingKey[]) {
						const push = value.push.bind(value);
						value.push = (...entries: MissingKey[]) => {
							for (const entry of entries) void w.__e2eMissingKey?.(entry);
							return push(...entries);
						};
						store = value;
					},
				});
			});

			await use();

			// A binding call still in flight at teardown is in the open page's array too
			for (const page of context.pages()) {
				if (page.isClosed()) continue;
				const onPage = await page
					.evaluate(() => (window as WithCollector).__I18N_MISSING__ ?? [])
					.catch(() => []);
				recorded.push(...onPage);
			}
			const unique = [
				...new Map(
					recorded.map((r) => [`${r.language}|${r.namespace}|${r.key}`, r]),
				).values(),
			];
			expect(
				unique,
				"Rendered a translation key the catalogue does not carry - a user sees the raw key. docs/i18n.md",
			).toEqual([]);
		},
		{ auto: true },
	],
});

export { expect };
