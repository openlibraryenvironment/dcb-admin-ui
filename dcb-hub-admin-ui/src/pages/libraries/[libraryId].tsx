// import { useQuery } from "@apollo/client/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Grid from "@mui/material/Unstable_Grid2";
import {
	Button,
	Divider,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { AdminLayout } from "@layout";
import { useState, useCallback } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import PrivateData from "@components/PrivateData/PrivateData";
import AddressLink from "@components/Address/AddressLink";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { useQuery } from "@apollo/client/react";
import { getLibraryById, getPatronRequests } from "src/queries/queries";
import { Library } from "@models/Library";
import { getILS } from "src/helpers/getILS";
import { findConsortium } from "src/helpers/findConsortium";
import {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
	SubAccordion,
	SubAccordionSummary,
	SubAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import dayjs from "dayjs";
import { containsOnly, equalsOnly, standardFilters } from "src/helpers/filters";
import { formatDuration } from "src/helpers/formatDuration";

type LibraryDetails = {
	libraryId: any;
};

const INITIAL_EXPANDED_STATE = 12; // Number of accordions that should be initially expanded
const TOTAL_ACCORDIONS = 15; // Total number of accordions

const getInitialAccordionState = (initialExpanded: number, total: number) => {
	return Array.from({ length: total }, (_, index) => index < initialExpanded);
};

export default function LibraryDetails({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	// pollInterval is in ms - set to 2 mins
	const { data, loading, error } = useQuery(getLibraryById, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
	});

	const library: Library = data?.libraries?.content?.[0];

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
		},
	});

	const ils: string = getILS(library?.agency?.hostLms?.lmsClientClass);
	const isConsortiumGroupMember: boolean =
		findConsortium(library?.membership) != null ? true : false;

	const libraryGroups = library?.membership.map(
		(member: { libraryGroup: any }) => member.libraryGroup,
	);

	const formatRoles = (roles: any) => {
		const formattedRoles = roles && roles.join(", ");
		return <ListItemText>{formattedRoles}</ListItemText>;
	};

	const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(
		getInitialAccordionState(INITIAL_EXPANDED_STATE, TOTAL_ACCORDIONS),
	);

	const handleAccordionChange = useCallback(
		(index: number) => () => {
			setExpandedAccordions((prevExpanded) => {
				const newExpanded = [...prevExpanded];
				newExpanded[index] = !newExpanded[index];
				return newExpanded;
			});
		},
		[],
	);

	const expandAll = useCallback(() => {
		setExpandedAccordions((prevExpanded) => {
			const allExpanded = prevExpanded.some((isExpanded) => !isExpanded);
			return prevExpanded.map(() => allExpanded);
		});
	}, []);

	const [totalSizes, setTotalSizes] = useState<{ [key: string]: number }>({});

	const handleTotalSizeChange = useCallback((type: string, size: number) => {
		setTotalSizes((prevTotalSizes) => ({
			...prevTotalSizes,
			[type]: size,
		}));
	}, []);

	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("libraries.library").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}
	const exceptionQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}" AND status: "ERROR"`;
	const outOfSequenceQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}" AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" AND NOT status:"CANCELLED" AND NOT status:"FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:true`;
	const inProgressQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:false`;
	const finishedQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND (status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" OR status: "CANCELLED" OR status: "FINALISED" OR status:"COMPLETED")`;
	return error || library == null || library == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={library?.fullName}>
			<Stack direction="row" justifyContent="end">
				<Button onClick={expandAll}>
					{expandedAccordions[0] ? t("details.collapse") : t("details.expand")}
				</Button>
			</Stack>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="library-details-library"
					id="library-details-library"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("libraries.library")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.name")}
								</Typography>
								<RenderAttribute attribute={library?.fullName} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.short_name")}
								</Typography>
								<RenderAttribute attribute={library?.shortName} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.abbreviated_name")}
								</Typography>
								<RenderAttribute attribute={library?.abbreviatedName} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.type")}
								</Typography>
								<RenderAttribute attribute={library?.type} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.agency_code")}
								</Typography>
								<RenderAttribute attribute={library?.agencyCode} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.support_hours")}
								</Typography>
								{/* This will need special handling when we have real data and know what format it's coming in */}
								<RenderAttribute attribute={library?.supportHours} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.service.environments.backup_schedule")}
								</Typography>
								<RenderAttribute attribute={library?.backupDowntimeSchedule} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.site_designation")}
								</Typography>
								{/* This will need special handling when we have real data and know what format it's coming in */}
								<RenderAttribute
									attribute={
										library?.agency?.hostLms?.clientConfig?.contextHierarchy[0]
									}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.library_id")}
								</Typography>
								<RenderAttribute attribute={library?.id} />
							</Stack>
						</Grid>
					</Grid>
					{/* /* 'Primary location' title goes here/* */}
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[8]}
						onChange={handleAccordionChange(8)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-location"
							id="library-location"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.primaryLocation.title")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.primaryLocation.address")}
										</Typography>
										{/* This will need address-specific handling, and possibly its own component - leave as placeholder until we're ready + open maps in new tab*/}
										<AddressLink address={library?.address} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.primaryLocation.location")}
										</Typography>
										{/* This component handles lat/long in the same way as address - however we don't require both currently.
										{/* <Location
											latitude={library?.latitude}
											longitude={library?.longitude}
										/> */}
										<RenderAttribute
											attribute={
												"" + library?.latitude + ", " + library?.longitude
											}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					{isConsortiumGroupMember ? (
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[4]}
							onChange={handleAccordionChange(4)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="library-consortium"
								id="library-consortium"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.consortium.title")}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.consortium.name")}
										</Typography>
										<RenderAttribute
											attribute={findConsortium(library?.membership)?.name}
										/>
									</Stack>
								</Grid>
							</SubAccordionDetails>
						</SubAccordion>
					) : null}
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[5]}
						onChange={handleAccordionChange(5)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-groups"
							id="library-groups"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.groups")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							{/* TRANSLATION KEYS NEEDED */}
							<Grid xs={4} sm={8} md={12} lg={16}>
								<ClientDataGrid
									columns={[
										{
											field: "name",
											headerName: t("groups.name"),
											minWidth: 100,
											flex: 1,
										},
										{
											field: "code",
											headerName: t("groups.code"),
											minWidth: 50,
											flex: 0.5,
										},
										{
											field: "type",
											headerName: t("groups.type"),
											minWidth: 50,
											flex: 0.5,
										},
									]}
									data={libraryGroups}
									type="groupsOfLibrary"
									selectable={false}
									noDataTitle={t("groups.none_for_library")}
									toolbarVisible="not-visible"
									sortModel={[{ field: "name", sort: "asc" }]}
								/>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[1]}
				onChange={handleAccordionChange(1)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="library-details-contacts"
					id="library-details-contacts"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("libraries.contacts.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ClientDataGrid
						columns={[
							{
								field: "role",
								headerName: t("libraries.contacts.role"),
								minWidth: 50,
								flex: 0.5,
							},
							{
								field: "name",
								headerName: t("libraries.contacts.name"),
								minWidth: 50,
								flex: 0.7,
								valueGetter: (params: {
									row: { firstName: string; lastName: string };
								}) => `${params.row.firstName} ${params.row.lastName}`,
							},
							{
								field: "email",
								headerName: t("libraries.contacts.email"),
								minWidth: 50,
								flex: 0.7,
							},
							{
								field: "isPrimaryContact",
								headerName: t("libraries.contacts.primary"),
								minWidth: 50,
								flex: 0.3,
							},
						]}
						data={library?.contacts}
						type="LibraryContacts"
						// No need for click through on this grid
						selectable={false}
						sortModel={[{ field: "isPrimaryContact", sort: "desc" }]}
						noDataTitle={"No groups found for this library."}
						toolbarVisible="search-only"
					></ClientDataGrid>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="hostlms-client-config-details"
					id="hostlms_details_client_config"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" fontWeight={"bold"}>
						{t("libraries.service.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[6]}
						onChange={handleAccordionChange(6)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="service-systems"
							id="service-systems"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.service.systems.title")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.systems.ils")}
										</Typography>
										<RenderAttribute attribute={ils} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.systems.discovery")}
										</Typography>
										<RenderAttribute attribute={library?.discoverySystem} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.systems.patron_site")}
										</Typography>
										{library?.patronWebsite ? (
											<Link
												href={library?.patronWebsite}
												title="Link to patron website"
											>
												{library?.patronWebsite}
											</Link>
										) : (
											<Typography variant="attributeText">-</Typography>
										)}
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.configuration")}
										</Typography>
										<RenderAttribute
											attribute={library?.hostLmsConfiguration}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					{/* First / Circulation Host LMS Section'*/}
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[7]}
						onChange={handleAccordionChange(7)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="service-hostlms"
							id="service-hostlms"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.service.hostlms_title", {
									name: library?.agency?.hostLms?.name,
								})}
							</Typography>
						</SubAccordionSummary>
						<StyledAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.name")}
										</Typography>
										<RenderAttribute
											attribute={library?.agency?.hostLms?.name}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.code")}
										</Typography>
										<RenderAttribute
											attribute={library?.agency?.hostLms?.code}
										/>
									</Stack>
								</Grid>
								{/* Handle multi-roles and separate them */}
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.roles")}
										</Typography>
										{formatRoles(
											library?.agency?.hostLms?.clientConfig?.["roles"],
										)}
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.id")}
										</Typography>
										<RenderAttribute attribute={library?.agency?.hostLms?.id} />
									</Stack>
								</Grid>

								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.client_config.ingest")}
										</Typography>
										<RenderAttribute
											attribute={library?.agency?.hostLms?.clientConfig?.ingest}
										/>
									</Stack>
								</Grid>

								{/* Suppression rulesets */}
								{library?.agency?.hostLms?.suppressionRulesetName != null && (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.bibSuppressionRulesetName")}
											</Typography>
											<Typography variant="attributeText">
												<RenderAttribute
													attribute={
														library.agency?.hostLms?.suppressionRulesetName
													}
												/>
											</Typography>
										</Stack>
									</Grid>
								)}
								{library?.agency?.hostLms?.itemSuppressionRulesetName !=
									null && (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.itemSuppressionRulesetName")}
											</Typography>
											<Typography variant="attributeText">
												<RenderAttribute
													attribute={
														library?.agency?.hostLms?.itemSuppressionRulesetName
													}
												/>
											</Typography>
										</Stack>
									</Grid>
								)}

								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.environments.api")}
										</Typography>
										<RenderAttribute
											attribute={
												library?.agency?.hostLms?.clientConfig?.["base-url"]
											}
										/>
									</Stack>
								</Grid>

								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.client_config.context_hierarchy")}
										</Typography>
										{formatRoles(
											library?.agency?.hostLms?.clientConfig?.contextHierarchy,
										)}
									</Stack>
								</Grid>

								{/* 'API Key' has many different guises on clientConfig: for FOLIO libraries it's simple*/}
								{library?.agency?.hostLms?.clientConfig?.apikey ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_key",
											)}
											hiddenTextValue={
												library?.agency?.hostLms?.clientConfig?.apikey
											}
											id="lib-prod-env-api-key-1"
										/>
									</Grid>
								) : null}

								{/* For Polaris libraries it's the 'access key' attribute*/}
								{library?.agency?.hostLms?.clientConfig?.["access-key"] ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_key",
											)}
											hiddenTextValue={
												library?.agency?.hostLms?.clientConfig?.["access-key"]
											}
											id="lib-prod-env-api-key-1"
										/>
									</Grid>
								) : null}

								{/* And for Sierra libraries it is the 'key' attribute*/}
								{library?.agency?.hostLms?.clientConfig?.key ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_key",
											)}
											hiddenTextValue={
												library?.agency?.hostLms?.clientConfig?.key
											}
											id="lib-prod-env-api-key-1"
										/>
									</Grid>
								) : null}

								{library?.agency?.hostLms?.clientConfig?.secret ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_secret",
											)}
											hiddenTextValue={
												library?.agency?.hostLms?.clientConfig?.secret
											}
											id="lib-prod-env-api-secret-1"
										/>
									</Grid>
								) : null}

								{library?.agency?.hostLms?.clientConfig?.defaultAgency ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.default_agency")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.defaultAgency
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{/* Sierra specific values*/}

								{library?.agency?.hostLms?.clientConfig?.holdPolicy ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.hold_policy")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.holdPolicy
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.agency?.hostLms?.clientConfig?.["page-size"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.page_size")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.["page-size"]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{/* Polaris-specific values*/}

								{library?.agency?.hostLms?.clientConfig?.["domain-id"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.polaris_domain")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.["domain-id"]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.agency?.hostLms?.clientConfig?.["domain-id"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.polaris_username")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.[
														"staff-username"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.agency?.hostLms?.clientConfig?.["staff-password"] ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.polaris_password",
											)}
											hiddenTextValue={
												library?.agency?.hostLms?.clientConfig?.[
													"staff-password"
												]
											}
											id="lib-prod-env-api-polaris-password"
										/>
									</Grid>
								) : null}
								{library?.agency?.hostLms?.clientConfig?.services?.[
									"organisation-id"
								] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.polaris_org_id")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.services?.[
														"organisation-id"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{/* FOLIO Specific values: folio-tenant, metadata-prefix, record_syntax, user-base-url*/}

								{library?.agency?.hostLms?.clientConfig?.["folio-tenant"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.folio_tenant")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.[
														"folio-tenant"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.agency?.hostLms?.clientConfig?.["metadata-prefix"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.metadata")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.[
														"metadata-prefix"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.agency?.hostLms?.clientConfig?.["record-syntax"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.record_syntax")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.[
														"record-syntax"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.agency?.hostLms?.clientConfig?.["user-base-url"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.user_base_url")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.[
														"user-base-url"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{/* Second Host LMS section - if exists - conditionally render */}
								{library?.secondHostLms ? (
									<Grid xs={4} sm={8} md={12} lg={16}>
										<Divider aria-hidden="true"></Divider>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={4} sm={8} md={12} lg={16}>
										<Typography variant="h3" fontWeight={"bold"}>
											{t("libraries.service.hostlms_title", {
												name: library?.secondHostLms?.name,
											})}
										</Typography>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.name")}
											</Typography>
											<RenderAttribute
												attribute={library?.secondHostLms?.name}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.code")}
											</Typography>
											<RenderAttribute
												attribute={library?.secondHostLms?.code}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.roles")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.["roles"]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.id")}
											</Typography>
											<RenderAttribute attribute={library?.secondHostLms?.id} />
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.ingest")}
											</Typography>
											<RenderAttribute
												attribute={library?.secondHostLms?.clientConfig?.ingest}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.api")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.["base-url"]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.context_hierarchy")}
											</Typography>
											{formatRoles(
												library?.secondHostLms?.clientConfig?.contextHierarchy,
											)}
										</Stack>
									</Grid>
								) : null}

								{/* 'API Key' has many different guises on clientConfig: for FOLIO libraries it's simple*/}
								{library?.secondHostLms?.clientConfig?.apikey ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_key",
											)}
											hiddenTextValue={
												library?.secondHostLms?.clientConfig?.apikey
											}
											id="lib-prod-env-api-key-2"
										/>
									</Grid>
								) : null}

								{/* For Polaris libraries it's the 'access key' attribute*/}
								{library?.secondHostLms?.clientConfig?.["access-key"] ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_key",
											)}
											hiddenTextValue={
												library?.secondHostLms?.clientConfig?.["access-key"]
											}
											id="lib-prod-env-api-key-2"
										/>
									</Grid>
								) : null}

								{/* And for Sierra libraries it is the 'key' attribute*/}
								{library?.secondHostLms?.clientConfig?.key ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_key",
											)}
											hiddenTextValue={
												library?.secondHostLms?.clientConfig?.key
											}
											id="lib-prod-env-api-key-2"
										/>
									</Grid>
								) : null}
								{library?.secondHostLms?.clientConfig?.secret ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.api_secret",
											)}
											hiddenTextValue={
												library?.secondHostLms?.clientConfig?.secret
											}
											id="lib-test-env-api-secret"
										/>
									</Grid>
								) : null}

								{/* Polaris specific values - Second Host LMS */}

								{library?.secondHostLms?.clientConfig?.["domain-id"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.polaris_domain")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.["domain-id"]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms?.clientConfig?.["staff-username"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.polaris_username")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.[
														"staff-username"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{library?.secondHostLms?.clientConfig?.["staff-password"] ? (
									<Grid xs={2} sm={4} md={4}>
										<PrivateData
											clientConfigType={t(
												"libraries.service.environments.polaris_password",
											)}
											hiddenTextValue={
												library?.secondHostLms?.clientConfig?.["staff-password"]
											}
											id="lib-test-env-polaris-password"
										/>
									</Grid>
								) : null}
								{library?.secondHostLms?.clientConfig?.services?.[
									"organisation-id"
								] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("libraries.service.environments.polaris_org_id")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.services?.[
														"organisation-id"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{/* FOLIO Specific values (Second Host LMS): folio-tenant, metadata-prefix, record_syntax, user-base-url*/}

								{library?.secondHostLms?.clientConfig?.["folio-tenant"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.folio_tenant")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.["folio-tenant"]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.secondHostLms?.clientConfig?.["metadata-prefix"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.metadata")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.[
														"metadata-prefix"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.secondHostLms?.clientConfig?.["record-syntax"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.record_syntax")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.[
														"record-syntax"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.secondHostLms?.clientConfig?.["user-base-url"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.user_base_url")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.[
														"user-base-url"
													]
												}
											/>
										</Stack>
									</Grid>
								) : null}
								{/* Sierra specific values*/}

								{library?.secondHostLms?.clientConfig?.holdPolicy ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.hold_policy")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.secondHostLms?.clientConfig?.holdPolicy
												}
											/>
										</Stack>
									</Grid>
								) : null}

								{library?.secondHostLms?.clientConfig?.["page-size"] ? (
									<Grid xs={2} sm={4} md={4}>
										<Stack direction={"column"}>
											<Typography variant="attributeTitle">
												{t("hostlms.client_config.page_size")}
											</Typography>
											<RenderAttribute
												attribute={
													library?.agency?.hostLms?.clientConfig?.["page-size"]
												}
											/>
										</Stack>
									</Grid>
								) : null}
							</Grid>
						</StyledAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="library-configuration-details"
					id="library-configuration-details"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" fontWeight={"bold"}>
						{t("libraries.config.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[9]}
						onChange={handleAccordionChange(9)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-patronAuthentication"
							id="library-configuration-patronAuthentication"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.patronAuth.title")}
							</Typography>
						</SubAccordionSummary>
						<StyledAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.config.patronAuth.auth_profile")}
										</Typography>
										<RenderAttribute attribute={library?.agency?.authProfile} />
									</Stack>
								</Grid>
							</Grid>
						</StyledAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			{library?.agency?.hostLms?.code ? (
				<StyledAccordion
					variant="outlined"
					expanded={expandedAccordions[10]}
					onChange={handleAccordionChange(10)}
					disableGutters
				>
					<StyledAccordionSummary
						aria-controls="library-patron-requests"
						id="library-patron-requests"
						expandIcon={
							<IconContext.Provider value={{ size: "2em" }}>
								<MdExpandMore />
							</IconContext.Provider>
						}
					>
						<Typography variant="h2" fontWeight={"bold"}>
							{t("nav.patronRequests")}
						</Typography>
					</StyledAccordionSummary>
					<StyledAccordionDetails>
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[11]}
							onChange={handleAccordionChange(11)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="exception-patron-requests"
								id="exception-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.exception", {
										number: totalSizes["patronRequestsLibraryException"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={exceptionQueryVariables}
									type="patronRequestsLibraryException"
									coreType="patronRequests"
									columns={[
										{
											field: "dateCreated",
											headerName: "Request created",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateCreated: string };
											}) => {
												const requestCreated = params.row.dateCreated;
												return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "localBarcode",
											headerName: "Patron barcode",
											filterable: false,
											valueGetter: (params: {
												row: { requestingIdentity: { localBarcode: string } };
											}) => params?.row?.requestingIdentity?.localBarcode,
										},
										{
											field: "clusterRecordTitle",
											headerName: "Title",
											minWidth: 100,
											flex: 1.25,
											filterOperators: standardFilters,
											valueGetter: (params: {
												row: { clusterRecord: { title: string } };
											}) => params?.row?.clusterRecord?.title,
										},
										{
											field: "suppliers",
											headerName: "Supplying agency",
											filterable: false,
											valueGetter: (params: {
												row: { suppliers: Array<{ localAgency: string }> };
											}) => {
												// Check if suppliers array is not empty
												if (params.row.suppliers.length > 0) {
													return params.row.suppliers[0].localAgency;
												} else {
													return ""; // This allows us to handle the array being empty, and any related type errors.
												}
											},
										},
										{
											field: "status",
											headerName: "Status",
											minWidth: 100,
											flex: 1.5,
											filterOperators: standardFilters, // Enabled in case we want users to also be able to see other PRs for their library
										},
										{
											field: "errorMessage",
											headerName: "Error message",
											minWidth: 100,
											flex: 1.5,
											filterOperators: containsOnly,
										},
										{
											field: "dateUpdated",
											headerName: "Request updated",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateUpdated: string };
											}) => {
												const requestUpdated = params.row.dateUpdated;
												return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "id",
											headerName: "Request UUID",
											minWidth: 100,
											flex: 0.5,
											filterOperators: equalsOnly,
										},
									]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t("patron_requests.search_placeholder")}
									columnVisibilityModel={{
										dateUpdated: false,
										id: false,
										status: false,
									}}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
								/>
							</SubAccordionDetails>
						</SubAccordion>
						{/* // Out of sequence patron requests */}
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[12]}
							onChange={handleAccordionChange(12)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="out-of-sequence-patron-requests"
								id="out-of-sequence-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.out_of_sequence", {
										number: totalSizes["patronRequestsLibraryOutOfSequence"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={outOfSequenceQueryVariables}
									type="patronRequestsLibraryOutOfSequence"
									coreType="patronRequests"
									columns={[
										{
											field: "dateCreated",
											headerName: "Request created",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateCreated: string };
											}) => {
												const requestCreated = params.row.dateCreated;
												return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "localBarcode",
											headerName: "Patron barcode",
											filterable: false,
											valueGetter: (params: {
												row: { requestingIdentity: { localBarcode: string } };
											}) => params?.row?.requestingIdentity?.localBarcode,
										},
										{
											field: "clusterRecordTitle",
											headerName: "Title",
											minWidth: 100,
											flex: 1.25,
											filterOperators: standardFilters,
											valueGetter: (params: {
												row: { clusterRecord: { title: string } };
											}) => params?.row?.clusterRecord?.title,
										},
										{
											field: "suppliers",
											headerName: "Supplying agency",
											filterable: false,
											valueGetter: (params: {
												row: { suppliers: Array<{ localAgency: string }> };
											}) => {
												// Check if suppliers array is not empty
												if (params.row.suppliers.length > 0) {
													return params.row.suppliers[0].localAgency;
												} else {
													return ""; // This allows us to handle the array being empty, and any related type errors.
												}
											},
										},
										{
											field: "status",
											headerName: "Status",
											minWidth: 100,
											flex: 1.5,
											filterOperators: standardFilters, // Enabled in case we want users to also be able to see other PRs for their library
										},
										{
											field: "outOfSequenceFlag",
											headerName: "Out of sequence",
											flex: 0.75,
											filterOperators: equalsOnly,
										},
										{
											field: "pollCountForCurrentStatus",
											headerName: "Polling count",
											flex: 0.25,
											filterOperators: equalsOnly,
										},
										{
											field: "elapsedTimeInCurrentStatus",
											headerName: "Time in state",
											minWidth: 50,
											filterOperators: equalsOnly,
											valueGetter: (params: {
												row: { elapsedTimeInCurrentStatus: number };
											}) =>
												formatDuration(params.row.elapsedTimeInCurrentStatus),
										},
										{
											field: "dateUpdated",
											headerName: "Request updated",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateUpdated: string };
											}) => {
												const requestUpdated = params.row.dateUpdated;
												return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "id",
											headerName: "Request UUID",
											minWidth: 100,
											flex: 0.5,
											filterOperators: equalsOnly,
										},
									]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t("patron_requests.search_placeholder")}
									columnVisibilityModel={{
										dateUpdated: false,
										id: false,
									}}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
								/>
							</SubAccordionDetails>
						</SubAccordion>
						{/* In progress patron requests (Active) */}
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[13]}
							onChange={handleAccordionChange(13)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="in-progress-patron-requests"
								id="in-progress-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.active", {
										number: totalSizes["patronRequestsLibraryActive"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={inProgressQueryVariables}
									type="patronRequestsLibraryActive"
									coreType="patronRequests"
									columns={[
										{
											field: "dateCreated",
											headerName: "Request created",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateCreated: string };
											}) => {
												const requestCreated = params.row.dateCreated;
												return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "localBarcode",
											headerName: "Patron barcode",
											filterable: false,
											valueGetter: (params: {
												row: { requestingIdentity: { localBarcode: string } };
											}) => params?.row?.requestingIdentity?.localBarcode,
										},
										{
											field: "clusterRecordTitle",
											headerName: "Title",
											minWidth: 100,
											flex: 1.25,
											filterOperators: standardFilters,
											valueGetter: (params: {
												row: { clusterRecord: { title: string } };
											}) => params?.row?.clusterRecord?.title,
										},
										{
											field: "suppliers",
											headerName: "Supplying agency",
											filterable: false,
											valueGetter: (params: {
												row: { suppliers: Array<{ localAgency: string }> };
											}) => {
												// Check if suppliers array is not empty
												if (params.row.suppliers.length > 0) {
													return params.row.suppliers[0].localAgency;
												} else {
													return ""; // This allows us to handle the array being empty, and any related type errors.
												}
											},
										},
										{
											field: "status",
											headerName: "Status",
											minWidth: 100,
											flex: 1.5,
											filterOperators: standardFilters, // Enabled in case we want users to also be able to see other PRs for their library
										},
										{
											field: "outOfSequenceFlag",
											headerName: "Out of sequence",
											flex: 0.75,
											filterOperators: equalsOnly,
										},
										{
											field: "pollCountForCurrentStatus",
											headerName: "Polling count",
											flex: 0.25,
											filterOperators: equalsOnly,
										},
										{
											field: "elapsedTimeInCurrentStatus",
											headerName: "Time in state",
											minWidth: 50,
											filterOperators: equalsOnly,
											valueGetter: (params: {
												row: { elapsedTimeInCurrentStatus: number };
											}) =>
												formatDuration(params.row.elapsedTimeInCurrentStatus),
										},
										{
											field: "dateUpdated",
											headerName: "Request updated",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateUpdated: string };
											}) => {
												const requestUpdated = params.row.dateUpdated;
												return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "id",
											headerName: "Request UUID",
											minWidth: 100,
											flex: 0.5,
											filterOperators: equalsOnly,
										},
									]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t("patron_requests.search_placeholder")}
									columnVisibilityModel={{
										dateUpdated: false,
										id: false,
									}}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
								/>
							</SubAccordionDetails>
						</SubAccordion>
						{/* Finished / Completed patron requests */}
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[14]}
							onChange={handleAccordionChange(14)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="finished-patron-requests"
								id="finished-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.completed", {
										number: totalSizes["patronRequestsLibraryCompleted"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={finishedQueryVariables}
									type="patronRequestsLibraryCompleted"
									coreType="patronRequests"
									columns={[
										{
											field: "dateCreated",
											headerName: "Request created",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateCreated: string };
											}) => {
												const requestCreated = params.row.dateCreated;
												return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "localBarcode",
											headerName: "Patron barcode",
											filterable: false,
											valueGetter: (params: {
												row: { requestingIdentity: { localBarcode: string } };
											}) => params?.row?.requestingIdentity?.localBarcode,
										},
										{
											field: "clusterRecordTitle",
											headerName: "Title",
											minWidth: 100,
											flex: 1.25,
											filterOperators: standardFilters,
											valueGetter: (params: {
												row: { clusterRecord: { title: string } };
											}) => params?.row?.clusterRecord?.title,
										},
										{
											field: "suppliers",
											headerName: "Supplying agency",
											filterable: false,
											valueGetter: (params: {
												row: { suppliers: Array<{ localAgency: string }> };
											}) => {
												// Check if suppliers array is not empty
												if (params.row.suppliers.length > 0) {
													return params.row.suppliers[0].localAgency;
												} else {
													return ""; // This allows us to handle the array being empty, and any related type errors.
												}
											},
										},
										{
											field: "status",
											headerName: "Status",
											minWidth: 100,
											flex: 1.5,
											filterOperators: standardFilters, // Enabled in case we want users to also be able to see other PRs for their library
										},
										{
											field: "dateUpdated",
											headerName: "Request updated",
											minWidth: 150,
											filterable: false,
											valueGetter: (params: {
												row: { dateUpdated: string };
											}) => {
												const requestUpdated = params.row.dateUpdated;
												return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
											},
										},
										{
											field: "id",
											headerName: "Request UUID",
											minWidth: 100,
											flex: 0.5,
											filterOperators: equalsOnly,
										},
									]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t("patron_requests.search_placeholder")}
									columnVisibilityModel={{
										dateUpdated: false,
										id: false,
									}}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
								/>
							</SubAccordionDetails>
						</SubAccordion>
					</StyledAccordionDetails>
				</StyledAccordion>
			) : null}
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
	const libraryId = ctx.params.libraryId;
	return {
		props: {
			libraryId,
			...translations,
		},
	};
}
