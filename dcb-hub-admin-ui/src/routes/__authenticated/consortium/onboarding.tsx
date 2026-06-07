import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Grid, Tab, Tabs, Typography, Box, Tooltip } from "@mui/material";
import { WarningAmber } from "@mui/icons-material";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import DataGrid from "@components/DataGrid/DataGrid";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getLibraries } from "@queries/getLibraries";
import { getILS } from "@helpers/getILS";
import { GridRowModesModel } from "@mui/x-data-grid-premium";

export const Route = createFileRoute("/__authenticated/consortium/onboarding")({
	component: Onboarding,
});

function Onboarding() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const { data, isLoading } = useQuery({
		queryKey: ["LoadLibrariesForOnboarding"],
		queryFn: () =>
			gqlClient.request<any>(getLibraries, {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 500,
				query: "",
			}),
	});

	const libraries = data?.libraries?.content ?? [];

	const showNumericRanges = useMemo(() => {
		return libraries.some((lib: any) => {
			const ils = getILS(lib.agency?.hostLms?.lmsClientClass || "");
			return ils === "Sierra" || ils === "Polaris";
		});
	}, [libraries]);

	const processedLibraries = useMemo(() => {
		return [...libraries].sort((a: any, b: any) => {
			const aMissing =
				!a.itemTypeMappingCount ||
				!a.patronTypeMappingCount ||
				!a.locationMappingCount ||
				!a.pickupLocationCount ||
				(showNumericRanges && !a.numericRangeMappingCount);
			const bMissing =
				!b.itemTypeMappingCount ||
				!b.patronTypeMappingCount ||
				!b.locationMappingCount ||
				!b.pickupLocationCount ||
				(showNumericRanges && !b.numericRangeMappingCount);

			if (aMissing && !bMissing) return -1;
			if (!aMissing && bMissing) return 1;
			return 0; // Maintain original order if both share the same status
		});
	}, [libraries, showNumericRanges]);

	const columns = useMemo(() => {
		const cols = [
			{
				field: "fullName",
				headerName: t("libraries.library"),
				flex: 1,
				renderCell: (params: any) => {
					const row = params.row;
					const isMissing =
						!row.itemTypeMappingCount ||
						!row.patronTypeMappingCount ||
						!row.locationMappingCount ||
						!row.pickupLocationCount ||
						(showNumericRanges && !row.numericRangeMappingCount);
					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							{isMissing && (
								<Tooltip
									title={t(
										"consortium.onboarding_warning",
										"This library may not be fully configured. Check mappings and pickup locations.",
									)}
									arrow
								>
									<WarningAmber color="warning" fontSize="small" />
								</Tooltip>
							)}
							{params.value}
						</Box>
					);
				},
			},
			{
				field: "itemTypeMappingCount",
				headerName: t("mappings.item_type_count", "Item Types"),
				flex: 0.5,
			},
			{
				field: "patronTypeMappingCount",
				headerName: t("mappings.patron_type_count", "Patron Types"),
				flex: 0.5,
			},
			{
				field: "locationMappingCount",
				headerName: t("mappings.location_count", "Locations"),
				flex: 0.5,
			},
			{
				field: "pickupLocationCount",
				headerName: t("locations.pickup_count", "Pickup Locations"),
				flex: 0.5,
			},
		];

		if (showNumericRanges) {
			cols.push({
				field: "numericRangeMappingCount",
				headerName: t("mappings.numeric_range_count", "Numeric Ranges"),
				flex: 0.5,
			});
		}

		return cols;
	}, [t, showNumericRanges]);

	return (
		<AdminLayout title={t("nav.consortium.onboarding")}>
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
						type="libraries"
						columns={columns}
						rows={processedLibraries}
						loading={isLoading}
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
						noResultsText={t("common.no_results")}
						searchText=""
					/>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }} sx={{ mt: 2 }}>
					<CombinedEnvironmentComponent />
				</Grid>
			</Grid>
		</AdminLayout>
	);
}
