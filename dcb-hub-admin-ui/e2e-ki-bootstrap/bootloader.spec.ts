import { expect, test, type Page } from "@playwright/test";

const runtimeConfig = {
	VITE_KEYCLOAK_URL: "https://identity.example.invalid",
	VITE_KEYCLOAK_ID: "dcb-admin",
	VITE_DCB_API_BASE: "https://api.example.invalid",
	VITE_DCB_SEARCH_BASE: "https://search.example.invalid",
	VITE_MUI_X_LICENSE_KEY: "",
};

const bundlePath = "/dcb-hub-admin-ui/v-test";

async function mapPublishedPrefix(page: Page, prefix: string): Promise<void> {
	await page.route(`http://localhost:4174${prefix}/**`, async (route) => {
		const sourceUrl = new URL(route.request().url());
		sourceUrl.pathname = sourceUrl.pathname.replace(prefix, "");
		const response = await route.fetch({ url: sourceUrl.href });
		await route.fulfill({ response });
	});
}

async function mockServiceInfo(page: Page): Promise<void> {
	await page.route("https://api.example.invalid/info", async (route) => {
		await route.fulfill({
			json: {
				version: "test",
				env: { code: "test" },
				branch: "test",
			},
		});
	});
}

async function mount(page: Page, path: string): Promise<void> {
	await mapPublishedPrefix(page, bundlePath);
	await mockServiceInfo(page);

	await page.goto(`${bundlePath}/ki-bootstrap.js`);
	await page.evaluate(
		async ({ path, runtimeConfig }) => {
			window.history.replaceState({}, "", path);
			document.head.innerHTML = "";
			document.body.innerHTML = '<main id="bootloader-mount"></main>';

			const importModule = new Function("url", "return import(url)") as (
				url: string,
			) => Promise<{
				mount(options: {
					element: HTMLElement;
					config: Record<string, unknown>;
				}): Promise<void>;
			}>;
			const adapter = await importModule(
				"/dcb-hub-admin-ui/v-test/ki-bootstrap.js",
			);
			await adapter.mount({
				element: document.getElementById("bootloader-mount")!,
				config: runtimeConfig,
			});
		},
		{ path, runtimeConfig },
	);
	await page.waitForLoadState("networkidle");
}

test("mounts at the host root with runtime configuration", async ({ page }) => {
	await mount(page, "/");

	await expect(page).toHaveURL(/\/login\?redirect=%2F$/);
	await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
	await expect(page.locator("#bootloader-mount")).not.toBeEmpty();

	const state = await page.evaluate(() => ({
		apiBase: window.__APP_ENV__?.VITE_DCB_API_BASE,
		bundleBase: window.__DCB_BUNDLE_BASE_URL__,
		stylesheets: Array.from(
			document.querySelectorAll<HTMLLinkElement>("link[data-ki-stylesheet]"),
			(link) => link.href,
		),
	}));

	expect(state.apiBase).toBe(runtimeConfig.VITE_DCB_API_BASE);
	expect(state.bundleBase).toBe(
		"http://localhost:4174/dcb-hub-admin-ui/v-test/",
	);
	expect(state.stylesheets).toHaveLength(1);
	expect(state.stylesheets[0]).toMatch(
		/^http:\/\/localhost:4174\/dcb-hub-admin-ui\/v-test\/assets\/.+\.css$/,
	);
});

test("preserves a deep-link redirect target", async ({ page }) => {
	await mount(page, "/libraries");
	await expect(page).toHaveURL(/\/login\?redirect=%2Flibraries$/);
});

test("the same artifact retains its standalone entrypoint", async ({
	page,
}) => {
	await mapPublishedPrefix(page, "/dcb-admin");
	await mockServiceInfo(page);
	await page.addInitScript((config) => {
		window.__APP_ENV__ = config;
	}, runtimeConfig);

	await page.goto("/dcb-admin/");

	await expect(page).toHaveURL(/\/dcb-admin\/login\?redirect=%2F$/);
	await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
	await page.waitForLoadState("networkidle");
});
