import type { Page } from "@playwright/test";

import pkg from "../../package.json";

export const LATEST_RELEASES_URL =
	"https://api.github.com/repos/openlibraryenvironment/*/releases/latest";

/**
 * GitHub's `releases/latest` for both repos: dcb-service at v9.0.0, and dcb-admin-ui at the
 * version this build carries, so its row reads "Up to date".
 */
export async function mockLatestReleases(page: Page) {
	await page.route(LATEST_RELEASES_URL, (route) =>
		route.fulfill({
			headers: { "access-control-allow-origin": "*" },
			json: route.request().url().includes("/dcb-service/")
				? { tag_name: "v9.0.0", published_at: "2026-08-20T18:40:20Z" }
				: {
						tag_name: `v${pkg.version}`,
						published_at: "2026-09-15T08:12:14Z",
					},
		}),
	);
}
