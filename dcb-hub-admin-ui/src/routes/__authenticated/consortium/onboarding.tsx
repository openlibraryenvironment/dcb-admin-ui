import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Grid, Tab, Tabs, Typography, Box, Tooltip } from "@mui/material";
import {
	WarningAmber,
	CheckCircle,
	Cancel,
	HourglassEmpty,
	RemoveCircleOutlined,
} from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getILS } from "@helpers/getILS";
import {
	evaluateLibrarySetup,
	evaluateLibraryTraffic,
	requiresNumericRangeMappings,
} from "@helpers/librarySetup";
import { GridRowModesModel } from "@mui/x-data-grid-premium";

import { getLibraries } from "@queries/getLibraries";
import { getMappings } from "@queries/getMappings";
import { getLocations } from "@queries/getLocations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import type {
	LoadLibrariesQueryVariables,
	LoadLocationsQueryVariables,
	LoadMappingsQueryVariables,
	LoadNumericRangeMappingsQueryVariables,
	LoadPatronRequestsQueryVariables,
} from "@generated/graphql";
import { useGridState } from "@hooks/useGridState";

export const Route = createFileRoute("/__authenticated/consortium/onboarding")({
	component: Onboarding,
});

/**
 * Sort order for the grid: things needing action first. Incomplete setup >
 * dormancy because an unconfigured library cannot have traffic anyway
 */
const rankForAttention = (row: any): number => {
	if (!row.setup?.isComplete) return 0;
	if (row.traffic?.isDormant) return 1;
	return 2;
};

function Onboarding() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const { paginationModel, onPaginationModelChange } = useGridState(
		"onboardingLibraries",
		{ pagination: { page: 0, pageSize: 20 } },
	);
	// Fetch libraries and then batch-fetch the individual totalSize counts for each
	const { data: librariesWithCounts, isLoading } = useQuery({
		queryKey: ["LoadLibrariesForOnboardingWithCounts"],
		queryFn: async () => {
			const libRes = await gqlClient.request<any, LoadLibrariesQueryVariables>(
				getLibraries,
				{
					order: "fullName",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 500,
					query: "",
				},
			);

			const libs = libRes?.libraries?.content ?? [];
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
						const [
							itemTypeRes,
							patronTypeRes,
							locationRes,
							pickupRes,
							borrowingRes,
							supplyingRes,
						] = await Promise.all([
							gqlClient.request<any, LoadMappingsQueryVariables>(getMappings, {
								query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"ItemType" OR fromCategory:"ItemType") AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any, LoadMappingsQueryVariables>(getMappings, {
								query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"patronType" OR fromCategory:"patronType") AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any, LoadMappingsQueryVariables>(getMappings, {
								query: `(toContext:"${hostLmsCode}" OR fromContext:"${hostLmsCode}") AND (toCategory:"Location" OR fromCategory:"Location") AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							}),
							gqlClient.request<any, LoadLocationsQueryVariables>(
								getLocations,
								{
									query: `hostSystem: ${hostLmsId} AND isPickup: true`,
									order: "code",
									orderBy: "ASC",
									pageno: 0,
									pagesize: 1,
								},
							),
							gqlClient.request<any, LoadPatronRequestsQueryVariables>(
								getPatronRequests,
								{
									query: `patronHostlmsCode: "${hostLmsCode}"`,
									order: "dateCreated",
									orderBy: "DESC",
									pageno: 0,
									pagesize: 1,
								},
							),
							gqlClient.request<any, LoadPatronRequestsQueryVariables>(
								getPatronRequests,
								{
									query: `supplyingAgencyCode: "${agencyCode}"`,
									order: "dateCreated",
									orderBy: "DESC",
									pageno: 0,
									pagesize: 1,
								},
							),
						]);

						let numericRangePromise = null;
						if (requiresNumeric) {
							numericRangePromise = gqlClient.request<
								any,
								LoadNumericRangeMappingsQueryVariables
							>(getNumericRangeMappings, {
								query: `context:"${hostLmsCode}" AND NOT deleted:true`,
								order: "id",
								orderBy: "ASC",
								pageno: 0,
								pagesize: 1,
							});
						}

						const numericRes = requiresNumeric
							? await numericRangePromise
							: null;

						return {
							...lib,
							itemTypeMappingCount:
								itemTypeRes?.referenceValueMappings?.totalSize ?? 0,
							patronTypeMappingCount:
								patronTypeRes?.referenceValueMappings?.totalSize ?? 0,
							locationMappingCount:
								locationRes?.referenceValueMappings?.totalSize ?? 0,
							pickupLocationCount: pickupRes?.locations?.totalSize ?? 0,
							patronRequestCount: borrowingRes?.patronRequests?.totalSize ?? 0,
							supplierRequestCount:
								supplyingRes?.patronRequests?.totalSize ?? 0,
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

	const renderStatus = (count: number | undefined) => {
		if (count && count > 0)
			return <CheckCircle color="success" fontSize="small" />;
		return <Cancel color="error" fontSize="small" />;
	};

	/**
	 * A library with no requests is not misconfigured, so it must not be shown
	 * as an error - but it is still worth surfacing, because "set up months ago
	 * and never used" is the state staff most want to catch.
	 */
	const renderTrafficStatus = (count: number | undefined) => {
		if (count && count > 0)
			return <CheckCircle color="success" fontSize="small" />;
		return <RemoveCircleOutlined color="disabled" fontSize="small" />;
	};

	const showNumericRanges = useMemo(
		() => (librariesWithCounts ?? []).some(requiresNumericRangeMappings),
		[librariesWithCounts],
	);

	const processedLibraries = useMemo(() => {
		if (!librariesWithCounts) return [];
		// Decide "is anything missing" once, via the shared model, and hang the
		// answer on the row.
		return (
			[...librariesWithCounts]
				.map((library: any) => {
					// The enriched row already carries the counts at top level, but pass
					// them explicitly so it is clear which half of the row is being read
					// as configuration and which as the library itself.
					const setup = evaluateLibrarySetup(library, {
						itemTypeMappingCount: library.itemTypeMappingCount,
						patronTypeMappingCount: library.patronTypeMappingCount,
						locationMappingCount: library.locationMappingCount,
						pickupLocationCount: library.pickupLocationCount,
						numericRangeMappingCount: library.numericRangeMappingCount,
					});
					return {
						...library,
						setup,
						traffic: evaluateLibraryTraffic(
							{
								patronRequestCount: library.patronRequestCount,
								supplierRequestCount: library.supplierRequestCount,
							},
							setup,
						),
					};
				})
				// Two separate concerns, ranked: something is missing (act on it),
				// then configured but never used (watch it), then everything else.
				.sort((a: any, b: any) => rankForAttention(a) - rankForAttention(b))
		);
	}, [librariesWithCounts]);

	const columns = useMemo(() => {
		const cols = [
			{
				field: "fullName",
				headerName: t("libraries.library"),
				flex: 1.5,
				renderCell: (params: any) => {
					const row = params.row;
					const requiresNumeric = requiresNumericRangeMappings(row);
					const isMissing = !row.setup?.isComplete;

					// Configuration and traffic are reported separately, because they
					// call for different actions: one is "go and finish the setup",
					// the other is "the setup is fine, go and find out why nobody is
					// using it".
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
								{t("libraries.config.data.mappings.location_type_count", {
									count: row.locationMappingCount || 0,
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

							<Typography
								variant="subtitle2"
								sx={{ fontWeight: "bold", mt: 1, mb: 0.5 }}
							>
								{t("consortium.onboarding_traffic")}
							</Typography>
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
							{row.traffic?.isDormant && (
								<Typography variant="body2" sx={{ mt: 0.5 }}>
									{t("consortium.onboarding_dormant")}
								</Typography>
							)}
						</Box>
					);

					// One icon slot, two possible meanings, never both: incomplete
					// setup outranks dormancy because it is the cause, not a symptom.
					// Also need a success icon
					// And the tooltip content should be "configuration", not "Missing config" in the success case
					console.log(row);
					const indicator = isMissing ? (
						<Tooltip title={tooltipContent} arrow placement="right">
							<WarningAmber
								color="warning"
								fontSize="small"
								titleAccess={t("consortium.onboarding_missing") as string}
							/>
						</Tooltip>
					) : row.traffic?.isDormant ? (
						<Tooltip title={tooltipContent} arrow placement="right">
							<HourglassEmpty
								color="info"
								fontSize="small"
								titleAccess={t("consortium.onboarding_dormant") as string}
							/>
						</Tooltip>
					) : (
						<Box sx={{ width: 20 }} />
					);

					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							{indicator}
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

					if (!requiresNumericRangeMappings(row)) {
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

		// Traffic, not configuration: a zero here is "unused", not "broken", so it
		// renders as a neutral dash rather than the red cross the config columns
		// use.
		cols.push({
			field: "patronRequestCount",
			headerName: t("nav.patronRequests.name", "Patron Requests"),
			flex: 0.5,
			renderCell: (params: any) =>
				renderTrafficStatus(params.row.patronRequestCount),
		});

		cols.push({
			field: "supplierRequestCount",
			headerName: t("nav.supplierRequests.name", "Supplier Requests"),
			flex: 0.5,
			renderCell: (params: any) =>
				renderTrafficStatus(params.row.supplierRequestCount),
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
						disableAggregation
						disableHoverInteractions={false}
						disableRowGrouping
						disablePivoting
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible={false}
						pagination
						paginationModel={paginationModel}
						onPaginationModelChange={onPaginationModelChange}
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
