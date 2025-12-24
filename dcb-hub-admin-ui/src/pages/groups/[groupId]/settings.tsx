import {
	Button,
	Grid,
	Stack,
	Tab,
	Tabs,
	Typography,
	Tooltip,
	CircularProgress,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
	getLibraryGroupById,
	updateAgencyParticipationStatus,
} from "src/queries/queries";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AdminLayout } from "@layout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useState, useMemo } from "react";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { handleGroupTabChange } from "src/helpers/navigation/handleTabChange";
import { closeConfirmation } from "src/helpers/actions/editAndDeleteActions";
import { Group } from "@models/Group";
import { LibraryGroupMember } from "@models/LibraryGroupMember";

type GroupSettingsProps = {
	groupId: any;
};

export default function GroupSettings({ groupId }: GroupSettingsProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const client = useApolloClient();

	const [tabIndex, setTabIndex] = useState(3); // Assuming 'settings' is index 3
	const [showConfirmationBorrowing, setConfirmationBorrowing] = useState(false);
	const [showConfirmationSupplying, setConfirmationSupplying] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});

	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});

	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	const { data, loading, error, refetch } = useQuery(getLibraryGroupById, {
		variables: { query: "id:" + groupId },
		pollInterval: 120000,
		errorPolicy: "all",
	});

	const group: Group = data?.libraryGroups?.content?.[0];
	const [updateParticipation] = useMutation(updateAgencyParticipationStatus);

	// Calculate Group State
	// We determine the "Group State" based on the majority.
	// If any member is enabled, we offer to Disable All. If all are disabled, we offer to Enable All.
	// This should say how many are enabled for borrowing, supplying in its own "circulation" section
	// Then give option to "Bulk set"
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
		console.log(total);
		console.log(borrowingCount);

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

			const input =
				type === "borrowing"
					? {
							code: agencyCode,
							isBorrowingAgency: isEnabled,
							reason,
							changeCategory,
							changeReferenceUrl,
						}
					: {
							code: agencyCode,
							isSupplyingAgency: isEnabled,
							reason,
							changeCategory,
							changeReferenceUrl,
						};

			return updateParticipation({ variables: { input } });
		});

		const results = await Promise.allSettled(updates);
		const successCount = results.filter((r) => r.status === "fulfilled").length;
		const failCount = results.filter((r) => r.status === "rejected").length;

		setIsUpdating(false);

		if (type === "borrowing")
			closeConfirmation(
				() => setConfirmationBorrowing(false),
				client,
				"LoadLibraryGroup",
			);
		else
			closeConfirmation(
				() => setConfirmationSupplying(false),
				client,
				"LoadLibraryGroup",
			);

		refetch();

		if (failCount === 0) {
			setAlert({
				open: true,
				severity: "success",
				title: t("ui.data_grid.success"),
				text: t("groups.bulk_update_success", {
					count: successCount,
				}),
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

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading title={t("nav.groups.group")} subtitle={t("ui.info.wait")} />
			</AdminLayout>
		);
	}

	if (error || !group) {
		return (
			<AdminLayout hideBreadcrumbs>
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/groups"
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={group.name}>
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
						<Tab label={t("nav.groups.settings")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("nav.groups.settings")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12, lg: 16 }}>
					<Typography variant="accordionSummary">
						{t("libraries.circulation.title")}
					</Typography>
				</Grid>
				{isUpdating && (
					<Grid size={{ xs: 4, sm: 8, md: 12 }}>
						<CircularProgress />
						<Typography variant="caption" align="center" display="block">
							{t("groups.settings.processing_bulk_update")}
						</Typography>
					</Grid>
				)}

				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.circulation.borrowing_status")}
						</Typography>
						<Typography>
							{t("groups.borrow_count", { count: groupStats?.borrowingCount })}
						</Typography>
					</Stack>
					{!isAnAdmin ? (
						<Tooltip
							title={t(
								"libraries.circulation.confirmation.admin_required_supplying",
							)}
							key={t(
								"libraries.circulation.confirmation.admin_required_supplying",
							)}
						>
							<span>
								<Button
									color="primary"
									variant="outlined"
									sx={{ marginTop: 1 }}
									disabled={!isAnAdmin || isUpdating}
									onClick={() => setConfirmationBorrowing(true)}
								>
									{groupStats.hasBorrowing
										? t("groups.settings.disable_all_borrowing")
										: t("groups.settings.enable_all_borrowing")}
								</Button>
							</span>
						</Tooltip>
					) : (
						<Button
							color="primary"
							variant="outlined"
							sx={{ marginTop: 1 }}
							disabled={!isAnAdmin || isUpdating}
							onClick={() => setConfirmationBorrowing(true)}
						>
							{groupStats.hasBorrowing
								? t("groups.settings.disable_all_borrowing")
								: t("groups.settings.enable_all_borrowing")}
						</Button>
					)}
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.circulation.supplying_status")}
						</Typography>
						<Typography>
							{t("groups.supply_count", { count: groupStats?.supplyingCount })}
						</Typography>
					</Stack>
					<Button
						disabled={!isAnAdmin || isUpdating}
						onClick={() => setConfirmationSupplying(true)}
						color="primary"
						variant="outlined"
						sx={{ marginTop: 1 }}
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
				onConfirm={(reason, changeCategory, changeReferenceUrl) =>
					handleGroupParticipation(
						"borrowing",
						groupStats?.hasBorrowing ? "disable" : "enable",
						reason,
						changeCategory,
						changeReferenceUrl,
					)
				}
				type="participationStatus"
				participation={
					groupStats?.hasBorrowing ? "disableBorrowing" : "enableBorrowing"
				}
				entity={t("nav.groups.group")}
				entityName={group.name}
				gridEdit={false}
			/>

			<Confirmation
				open={showConfirmationSupplying}
				onClose={() => setConfirmationSupplying(false)}
				onConfirm={(reason, changeCategory, changeReferenceUrl) =>
					handleGroupParticipation(
						"supplying",
						groupStats?.hasSupplying ? "disable" : "enable",
						reason,
						changeCategory,
						changeReferenceUrl,
					)
				}
				type="participationStatus"
				participation={
					groupStats?.hasSupplying ? "disableSupplying" : "enableSupplying" // probably needs a customisation of confirmation modal
				}
				entity={t("nav.groups.group")}
				entityName={group.name}
				gridEdit={false}
			/>

			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
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
