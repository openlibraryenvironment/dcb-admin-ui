import { Grid, Tab, Tabs, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import {
	getLibraries,
	getLibraryGroupById,
	getLocationForPatronRequestGrid,
	getPatronRequests,
} from "src/queries/queries";
import { defaultPatronRequestGroupVisibility } from "src/helpers/DataGrid/columns";
import { useCustomColumns } from "@hooks/useCustomColumns";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";
import { useMemo, useState } from "react";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { Location } from "@models/Location";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { Group } from "@models/Group";
import { handleGroupTabChange } from "src/helpers/navigation/handleTabChange";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import { useQuery } from "@apollo/client/react";

type GroupDetails = {
	groupId: any;
};
export default function GroupSupplierRequests({ groupId }: GroupDetails) {
	const { t } = useTranslation();
	const customColumns = useCustomColumns();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const [tabIndex, setTabIndex] = useState(2);
	const { loading, data, error } = useQuery(getLibraryGroupById, {
		variables: {
			query: "id:" + groupId,
		},
		pollInterval: 120000,
		errorPolicy: "all",
	});
	// Get all the supplying agency codes
	const group: Group = data?.libraryGroups?.content?.[0];

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
		},
	);
	const patronRequestLocations: Location[] = locationsData?.locations.content;

	const { data: patronLibraries, loading: patronLibrariesLoading } = useQuery(
		getLibraries,
		{
			variables: {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			},
			errorPolicy: "all",
		},
	);
	const patronLibrariesContent = patronLibraries?.libraries?.content;

	// Supplying agency codes
	const groupVariables = useMemo(() => {
		if (!group?.members) return "";
		const codes = group.members
			.map((member: LibraryGroupMember) => member?.library?.agency?.code)
			.filter((code: string) => code != null && code !== "");

		const uniqueCodes = Array.from(new Set(codes));
		console.log(uniqueCodes);
		if (uniqueCodes.length === 0) return "";
		return uniqueCodes.map((c) => `supplyingAgencyCode:${c}`).join(" OR ");
	}, [group]);

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: patronRequestLocations,
		libraries: patronLibrariesContent,
		variant: "standard",
	});

	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	if (loading || status === "loading" || patronLibrariesLoading) {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("groups.groups_one").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || group == null || group == undefined ? (
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
		<AdminLayout title={group?.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleGroupTabChange(event, value, router, setTabIndex, groupId);
						}}
						aria-label="Group navigation"
					>
						<Tab label={t("nav.groups.profile")} />
						<Tab label={t("nav.groups.patronRequests")} />
						<Tab label={t("nav.groups.supplierRequests")} />
						{/* <Tab label={t("nav.groups.settings")} /> */}
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" fontWeight={"bold"}>
						{t("nav.groups.supplierRequests")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{groupVariables ? (
						<ServerPaginationGrid
							query={getPatronRequests}
							presetQueryVariables={"(" + groupVariables + ")"} // Makes sure the OR chain is evaluated properly
							type="supplierRequestsGroupAll"
							coreType="patronRequests"
							columns={allColumns}
							selectable={false}
							pageSize={20}
							noDataMessage={t("patron_requests.no_rows")}
							noResultsMessage={t("patron_requests.no_results")}
							searchPlaceholder={t("patron_requests.search_placeholder_status")}
							columnVisibilityModel={defaultPatronRequestGroupVisibility}
							scrollbarVisible={true}
							sortModel={[{ field: "dateCreated", sort: "desc" }]}
							sortDirection="DESC"
							sortAttribute="dateCreated"
							getDetailPanelContent={({ row }: any) => (
								<MasterDetail row={row} type="patronRequests" />
							)}
						/>
					) : null}
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
	const groupId = ctx.params.groupId;
	return {
		props: {
			groupId,
			...translations,
		},
	};
}
