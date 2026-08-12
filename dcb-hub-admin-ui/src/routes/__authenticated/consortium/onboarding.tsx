import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import dayjs from "dayjs";
import {
	Grid,
	Stack,
	Tab,
	Tabs,
	Typography,
	Box,
	Tooltip,
} from "@mui/material";
import {
	WarningAmber,
	CheckCircle,
	Cancel,
	HourglassEmpty,
	RemoveCircleOutlined,
	Block,
	CloudOff,
} from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import CombinedEnvironmentComponent from "@components/HomeContent/CombinedEnvironmentComponent";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import OnboardingStats from "@components/OnboardingStats/OnboardingStats";
import { mapWithConcurrency } from "@helpers/mapWithConcurrency";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getILS } from "@helpers/getILS";
import {
	evaluateLibraryIngest,
	evaluateLibrarySetup,
	evaluateLibraryTraffic,
	type LibraryMappingsState,
	type MappingCategoryId,
} from "@helpers/librarySetup";
import { GridRowModesModel } from "@mui/x-data-grid-premium";

import { getLibraries } from "@queries/getLibraries";
import { getMappings } from "@queries/getMappings";
import { getLocations } from "@queries/getLocations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import { getBibs } from "@queries/getBibs";
import type {
	LoadBibsQueryVariables,
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
 * Sort order for the grid: things needing action first, causes above symptoms.
 *
 * Incomplete setup outranks everything (an unconfigured library cannot ingest
 * or receive requests), failed ingest outranks dormancy (a library with no bib
 * records has nothing to be requested FROM, so its silence is explained), and a
 * library switched off in both directions is not a problem at all.
 */
const rankForAttention = (row: any): number => {
	if (!row.setup?.isComplete) return 0;
	if (row.ingest?.isIngestOutstanding) return 1;
	if (row.traffic?.isDormant) return 2;
	return 3;
};

/**
 * An indicator and the sentence that explains it, in one cell.
 *
 * The columns are the "at a glance": a tick or a cross, nothing else. Every
 * number behind that verdict lives in the tooltip and, in full, in the master
 * detail - the icon says whether to look, the tooltip says what at.
 */
const IndicatorCell = ({
	icon,
	tooltip,
}: {
	icon: ReactNode;
	tooltip: ReactNode;
}) => (
	<Tooltip title={tooltip} arrow placement="right">
		<Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
			{icon}
		</Box>
	</Tooltip>
);

const TooltipHeading = ({ children }: { children: ReactNode }) => (
	<Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
		{children}
	</Typography>
);

/** A tooltip line that carries its own verdict, so the eye can skip the prose. */
const TooltipFact = ({
	complete,
	children,
}: {
	complete: boolean;
	children: ReactNode;
}) => (
	<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
		{complete ? (
			<CheckCircle color="success" sx={{ fontSize: 14 }} />
		) : (
			<Cancel color="error" sx={{ fontSize: 14 }} />
		)}
		<Typography variant="body2">{children}</Typography>
	</Stack>
);

const MAPPING_CATEGORY_LABEL: Record<MappingCategoryId, string> = {
	itemType: "libraries.config.data.mappings.item_type_count",
	patronType: "libraries.config.data.mappings.patron_type_count",
	locationType: "libraries.config.data.mappings.location_type_count",
	numericRange: "libraries.config.data.mappings.numeric_range_count",
};

/**
 * One line per applicable mapping category, so "missing mappings" says which.
 * Shared by the mappings column and the whole-library summary rather than
 * written twice - the grid used to repeat the same list in two places and they
 * had already drifted.
 */
const mappingBreakdown = (t: TFunction, mappings: LibraryMappingsState) => (
	<>
		{mappings.categories
			.filter((category) => category.applicable)
			.map((category) => (
				<TooltipFact key={category.id} complete={category.complete}>
					{t(MAPPING_CATEGORY_LABEL[category.id], { count: category.count })}
				</TooltipFact>
			))}
		{/* Say it is not required, rather than leaving a silent gap that reads as
		    an oversight. */}
		{!mappings.categories.find((category) => category.id === "numericRange")
			?.applicable && (
			<Typography variant="body2" sx={{ pl: 2.5 }}>
				{t("consortium.onboarding_numeric_not_required")}
			</Typography>
		)}
	</>
);

const mappingsTooltip = (t: TFunction, mappings: LibraryMappingsState) => (
	<Box sx={{ p: 0.5 }}>
		<TooltipHeading>
			{mappings.isComplete
				? t("consortium.onboarding_mappings_complete")
				: t("consortium.onboarding_mappings_missing")}
		</TooltipHeading>
		{mappingBreakdown(t, mappings)}
		{/* Nothing mapped at all is a different conversation from a half-finished
		    job, so the tooltip names which one this is. */}
		{!mappings.isComplete && !mappings.isPartial && (
			<Typography variant="body2" sx={{ mt: 0.5 }}>
				{t("consortium.onboarding_mappings_none")}
			</Typography>
		)}
	</Box>
);

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
			// Eight count queries per library, bounded rather than all at once -
			// see mapWithConcurrency. Six is roughly a browser's per-host
			// connection limit, so this is the point past which extra parallelism
			// only buys queueing.
			const enriched = await mapWithConcurrency(libs, 6, async (lib: any) => {
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
						bibCount: 0,
						lastBorrowingRequestAt: null,
						lastSupplyingRequestAt: null,
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
						bibRes,
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
						gqlClient.request<any, LoadLocationsQueryVariables>(getLocations, {
							query: `hostSystem: ${hostLmsId} AND isPickup: true`,
							order: "code",
							orderBy: "ASC",
							pageno: 0,
							pagesize: 1,
						}),
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
						// Ingest health: bibs live under the Host LMS, and zero of them
						// means the library cannot supply anything however well the
						// rest is configured.
						gqlClient.request<any, LoadBibsQueryVariables>(getBibs, {
							query: `sourceSystemId: ${hostLmsId}`,
							order: "dateCreated",
							pageno: 0,
							pagesize: 1,
						}),
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

					const numericRes = requiresNumeric ? await numericRangePromise : null;

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
						supplierRequestCount: supplyingRes?.patronRequests?.totalSize ?? 0,
						// Both request queries already sort dateCreated DESC and take a
						// single row, so the most recent request is sitting in the same
						// response the count came from - it was simply being discarded.
						lastBorrowingRequestAt:
							borrowingRes?.patronRequests?.content?.[0]?.dateCreated ?? null,
						lastSupplyingRequestAt:
							supplyingRes?.patronRequests?.content?.[0]?.dateCreated ?? null,
						bibCount: bibRes?.sourceBibs?.totalSize ?? 0,
						numericRangeMappingCount: requiresNumeric
							? (numericRes?.numericRangeMappings?.totalSize ?? 0)
							: null,
					};
				} catch (e) {
					console.error("Failed fetching counts for", lib.fullName, e);
					return lib;
				}
			});

			return enriched;
		},
		// Counting eight things per library is expensive enough that remounting
		// the page should not redo it; the wizard invalidates "libraries*" keys
		// when anything actually changes.
		staleTime: 1000 * 60 * 2,
	});

	/**
	 * A library with no requests is not misconfigured, so it must not be shown
	 * as an error - but it is still worth surfacing, because "set up months ago
	 * and never used" is the state staff most want to catch.
	 *
	 * When the direction is switched off entirely, say so: a zero that was never
	 * going to be anything else is not a finding.
	 */
	const renderTrafficStatus = (
		count: number | undefined,
		disabled: boolean,
		countKey: string,
		disabledLabel: string,
		lastRequestAt: string | null | undefined,
	) => {
		const tooltip = (
			<Box sx={{ p: 0.5 }}>
				<Typography variant="body2">
					{t(countKey, { count: count ?? 0 })}
				</Typography>
				{disabled && <Typography variant="body2">{disabledLabel}</Typography>}
				{lastRequestAt && (
					<Typography variant="body2">
						{t("consortium.onboarding_last_request", {
							date: dayjs(lastRequestAt).format("YYYY-MM-DD HH:mm"),
						})}
					</Typography>
				)}
				{!count && !disabled && (
					<Typography variant="body2">
						{t("consortium.onboarding_requests_none")}
					</Typography>
				)}
			</Box>
		);

		if (count && count > 0)
			return (
				<IndicatorCell
					tooltip={tooltip}
					icon={
						<CheckCircle
							color="success"
							fontSize="small"
							titleAccess={t(countKey, { count })}
						/>
					}
				/>
			);
		if (disabled)
			return (
				<IndicatorCell
					tooltip={tooltip}
					icon={
						<Block
							color="disabled"
							fontSize="small"
							titleAccess={disabledLabel}
						/>
					}
				/>
			);
		return (
			<IndicatorCell
				tooltip={tooltip}
				icon={
					<RemoveCircleOutlined
						color="disabled"
						fontSize="small"
						titleAccess={t("consortium.onboarding_requests_none")}
					/>
				}
			/>
		);
	};

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
								lastBorrowingRequestAt: library.lastBorrowingRequestAt,
								lastSupplyingRequestAt: library.lastSupplyingRequestAt,
							},
							setup,
							library,
						),
						ingest: evaluateLibraryIngest(
							{ bibCount: library.bibCount },
							library,
						),
					};
				})
				// Two separate concerns, ranked: something is missing (act on it),
				// then configured but never used (watch it), then everything else.
				.sort((a: any, b: any) => rankForAttention(a) - rankForAttention(b))
		);
	}, [librariesWithCounts]);

	/**
	 * Five indicators, one per thing that can be wrong, plus the name.
	 *
	 * There were nine columns, four of them different flavours of "mappings",
	 * and reading a row meant reconstructing a verdict from a row of ticks. The
	 * grid answers "does this library need attention, and roughly why"; the
	 * tooltip narrows it to which category; the master detail carries every
	 * number. Nothing was dropped, only moved to where it can be read.
	 */
	const columns = useMemo(
		() => [
			{
				field: "fullName",
				headerName: t("libraries.library"),
				flex: 1.5,
				renderCell: (params: any) => {
					const row = params.row;
					const setup = row.setup;
					const isMissing = !setup?.isComplete;

					// Configuration, ingest and traffic are reported separately,
					// because they call for different actions: finish the setup, chase
					// the harvest, or find out why nobody is using a library that is
					// ready.
					const tooltipContent = (
						<Box sx={{ p: 0.5 }}>
							<TooltipHeading>
								{isMissing
									? t("consortium.onboarding_missing")
									: t("consortium.onboarding_configuration")}
							</TooltipHeading>
							{setup?.mappings && mappingBreakdown(t, setup.mappings)}
							<TooltipFact complete={(row.pickupLocationCount ?? 0) > 0}>
								{t("locations.pickup_count", {
									count: row.pickupLocationCount ?? 0,
								})}
							</TooltipFact>
							{/* Steps the grid has no column for - contacts, group
							    membership, the profile itself - would otherwise be
							    invisible until someone opened the library. */}
							{setup?.steps
								?.filter(
									(step: any) =>
										step.applicable &&
										!step.complete &&
										step.id !== "refMappings" &&
										step.id !== "numMappings" &&
										step.id !== "locations",
								)
								.map((step: any) => (
									<TooltipFact key={step.id} complete={false}>
										{t(`libraries.setup.step.${step.id}`)}
									</TooltipFact>
								))}

							<Box sx={{ mt: 1 }}>
								<TooltipHeading>
									{t("consortium.onboarding_ingest")}
								</TooltipHeading>
							</Box>
							<TooltipFact complete={row.ingest?.hasBibs ?? false}>
								{t("consortium.onboarding_bib_count", {
									count: row.bibCount ?? 0,
								})}
							</TooltipFact>

							<Box sx={{ mt: 1 }}>
								<TooltipHeading>
									{t("consortium.onboarding_traffic")}
								</TooltipHeading>
							</Box>
							<Typography variant="body2">
								{t("patron_request.count", {
									count: row.patronRequestCount ?? 0,
								})}
								{/* A zero here means nothing if the library was never meant
								    to borrow. Without this the indicator reads as a fault
								    and staff learn to ignore it. */}
								{row.traffic?.borrowingDisabled &&
									` - ${t("consortium.onboarding_borrowing_disabled")}`}
							</Typography>
							<Typography variant="body2">
								{t("patron_request.supplier_request_count", {
									count: row.supplierRequestCount ?? 0,
								})}
								{row.traffic?.supplyingDisabled &&
									` - ${t("consortium.onboarding_supplying_disabled")}`}
							</Typography>
							{row.traffic?.lastRequestAt && (
								<Typography variant="body2">
									{t("consortium.onboarding_last_request", {
										date: dayjs(row.traffic.lastRequestAt).format(
											"YYYY-MM-DD HH:mm",
										),
									})}
								</Typography>
							)}
							{row.traffic?.isFullyDisabled && (
								<Typography variant="body2" sx={{ mt: 0.5 }}>
									{t("consortium.onboarding_fully_disabled")}
								</Typography>
							)}
							{row.traffic?.isDormant && (
								<Typography variant="body2" sx={{ mt: 0.5 }}>
									{t("consortium.onboarding_dormant")}
								</Typography>
							)}
						</Box>
					);

					// One icon slot, four possible meanings, never more than one:
					// incomplete setup outranks failed ingest outranks dormancy,
					// because each is the cause of the next.
					const summaryIcon = isMissing ? (
						<WarningAmber
							color="warning"
							fontSize="small"
							titleAccess={t("consortium.onboarding_missing")}
						/>
					) : row.ingest?.isIngestOutstanding ? (
						<CloudOff
							color="error"
							fontSize="small"
							titleAccess={t("consortium.onboarding_ingest_none")}
						/>
					) : row.traffic?.isDormant ? (
						<HourglassEmpty
							color="info"
							fontSize="small"
							titleAccess={t("consortium.onboarding_dormant")}
						/>
					) : (
						<CheckCircle
							color="success"
							fontSize="small"
							titleAccess={t("consortium.onboarding_setup_complete")}
						/>
					);

					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<IndicatorCell tooltip={tooltipContent} icon={summaryIcon} />
							{params.value}
						</Box>
					);
				},
			},
			{
				field: "mappingsStatus",
				headerName: t("mappings.mappings"),
				flex: 0.6,
				// The row carries no such field, so give the grid something to sort
				// on: how many categories are outstanding, worst first.
				valueGetter: (_value: any, row: any) =>
					row?.setup?.mappings?.missing?.length ?? 0,
				renderCell: (params: any) => {
					const mappings = params.row.setup?.mappings;
					if (!mappings) return null;

					// Partial is its own state: somebody started and stopped, which is
					// a different message from a library nobody has touched.
					const icon = mappings.isComplete ? (
						<CheckCircle
							color="success"
							fontSize="small"
							titleAccess={t("consortium.onboarding_mappings_complete")}
						/>
					) : mappings.isPartial ? (
						<WarningAmber
							color="warning"
							fontSize="small"
							titleAccess={t("consortium.onboarding_mappings_missing")}
						/>
					) : (
						<Cancel
							color="error"
							fontSize="small"
							titleAccess={t("consortium.onboarding_mappings_none")}
						/>
					);

					return (
						<IndicatorCell tooltip={mappingsTooltip(t, mappings)} icon={icon} />
					);
				},
			},
			{
				field: "pickupLocationCount",
				headerName: t("locations.pickup_locations"),
				flex: 0.6,
				renderCell: (params: any) => {
					const count = params.row.pickupLocationCount ?? 0;
					const tooltip = (
						<Box sx={{ p: 0.5 }}>
							<Typography variant="body2">
								{t("locations.pickup_count", { count })}
							</Typography>
							{count === 0 && (
								<Typography variant="body2">
									{t("consortium.onboarding_pickup_none")}
								</Typography>
							)}
						</Box>
					);

					return (
						<IndicatorCell
							tooltip={tooltip}
							icon={
								count > 0 ? (
									<CheckCircle
										color="success"
										fontSize="small"
										titleAccess={t("locations.pickup_count", { count })}
									/>
								) : (
									<Cancel
										color="error"
										fontSize="small"
										titleAccess={t("consortium.onboarding_pickup_none")}
									/>
								)
							}
						/>
					);
				},
			},
			// Ingest health, not configuration: bib records come from the Host LMS
			// harvest rather than anything the wizard sets, but zero of them means
			// the library has nothing to be requested from.
			{
				field: "bibCount",
				headerName: t("consortium.onboarding_ingest_column"),
				flex: 0.6,
				renderCell: (params: any) => {
					const row = params.row;
					const count = row.bibCount ?? 0;
					const supplyingDisabled = row.traffic?.supplyingDisabled ?? false;
					const tooltip = (
						<Box sx={{ p: 0.5 }}>
							<Typography variant="body2">
								{t("consortium.onboarding_bib_count", { count })}
							</Typography>
							{count === 0 &&
								(supplyingDisabled ? (
									<Typography variant="body2">
										{t("consortium.onboarding_supplying_disabled_full")}
									</Typography>
								) : (
									<Typography variant="body2">
										{t("consortium.onboarding_ingest_none")}
									</Typography>
								))}
						</Box>
					);

					if (count > 0)
						return (
							<IndicatorCell
								tooltip={tooltip}
								icon={
									<CheckCircle
										color="success"
										fontSize="small"
										titleAccess={t("consortium.onboarding_bib_count", {
											count,
										})}
									/>
								}
							/>
						);
					// Nothing to harvest is the expected outcome for a library that
					// never supplies, so it is a setting, not a fault.
					if (supplyingDisabled)
						return (
							<IndicatorCell
								tooltip={tooltip}
								icon={
									<Block
										color="disabled"
										fontSize="small"
										titleAccess={t(
											"consortium.onboarding_supplying_disabled_full",
										)}
									/>
								}
							/>
						);
					return (
						<IndicatorCell
							tooltip={tooltip}
							icon={
								<CloudOff
									color="error"
									fontSize="small"
									titleAccess={t("consortium.onboarding_ingest_none")}
								/>
							}
						/>
					);
				},
			},
			// Traffic, not configuration: a zero here is "unused", not "broken", so
			// it renders as a neutral dash rather than the red cross the config
			// columns use - and as an explicit "switched off" where that is why.
			{
				field: "patronRequestCount",
				headerName: t("nav.patronRequests.name"),
				flex: 0.6,
				renderCell: (params: any) =>
					renderTrafficStatus(
						params.row.patronRequestCount,
						params.row.traffic?.borrowingDisabled ?? false,
						"patron_request.count",
						t("consortium.onboarding_borrowing_disabled_full"),
						params.row.lastBorrowingRequestAt,
					),
			},
			{
				field: "supplierRequestCount",
				headerName: t("nav.supplierRequests.name"),
				flex: 0.6,
				renderCell: (params: any) =>
					renderTrafficStatus(
						params.row.supplierRequestCount,
						params.row.traffic?.supplyingDisabled ?? false,
						"patron_request.supplier_request_count",
						t("consortium.onboarding_supplying_disabled_full"),
						params.row.lastSupplyingRequestAt,
					),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- renderTrafficStatus is a stable render helper closing over `t`
		[t],
	);

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

					{/* What the consortium is made of, separate from which rows need
					    attention - the grid answers the second question only. */}
					<OnboardingStats libraries={processedLibraries} loading={isLoading} />

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
