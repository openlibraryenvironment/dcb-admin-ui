import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	Alert,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Grid,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import ConsortiumTabs from "@components/ConsortiumTabs/ConsortiumTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import Error from "@components/Error/Error";
import RequestTagDialog, {
	EditableRequestTag,
} from "@forms/RequestTagDialog/RequestTagDialog";

import i18n from "@/i18n";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { isConsortiumStaff } from "@helpers/consortiumAccess";
import { describeGraphQLError } from "@helpers/graphQLErrors";
import { isRequestTagsEnabled } from "@helpers/featureFlags";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useIsConsortiumAdmin } from "@hooks/useIsConsortiumAdmin";
import { deleteRequestTag, updateRequestTag } from "@mutations/requestTags";
import {
	REQUEST_TAGS_QUERY_KEY,
	requestTagsQuery,
} from "@/queryOptions/requestTags";
import { REQUEST_TAG_VOCABULARY_MAX } from "@schemas/requestTagSchema";
import type {
	DeleteRequestTagMutation,
	DeleteRequestTagMutationVariables,
	UpdateRequestTagMutation,
	UpdateRequestTagMutationVariables,
} from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/consortium/requestTags")(
	{
		beforeLoad: ({ context: { auth } }) => {
			if (!isRequestTagsEnabled()) {
				throw redirect({ to: "/consortium" });
			}

			// On a cold load the session is not restored yet, so the component's own check
			// below is what covers that path
			if (!auth?.isAuthenticated) return;

			if (
				!isConsortiumStaff(auth.user?.profile?.roles as string[] | undefined)
			) {
				throw redirect({ to: "/unauthorised" });
			}
		},
		loader: ({ context: { queryClient, cfg, auth } }) => {
			if (!auth?.isAuthenticated) return;
			return queryClient.ensureQueryData(
				requestTagsQuery(createGraphQLClient(cfg, auth)),
			);
		},
		component: RequestTags,
		errorComponent: ({ error }) => (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={i18n.t("ui.error.unable_to_load_page")}
					message={error.message}
					action={i18n.t("ui.actions.reload")}
					onAction={() => location.reload()}
				/>
			</PageContainer>
		),
		pendingComponent: () => (
			<PageContainer title={i18n.t("nav.consortium.requestTags")}>
				<Stack spacing={2}>
					<Skeleton variant="rounded" height={48} />
					<Skeleton variant="text" width="70%" />
					<Skeleton variant="rounded" width={140} height={36} />
					<Skeleton variant="rounded" height={320} />
				</Stack>
			</PageContainer>
		),
	},
);

interface RequestTagRow {
	code: string;
	label: string;
	description?: string | null;
	active: boolean;
}

type Editing = { tag?: EditableRequestTag } | null;

function RequestTags() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const isConsortiumAdmin = useIsConsortiumAdmin();

	const [editing, setEditing] = useState<Editing>(null);
	const [deleting, setDeleting] = useState<RequestTagRow | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const { data, isLoading, isFetching } = useQuery({
		...requestTagsQuery(gqlClient),
		enabled: isConsortiumAdmin,
	});

	const rows: RequestTagRow[] = useMemo(
		() =>
			(data?.requestTags ?? []).flatMap((tag) =>
				tag?.code && tag.label
					? [
							{
								code: tag.code,
								label: tag.label,
								description: tag.description,
								active: tag.active ?? false,
							},
						]
					: [],
			),
		[data],
	);

	const setActive = useMutation({
		mutationFn: (row: RequestTagRow) =>
			gqlClient.request<
				UpdateRequestTagMutation,
				UpdateRequestTagMutationVariables
			>(updateRequestTag, {
				// Description left out, so the stored one is kept
				input: { code: row.code, label: row.label, active: !row.active },
			}),
		onSuccess: (_result, row) => {
			setNotice(
				t(
					row.active
						? "consortium.request_tags.retired"
						: "consortium.request_tags.restored",
					{ label: row.label },
				),
			);
			return queryClient.invalidateQueries({
				queryKey: REQUEST_TAGS_QUERY_KEY,
			});
		},
	});

	const remove = useMutation({
		mutationFn: (row: RequestTagRow) =>
			gqlClient.request<
				DeleteRequestTagMutation,
				DeleteRequestTagMutationVariables
			>(deleteRequestTag, { code: row.code }),
		onSuccess: (_result, row) => {
			setDeleting(null);
			setNotice(t("consortium.request_tags.deleted", { label: row.label }));
			return queryClient.invalidateQueries({
				queryKey: REQUEST_TAGS_QUERY_KEY,
			});
		},
	});

	const { mutate: toggleActive, isPending: isTogglingActive } = setActive;
	const { reset: resetRemove } = remove;

	const columns: GridColDef<RequestTagRow>[] = useMemo(
		() => [
			{
				field: "label",
				headerName: t("consortium.request_tags.label"),
				flex: 0.7,
			},
			{
				field: "code",
				headerName: t("consortium.request_tags.code"),
				flex: 0.6,
			},
			{
				field: "description",
				headerName: t("consortium.request_tags.description"),
				flex: 1.2,
			},
			{
				field: "active",
				headerName: t("consortium.request_tags.status"),
				flex: 0.4,
				renderCell: (params: GridRenderCellParams<RequestTagRow>) => (
					<Chip
						size="small"
						label={t(
							params.row.active
								? "consortium.request_tags.active"
								: "consortium.request_tags.retired_status",
						)}
						variant={params.row.active ? "filled" : "outlined"}
					/>
				),
			},
			{
				field: "actions",
				headerName: t("consortium.request_tags.actions"),
				sortable: false,
				filterable: false,
				flex: 1,
				renderCell: (params: GridRenderCellParams<RequestTagRow>) => (
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<Button
							size="small"
							aria-label={t("consortium.request_tags.edit_named", {
								label: params.row.label,
							})}
							onClick={() => {
								setNotice(null);
								setEditing({ tag: params.row });
							}}
						>
							{t("consortium.request_tags.edit")}
						</Button>
						<Button
							size="small"
							disabled={isTogglingActive}
							aria-label={t(
								params.row.active
									? "consortium.request_tags.retire_named"
									: "consortium.request_tags.restore_named",
								{ label: params.row.label },
							)}
							onClick={() => toggleActive(params.row)}
						>
							{t(
								params.row.active
									? "consortium.request_tags.retire"
									: "consortium.request_tags.restore",
							)}
						</Button>
						<Button
							size="small"
							aria-label={t("consortium.request_tags.delete_named", {
								label: params.row.label,
							})}
							onClick={() => {
								resetRemove();
								setDeleting(params.row);
							}}
						>
							{t("consortium.request_tags.delete")}
						</Button>
					</Stack>
				),
			},
		],
		[t, toggleActive, isTogglingActive, resetRemove],
	);

	if (!isConsortiumAdmin) {
		return (
			<PageContainer hideTitleBox hideBreadcrumbs>
				<Error
					title={t("ui.error.401.name")}
					message={t("ui.error.401.summary")}
					description={t("ui.error.401.description")}
					action={t("ui.error.401.action")}
					goBack="/consortium"
				/>
			</PageContainer>
		);
	}

	const full = rows.length >= REQUEST_TAG_VOCABULARY_MAX;

	return (
		<PageContainer title={t("nav.consortium.requestTags")}>
			<ConsortiumTabs current="requestTags" />

			<Grid container spacing={2} columns={{ xs: 4, sm: 8, md: 12 }}>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography>{t("consortium.request_tags.explanation")}</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
						<Button
							variant="contained"
							disabled={full}
							onClick={() => {
								setNotice(null);
								setEditing({});
							}}
						>
							{t("consortium.request_tags.add")}
						</Button>
						{full && (
							<Typography variant="body2">
								{t("consortium.request_tags.full", {
									max: REQUEST_TAG_VOCABULARY_MAX,
								})}
							</Typography>
						)}
					</Stack>
				</Grid>

				{setActive.isError && (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<Alert severity="error">
							{describeGraphQLError(
								setActive.error,
								t("consortium.request_tags.save_failed"),
							)}
						</Alert>
					</Grid>
				)}

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="body2" role="status" aria-live="polite">
						{notice ??
							t("consortium.request_tags.count", {
								count: rows.length,
								max: REQUEST_TAG_VOCABULARY_MAX,
							})}
					</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{/* Client-side paging, sorting and filtering: dcb-service caps the list at
					    100 tags, so it is fetched whole */}
					<DataGrid
						identifier="requestTags"
						type="requestTag"
						columns={columns}
						rows={rows}
						getRowId={(row: RequestTagRow) => row.code}
						loading={isLoading || isFetching}
						paginationMode="client"
						sortingMode="client"
						filterMode="client"
						disableAggregation
						disableRowGrouping
						toolbarVisible={false}
						pagination
						scrollbarVisible={false}
						noResultsText={t("consortium.request_tags.none")}
						searchText=""
						disableHoverInteractions
						disablePivoting
						listViewEnabled={false}
						paginationModel={{ page: 0, pageSize: 25 }}
						pivotingEnabled={false}
					/>
				</Grid>
			</Grid>

			{editing && (
				<RequestTagDialog
					tag={editing.tag}
					onClose={() => setEditing(null)}
					onSaved={(label) => {
						setEditing(null);
						setNotice(
							t(
								editing.tag
									? "consortium.request_tags.saved"
									: "consortium.request_tags.added",
								{ label },
							),
						);
					}}
				/>
			)}

			<Dialog
				open={deleting !== null}
				onClose={() => setDeleting(null)}
				aria-labelledby="delete-request-tag-title"
			>
				<DialogTitle id="delete-request-tag-title">
					{t("consortium.request_tags.delete_title", {
						label: deleting?.label,
					})}
				</DialogTitle>
				<DialogContent>
					{remove.isError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{describeGraphQLError(
								remove.error,
								t("consortium.request_tags.delete_failed"),
							)}
						</Alert>
					)}
					<DialogContentText>
						{t("consortium.request_tags.delete_body")}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleting(null)}>
						{t("ui.actions.cancel")}
					</Button>
					<Button
						variant="contained"
						color="error"
						disabled={remove.isPending}
						onClick={() => deleting && remove.mutate(deleting)}
					>
						{t("consortium.request_tags.delete")}
					</Button>
				</DialogActions>
			</Dialog>
		</PageContainer>
	);
}
