import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Button,
	Chip,
	Grid,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import Error from "@components/Error/Error";
import NewLibraryUser from "@forms/NewLibraryUser/NewLibraryUser";

import i18n from "@/i18n";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import {
	getLibraryUserProvisioningAvailable,
	getLibraryUsers,
} from "@queries/getLibraryUsers";
import { getLibraryContacts } from "@queries/getLibraryContacts";
import {
	resendLibraryUserInvite,
	setLibraryUserEnabled,
} from "@mutations/provisionLibraryUser";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/accounts",
)({
	component: LibraryAccounts,
	errorComponent: ({ error }) => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			<Error
				title={i18n.t("ui.error.unable_to_load_page")}
				message={error.message}
				action={i18n.t("ui.actions.reload")}
				reload={true}
			/>
		</PageContainer>
	),

	pendingComponent: () => (
		<PageContainer hideTitleBox hideBreadcrumbs>
			{/* Sized to what replaces it - tab bar, heading, blurb, button, grid. A
			    skeleton of the wrong height is a layout shift with extra steps, and CLS
			    is the one metric a reviewer cannot see in a diff. */}
			<Stack spacing={2}>
				<Skeleton variant="rounded" height={48} />
				<Skeleton variant="text" width="40%" height={48} />
				<Skeleton variant="text" width="70%" />
				<Skeleton variant="rounded" width={180} height={36} />
				<Skeleton variant="rounded" height={320} />
			</Stack>
		</PageContainer>
	),
});

interface LibraryUserRow {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	role: string;
	status: "INVITED" | "ACTIVE" | "DISABLED";
	agencyCode: string;
	dateCreated?: string | null;
	lastEditedBy?: string | null;
}

function LibraryAccounts() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	// Both halves of the guard, for the reason recorded in the hook: a beforeLoad check
	// reading context.auth silently passes on a cold load, because react-oidc-context has
	// not restored the session yet. Neither half is the control - dcb-service gates every
	// one of these operations on GraphQLRoles.CONSORTIUM.
	const isConsortiumAdmin = useIsConsortiumAdmin();

	const [showNewUser, setShowNewUser] = useState(false);

	const { data: availability } = useQuery({
		queryKey: ["libraryUserProvisioningAvailable"],
		queryFn: () =>
			gqlClient.request<{ libraryUserProvisioningAvailable: boolean }>(
				getLibraryUserProvisioningAvailable,
			),
		// Whether a deployment has an identity provider wired changes at deploy time, not
		// during a session. Refetching it on every mount would be a request per navigation
		// for an answer that cannot have moved.
		staleTime: 30 * 60 * 1000,
		enabled: isConsortiumAdmin,
	});

	const provisioningAvailable =
		availability?.libraryUserProvisioningAvailable ?? false;

	const {
		data,
		isLoading,
		isFetching,
		error: loadError,
	} = useQuery({
		queryKey: ["libraryUsers", libraryId],
		queryFn: () =>
			gqlClient.request<{ libraryUsers: LibraryUserRow[] }>(getLibraryUsers, {
				libraryId,
			}),
		// A staff list changes when somebody on this page changes it, and the mutations
		// below invalidate it when they do. Thirty seconds keeps a second tab honest
		// without polling the identity provider behind every mount.
		staleTime: 30 * 1000,
		enabled: isConsortiumAdmin && provisioningAvailable,
	});

	// The library's existing contacts, so provisioning can start from a person already
	// recorded rather than asking for the same name and address twice (WCAG 3.3.7).
	const { data: contactData } = useQuery({
		queryKey: ["library", "contacts", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibraryContacts, {
				query: `id:${libraryId}`,
				pageno: 0,
				pagesize: 100,
				order: "fullName",
				orderBy: "DESC",
			}),
		staleTime: 5 * 60 * 1000,
		enabled: isConsortiumAdmin && provisioningAvailable,
	});

	const library = contactData?.libraries?.content?.[0];
	const accounts = data?.libraryUsers ?? [];

	// Destructured because a useMutation result is not referentially stable, so passing
	// it into the columns memo would rebuild the column array on every render - and a
	// fresh columns array re-mounts the grid.
	const enabledMutation = useMutation({
		mutationFn: (input: { id: string; enabled: boolean }) =>
			gqlClient.request<unknown>(setLibraryUserEnabled, { input }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["libraryUsers", libraryId] }),
	});

	const inviteMutation = useMutation({
		mutationFn: (id: string) =>
			gqlClient.request<unknown>(resendLibraryUserInvite, { input: { id } }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["libraryUsers", libraryId] }),
	});

	const { mutate: setEnabled, isPending: isSettingEnabled } = enabledMutation;
	const { mutate: resendInvite, isPending: isResendingInvite } = inviteMutation;

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "name",
				headerName: t("libraries.accounts.name"),
				flex: 0.7,
				valueGetter: (_value: unknown, row: LibraryUserRow) =>
					`${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
			},
			{
				field: "email",
				headerName: t("libraries.accounts.email"),
				flex: 0.9,
			},
			{
				field: "role",
				headerName: t("libraries.accounts.role"),
				flex: 0.6,
				valueFormatter: (value: string) =>
					t(`libraries.accounts.roles.${String(value).toLowerCase()}`),
			},
			{
				field: "status",
				headerName: t("libraries.accounts.status"),
				flex: 0.5,
				renderCell: (params: GridRenderCellParams<LibraryUserRow>) => (
					// The label carries the meaning. A coloured chip alone would put the
					// whole distinction in hue, which fails both 1.4.1 and anybody
					// reading it in a hurry.
					<Chip
						size="small"
						label={t(
							`libraries.accounts.statuses.${String(params.value).toLowerCase()}`,
						)}
						color={params.value === "DISABLED" ? "default" : "primary"}
						variant={params.value === "ACTIVE" ? "filled" : "outlined"}
					/>
				),
			},
			{
				field: "actions",
				headerName: t("libraries.accounts.actions"),
				sortable: false,
				filterable: false,
				flex: 0.9,
				renderCell: (params: GridRenderCellParams<LibraryUserRow>) => (
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						{/* Text buttons rather than icons: a 24x24 icon-only control in a
						    dense grid row is the standard 2.5.8 offender, and these two
						    actions are rare enough that words cost nothing. */}
						<Button
							size="small"
							disabled={isSettingEnabled}
							onClick={() =>
								setEnabled({
									id: params.row.id,
									enabled: params.row.status === "DISABLED",
								})
							}
						>
							{params.row.status === "DISABLED"
								? t("libraries.accounts.enable")
								: t("libraries.accounts.disable")}
						</Button>
						<Button
							size="small"
							disabled={isResendingInvite}
							onClick={() => resendInvite(params.row.id)}
						>
							{t("libraries.accounts.resend_invite")}
						</Button>
					</Stack>
				),
			},
		],
		[t, setEnabled, isSettingEnabled, resendInvite, isResendingInvite],
	);

	if (!isConsortiumAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack="/"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={library?.fullName}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: 3 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={10} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("nav.libraries.accounts")}
					</Typography>
					<Typography variant="body1" sx={{ mt: 1 }}>
						{t("libraries.accounts.explanation")}
					</Typography>
				</Grid>

				{!provisioningAvailable ? (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						{/* Not an error: a deployment with no identity provider configured
						    is a supported state, and saying so is better than a grid that
						    fails for reasons the reader cannot see. */}
						<Typography variant="body1">
							{t("libraries.accounts.unavailable")}
						</Typography>
					</Grid>
				) : (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Stack direction="row" sx={{ mb: 2 }}>
							<Button
								variant="contained"
								onClick={() => setShowNewUser(true)}
							>
								{t("libraries.accounts.new.title")}
							</Button>
						</Stack>

						{/* Announced, not merely rendered: a count that changes only
						    visually does not exist for a screen-reader user. */}
						<Typography
							variant="body2"
							role="status"
							aria-live="polite"
							sx={{ mb: 1 }}
						>
							{loadError
								? t("libraries.accounts.load_error")
								: t("libraries.accounts.count", { count: accounts.length })}
						</Typography>

						<DataGrid
							identifier="libraryUsers"
							type="libraryUser"
							columns={columns}
							rows={accounts}
							loading={isLoading || isFetching}
							paginationMode="client"
							sortingMode="client"
							filterMode="client"
							disableAggregation
							disableRowGrouping
							toolbarVisible={false}
							pagination
							scrollbarVisible={false}
							noResultsText={t("libraries.accounts.none")}
							searchText=""
							disableHoverInteractions
							disablePivoting
							listViewEnabled={false}
							paginationModel={{ page: 0, pageSize: 25 }}
							pivotingEnabled={false}
						/>
					</Grid>
				)}
			</Grid>

			{showNewUser && (
				<NewLibraryUser
					show={showNewUser}
					onClose={() => setShowNewUser(false)}
					libraryId={libraryId}
					libraryName={library?.fullName}
					contacts={library?.contacts ?? []}
				/>
			)}
		</PageContainer>
	);
}
