import { expect, type Page } from "@playwright/test";

import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./patron-request-detail";
import { mockLatestReleases } from "./service-status-mocks";
import { overrideGraphQL } from "./graphql-mocks";
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
import clusterRecord from "../fixtures-data/cluster-record.json";
import catalogMetrics from "../fixtures-data/catalog-metrics.json";
import audit from "../fixtures-data/audit.json";
import bibDetail from "../fixtures-data/bib-detail.json";
import { CLUSTER_ID, mockClusterRest } from "./cluster-mocks";

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
	// The consortium contacts grid. Its own operation, and unmocked it 404s.
	LoadConsortiumContacts: consortium,
	LoadLibraries: libraries,
	// The light code-to-library projection, a different operation from LoadLibraries.
	LoadLibraryDirectory: libraries,
	LoadLibraryCount: libraryCount,
	LoadAnnouncements: { announcements: [] },
	LoadLibraryContacts: libraryDetail,
	LoadLibraryUsers: libraryUsers,
	LibraryUserProvisioningAvailable: libraryUserProvisioning,
	LoadLibrary: libraryDetail,
	LoadLibraryServiceInfo: libraryDetail,
	LoadHostLms: hostLms,
	// A DIFFERENT operation from LoadHostLms, and unmocked it 404s: the consortium-wide
	// mappings route fetches it for the new-mapping form's context list, and the global
	// throwOnError sends any non-401/503 failure to GlobalError - so the page died about
	// two seconds after load and only fast specs finished before it did.
	LoadHostLmsCodes: hostLms,
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
	// The detail route's own operation, over the same shape as the list's. Absent from
	// here rather than unfixturable, which is why that route was unscanned.
	GetDataChangeLogById: dataChangeLog,
	LoadAlarms: { alarms: { totalSize: 0, content: [] } },
	LoadAudits: { audits: { totalSize: 0, content: [] } },
	LoadBibs: { sourceBibs: { totalSize: 0, content: [] } },
	LoadPatronRequestTotals: { patronRequests: { totalSize: 0 } },
	// Unmocked, both 404'd quietly on every gate run and the scans measured their fallbacks.
	// docs/testing.md, "An unmocked operation is not a neutral default"
	// The cluster layout reads the title-only projection and its tabs read the full
	// record; two operations over the same data, so one fixture answers both.
	ClusterRecords: clusterRecord,
	ClusterRecordsTitleOnly: clusterRecord,
	LoadLocationForPRGrid: locations,
	LoadAuditIncidence: {
		auditIncidence: {
			interval: "DAY",
			totalSize: 12,
			buckets: [
				{ bucketStart: "2026-09-29T00:00:00Z", count: 7 },
				{ bucketStart: "2026-09-30T00:00:00Z", count: 5 },
			],
		},
	},
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
		// Level 1, and it used to be level 2: this page hides PageContainer's title box
		// and headed itself with an h2, so it had no top-level heading at all. This
		// predicate was asserting the defect.
		path: "/profile",
		ready: async (page) => {
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

	/*
	 * The seven per-library mapping pages. Four of them rendered a 500 for every
	 * visit - `library.agency?.hostLms?.code` in a template string ABOVE the
	 * isLoading guard, so the first render threw before the library query had even
	 * been started - and no gate looked at them, because this list did not.
	 */
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/referenceValueMappings/all",
		ready: async (page) => {
			await expect(page.getByText("loanable-item").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/referenceValueMappings/itemType",
		ready: async (page) => {
			await expect(page.getByText("loanable-item").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/referenceValueMappings/location",
		ready: async (page) => {
			await expect(page.getByText("loanable-item").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/referenceValueMappings/patronType",
		ready: async (page) => {
			await expect(page.getByText("loanable-item").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/numericRangeMappings/all",
		ready: async (page) => {
			// LoadNumericRangeMappings is mocked empty, so the grid's own empty state is
			// what "this page has finished" looks like here.
			await expect(page.getByText("No results found").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/numericRangeMappings/itemType",
		ready: async (page) => {
			// LoadNumericRangeMappings is mocked empty, so the grid's own empty state is
			// what "this page has finished" looks like here.
			await expect(page.getByText("No results found").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/numericRangeMappings/patronType",
		ready: async (page) => {
			// LoadNumericRangeMappings is mocked empty, so the grid's own empty state is
			// what "this page has finished" looks like here.
			await expect(page.getByText("No results found").first()).toBeVisible();
		},
	},
	/*
	 * The rest of the application. 47 of 86 navigable routes had no axe scan at all,
	 * which is also why four of them could be a 500 on every visit without anything
	 * going red. These are the ones that render against the shared mocks; what is
	 * still missing is listed in docs/accessibility.md.
	 */
	{
		path: "/unauthorised",
		ready: async (page) => {
			await expect(page.getByText("401 Unauthorised").first()).toBeVisible();
		},
	},
	{
		path: "/maintenance",
		ready: async (page) => {
			await expect(
				page.getByText("Maintenance in progress").first(),
			).toBeVisible();
		},
	},
	{
		path: "/networkError",
		ready: async (page) => {
			await expect(page.getByText("Network error").first()).toBeVisible();
		},
	},
	{
		// LoadBibs is mocked empty, so the grid's own empty state is this page finished.
		path: "/bibs",
		ready: async (page) => {
			await expect(page.getByText("No results").first()).toBeVisible();
		},
	},
	{
		// The shared index before a search term: its own empty state, not a spinner.
		path: "/search",
		ready: async (page) => {
			await expect(page.getByText("No data available").first()).toBeVisible();
		},
	},
	{
		path: "/mappings/allNumericRange",
		ready: async (page) => {
			await expect(page.getByText("No results found").first()).toBeVisible();
		},
	},
	{
		path: "/patronRequests/active",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/patronRequests/completed",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/patronRequests/exception",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/patronRequests/outOfSequence",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/consortium/contacts",
		ready: async (page) => {
			await expect(
				page.getByText("contact@example.invalid").first(),
			).toBeVisible();
		},
	},
	{
		// The environment grid's rows appear once every health request has settled
		path: "/consortium/environment",
		ready: async (page) => {
			await expect(page.getByText("Keycloak").first()).toBeVisible();
		},
	},
	{
		path: "/consortium/onboarding",
		ready: async (page) => {
			await expect(
				page.getByText("Consortium at a glance").first(),
			).toBeVisible();
		},
	},
	{
		path: "/serviceInfo/alarms",
		ready: async (page) => {
			await expect(page.getByText("No results").first()).toBeVisible();
		},
	},
	{
		path: "/serviceInfo/auditExplorer",
		ready: async (page) => {
			await expect(page.getByText("Common signals").first()).toBeVisible();
		},
	},
	{
		path: "/serviceInfo/requestErrors/requests",
		ready: async (page) => {
			await expect(page.getByText("No results found").first()).toBeVisible();
		},
	},
	{
		path: "/groups/99999999-1111-5111-9111-111111111111",
		ready: async (page) => {
			await expect(page.getByText("NORTH-EAST").first()).toBeVisible();
		},
	},
	{
		// Both group request grids block on allLocationsQuery, which is why they were
		// a 500 until it stopped throwing.
		//
		// The GRID rather than a cell: at the 320px viewport the narrow project uses,
		// the Title column is hidden, so no row text is dependable. One spinner covers
		// all four of this route's queries, so the grid existing IS its data arriving.
		path: "/groups/99999999-1111-5111-9111-111111111111/patronRequests",
		ready: async (page) => {
			await expect(page.getByRole("grid")).toBeVisible();
		},
	},
	{
		path: "/groups/99999999-1111-5111-9111-111111111111/supplierRequests",
		ready: async (page) => {
			await expect(page.getByRole("grid")).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/contacts",
		ready: async (page) => {
			await expect(
				page.getByText("No contacts found for this library").first(),
			).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/locations",
		ready: async (page) => {
			await expect(page.getByText("Alpha Main Desk").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/patronRequests/active",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/patronRequests/all",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/patronRequests/completed",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/patronRequests/exception",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/patronRequests/outOfSequence",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/supplierRequests/all",
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},

	/*
	 * The agency and location detail routes. Both were blocked from this list, not by a
	 * defect but by the shared MOCKS answering LoadAgency and LoadLocation EMPTY - which
	 * the patron request detail page needs them to do. `overrideGraphQL` answers those
	 * two differently for these routes only.
	 */
	/*
	 * Two routes that needed no new record data to join this list - one REST response
	 * and one override of a mock that is empty on purpose elsewhere.
	 *
	 * They were reported as fixture-blocked when they were not. A detail route cannot be
	 * scanned without a record, but a GRID route can be scanned over its own empty state,
	 * which nine entries in this list already do - and the library bibs grid needed only
	 * the library basics that the patron request detail page deliberately empties.
	 */
	{
		/*
		 * The one admin surface that ran no axe at all: its own spec drives the
		 * invitation flow and never scans. Readiness is a real timeout against a
		 * preview, so the checks are mocked here exactly as they are there.
		 */
		path: "/serviceInfo/dcbNcipOnboarding",
		setup: async (page) => {
			await page.route("**/api/v1/dcb-profile-ncip2/readiness", (route) =>
				route.fulfill({
					json: {
						ready: false,
						profile: "DCB-NCIP2.02+",
						profileVersion: 1,
						dcbBaseUrl: "https://dcb.example",
						checks: [
							{
								code: "PEER_AUTH_ENABLED",
								status: "FAIL",
								message: "Enable dcb.peer-auth.enabled.",
								remediation: "Enable dcb.peer-auth.enabled.",
							},
						],
					},
				}),
			);
		},
		ready: async (page) => {
			await expect(page.getByText("PEER_AUTH_ENABLED")).toBeVisible();
		},
	},
	{
		// Its own two operations, plus LoadAgency - which the shared set empties for the
		// patron request detail page - so the source library resolves to a name.
		path: "/bibs/bb220000-2222-5222-9222-bbbbbbbbbbbb",
		setup: (page) =>
			overrideGraphQL(page, {
				LoadBibMainDetails: bibDetail,
				LoadBibSourceRecord: bibDetail,
				LoadAgency: agencies,
			}),
		ready: async (page) => {
			await expect(page.getByText("Lovelace, Ada").first()).toBeVisible();
		},
	},
	{
		// GetAuditsByPatronRequest stays empty from the shared set: that is the
		// previous/next strip, and having neither is a state the page has to handle.
		path: "/patronRequests/audits/a0d17e42-6b58-4f91-8c23-5e7a9d4b1c60",
		setup: (page) => overrideGraphQL(page, { GetAuditById: audit }),
		ready: async (page) => {
			await expect(
				page.getByText("Virtual checkout failed at the supplying agency"),
			).toBeVisible();
		},
	},
	{
		path: "/serviceInfo/catalogMetricsByHostLms",
		setup: async (page) => {
			// A FLAT array: the grid does rows={records ?? []}, not a paged envelope.
			await page.route("**/hostlmss/importIngestDetails", (route) =>
				route.fulfill({ json: catalogMetrics }),
			);
		},
		ready: async (page) => {
			await expect(page.getByText("alpha-lms").first()).toBeVisible();
		},
	},
	{
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/bibs",
		// LoadLibraryBasics is empty in the shared set for the patron request detail
		// page; this page needs it to title itself and render its tabs.
		setup: (page) =>
			overrideGraphQL(page, { LoadLibraryBasics: libraryDetail }),
		ready: async (page) => {
			// LoadBibs is mocked empty, so the grid's own empty state is this page
			// finished - the same standard /bibs and /serviceInfo/alarms are held to.
			// This grid has its OWN empty string, not the shared ui.data_grid one.
			await expect(
				page.getByText("No bib records found").first(),
			).toBeVisible();
		},
	},
	{
		path: "/serviceInfo/dataChangeLog/9d2a5f81-3c64-4b09-8e75-6a1f3b8c4d90",
		ready: async (page) => {
			await expect(page.getByText("Corrected the agency code")).toBeVisible();
		},
	},
	{
		path: "/agencies/4c9f6b23-8d17-4a50-9e38-1b7c5d2a6f44",
		setup: (page) => overrideGraphQL(page, { LoadAgency: agencies }),
		ready: async (page) => {
			await expect(page.getByText("Alpha Test Agency").first()).toBeVisible();
		},
	},
	{
		path: "/locations/1f0c9b3a-1111-5111-9111-111111111111",
		setup: (page) => overrideGraphQL(page, { LoadLocation: locations }),
		ready: async (page) => {
			// The location's own name. The loading branch now titles the page
			// "Locations" generically, so the specific name is what says the query
			// answered.
			await expect(page.getByText("Alpha Main Desk").first()).toBeVisible();
		},
	},

	/*
	 * Two detail routes whose loading branch used to render a bare spinner where the
	 * loaded page renders breadcrumbs and a title box. Both already had their data in
	 * the shared MOCKS, so nothing but this list was missing - which is why neither was
	 * measured.
	 */
	{
		path: "/hostlmss/h1h1h1h1-1111-5111-9111-111111111111",
		ready: async (page) => {
			await expect(page.getByText("alpha-lms").first()).toBeVisible();
		},
	},
	{
		path: "/groups/99999999-1111-5111-9111-111111111111/settings",
		ready: async (page) => {
			// The circulation section, which only renders once the group has arrived.
			// Not a `grid`: this page lays out with MUI Grid and has no DataGrid.
			await expect(page.getByText("Circulation").first()).toBeVisible();
		},
	},

	/*
	 * The cluster surface: a layout and its five tabs, none of which any spec opened.
	 *
	 * It is reached from the shared index, it is where a member record is actually
	 * inspected, and `items` is the live fan-out - dcb-service turns one
	 * /items/availability call into one request per Host LMS to systems we do not own,
	 * and this tab fires two of them concurrently. That makes it the route whose cost
	 * matters most and the one nothing was measuring.
	 *
	 * Each predicate names something only its own tab renders. The cluster title is not
	 * usable for that: it is in the h1 on all five.
	 */
	{
		path: `/search/${CLUSTER_ID}/cluster`,
		setup: mockClusterRest,
		ready: async (page) => {
			await expect(page.getByText("Date created").first()).toBeVisible();
		},
	},
	{
		path: `/search/${CLUSTER_ID}/clusterExplanation`,
		setup: mockClusterRest,
		ready: async (page) => {
			// The parsed event type, so the audit log has been fetched AND interpreted -
			// an empty grid would pass a scan without proving either.
			await expect(
				page.getByText("Match - high confidence").first(),
			).toBeVisible();
		},
	},
	{
		path: `/search/${CLUSTER_ID}/items`,
		setup: mockClusterRest,
		ready: async (page) => {
			// A status code from the availability response, via the column's valueGetter.
			await expect(page.getByText("AVAILABLE").first()).toBeVisible();
		},
	},
	{
		path: `/search/${CLUSTER_ID}/identifiers`,
		setup: mockClusterRest,
		ready: async (page) => {
			// The author column, which only this tab has.
			await expect(page.getByText("Lovelace, Ada").first()).toBeVisible();
		},
	},
	{
		path: `/search/${CLUSTER_ID}/requestingHistory`,
		setup: mockClusterRest,
		ready: async (page) => {
			await expect(
				page.getByText("Alpha and the art of failure").first(),
			).toBeVisible();
		},
	},
];
