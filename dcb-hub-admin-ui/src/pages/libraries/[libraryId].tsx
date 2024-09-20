import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Trans, useTranslation } from "next-i18next";
import Grid from "@mui/material/Unstable_Grid2";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { AdminLayout } from "@layout";
import { useState, useCallback, useRef } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import AddressLink from "@components/Address/AddressLink";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
	deleteLibraryQuery,
	getLibraryById,
	getMappings,
	getNumericRangeMappings,
	getPatronRequests,
	updateAgencyParticipationStatus,
	updateLibraryQuery,
	updatePerson,
} from "src/queries/queries";
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
	StyledAccordionButton,
} from "@components/StyledAccordion/StyledAccordion";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { getInitialAccordionState } from "src/helpers/getInitialAccordionState";
import LibraryHostLmsDetails from "./LibraryHostLmsDetails";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	standardPatronRequestColumns,
	defaultPatronRequestLibraryColumnVisibility,
	finishedPatronRequestColumnVisibility,
	exceptionPatronRequestColumnVisibility,
	patronRequestColumnsNoStatusFilter,
	refValueMappingColumnsNoCategoryFilter,
	numRangeMappingColumnsNoCategoryFilter,
} from "src/helpers/columns";
import { useCustomColumns } from "src/helpers/useCustomColumns";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { Person } from "@models/Person";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import EditableAttribute from "src/helpers/EditableAttribute/EditableAttribute";
import { formatChangedFields } from "src/helpers/formatChangedFields";
import MoreActionsMenu from "@components/MoreActionsMenu/MoreActionsMenu";
import useUnsavedChangesWarning from "@hooks/useUnsavedChangesWarning";

type LibraryDetails = {
	libraryId: any;
};

const INITIAL_EXPANDED_STATE = 3; // Number of accordions that should be initially expanded
const TOTAL_ACCORDIONS = 19; // Total number of accordions

export default function LibraryDetails({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();
	const customColumns = useCustomColumns();
	const firstEditableFieldRef = useRef<HTMLInputElement>(null);
	const theme = useTheme();

	// pollInterval is in ms - set to 2 mins
	const { data, loading, error } = useQuery(getLibraryById, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
	});
	const { data: session }: { data: any } = useSession();

	const [updateParticipation] = useMutation(updateAgencyParticipationStatus);
	const [deleteLibrary] = useMutation(deleteLibraryQuery);
	const [updateLibrary] = useMutation(updateLibraryQuery, {
		refetchQueries: ["LoadLibrary", "LoadLibraries"],
	});
	const [alert, setAlert] = useState<any>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});

	const [changedFields, setChangedFields] = useState<Partial<Library>>({});

	const isAnAdmin = session?.profile?.roles?.some(
		(role: string) => role === "ADMIN" || role === "CONSORTIUM_ADMIN",
	);

	// Handles toggling the library participation when a user clicks 'confirm'.
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
				closeConfirmation(active);
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

	const handleDeleteEntity = async (
		id: string,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		try {
			const input = {
				id: id,
				reason: reason,
				changeCategory: changeCategory,
				changeReferenceUrl: changeReferenceUrl,
			};
			const { data } = await deleteLibrary({
				variables: {
					input,
				},
				update(cache, { data: mutationData }) {
					// This will remove cached libraries if the delete is successful.
					// Thus forcing them to be re-fetched before re-direction to the libraries page.
					if (mutationData?.deleteLibrary.success) {
						cache.modify({
							fields: {
								libraries(_, { DELETE }) {
									return DELETE;
								},
							},
						});
					}
				},
			});
			if (data.deleteLibrary.success == true) {
				setAlert({
					open: true,
					severity: "success",
					text: t("ui.data_grid.delete_success", {
						entity: t("libraries.library").toLowerCase(),
						name: library?.fullName,
					}),
					title: t("ui.data_grid.deleted"),
				});
				console.log(data.deleteLibrary);
				console.log("Entity deleted successfully");
				setTimeout(() => {
					router.push("/libraries");
				}, 100);
			} else {
				console.log(data?.deleteLibrary);
				console.log("Failed to delete entity");
				setAlert({
					open: true,
					severity: "error",
					text: t("ui.data_grid.delete_error", {
						entity: t("libraries.library").toLowerCase(),
					}),
				});
			}
		} catch (error) {
			console.log(data?.deleteLibrary);
			console.error("Error deleting entity:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.delete_error", {
					entity: t("libraries.library").toLowerCase(),
				}),
			});
		}
	};

	const client = useApolloClient();
	const [showConfirmationBorrowing, setConfirmationBorrowing] = useState(false);
	const [showConfirmationSupplying, setConfirmationSupplying] = useState(false);
	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [showConfirmationEdit, setConfirmationEdit] = useState(false);
	const [hasValidationError, setValidationError] = useState(false);
	const [isDirty, setDirty] = useState(false);
	const [errors, setErrors] = useState();

	const library: Library = data?.libraries?.content?.[0];

	const [editMode, setEditMode] = useState(false);
	const [editKey, setEditKey] = useState(0);
	const [editableFields, setEditableFields] = useState({
		backupDowntimeSchedule: library?.backupDowntimeSchedule,
		supportHours: library?.supportHours,
		latitude: library?.latitude,
		longitude: library?.longitude,
		fullName: library?.fullName,
		shortName: library?.shortName,
		abbreviatedName: library?.abbreviatedName,
	});

	const handleSave = () => {
		if (Object.keys(changedFields).length === 0) {
			setEditMode(false);
			return;
		}
		setConfirmationEdit(true);
	};
	const handleCancel = () => {
		setEditMode(false);
		setEditableFields({
			backupDowntimeSchedule: library?.backupDowntimeSchedule,
			supportHours: library?.supportHours,
			latitude: library?.latitude,
			longitude: library?.longitude,
			fullName: library?.fullName,
			shortName: library?.shortName,
			abbreviatedName: library?.abbreviatedName,
		});
		setChangedFields({});
		setDirty(false);
		setValidationError(false);
		setEditKey((prevKey) => prevKey + 1); // This will change the keys of all EditableAttributes
		// Thus re-setting their states on cancel.
	};

	const handleConfirmSave = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		try {
			const { data } = await updateLibrary({
				variables: {
					input: {
						id: library.id,
						...changedFields,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
			});

			if (data.updateLibrary) {
				setEditMode(false);
				setChangedFields({});
				client.refetchQueries({
					include: ["LoadLibrary"],
				});
				setAlert({
					open: true,
					severity: "success",
					text: t("ui.data_grid.edit_success", {
						entity: t("libraries.library").toLowerCase(),
						name: library?.fullName,
					}),
					title: t("ui.data_grid.updated"),
				});
			}
		} catch (error) {
			console.error("Error updating library:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("ui.data_grid.edit_error", {
					entity: t("libraries.library").toLowerCase(),
					name: library?.fullName,
				}),
				title: t("ui.data_grid.updated"),
			});
		} finally {
			setConfirmationEdit(false);
		}
	};

	const handleEdit = () => {
		setEditableFields({
			backupDowntimeSchedule: library?.backupDowntimeSchedule,
			supportHours: library?.supportHours,
			latitude: library?.latitude,
			longitude: library?.longitude,
			fullName: library?.fullName,
			abbreviatedName: library?.abbreviatedName,
			shortName: library?.shortName,
		});
		setEditMode(true);
		expandAll();
		setTimeout(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		}, 0);
	};
	const updateField = (field: keyof Library, value: string | number | null) => {
		setEditableFields((prev) => ({
			...prev,
			[field]: value,
		}));

		if (value !== library[field]) {
			setChangedFields((prev) => ({
				...prev,
				[field]: value,
			}));
		} else {
			setChangedFields((prev) => {
				const newChangedFields = { ...prev };
				delete newChangedFields[field];
				return newChangedFields;
			});
		}
	};

	const {
		showUnsavedChangesModal,
		handleKeepEditing,
		handleLeaveWithoutSaving,
	} = useUnsavedChangesWarning({
		isDirty,
		hasValidationError,
		onKeepEditing: () => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		},
		onLeaveWithoutSaving: () => {
			setDirty(false);
			setChangedFields({});
		},
	});

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	const ils: string = getILS(library?.agency?.hostLms?.lmsClientClass);
	const isConsortiumGroupMember: boolean =
		findConsortium(library?.membership) != null ? true : false;

	const libraryGroups = library?.membership.map(
		(member: { libraryGroup: any }) => member.libraryGroup,
	);

	const openConfirmation = (participation: string) => {
		if (participation === "borrowing") {
			setConfirmationBorrowing(true);
		} else if (participation === "supplying") {
			setConfirmationSupplying(true);
		} else if (participation === "deletion") {
			setConfirmationDeletion(true);
		}
	};

	const closeConfirmation = (participation: string) => {
		if (participation === "borrowing") {
			setConfirmationBorrowing(false);
		} else if (participation === "supplying") {
			setConfirmationSupplying(false);
		} else if (participation === "deletion") {
			setConfirmationDeletion(false);
		}
		// This refetches the LoadLibrary query to ensure we're up-to-date after confirmation.
		client.refetchQueries({
			include: ["LoadLibrary"],
		});
	};

	const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(
		getInitialAccordionState(INITIAL_EXPANDED_STATE, TOTAL_ACCORDIONS),
	);

	const expandAll = useCallback(() => {
		setExpandedAccordions((prevExpanded) => prevExpanded.map(() => true));
	}, []);

	const collapseAll = useCallback(() => {
		setExpandedAccordions((prevExpanded) => prevExpanded.map(() => false));
	}, []);

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

	const [totalSizes, setTotalSizes] = useState<{ [key: string]: number }>({});

	const handleTotalSizeChange = useCallback((type: string, size: number) => {
		setTotalSizes((prevTotalSizes) => ({
			...prevTotalSizes,
			[type]: size,
		}));
	}, []);
	// Actions for the menu - in both view and edit mode.
	const viewModeActions = [
		{
			key: "edit",
			onClick: handleEdit,
			disabled: !isAnAdmin,
			label: t("ui.data_grid.edit"),
			startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
		},
		{
			key: "delete",
			onClick: () => openConfirmation("deletion"),
			disabled: !isAnAdmin,
			label: t("ui.data_grid.delete_entity", {
				entity: t("libraries.library").toLowerCase(),
			}),
			startIcon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
		},
	];

	const editModeActions = [
		<Button
			key="save"
			startIcon={<Save />}
			onClick={handleSave}
			disabled={hasValidationError || !isDirty}
		>
			{t("ui.data_grid.save")}
		</Button>,
		<Button key="cancel" startIcon={<Cancel />} onClick={handleCancel}>
			{t("ui.data_grid.cancel")}
		</Button>,
		<MoreActionsMenu
			key="more"
			actions={[
				{
					key: "delete",
					onClick: () => openConfirmation("deletion"),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
				{
					key: "edit",
					onClick: handleEdit,
					disabled: true,
					label: t("ui.data_grid.edit"),
					startIcon: <Edit htmlColor={theme.palette.primary.exclamationIcon} />,
				},
			]}
		/>,
	];

	const pageActions = editMode ? editModeActions : viewModeActions;

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

	// These are pre-sets for the library Patron Request grids.
	const exceptionQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND status: "ERROR"`;
	const outOfSequenceQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}" AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" AND NOT status:"CANCELLED" AND NOT status:"FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:true`;
	const inProgressQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:false`;
	const finishedQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND (status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" OR status: "CANCELLED" OR status: "FINALISED" OR status:"COMPLETED")`;

	const refValuePatronTypeVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "patronType" OR fromCategory: "patronType") AND (NOT deleted:true)`;
	const refValueItemTypeVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "ItemType" OR fromCategory: "ItemType") AND (NOT deleted:true)`;
	const refValueLocationVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "Location" OR fromCategory: "Location") AND (NOT deleted:true)`;

	const numericRangePatronTypeVariables = `context:${library?.agency?.hostLms?.code} AND domain: "patronType" AND (NOT deleted:true)`;
	const numericRangeItemTypeVariables = `context:${library?.agency?.hostLms?.code} AND domain: "ItemType" AND (NOT deleted:true)`;

	// Add ones for second Host LMS here.
	const refValuePatronTypeSecondHostLmsVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "patronType" OR fromCategory: "patronType") AND (NOT deleted:true)`;
	const refValueItemTypeSecondHostLmsVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "ItemType" OR fromCategory: "ItemType") AND (NOT deleted:true)`;
	const refValueLocationForLibrarySecondHostLmsVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "ItemType" OR fromCategory: "Location") AND (NOT deleted:true)`;

	const numericRangePatronTypeSecondHostLmsVariables = `context:"${library?.agency?.hostLms?.code}" AND domain: "patronType" AND (NOT deleted:true)`;
	const numericRangeItemTypeSecondHostLmsVariables = `context:"${library?.agency?.hostLms?.code}" AND domain: "ItemType" AND (NOT deleted:true)`;

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
			title={library?.fullName}
			pageActions={pageActions}
			mode={editMode ? "edit" : "view"}
		>
			<Stack direction="row" justifyContent="end">
				<StyledAccordionButton
					onClick={
						expandedAccordions.some((isExpanded) => !isExpanded)
							? expandAll
							: collapseAll
					}
				>
					{expandedAccordions.some((isExpanded) => !isExpanded)
						? t("details.expand")
						: t("details.collapse")}
				</StyledAccordionButton>
			</Stack>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[10]}
				onChange={handleAccordionChange(10)}
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
					<Typography variant="accordionSummary">
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
								<Typography
									variant="attributeTitle"
									color={
										errors?.["fullName"] && editMode
											? theme.palette.error.main
											: theme.palette.common.black
									}
								>
									{t("libraries.name")}
								</Typography>
								<EditableAttribute
									field="fullName"
									value={library?.fullName}
									updateField={updateField}
									editMode={editMode}
									type="string"
									inputRef={firstEditableFieldRef}
									setValidationError={setValidationError}
									setDirty={setDirty}
									setErrors={setErrors}
									key={`fullName-${editKey}`}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography
									variant="attributeTitle"
									color={
										errors?.["shortName"] && editMode
											? theme.palette.error.main
											: theme.palette.common.black
									}
								>
									{t("libraries.short_name")}
								</Typography>
								<EditableAttribute
									field="shortName"
									value={library?.shortName}
									updateField={updateField}
									editMode={editMode}
									type="string"
									setValidationError={setValidationError}
									setDirty={setDirty}
									setErrors={setErrors}
									key={`shortName-${editKey}`}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography
									variant="attributeTitle"
									color={
										errors?.["abbreviatedName"] && editMode
											? theme.palette.error.main
											: theme.palette.common.black
									}
								>
									{t("libraries.abbreviated_name")}
								</Typography>
								<EditableAttribute
									field="abbreviatedName"
									value={library?.abbreviatedName}
									updateField={updateField}
									editMode={editMode}
									type="string"
									setValidationError={setValidationError}
									setDirty={setDirty}
									setErrors={setErrors}
									key={`abbreviatedName-${editKey}`}
								/>
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
								<Typography
									variant="attributeTitle"
									color={
										errors?.["supportHours"] && editMode
											? theme.palette.error.main
											: theme.palette.common.black
									}
								>
									{t("libraries.support_hours")}
								</Typography>
								<EditableAttribute
									field="supportHours"
									value={editableFields.supportHours ?? library?.supportHours}
									updateField={updateField}
									editMode={editMode}
									type="string"
									setValidationError={setValidationError}
									setDirty={setDirty}
									setErrors={setErrors}
									key={`supportHours-${editKey}`}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography
									variant="attributeTitle"
									color={
										errors?.["backupDowntimeSchedule"] && editMode
											? theme.palette.error.main
											: theme.palette.common.black
									}
								>
									{t("libraries.service.environments.backup_schedule")}
								</Typography>
								<EditableAttribute
									field="backupDowntimeSchedule"
									value={
										editableFields.backupDowntimeSchedule ??
										library?.backupDowntimeSchedule
									}
									updateField={updateField}
									editMode={editMode}
									type="string"
									setValidationError={setValidationError}
									setDirty={setDirty}
									setErrors={setErrors}
									key={`backupDowntimeSchedule-${editKey}`}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.site_designation")}
								</Typography>
								{/* This may need special handling when we have real data and know what format it's coming in */}
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
										<Typography
											variant="attributeTitle"
											color={
												errors?.["latitude"] && editMode
													? theme.palette.error.main
													: theme.palette.common.black
											}
										>
											{t("libraries.primaryLocation.latitude")}
										</Typography>
										<EditableAttribute
											field="latitude"
											value={editableFields.latitude ?? library?.latitude}
											updateField={updateField}
											editMode={editMode}
											type="latitude"
											setValidationError={setValidationError}
											setDirty={setDirty}
											setErrors={setErrors}
											key={`latitude-${editKey}`}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography
											variant="attributeTitle"
											color={
												errors?.["longitude"] && editMode
													? theme.palette.error.main
													: theme.palette.common.black
											}
										>
											{t("libraries.primaryLocation.longitude")}
										</Typography>
										<EditableAttribute
											field="longitude"
											value={editableFields.longitude ?? library?.longitude}
											updateField={updateField}
											editMode={editMode}
											type="longitude"
											setValidationError={setValidationError}
											setDirty={setDirty}
											setErrors={setErrors}
											key={`longitude-${editKey}`}
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
				expanded={expandedAccordions[11]}
				onChange={handleAccordionChange(11)}
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
					<Typography variant="accordionSummary">
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
								editable: true,
								flex: 0.5,
							},
							{
								field: "name",
								headerName: t("libraries.contacts.name"),
								minWidth: 50,
								editable: true,
								flex: 0.7,
								valueGetter: (value: string, row: Person) => {
									return `${row.firstName} ${row.lastName}`.trim();
								},
								valueSetter: (value: string, row: Person) => {
									// if we can remove regex would be better
									const [firstName, ...rest] = value.trim().split(/\s+/); // Split by any whitespace
									const lastName = rest.join(" "); // Join the remaining parts as the last name
									return { ...row, firstName, lastName };
								},
							},
							{
								field: "email",
								headerName: t("libraries.contacts.email"),
								minWidth: 50,
								editable: true,
								flex: 0.7,
							},
							{
								field: "isPrimaryContact",
								headerName: t("libraries.contacts.primary"),
								minWidth: 50,
								editable: true,
								flex: 0.3,
							},
						]}
						data={library?.contacts}
						type="contact"
						// No need for click through on this grid - fix translation keys
						selectable={false}
						sortModel={[{ field: "isPrimaryContact", sort: "desc" }]}
						noDataTitle={"No contacts found for this library."}
						toolbarVisible="search-only"
						disableHoverInteractions={true}
						editQuery={updatePerson}
					></ClientDataGrid>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
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
					<Typography variant="accordionSummary">
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
						<LibraryHostLmsDetails
							library={library}
							firstHostLms={library?.agency?.hostLms}
							secondHostLms={library?.secondHostLms}
						/>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
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
					<Typography variant="accordionSummary">
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
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[17]}
						onChange={handleAccordionChange(17)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-itemType"
							id="library-configuration-itemType"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.data.mappings.item_type")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.ref_value_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getMappings}
								presetQueryVariables={refValueItemTypeVariables}
								type="referenceValueMappingsForLibrary"
								coreType="referenceValueMappings"
								columns={refValueMappingColumnsNoCategoryFilter}
								noDataMessage={t("mappings.import_no_data")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								// This is how to set the default sort order
								sortModel={[{ field: "fromContext", sort: "asc" }]}
								sortDirection="ASC"
								sortAttribute="fromContext"
								pageSize={20}
								columnVisibilityModel={{
									fromCategory: false,
									last_imported: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.ref_value_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getMappings}
									presetQueryVariables={refValueItemTypeSecondHostLmsVariables}
									type="referenceValueMappingsForLibrary"
									coreType="referenceValueMappings"
									columns={refValueMappingColumnsNoCategoryFilter}
									noDataMessage={t("mappings.import_no_data")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									// This is how to set the default sort order
									sortModel={[{ field: "fromContext", sort: "asc" }]}
									sortDirection="ASC"
									sortAttribute="fromContext"
									pageSize={20}
									columnVisibilityModel={{
										fromCategory: false,
										last_imported: false,
									}}
								/>
							) : null}
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.numeric_range_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getNumericRangeMappings}
								presetQueryVariables={numericRangeItemTypeVariables}
								type="numericRangeMappingsForLibrary"
								coreType="numericRangeMappings"
								columns={numRangeMappingColumnsNoCategoryFilter}
								noDataMessage={t("mappings.no_results")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								sortModel={[{ field: "context", sort: "asc" }]}
								pageSize={20}
								sortDirection="ASC"
								sortAttribute="context"
								columnVisibilityModel={{
									domain: false,
									last_imported: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.numeric_range_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getNumericRangeMappings}
									presetQueryVariables={
										numericRangeItemTypeSecondHostLmsVariables
									}
									type="numericRangeMappingsForLibrary"
									coreType="numericRangeMappings"
									columns={numRangeMappingColumnsNoCategoryFilter}
									noDataMessage={t("mappings.no_results")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									sortModel={[{ field: "context", sort: "asc" }]}
									pageSize={20}
									sortDirection="ASC"
									sortAttribute="context"
									columnVisibilityModel={{
										domain: false,
										last_imported: false,
									}}
								/>
							) : null}
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[18]}
						onChange={handleAccordionChange(18)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-location"
							id="library-configuration-location"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.data.mappings.location")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.ref_value_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getMappings}
								presetQueryVariables={refValueLocationVariables}
								type="referenceValueMappingsForLibrary"
								coreType="referenceValueMappings"
								columns={refValueMappingColumnsNoCategoryFilter}
								noDataMessage={t("mappings.import_no_data")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								// This is how to set the default sort order
								sortModel={[{ field: "fromContext", sort: "asc" }]}
								sortDirection="ASC"
								sortAttribute="fromContext"
								pageSize={20}
								columnVisibilityModel={{
									fromCategory: false,
									last_imported: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.ref_value_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getMappings}
									presetQueryVariables={
										refValueLocationForLibrarySecondHostLmsVariables
									}
									type="referenceValueMappingsForLibrary"
									coreType="referenceValueMappings"
									columns={refValueMappingColumnsNoCategoryFilter}
									noDataMessage={t("mappings.import_no_data")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									// This is how to set the default sort order
									sortModel={[{ field: "fromContext", sort: "asc" }]}
									sortDirection="ASC"
									sortAttribute="fromContext"
									pageSize={20}
									columnVisibilityModel={{
										fromCategory: false,
										last_imported: false,
									}}
								/>
							) : null}
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[16]}
						onChange={handleAccordionChange(16)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-patronTypes"
							id="library-configuration-patronTypes"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.data.mappings.patron_type")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.ref_value_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getMappings}
								presetQueryVariables={refValuePatronTypeVariables}
								type="referenceValueMappingsForLibrary"
								coreType="referenceValueMappings"
								columns={refValueMappingColumnsNoCategoryFilter}
								noDataMessage={t("mappings.import_no_data")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								// This is how to set the default sort order
								sortModel={[{ field: "fromContext", sort: "asc" }]}
								sortDirection="ASC"
								sortAttribute="fromContext"
								pageSize={20}
								columnVisibilityModel={{
									fromCategory: false,
									last_imported: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.ref_value_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getMappings}
									presetQueryVariables={
										refValuePatronTypeSecondHostLmsVariables
									}
									type="referenceValueMappingsForLibrary"
									coreType="referenceValueMappings"
									columns={refValueMappingColumnsNoCategoryFilter}
									noDataMessage={t("mappings.import_no_data")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									// This is how to set the default sort order
									sortModel={[{ field: "fromContext", sort: "asc" }]}
									sortDirection="ASC"
									sortAttribute="fromContext"
									pageSize={20}
									columnVisibilityModel={{
										fromCategory: false,
										last_imported: false,
									}}
								/>
							) : null}
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.numeric_range_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getNumericRangeMappings}
								presetQueryVariables={numericRangePatronTypeVariables}
								type="numericRangeMappingsForLibrary"
								coreType="numericRangeMappings"
								columns={numRangeMappingColumnsNoCategoryFilter}
								noDataMessage={t("mappings.no_results")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								sortModel={[{ field: "context", sort: "asc" }]}
								pageSize={20}
								sortDirection="ASC"
								sortAttribute="context"
								columnVisibilityModel={{
									domain: false,
									last_imported: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.numeric_range_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getNumericRangeMappings}
									presetQueryVariables={
										numericRangePatronTypeSecondHostLmsVariables
									}
									type="numericRangeMappingsForLibrary"
									coreType="numericRangeMappings"
									columns={numRangeMappingColumnsNoCategoryFilter}
									noDataMessage={t("mappings.no_results")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									sortModel={[{ field: "context", sort: "asc" }]}
									pageSize={20}
									sortDirection="ASC"
									sortAttribute="context"
									columnVisibilityModel={{
										domain: false,
										last_imported: false,
									}}
								/>
							) : null}
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			{library?.agency ? (
				<StyledAccordion
					variant="outlined"
					expanded={expandedAccordions[15]}
					onChange={handleAccordionChange(15)}
					disableGutters
				>
					<StyledAccordionSummary
						aria-controls="library-circulation-details"
						id="library-circulation-details"
						expandIcon={
							<IconContext.Provider value={{ size: "2em" }}>
								<MdExpandMore />
							</IconContext.Provider>
						}
					>
						<Typography variant="accordionSummary">
							{t("libraries.circulation.title")}
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
										{t("libraries.circulation.supplying_status")}
									</Typography>
									{library?.agency?.isSupplyingAgency
										? t("libraries.circulation.enabled_supply")
										: library?.agency?.isSupplyingAgency == false
											? t("libraries.circulation.disabled_supply")
											: t("libraries.circulation.not_set")}
								</Stack>
								<Button
									onClick={() => openConfirmation("supplying")}
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
									onClick={() => openConfirmation("borrowing")}
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
					</StyledAccordionDetails>
				</StyledAccordion>
			) : null}
			{library?.agency?.hostLms?.code ? (
				<StyledAccordion
					variant="outlined"
					expanded={expandedAccordions[0]}
					onChange={handleAccordionChange(0)}
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
						<Typography variant="accordionSummary">
							{t("nav.patronRequests")}
						</Typography>
					</StyledAccordionSummary>
					<StyledAccordionDetails>
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[1]}
							onChange={handleAccordionChange(1)}
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
										...customColumns,
										...patronRequestColumnsNoStatusFilter,
									]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_error_message",
									)}
									columnVisibilityModel={{
										...defaultPatronRequestLibraryColumnVisibility,
										...exceptionPatronRequestColumnVisibility,
									}}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
									getDetailPanelContent={({ row }: any) => (
										<MasterDetail row={row} type="patronRequests" />
									)}
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
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_status",
									)}
									columnVisibilityModel={
										defaultPatronRequestLibraryColumnVisibility
									}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
									getDetailPanelContent={({ row }: any) => (
										<MasterDetail row={row} type="patronRequests" />
									)}
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
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_status",
									)}
									columnVisibilityModel={
										defaultPatronRequestLibraryColumnVisibility
									}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
									getDetailPanelContent={({ row }: any) => (
										<MasterDetail row={row} type="patronRequests" />
									)}
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
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_status",
									)}
									columnVisibilityModel={{
										...defaultPatronRequestLibraryColumnVisibility,
										...finishedPatronRequestColumnVisibility,
									}}
									scrollbarVisible={true}
									// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									sortDirection="DESC"
									sortAttribute="dateCreated"
									onTotalSizeChange={handleTotalSizeChange}
									getDetailPanelContent={({ row }: any) => (
										<MasterDetail row={row} type="patronRequests" />
									)}
								/>
							</SubAccordionDetails>
						</SubAccordion>
					</StyledAccordionDetails>
				</StyledAccordion>
			) : null}
			<Box>
				{showConfirmationBorrowing ? (
					<Confirmation
						open={showConfirmationBorrowing}
						onClose={() => closeConfirmation("borrowing")}
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
						library={library?.shortName}
						code={library?.agency?.code}
					/>
				) : null}
				{showConfirmationSupplying ? (
					<Confirmation
						open={showConfirmationSupplying}
						onClose={() => closeConfirmation("supplying")}
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
						participation={
							library?.agency?.isSupplyingAgency
								? "disableSupplying"
								: "enableSupplying"
						}
						library={library?.fullName}
						code={library?.agency?.code}
					/>
				) : null}
			</Box>
			{/* // One alert for all things */}
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
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					handleDeleteEntity(
						library.id,
						reason,
						changeCategory,
						changeReferenceUrl,
					);
					setConfirmationDeletion(false);
				}}
				type={"deletelibraries"}
				library={library?.fullName}
				entity={t("libraries.library")}
			/>
			<Confirmation
				open={showConfirmationEdit}
				onClose={() => setConfirmationEdit(false)}
				onConfirm={handleConfirmSave}
				type="pageEdit"
				editInformation={formatChangedFields(changedFields, library)}
				library={library?.fullName}
				entity={t("libraries.library")}
			/>
			<Confirmation
				open={showUnsavedChangesModal}
				onClose={handleKeepEditing}
				onConfirm={handleLeaveWithoutSaving}
				type="unsavedChanges"
				library={library?.fullName}
				entity={t("libraries.library")}
				entityId={library?.id}
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
	const libraryId = ctx.params.libraryId;
	return {
		props: {
			libraryId,
			...translations,
		},
	};
}
