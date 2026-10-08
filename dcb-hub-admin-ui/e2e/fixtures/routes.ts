import { expect, type Page } from "@playwright/test";

import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./patron-request-detail";
import { mockLatestReleases } from "./service-status-mocks";
import consortiumBasics from "../fixtures-data/consortium-basics.json";
import consortium from "../fixtures-data/consortium.json";
import libraries from "../fixtures-data/libraries.json";
import libraryCount from "../fixtures-data/library-count.json";
import libraryDetail from "../fixtures-data/library-detail.json";
import libraryUsers from "../fixtures-data/library-users.json";
import libraryUserProvisioning from "../fixtures-data/library-user-provisioning.json";
import hostLms from "../fixtures-data/host-lms.json";
import groupDetail from "../fixtures-data/group-region-detail.json";
import resolvedSettings from "../fixtures-data/resolved-functional-settings.json";
import patronRequests from "../fixtures-data/patron-requests.json";
import mappings from "../fixtures-data/mappings.json";
import locations from "../fixtures-data/locations.json";
import groups from "../fixtures-data/groups.json";
import agencies from "../fixtures-data/agencies.json";
import dataChangeLog from "../fixtures-data/data-change-log.json";

/**
 * The routes a user cannot avoid, and the mocks they need.
 *
 * One home, because two gates walk this list: the axe scan in
 * accessibility.spec.ts and the missing-translation scan in i18n-missing.spec.ts.
 * A route added for one is measured by both, which is the point - a page nobody
 * scans is a page where either defect ships.
 */
export interface ScannedRoute {
	path: string;
	/** Route-specific mocks, registered before navigation. */
	setup?: (page: Page) => Promise<void>;
	/**
	 * Something on the page that only appears once the route's own data has
	 * arrived, so a scan never runs against a skeleton - a gate that measures a
	 * spinner passes for the wrong reason.
	 */
	ready: (page: Page) => Promise<void>;
}
export const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibraries: libraries,
	LoadLibraryCount: libraryCount,
	LoadAnnouncements: { announcements: [] },
	LoadLibraryContacts: libraryDetail,
	LoadLibraryUsers: libraryUsers,
	LibraryUserProvisioningAvailable: libraryUserProvisioning,
	LoadLibrary: libraryDetail,
	LoadLibraryServiceInfo: libraryDetail,
	LoadHostLms: hostLms,
	LoadLocations: locations,
	LoadGroup: groupDetail,
	LoadResolvedFunctionalSettings: resolvedSettings,
	LoadSettingsBearingGroupType: { settingsBearingGroupType: "REGION" },
	...patronRequestDetailMocks,
	// Every grid the route table reaches. An unmocked operation 404s against a
	// preview with no API behind it, the global handler renders the 500 route, and
	// the scan then measures an error page and passes for the wrong reason.
	LoadPatronRequests: patronRequests,
	// /patronRequests/all reads `allRequests`, which is this operation's field
	// alias - not LoadPatronRequests. Mocking the wrong one left the grid empty
	// and the ready predicate waiting for a row that was never fetched.
	GetPatronRequestDashboard: {
		allRequests: patronRequests.patronRequests,
		activeRequests: { totalSize: 1 },
		exceptionRequests: { totalSize: 1 },
		outOfSequenceRequests: { totalSize: 0 },
		finishedRequests: { totalSize: 0 },
	},
	LoadMappings: mappings,
	LoadNumericRangeMappings: {
		numericRangeMappings: { totalSize: 0, content: [] },
	},
	LoadGroups: groups,
	LoadAgencies: agencies,
	LoadDataChangeLog: dataChangeLog,
	LoadAlarms: { alarms: { totalSize: 0, content: [] } },
	LoadAudits: { audits: { totalSize: 0, content: [] } },
	LoadBibs: { sourceBibs: { totalSize: 0, content: [] } },
	LoadPatronRequestTotals: { patronRequests: { totalSize: 0 } },
};

/**
 * The routes a user cannot avoid. Each names something on the page that only appears once
 * the route's own data has arrived, so the scan never runs against a skeleton - a gate that
 * measures a spinner passes for the wrong reason.
 */
export const ROUTES: ScannedRoute[] = [
	{
		path: "/",
		ready: async (page) => {
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		},
	},
	{
		path: "/libraries",
		ready: async (page) => {
			await expect(page.getByText("Alpha Test Library")).toBeVisible();
		},
	},
	{
		path: "/consortium",
		ready: async (page) => {
			await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();
		},
	},
	{
		// V-12's compose form, plus the confirmation dialog behind it. A form is where
		// accessible names and error association fail, and the dialog is the widest-reaching
		// control in the application — a modal that traps focus badly is worse here than
		// almost anywhere.
		path: "/consortium/announcements",
		ready: async (page) => {
			await expect(
				page.getByRole("textbox", { name: "Headline" }),
			).toBeVisible();
		},
	},
	{
		// Six tabs, an audit grid and the Actions menu. It was scanned by nothing until
		// 2026-09-24, and carried a critical aria-valid-attr-value the whole time: the
		// tabs had no `value`, so the selected one's aria-controls named a panel id
		// nothing rendered.
		path: `/patronRequests/${TRACKED_REQUEST.id}`,
		ready: async (page) => {
			await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
		},
	},
	{
		path: "/settings",
		ready: async (page) => {
			// Named, because /settings now has three radio groups - theme, mode and
			// typeface. An unnamed getByRole is a strict-mode violation the moment a
			// second one appears, and this one only has to prove the panel has painted.
			await expect(
				page.getByRole("radiogroup", { name: /typeface/i }),
			).toBeVisible();
		},
	},
	{
		path: "/profile",
		ready: async (page) => {
			await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
		},
	},
	{
		// Service Status: the environment and version grids. GitHub is mocked so the
		// Latest version column is painted, not left at "Checking…".
		path: "/serviceInfo/serviceStatus",
		setup: mockLatestReleases,
		ready: async (page) => {
			await expect(
				page.getByRole("row").filter({ hasText: "dcb-admin-ui" }),
			).toContainText("Up to date");
		},
	},
	{
		// The busiest grid in the application, and the one every shift starts on.
		path: "/patronRequests/all",
		ready: async (page) => {
			// A visible column: patronHostlmsCode is hidden by
			// defaultPatronRequestColumnVisibility, so asserting on it could never pass.
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		// A nav list, and the route whose ListItems rendered as nested <nav>
		// landmarks. axe's `list` rule could not see it, because the parent was not a
		// <ul> either - so this scans the structure that replaced it.
		path: "/mappings",
		ready: async (page) => {
			await expect(
				page.getByRole("navigation", { name: /^mappings$/i }),
			).toBeVisible();
		},
	},
	{
		// An editable grid: row edit mode, a save/cancel action pair per row and the
		// export menu's format choice. Dense row actions are where target size fails.
		path: "/mappings/allReferenceValue",
		ready: async (page) => {
			await expect(page.getByText("loanable-item")).toBeVisible();
		},
	},
	{
		path: "/locations",
		ready: async (page) => {
			await expect(page.getByText("Alpha Main Desk")).toBeVisible();
		},
	},
	{
		path: "/hostlmss",
		ready: async (page) => {
			await expect(page.getByText("Alpha LMS")).toBeVisible();
		},
	},
	{
		path: "/groups",
		ready: async (page) => {
			await expect(page.getByText("Northern Region")).toBeVisible();
		},
	},
	{
		path: "/agencies",
		ready: async (page) => {
			await expect(page.getByText("Alpha Test Agency")).toBeVisible();
		},
	},
	{
		// The library detail page in VIEW mode and its tab strip - ten tabs, and the
		// widest navigation surface in the product after the sidebar. The edit-mode
		// scan of the same path is below, in its own block: pressing Edit replaces
		// the page with a form, and neither covers the other.
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22",
		ready: async (page) => {
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		},
	},
	{
		path: "/serviceInfo",
		ready: async (page) => {
			await expect(
				page.getByRole("navigation", { name: /^service info$/i }),
			).toBeVisible();
		},
	},
	{
		// Fed by /sql, which returns whatever columns the named query selects and
		// never an id - so until that was fixed this route threw before it painted.
		// Its own behaviour is covered by e2e/request-errors.spec.ts; this is the
		// accessibility half.
		path: "/serviceInfo/requestErrors",
		setup: async (page) => {
			await page.route("**/sql?*", (route) =>
				route.fulfill({
					json: {
						hits: [
							{
								description: "Read timeout, DCB-1450",
								namedSql: "errors/readTimeout",
								total: "12",
								mostRecent: "2026-09-30",
								earliest: "2026-08-01",
							},
						],
					},
				}),
			);
		},
		ready: async (page) => {
			await expect(page.getByText("Read timeout, DCB-1450")).toBeVisible();
		},
	},
	{
		path: "/serviceInfo/dataChangeLog",
		ready: async (page) => {
			await expect(page.getByText("Corrected the agency code")).toBeVisible();
		},
	},
	{
		// The accounts grid: a status chip and two text actions per row, in every scheme.
		// Chips and dense row actions are where contrast and target size fail, so this
		// route earns its place rather than being taken as covered by library pages that
		// have neither.
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/accounts",
		ready: async (page) => {
			await expect(page.getByText("ada@alpha.example")).toBeVisible();
		},
	},
];
