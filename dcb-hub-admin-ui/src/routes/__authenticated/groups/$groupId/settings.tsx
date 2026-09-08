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

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getLibraryGroupById } from "@queries/getGroupById";
import { updateAgencyParticipationStatus } from "@mutations/updateAgencyParticipation";
import { CONFIRMATION_TEXT_MAP } from "@helpers/getConfirmationText";
import { Group } from "@models/Group";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import type { LoadGroupQueryVariables } from "@generated/graphql";

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

	const [showConfirmationBorrowing, setConfirmationBorrowing] = useState(false);
	const [showConfirmationSupplying, setConfirmationSupplying] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error" | "warning";
		text: string | null;
		title: string | null;
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
		refetchInterval: 120000,
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
		type: "borrowing" | "supplying",
		action: "enable" | "disable",
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		if (!group?.members) return;

		setIsUpdating(true);
		const isEnabled = action === "enable";

		const updates = group.members.map((member: LibraryGroupMember) => {
			const agencyCode = member.library?.agencyCode;
			if (!agencyCode) return Promise.resolve(null);

			const input = {
				code: agencyCode,
				[type === "borrowing" ? "isBorrowingAgency" : "isSupplyingAgency"]:
					isEnabled,
				reason,
				changeCategory,
				changeReferenceUrl,
			};

			return updateParticipation({ input });
		});

		const results = await Promise.allSettled(updates);
		const successCount = results.filter((r) => r.status === "fulfilled").length;
		const failCount = results.filter((r) => r.status === "rejected").length;

		setIsUpdating(false);
		if (type === "borrowing") setConfirmationBorrowing(false);
		else setConfirmationSupplying(false);
		queryClient.invalidateQueries({ queryKey: ["group", groupId] });

		if (failCount === 0) {
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
				text: t("groups.settings.bulk_update_partial", {
					success: successCount,
					total: group.members.length,
				}),
			});
		}
	};

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
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

	const borrowingAction = groupStats.hasBorrowing
		? "disableBorrowing"
		: "enableBorrowing";
	const supplyingAction = groupStats.hasSupplying
		? "disableSupplying"
		: "enableSupplying";

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
					<Tooltip
						title={
							!isAnAdmin ? t("ui.confirmation.admin_required_supplying") : ""
						}
					>
						<span>
							<Button
								color="primary"
								variant="outlined"
								sx={{ mt: 1 }}
								disabled={!isAnAdmin || isUpdating}
								onClick={() => setConfirmationBorrowing(true)}
							>
								{groupStats.hasBorrowing
									? t("groups.settings.disable_all_borrowing")
									: t("groups.settings.enable_all_borrowing")}
							</Button>
						</span>
					</Tooltip>
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
					<Button
						disabled={!isAnAdmin || isUpdating}
						onClick={() => setConfirmationSupplying(true)}
						color="primary"
						variant="outlined"
						sx={{ mt: 1 }}
					>
						{groupStats.hasSupplying
							? t("groups.settings.disable_all_supplying")
							: t("groups.settings.enable_all_supplying")}
					</Button>
				</Grid>
			</Grid>
			<Confirmation
				open={showConfirmationBorrowing}
				onClose={() => setConfirmationBorrowing(false)}
				onConfirm={(reason, category, url) =>
					handleGroupParticipation(
						"borrowing",
						groupStats.hasBorrowing ? "disable" : "enable",
						reason,
						category,
						url,
					)
				}
				action="gridEdit"
				entityName={group.name}
				customWarningText={
					<Box>
						<Typography variant="h6" gutterBottom>
							{t(CONFIRMATION_TEXT_MAP[borrowingAction].header)}
						</Typography>
						<Typography
							sx={{
								marginBottom: "16px",
							}}
						>
							{t(CONFIRMATION_TEXT_MAP[borrowingAction].para1)}
						</Typography>
						<Typography variant="body2">
							{t(CONFIRMATION_TEXT_MAP[borrowingAction].select)}
						</Typography>
					</Box>
				}
			/>
			<Confirmation
				open={showConfirmationSupplying}
				onClose={() => setConfirmationSupplying(false)}
				onConfirm={(reason, category, url) =>
					handleGroupParticipation(
						"supplying",
						groupStats.hasSupplying ? "disable" : "enable",
						reason,
						category,
						url,
					)
				}
				action="gridEdit"
				entityName={group.name}
				customWarningText={
					<Box>
						<Typography variant="h6" gutterBottom>
							{t(CONFIRMATION_TEXT_MAP[supplyingAction].header)}
						</Typography>
						<Typography
							sx={{
								marginBottom: "16px",
							}}
						>
							{t(CONFIRMATION_TEXT_MAP[supplyingAction].para1)}
						</Typography>
						<Typography variant="body2">
							{t(CONFIRMATION_TEXT_MAP[supplyingAction].select)}
						</Typography>
					</Box>
				}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
