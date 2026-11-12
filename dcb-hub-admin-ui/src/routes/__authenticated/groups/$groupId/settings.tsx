import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import {
	Button,
	Grid,
	Stack,
	Typography,
	Tooltip,
	CircularProgress,
	Box,
} from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import GroupTabs from "@components/GroupTabs/GroupTabs";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { requestReferenceOf } from "@helpers/requestReference";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { isSettingsInheritanceEnabled } from "@helpers/featureFlags";
import { getSettingsBearingGroupType } from "@queries/getResolvedFunctionalSettings";
import FunctionalSettingInheritance from "@components/FunctionalSettingInheritance/FunctionalSettingInheritance";
import { getLibraryGroupById } from "@queries/getGroupById";
import { updateAgencyParticipationStatus } from "@mutations/updateAgencyParticipation";
import { CONFIRMATION_TEXT_MAP } from "@helpers/getConfirmationText";
import {
	participationChanges,
	type Participation,
} from "@helpers/groupParticipation";
import { invalidateLibraryCaches } from "@forms/NewLibrary/libraryCaches";
import { Group } from "@models/Group";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import type {
	LoadGroupQueryVariables,
	LoadSettingsBearingGroupTypeQuery,
} from "@generated/graphql";

import { DETAIL_REFETCH_MS } from "@constants/refetchIntervals";
import { nonCriticalQuery } from "@helpers/queryPolicy";
export const Route = createFileRoute(
	"/__authenticated/groups/$groupId/settings",
)({
	component: GroupSettings,
});

function GroupSettings() {
	const { t } = useTranslation();
	const { groupId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	// The group-wide change waiting on its confirmation
	const [pending, setPending] = useState<{
		type: Participation;
		enable: boolean;
	} | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error" | "warning";
		text: string | null;
		title: string | null;
		reference?: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});

	const { data, isLoading, error } = useQuery({
		queryKey: ["group", groupId],
		queryFn: () =>
			gqlClient.request<any, LoadGroupQueryVariables>(getLibraryGroupById, {
				query: `id:${groupId}`,
			}),
		refetchInterval: DETAIL_REFETCH_MS,
	});

	/**
	 * Which group type carries settings on this deployment — §V-22.6b.
	 *
	 * Exactly ONE type is settings-bearing, so most groups have no settings at all and
	 * showing them an editable panel would invite an administrator to configure something
	 * that resolves for nobody. Deployment configuration, so it is asked once per session.
	 */
	const settingsBearingType = useQuery({
		...nonCriticalQuery,
		queryKey: ["settingsBearingGroupType"],
		queryFn: () =>
			gqlClient.request<LoadSettingsBearingGroupTypeQuery>(
				getSettingsBearingGroupType(),
			),
		staleTime: Infinity,
		enabled: isSettingsInheritanceEnabled(),
		select: (data) => data.settingsBearingGroupType ?? null,
	});

	const group: Group = data?.libraryGroups?.content?.[0];

	const { mutateAsync: updateParticipation } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updateAgencyParticipationStatus, variables),
	});

	const groupStats = useMemo(() => {
		if (!group?.members)
			return {
				borrowingCount: 0,
				supplyingCount: 0,
				total: 0,
				hasBorrowing: false,
				hasSupplying: false,
			};

		const total = group.members.length;
		const borrowingCount = group.members.filter(
			(m: LibraryGroupMember) => m.library?.agency?.isBorrowingAgency,
		).length;
		const supplyingCount = group.members.filter(
			(m: LibraryGroupMember) => m.library?.agency?.isSupplyingAgency,
		).length;

		return {
			borrowingCount,
			supplyingCount,
			total,
			hasBorrowing: borrowingCount > 0,
			hasSupplying: supplyingCount > 0,
		};
	}, [group]);

	const handleGroupParticipation = async (
		type: Participation,
		enable: boolean,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		if (!group?.members) return;

		setIsUpdating(true);
		const codes = participationChanges(group.members, type, enable);
		const results = await Promise.allSettled(
			codes.map((code) =>
				updateParticipation({
					input: {
						code,
						[type === "borrowing" ? "isBorrowingAgency" : "isSupplyingAgency"]:
							enable,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				}),
			),
		);
		const successCount = results.filter((r) => r.status === "fulfilled").length;
		const failures = results.filter(
			(r): r is PromiseRejectedResult => r.status === "rejected",
		);

		setIsUpdating(false);
		setPending(null);
		// The group, and every library and agency page that shows participation
		void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
		void invalidateLibraryCaches(queryClient);

		if (failures.length === 0) {
			setAlert({
				open: true,
				severity: "success",
				title: t("ui.data_grid.success"),
				text: t("groups.bulk_update_success", { count: successCount }),
			});
		} else {
			setAlert({
				open: true,
				severity: "warning",
				title: t("ui.data_grid.warning"),
				reference: requestReferenceOf(failures[0]?.reason),
				text: t("groups.settings.bulk_update_partial", {
					success: successCount,
					total: codes.length,
				}),
			});
		}
	};

	if (isLoading) {
		return (
			// The SAME chrome as the loaded branch, titled with the generic label for
			// this kind of record. Withholding the breadcrumbs and the title box and
			// adding them when the data lands inserts 77px above the page and pushes it
			// down; the specific name replaces this on one line, so the box does not
			// change height. See docs/performance-budget.md, "Layout shift on every
			// route".
			<PageContainer title={t("nav.groups.settings")}>
				<Loading title={t("groups.groups_one")} subtitle={t("ui.info.wait")} />
			</PageContainer>
		);
	}

	if (error || !group) {
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.actions.go_back")}
					goBack="/groups"
				/>
			</PageContainer>
		);
	}

	const pendingText =
		pending &&
		CONFIRMATION_TEXT_MAP[
			`${pending.enable ? "enable" : "disable"}${pending.type === "borrowing" ? "Borrowing" : "Supplying"}`
		];
	// Disable while any member takes part, enable while any does not: a mixed group has both
	const offers = (type: Participation) =>
		[false, true].filter(
			(enable) =>
				participationChanges(group.members ?? [], type, enable).length > 0,
		);

	return (
		<PageContainer title={group.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<GroupTabs groupId={groupId} value={3} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("nav.groups.settings")}
					</Typography>
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="accordionSummary">
						{t("libraries.circulation.title")}
					</Typography>
				</Grid>

				{isUpdating && (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<CircularProgress />
						<Typography
							variant="caption"
							align="center"
							sx={{
								display: "block",
							}}
						>
							{t("groups.settings.processing_bulk_update")}
						</Typography>
					</Grid>
				)}

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.circulation.borrowing_status")}
						</Typography>
						<Typography>
							{t("groups.borrow_count", { count: groupStats.borrowingCount })}
						</Typography>
					</Stack>
					<Stack
						direction="row"
						spacing={1}
						useFlexGap
						sx={{ mt: 1, flexWrap: "wrap" }}
					>
						{offers("borrowing").map((enable) => (
							<Tooltip
								key={String(enable)}
								title={
									!isAnAdmin
										? t("ui.confirmation.admin_required_supplying")
										: ""
								}
							>
								<span>
									<Button
										color="primary"
										variant="outlined"
										disabled={!isAnAdmin || isUpdating}
										onClick={() => setPending({ type: "borrowing", enable })}
									>
										{t(
											enable
												? "groups.settings.enable_all_borrowing"
												: "groups.settings.disable_all_borrowing",
										)}
									</Button>
								</span>
							</Tooltip>
						))}
					</Stack>
				</Grid>

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("libraries.circulation.supplying_status")}
						</Typography>
						<Typography>
							{t("groups.supply_count", { count: groupStats.supplyingCount })}
						</Typography>
					</Stack>
					<Stack
						direction="row"
						spacing={1}
						useFlexGap
						sx={{ mt: 1, flexWrap: "wrap" }}
					>
						{offers("supplying").map((enable) => (
							<Button
								key={String(enable)}
								disabled={!isAnAdmin || isUpdating}
								onClick={() => setPending({ type: "supplying", enable })}
								color="primary"
								variant="outlined"
							>
								{t(
									enable
										? "groups.settings.enable_all_supplying"
										: "groups.settings.disable_all_supplying",
								)}
							</Button>
						))}
					</Stack>
				</Grid>
			</Grid>
			{/* §V-22.6. A group is a level of the settings chain, but only if its type is the
			    one this deployment made settings-bearing — otherwise a value written here
			    would resolve for no library at all. */}
			{isSettingsInheritanceEnabled() &&
				settingsBearingType.isSuccess &&
				(settingsBearingType.data === group.type ? (
					<FunctionalSettingInheritance
						scopeType="LIBRARY_GROUP"
						scopeId={group.id}
						scopeName={group.name}
						canEdit={isAnAdmin}
					/>
				) : (
					<Typography color="text.secondary" sx={{ mt: 4 }}>
						{settingsBearingType.data
							? t("settings_inheritance.group_not_settings_bearing", {
									type: settingsBearingType.data,
								})
							: t("settings_inheritance.no_group_level")}
					</Typography>
				))}

			<Confirmation
				open={!!pending}
				onClose={() => setPending(null)}
				onConfirm={(reason, category, url) =>
					pending &&
					handleGroupParticipation(
						pending.type,
						pending.enable,
						reason,
						category,
						url,
					)
				}
				action="gridEdit"
				entityName={group.name}
				customWarningText={
					pendingText && (
						<Box>
							<Typography variant="h6" gutterBottom>
								{t(pendingText.header)}
							</Typography>
							<Typography
								sx={{
									marginBottom: "16px",
								}}
							>
								{t(pendingText.para1)}
							</Typography>
							<Typography variant="body2">{t(pendingText.select)}</Typography>
						</Box>
					)
				}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				reference={alert.reference}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
