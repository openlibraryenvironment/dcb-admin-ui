import { Library } from "@models/Library";
import {
	Box,
	Button,
	Stack,
	Tab,
	Tabs,
	Typography,
	useTheme,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
	deleteLibraryQuery,
	getLibraryBasics,
	updateAgencyParticipationStatus,
} from "src/queries/queries";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AdminLayout } from "@layout";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import { useState } from "react";
import { Delete } from "@mui/icons-material";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { handleTabChange } from "src/helpers/navigation/handleTabChange";
import {
	closeConfirmation,
	handleDeleteEntity,
} from "src/helpers/actions/editAndDeleteActions";

type LibraryDetails = {
	libraryId: any;
};

export default function Settings({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();

	const [tabIndex, setTabIndex] = useState(2);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationBorrowing, setConfirmationBorrowing] = useState(false);
	const [showConfirmationSupplying, setConfirmationSupplying] = useState(false);
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});
	const { data, loading, error } = useQuery(getLibraryBasics, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
	});
	const [deleteLibrary] = useMutation(deleteLibraryQuery);

	const theme = useTheme();
	const router = useRouter();
	const client = useApolloClient();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);
	const [updateParticipation] = useMutation(updateAgencyParticipationStatus);

	const library: Library = data?.libraries?.content?.[0];

	const handleParticipationConfirmation = (
		active: string,
		targetParticipation: string,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		// Should be null if borrowing not active, true if we're looking to enable it, and false if we're looking to disable it
		const borrowInput =
			active == "borrowing"
				? targetParticipation == "disableBorrowing"
					? false
					: true
				: null;
		const supplyInput =
			active == "supplying"
				? targetParticipation == "disableSupplying"
					? false
					: true
				: null;
		// Pass the correct input to the mutation
		const input =
			active == "borrowing"
				? {
						code: library?.agencyCode,
						isBorrowingAgency: borrowInput ?? null,
						reason: reason,
						changeCategory: changeCategory,
						changeReferenceUrl: changeReferenceUrl,
					}
				: {
						code: library?.agencyCode,
						isSupplyingAgency: supplyInput ?? null,
						reason: reason,
						changeCategory: changeCategory,
						changeReferenceUrl: changeReferenceUrl,
					};
		updateParticipation({
			variables: {
				input,
			},
		})
			.then((response) => {
				// Handle successful response
				console.log("Participation status updated:", response?.data);
				// close the confirmation modal here - active determines the text shown
				const successText = {
					disableSupplying: t(
						"libraries.circulation.confirmation.alert.supplying_disabled",
					),
					enableSupplying: t(
						"libraries.circulation.confirmation.alert.supplying_enabled",
					),
					disableBorrowing: t(
						"libraries.circulation.confirmation.alert.borrowing_disabled",
					),
					enableBorrowing: t(
						"libraries.circulation.confirmation.alert.borrowing_enabled",
					),
				}[targetParticipation];

				setAlert({
					open: true,
					severity: "success",
					text: (
						<Trans
							i18nKey={successText}
							values={{ library: library?.fullName }}
							components={{ bold: <strong /> }}
						/>
					),
				});
				if (active.includes("Supplying")) {
					closeConfirmation(setConfirmationSupplying, client, "LoadLibrary");
				} else {
					closeConfirmation(setConfirmationBorrowing, client, "LoadLibrary");
				}
			})
			.catch((error) => {
				// Handle error
				console.error("Error updating participation status:", error);
				// Show the correct error alert.
				const errorText = {
					disableSupplying: t(
						"libraries.circulation.confirmation.alert.supplying_disabled_fail",
					),
					enableSupplying: t(
						"libraries.circulation.confirmation.alert.supplying_enabled_fail",
					),
					disableBorrowing: t(
						"libraries.circulation.confirmation.alert.borrowing_disabled_fail",
					),
					enableBorrowing: t(
						"libraries.circulation.confirmation.alert.borrowing_enabled_fail",
					),
				}[targetParticipation];
				setAlert({
					open: true,
					severity: "error",
					text: (
						<Trans
							i18nKey={errorText}
							values={{ library: library?.fullName }}
							components={{ bold: <strong /> }}
						/>
					),
				});
			});
	};

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("libraries.library").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	const pageActions = [
		{
			key: "delete",
			onClick: () => setConfirmationDeletion(true),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.delete_entity", {
				entity: t("libraries.library").toLowerCase(),
			}),
			startIcon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

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
		<AdminLayout
			title={t("libraries.settings_title", { name: library?.fullName })}
			pageActions={pageActions}
			mode={"view"}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid xs={4} sm={8} md={12}>
					<Tabs
						value={tabIndex}
						onChange={(event, value) => {
							handleTabChange(event, value, router, setTabIndex, libraryId);
						}}
						aria-label="Library navigation"
					>
						<Tab label={t("nav.libraries.profile")} />
						<Tab label={t("nav.libraries.service")} />
						<Tab label={t("nav.libraries.settings")} />
						<Tab label={t("nav.mappings.name")} />
						<Tab label={t("nav.libraries.patronRequests.name")} />
						<Tab label={t("nav.libraries.contacts")} />
						<Tab label={t("nav.locations")} />
					</Tabs>
				</Grid>
				<Grid xs={4} sm={8} md={12} lg={16}>
					<Typography variant="accordionSummary">
						{t("libraries.circulation.title")}
					</Typography>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.circulation.supplying_status")}
						</Typography>
						{library?.agency?.isSupplyingAgency
							? t("libraries.circulation.enabled_supply")
							: library?.agency?.isSupplyingAgency == false
								? t("libraries.circulation.disabled_supply")
								: t("libraries.circulation.not_set")}
					</Stack>
					<Button
						onClick={() => setConfirmationSupplying(true)}
						color="primary"
						variant="outlined"
						sx={{ marginTop: 1 }}
						type="submit"
					>
						{library?.agency?.isSupplyingAgency
							? t("libraries.circulation.confirmation.disable_supplying")
							: t("libraries.circulation.confirmation.enable_supplying")}
					</Button>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("libraries.circulation.borrowing_status")}
						</Typography>
						{library?.agency?.isBorrowingAgency
							? t("libraries.circulation.enabled_borrow")
							: library?.agency?.isBorrowingAgency == false
								? t("libraries.circulation.disabled_borrow")
								: t("libraries.circulation.not_set")}
					</Stack>
					<Button
						onClick={() => setConfirmationBorrowing(true)}
						color="primary"
						variant="outlined"
						sx={{ marginTop: 1 }}
						type="submit"
					>
						{library?.agency?.isBorrowingAgency
							? t("libraries.circulation.confirmation.disable_borrowing")
							: t("libraries.circulation.confirmation.enable_borrowing")}
					</Button>
				</Grid>
			</Grid>

			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertTitle={alert.title}
			/>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() =>
					closeConfirmation(setConfirmationDeletion, client, "LoadLibrary")
				}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					handleDeleteEntity(
						library.id,
						reason,
						changeCategory,
						changeReferenceUrl,
						setAlert,
						deleteLibrary,
						t,
						router,
						library?.fullName ?? "",
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				type={"deletelibraries"}
				entityName={library?.fullName}
				entity={t("libraries.library")}
				gridEdit={false}
			/>
			<Box>
				{showConfirmationBorrowing ? (
					<Confirmation
						open={showConfirmationBorrowing}
						onClose={() =>
							closeConfirmation(setConfirmationBorrowing, client, "LoadLibrary")
						}
						onConfirm={(reason, changeCategory, changeReferenceUrl) =>
							handleParticipationConfirmation(
								"borrowing",
								library?.agency?.isBorrowingAgency
									? "disableBorrowing"
									: "enableBorrowing",
								reason,
								changeCategory,
								changeReferenceUrl,
							)
						} // Needs to be handleConfirm "borrowing" and ideally saying which one it is
						type="participationStatus"
						participation={
							library?.agency?.isBorrowingAgency
								? "disableBorrowing"
								: "enableBorrowing"
						}
						entity={t("libraries.library")}
						entityName={library?.shortName}
						code={library?.agency?.code}
						gridEdit={false}
					/>
				) : null}
				{showConfirmationSupplying ? (
					<Confirmation
						open={showConfirmationSupplying}
						onClose={() =>
							closeConfirmation(setConfirmationSupplying, client, "LoadLibrary")
						}
						onConfirm={(reason, changeCategory, changeReferenceUrl) =>
							handleParticipationConfirmation(
								"supplying",
								library?.agency?.isSupplyingAgency
									? "disableSupplying"
									: "enableSupplying",
								reason,
								changeCategory,
								changeReferenceUrl,
							)
						} // Needs to be handleConfirm "borrowing" and ideally saying which one it is
						type={"participationStatus"}
						entity={t("libraries.library")}
						participation={
							library?.agency?.isSupplyingAgency
								? "disableSupplying"
								: "enableSupplying"
						}
						entityName={library?.fullName}
						code={library?.agency?.code}
						gridEdit={false}
					/>
				) : null}
			</Box>
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
