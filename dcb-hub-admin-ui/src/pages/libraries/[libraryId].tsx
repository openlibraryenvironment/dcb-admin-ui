// import { useQuery } from "@apollo/client/react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Grid from "@mui/material/Unstable_Grid2";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Button,
	Divider,
	ListItemText,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { AdminLayout } from "@layout";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Location from "@components/Location/Location";
// import { getLibraryById } from "src/queries/queries";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import PrivateData from "@components/PrivateData/PrivateData";
import AddressLink from "@components/Address/AddressLink";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { useQuery } from "@apollo/client/react";
import { getLibraryById } from "src/queries/queries";
import { Library } from "@models/Library";
import { getILS } from "src/helpers/getILS";
import { findConsortium } from "src/helpers/findConsortium";

type LibraryDetails = {
	libraryId: any;
};
export default function LibraryDetails({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();
	const theme = useTheme();

	// pollInterval is in ms - set to 2 mins
	const { data, loading, error } = useQuery(getLibraryById, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
	});

	const library: Library = data?.libraries?.content?.[0];
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

	// Sets default state for expansion
	const [expandedAccordions, setExpandedAccordions] = useState([
		true,
		true,
		true,
		true,
	]);
	// Functions to handle expanding both individual accordions and all accordions
	const handleAccordionChange = (index: number) => () => {
		setExpandedAccordions((prevExpanded) => {
			const newExpanded = [...prevExpanded];
			newExpanded[index] = !newExpanded[index];
			return newExpanded;
		});
	};

	// Works for closing + expanding as it sets values to their opposite
	const expandAll = () => {
		setExpandedAccordions((prevExpanded) =>
			prevExpanded.map(() => !prevExpanded[0]),
		);
	};

	if (loading) {
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

	return error || library == null || library == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.info.go_back")}
					goBack="/libraries"
				/>
			) : (
				<Error
					title={t("ui.error.record_not_found")}
					message={t("ui.info.record_unavailable")}
					description={t("ui.action.check_url")}
					action={t("ui.info.go_back")}
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
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
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
				</AccordionSummary>
				<AccordionDetails>
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
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Divider aria-hidden="true"></Divider>
						</Grid>
						{/* /* 'Primary location' title goes here/* */}
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.primaryLocation.title")}
							</Typography>
						</Grid>
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
								{/* This needs a component which takes the lat+long and makes it into a GMaps link - must be URL encoded so get variables in right format first
								commas become %2C and spaces become +*
				This also needs to either store these variables or open the link in a new tab, as going directly back causes issues - same for address*/}
								<Location
									latitude={library?.latitude}
									longitude={library?.longitude}
								/>
							</Stack>
						</Grid>
						{isConsortiumGroupMember ? (
							<Grid xs={4} sm={8} md={12} lg={16}>
								<Divider aria-hidden="true"></Divider>
							</Grid>
						) : null}
						{isConsortiumGroupMember ? (
							<Grid xs={4} sm={8} md={12} lg={16}>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.consortium.title")}
								</Typography>
							</Grid>
						) : null}
						{isConsortiumGroupMember ? (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("libraries.consortium.name")}
									</Typography>
									<RenderAttribute
										attribute={
											library?.membership[0]?.libraryGroup?.consortium?.name
										}
									/>
								</Stack>
							</Grid>
						) : null}

						<Grid xs={4} sm={8} md={12} lg={16}>
							<Divider aria-hidden="true"></Divider>
						</Grid>
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.groups")}
							</Typography>
						</Grid>
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
					</Grid>
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[1]}
				onChange={handleAccordionChange(1)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
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
				</AccordionSummary>
				<AccordionDetails>
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
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
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
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Divider aria-hidden="true"></Divider>
						</Grid>
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.service.systems.title")}
							</Typography>
						</Grid>
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
								<RenderAttribute attribute={library?.hostLmsConfiguration} />
							</Stack>
						</Grid>
						{/* First Host LMS Section'*/}
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Divider aria-hidden="true"></Divider>
						</Grid>
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.service.hostlms_title", {
									name: library?.agency?.hostLms?.name,
								})}
							</Typography>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.name")}
								</Typography>
								<RenderAttribute attribute={library?.agency?.hostLms?.name} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.code")}
								</Typography>
								<RenderAttribute attribute={library?.agency?.hostLms?.code} />
							</Stack>
						</Grid>
						{/* Handle multi-roles and separate them */}
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.roles")}
								</Typography>
								{formatRoles(library?.agency?.hostLms?.clientConfig?.["roles"])}
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
									clientConfigType={t("libraries.service.environments.api_key")}
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
									clientConfigType={t("libraries.service.environments.api_key")}
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
									clientConfigType={t("libraries.service.environments.api_key")}
									hiddenTextValue={library?.agency?.hostLms?.clientConfig?.key}
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
											library?.agency?.hostLms?.clientConfig?.["staff-username"]
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
										library?.agency?.hostLms?.clientConfig?.["staff-password"]
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
											library?.agency?.hostLms?.clientConfig?.["folio-tenant"]
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
											library?.agency?.hostLms?.clientConfig?.["record-syntax"]
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
											library?.agency?.hostLms?.clientConfig?.["user-base-url"]
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
									<RenderAttribute attribute={library?.secondHostLms?.name} />
								</Stack>
							</Grid>
						) : null}
						{library?.secondHostLms ? (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("hostlms.code")}
									</Typography>
									<RenderAttribute attribute={library?.secondHostLms?.code} />
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
										attribute={library?.secondHostLms?.clientConfig?.["roles"]}
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
									clientConfigType={t("libraries.service.environments.api_key")}
									hiddenTextValue={library?.secondHostLms?.clientConfig?.apikey}
									id="lib-prod-env-api-key-2"
								/>
							</Grid>
						) : null}

						{/* For Polaris libraries it's the 'access key' attribute*/}
						{library?.secondHostLms?.clientConfig?.["access-key"] ? (
							<Grid xs={2} sm={4} md={4}>
								<PrivateData
									clientConfigType={t("libraries.service.environments.api_key")}
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
									clientConfigType={t("libraries.service.environments.api_key")}
									hiddenTextValue={library?.secondHostLms?.clientConfig?.key}
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
									hiddenTextValue={library?.secondHostLms?.clientConfig?.secret}
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
											library?.secondHostLms?.clientConfig?.["staff-username"]
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
											library?.secondHostLms?.clientConfig?.["metadata-prefix"]
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
											library?.secondHostLms?.clientConfig?.["record-syntax"]
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
											library?.secondHostLms?.clientConfig?.["user-base-url"]
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
										attribute={library?.secondHostLms?.clientConfig?.holdPolicy}
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
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
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
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Divider aria-hidden="true"></Divider>
						</Grid>
						<Grid xs={4} sm={8} md={12} lg={16}>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.patronAuth.title")}
							</Typography>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.config.patronAuth.auth_profile")}
								</Typography>
								<RenderAttribute attribute={library?.agency?.authProfile} />
							</Stack>
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>
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
