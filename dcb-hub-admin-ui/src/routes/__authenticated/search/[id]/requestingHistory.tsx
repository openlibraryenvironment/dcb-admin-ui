import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Grid, Tab, Tabs } from "@mui/material";

// UI Components
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";

// Hooks & Helpers
import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { handleRecordTabChange } from "src/helpers/navigation/handleTabChange";
import { defaultPatronRequestColumnVisibility } from "@helpers/dataGrid/columns";
import { Location } from "@models/Location";

// Typed GraphQL Documents
import { getClustersTitleOnly } from "@queries/getClustersTitleOnly";
import { getLibraries } from "@queries/getLibraries";
import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getPatronRequests } from "@queries/getPatronRequests";

export const Route = createFileRoute(
	"/__authenticated/search/$id/requestingHistory",
)({
	component: RequestingHistory,
});

function RequestingHistory() {
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = Route.useParams();

	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gqlClient = useGraphQLClient();
	const [tabIndex, setTabIndex] = useState(4);

	// ==========================================
	// 1. CLUSTER DATA FETCH
	// ==========================================
	const {
		isLoading: clusterLoading,
		isError: clusterError,
		data: clusterData,
	} = useQuery({
		queryKey: ["cluster", "titleOnly", id],
		queryFn: () =>
			gqlClient.request(getClustersTitleOnlyDoc, { query: `id: ${id}` }),
		enabled: !!id,
	});

	// ==========================================
	// 2. LOCATIONS FETCH (Replaces Apollo fetchMore)
	// ==========================================
	// Instead of onCompleted, we just do the pagination loop inside the fetcher!
	const fetchAllLocations = async () => {
		const variables = {
			query: "",
			order: "name",
			orderBy: "ASC",
			pagesize: 100,
		};

		// Fetch page 0
		const firstPage = await gqlClient.request(
			getLocationForPatronRequestGridDoc,
			{ ...variables, pageno: 0 },
		);
		let allLocations = [...(firstPage?.locations?.content || [])];
		const totalSize = firstPage?.locations?.totalSize || 0;

		// If there are more pages, fetch them all concurrently
		if (allLocations.length < totalSize) {
			const totalPages = Math.ceil(totalSize / 100);
			const promises = [];
			for (let i = 1; i < totalPages; i++) {
				promises.push(
					gqlClient.request(getLocationForPatronRequestGridDoc, {
						...variables,
						pageno: i,
					}),
				);
			}

			const results = await Promise.all(promises);
			results.forEach((res) => {
				allLocations = [...allLocations, ...(res?.locations?.content || [])];
			});
		}

		return allLocations;
	};

	const { data: patronRequestLocations } = useQuery({
		queryKey: ["locations", "allPatronRequestGrid"],
		queryFn: fetchAllLocations,
	});

	// ==========================================
	// 3. LIBRARIES FETCH
	// ==========================================
	const { data: supplyingLibraries, isLoading: supplyingLibrariesLoading } =
		useQuery({
			queryKey: ["libraries", "allSupplying"],
			queryFn: () =>
				gqlClient.request(getLibrariesDoc, {
					order: "fullName",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 1000,
					query: "",
				}),
		});

	// ==========================================
	// 4. COLUMN CONFIGURATION
	// ==========================================
	const customColumns = useCustomColumns();
	const supplyingLibrariesContent = supplyingLibraries?.libraries?.content;

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: (patronRequestLocations as Location[]) || [],
		libraries: supplyingLibrariesContent,
		variant: "noStatus",
	});

	const noStatusColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	// ==========================================
	// 5. RENDER UI
	// ==========================================
	const query = "bibClusterId:" + id;

	if (clusterLoading || supplyingLibrariesLoading) {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.patronRequests.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout
			title={t("search.requesting_history_for", {
				title:
					clusterError || clusterLoading
						? id
						: clusterData?.instanceClusters?.content?.[0]?.title,
			})}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleRecordTabChange(
								event,
								value,
								router,
								setTabIndex,
								id as string,
							);
						}}
						aria-label="Group navigation"
					>
						<Tab label={t("nav.search.cluster")} />
						<Tab label={t("nav.search.cluster_explainer")} />
						<Tab label={t("nav.search.items")} />
						<Tab label={t("nav.search.identifiers")} />
						<Tab label={t("nav.search.requesting_history")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ServerPaginationGrid
						// Make sure ServerPaginationGrid accepts your new Document string
						query={getPatronRequestsDoc}
						presetQueryVariables={query}
						type="patronRequestsRecordHistory"
						coreType="patronRequests"
						columns={noStatusColumns}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t(
							"patron_requests.search_placeholder_error_message",
						)}
						columnVisibilityModel={{
							...defaultPatronRequestColumnVisibility,
						}}
						scrollbarVisible={true}
						sortModel={[{ field: "dateCreated", sort: "desc" }]}
						sortDirection="DESC"
						sortAttribute="dateCreated"
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
					/>
				</Grid>
			</Grid>
		</AdminLayout>
	);
}
