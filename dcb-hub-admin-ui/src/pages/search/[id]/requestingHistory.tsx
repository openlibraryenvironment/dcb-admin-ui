import { useQuery } from "@apollo/client";
import { Grid, Tab, Tabs } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import {
	getClustersTitleOnly,
	getLibraries,
	getLocationForPatronRequestGrid,
	getPatronRequests,
} from "src/queries/queries";
import { defaultPatronRequestColumnVisibility } from "src/helpers/DataGrid/columns";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";
import { useMemo, useState } from "react";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { Location } from "@models/Location";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { handleRecordTabChange } from "src/helpers/navigation/handleTabChange";

export default function RequestingHistory() {
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const { id } = router.query;
	const {
		loading: clusterLoading,
		error: clusterError,
		data: clusterData,
	} = useQuery(getClustersTitleOnly, {
		variables: { query: `id: ${id}` },
		skip: !id,
		errorPolicy: "all",
	});
	const [tabIndex, setTabIndex] = useState(3);

	const { data: locationsData, fetchMore } = useQuery(
		getLocationForPatronRequestGrid,
		{
			variables: {
				query: "",
				order: "name",
				orderBy: "ASC",
				pagesize: 100,
				pageno: 0,
			},
			onCompleted: (data) => {
				if (data.locations.content.length < data.locations.totalSize) {
					const totalPages = Math.ceil(data.locations.totalSize / 100);
					const fetchPromises = Array.from(
						{ length: totalPages - 1 },
						(_, index) =>
							fetchMore({
								variables: {
									pageno: index + 1,
								},
								updateQuery: (prev, { fetchMoreResult }) => {
									if (!fetchMoreResult) return prev;
									return {
										locations: {
											...fetchMoreResult.locations,
											content: [
												...prev.locations.content,
												...fetchMoreResult.locations.content,
											],
										},
									};
								},
							}),
					);
					Promise.all(fetchPromises).catch((error) =>
						console.error("Error fetching additional locations:", error),
					);
				}
			},
			errorPolicy: "all",
		},
	);

	const patronRequestLocations: Location[] = locationsData?.locations.content;

	const { data: supplyingLibraries, loading: supplyingLibrariesLoading } =
		useQuery(getLibraries, {
			variables: {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			},
			errorPolicy: "all",
		});

	const customColumns = useCustomColumns();
	const supplyingLibrariesContent = supplyingLibraries?.libraries?.content;
	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: patronRequestLocations,
		libraries: supplyingLibrariesContent,
		variant: "noStatus",
	});
	const noStatusColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	const query = "bibClusterId:" + id;
	if (status === "loading" || supplyingLibrariesLoading) {
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
						<Tab label={t("nav.search.items")} />
						<Tab label={t("nav.search.identifiers")} />
						<Tab label={t("nav.search.requesting_history")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<ServerPaginationGrid
						query={getPatronRequests}
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

export async function getServerSideProps(ctx: any) {
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
}
