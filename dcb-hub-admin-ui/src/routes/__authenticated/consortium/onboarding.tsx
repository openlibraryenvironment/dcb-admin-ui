import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Grid, Tab, Tabs, Typography, Box, Tooltip } from "@mui/material";
import { WarningAmber, CheckCircle, Cancel } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getILS } from "@helpers/getILS";
import { GridRowModesModel } from "@mui/x-data-grid-premium";

import { getLibraries } from "@queries/getLibraries";
import { getMappings } from "@queries/getMappings";
import { getLocations } from "@queries/getLocations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";

export const Route = createFileRoute("/__authenticated/consortium/onboarding")({
	component: Onboarding,
});

function Onboarding() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// Fetch libraries and then batch-fetch the individual totalSize counts for each
	const { data: librariesWithCounts, isLoading } = useQuery({
		queryKey: ["LoadLibrariesForOnboardingWithCounts"],
		queryFn: async () => {
			// 1. Get the base libraries
			const libRes = await gqlClient.request<any>(getLibraries, {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 500,
				query: "",
			});

			const libs = libRes?.libraries?.content ?? [];

			// 2. Loop through and fetch the 'totalSize' for each configuration requirement
			const enriched = await Promise.all(
				libs.map(async (lib: any) => {
					const hostLmsCode = lib?.agency?.hostLms?.code;
					const hostLmsId = lib?.agency?.hostLms?.id;
					const agencyCode = lib?.agencyCode;
					const ils = getILS(lib?.agency?.hostLms?.lmsClientClass || "");
					const requiresNumeric = ils === "Sierra" || ils === "Polaris";

					if (!hostLmsCode || !hostLmsId) {
						return {
							...lib,
							itemTypeMappingCount: 0,
							patronTypeMappingCount: 0,
							locationMappingCount: 0,
							pickupLocationCount: 0,
							patronRequestCount: 0,
							supplierRequestCount: 0,
							numericRangeMappingCount: requiresNumeric ? 0 : null,
						};
					}

					try {
						// Setting pagesize: 1 to purely retrieve the totalSize count efficiently
						const queries = [
							gqlClient.request<any>(getMappings, {
								query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"ItemType" OR fromCategory:"ItemType") AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any>(getMappings, {
								query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"patronType" OR fromCategory:"patronType") AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any>(getMappings, {
								query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"Location" OR fromCategory:"Location") AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any>(getLocations, {
								query: `hostSystem: ${hostLmsId} AND isPickup: true`,
								order: "code",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any>(getPatronRequests, {
								query: `patronHostlmsCode: "${hostLmsCode}"`,
								order: "dateCreated",
								orderBy: "DESC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any>(getPatronRequests, {
								query: `supplyingAgencyCode: "${agencyCode}"`,
								order: "dateCreated",
								orderBy: "DESC",
								pageno: 0,
								pagesize: 1,
							}),
						];

						let numericRangePromise = null;
						if (requiresNumeric) {
							numericRangePromise = gqlClient.request<any>(
								getNumericRangeMappings,
								{
									query: `context:"${hostLmsCode}" AND NOT deleted:true`,
									order: "id",
									orderBy: "ASC",
									pageno: 0,
									pagesize: 1,
								},
							);
						}

						const results = await Promise.all(queries);
						const numericRes = requiresNumeric
							? await numericRangePromise
							: null;

						return {
							...lib,
							itemTypeMappingCount:
								results[0]?.referenceValueMappings?.totalSize ?? 0,
							patronTypeMappingCount:
								results[1]?.referenceValueMappings?.totalSize ?? 0,
							locationMappingCount:
								results[2]?.referenceValueMappings?.totalSize ?? 0,
							pickupLocationCount: results[3]?.locations?.totalSize ?? 0,
							patronRequestCount: results[4]?.patronRequests?.totalSize ?? 0,
							supplierRequestCount:
								results[5]?.supplierRequests?.totalSize ?? 0,
							numericRangeMappingCount: requiresNumeric
								? (numericRes?.numericRangeMappings?.totalSize ?? 0)
								: null,
						};
					} catch (e) {
						console.error("Failed fetching counts for", lib.fullName, e);
						return lib;
					}
				}),
			);

			return enriched;
		},
	});

	// Shared helper to render a tick or cross based on count > 0
	const renderStatus = (count: number | undefined) => {
		if (count && count > 0)
			return <CheckCircle color="success" fontSize="small" />;
		return <Cancel color="error" fontSize="small" />;
	};

	const showNumericRanges = useMemo(() => {
		return (librariesWithCounts ?? []).some((lib: any) => {
			const ils = getILS(lib.agency?.hostLms?.lmsClientClass || "");
			return ils === "Sierra" || ils === "Polaris";
		});
	}, [librariesWithCounts]);

	const processedLibraries = useMemo(() => {
		if (!librariesWithCounts) return [];
		return [...librariesWithCounts].sort((a: any, b: any) => {
			const aIls = getILS(a.agency?.hostLms?.lmsClientClass || "");
			const bIls = getILS(b.agency?.hostLms?.lmsClientClass || "");

			const aRequiresNumeric = aIls === "Sierra" || aIls === "Polaris";
			const bRequiresNumeric = bIls === "Sierra" || bIls === "Polaris";

			const aMissing =
				!a.itemTypeMappingCount ||
				!a.patronTypeMappingCount ||
				!a.locationMappingCount ||
				!a.pickupLocationCount ||
				!a.patronRequestCount ||
				!a.supplierRequestCount ||
				(aRequiresNumeric && !a.numericRangeMappingCount);

			const bMissing =
				!b.itemTypeMappingCount ||
				!b.patronTypeMappingCount ||
				!b.locationMappingCount ||
				!b.pickupLocationCount ||
				!b.patronRequestCount ||
				!b.supplierRequestCount ||
				(bRequiresNumeric && !b.numericRangeMappingCount);

			// Bubble rows with missing configs to the top
			if (aMissing && !bMissing) return -1;
			if (!aMissing && bMissing) return 1;
			return 0;
		});
	}, [librariesWithCounts]);

	const columns = useMemo(() => {
		const cols = [
			{
				field: "fullName",
				headerName: t("libraries.library"),
				flex: 1.5,
				renderCell: (params: any) => {
					const row = params.row;
					const ils = getILS(row.agency?.hostLms?.lmsClientClass || "");
					const requiresNumeric = ils === "Sierra" || ils === "Polaris";

					const isMissing =
						!row.itemTypeMappingCount ||
						!row.patronTypeMappingCount ||
						!row.locationMappingCount ||
						!row.pickupLocationCount ||
						!row.patronRequestCount ||
						!row.supplierRequestCount ||
						(requiresNumeric && !row.numericRangeMappingCount);

					const tooltipContent = (
						<Box sx={{ p: 0.5 }}>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: "bold", mb: 0.5 }}
							>
								{t("consortium.onboarding_missing", "Missing Configurations:")}
							</Typography>
							<Typography variant="body2">
								{t("libraries.config.data.mappings.item_type_count", {
									count: row.itemTypeMappingCount || 0,
								})}
							</Typography>
							<Typography variant="body2">
								{t("libraries.config.data.mappings.patron_type_count", {
									count: row.patronTypeMappingCount || 0,
								})}
							</Typography>
							<Typography variant="body2">
								{t("libraries.config.data.mappings.location_count", {
									count: row.locationTypeMappingCount || 0,
								})}
							</Typography>
							<Typography variant="body2">
								{t("locations.pickup_count", {
									count: row.pickupLocationCount || 0,
								})}
							</Typography>
							{requiresNumeric && (
								<Typography variant="body2">
									{t("libraries.config.data.mappings.numeric_range_count", {
										count: row.numericRangeMappingCount || 0,
									})}
								</Typography>
							)}
							<Typography variant="body2">
								{t("patron_request.count", {
									count: row.patronRequestCount || 0,
								})}
							</Typography>
							<Typography variant="body2">
								{t("patron_request.supplier_request_count", {
									count: row.supplierRequestCount || 0,
								})}
							</Typography>
						</Box>
					);

					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							{isMissing ? (
								<Tooltip title={tooltipContent} arrow placement="right">
									<WarningAmber color="warning" fontSize="small" />
								</Tooltip>
							) : (
								<Box sx={{ width: 20 }} />
							)}
							{params.value}
						</Box>
					);
				},
			},
			{
				field: "itemTypeMappingCount",
				headerName: t("mappings.item_type_ref_value"),
				flex: 0.5,
				renderCell: (params: any) =>
					renderStatus(params.row.itemTypeMappingCount),
			},
			{
				field: "patronTypeMappingCount",
				headerName: t("mappings.patron_type_ref_value"),
				flex: 0.5,
				renderCell: (params: any) =>
					renderStatus(params.row.patronTypeMappingCount),
			},
			{
				field: "locationMappingCount",
				headerName: t("mappings.location_ref_value"),
				flex: 0.5,
				renderCell: (params: any) =>
					renderStatus(params.row.locationMappingCount),
			},
			{
				field: "pickupLocationCount",
				headerName: t("libraries.config.data.locations.pickup"),
				flex: 0.5,
				renderCell: (params: any) =>
					renderStatus(params.row.pickupLocationCount),
			},
		];

		if (showNumericRanges) {
			cols.push({
				field: "numericRangeMappingCount",
				headerName: t("mappings.numeric_range"),
				flex: 0.5,
				renderCell: (params: any) => {
					const row = params.row;
					const ils = getILS(row.agency?.hostLms?.lmsClientClass || "");
					const requiresNumeric = ils === "Sierra" || ils === "Polaris";

					if (!requiresNumeric) {
						return (
							<Typography variant="body2" color="textSecondary">
								{t("common.na", "N/A")}
							</Typography>
						);
					}
					return renderStatus(row.numericRangeMappingCount);
				},
			});
		}

		cols.push({
			field: "patronRequestCount",
			headerName: t("nav.patronRequests.name", "Patron Requests"),
			flex: 0.5,
			renderCell: (params: any) => renderStatus(params.row.patronRequestCount),
		});

		cols.push({
			field: "supplierRequestCount",
			headerName: t("nav.supplierRequests.name", "Supplier Requests"),
			flex: 0.5,
			renderCell: (params: any) =>
				renderStatus(params.row.supplierRequestCount),
		});

		return cols;
	}, [t, showNumericRanges]);

	return (
		<PageContainer title={t("nav.consortium.onboarding")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 3 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={2}
						onChange={(_, val) =>
							router.navigate({
								to: [
									"/consortium",
									"/consortium/functionalSettings",
									"/consortium/onboarding",
									"/consortium/contacts",
								][val],
							})
						}
					>
						<Tab label={t("nav.consortium.profile")} />
						<Tab label={t("nav.consortium.functionalSettings")} />
						<Tab label={t("nav.consortium.onboarding")} />
						<Tab label={t("nav.consortium.contacts")} />
					</Tabs>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" sx={{ mb: 2 }}>
						{t("consortium.onboarding")}
					</Typography>

					<DataGrid
						identifier="onboardingLibraries"
						type="libraries" // Retains native row navigation to the library page
						columns={columns}
						rows={processedLibraries}
						loading={isLoading}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="onboarding" />
						)}
						paginationMode="client"
						sortingMode="client"
						filterMode="client"
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
						checkboxSelection={false}
						disableAggregation
						disableHoverInteractions={false}
						disableRowGrouping
						disablePivoting
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible={false}
						pagination
						paginationModel={{ page: 0, pageSize: 20 }}
						scrollbarVisible={false}
						noResultsText={t("ui.data_grid.no_results")}
						searchText=""
					/>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }} sx={{ mt: 2 }}>
					<CombinedEnvironmentComponent />
				</Grid>
			</Grid>
		</PageContainer>
	);
}
