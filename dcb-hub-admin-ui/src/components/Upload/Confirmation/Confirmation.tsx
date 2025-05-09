// A modal to confirm or cancel file uploads. Originally built for Circulation status mappings.
import { useLazyQuery } from "@apollo/client";
import Alert from "@components/Alert/Alert";
import ChangesSummary from "@components/ChangesSummary/ChangesSummary";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Divider,
	TextField,
	Stack,
	Autocomplete,
	CircularProgress,
} from "@mui/material";
import { isEmpty } from "lodash";
import { Trans, useTranslation } from "next-i18next";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	locationPatronRequestColumnVisibility,
	standardPatronRequestColumns,
} from "src/helpers/DataGrid/columns";
import { getEntityText } from "src/helpers/DataGrid/getEntityText";
import {
	getConfirmationFirstPara,
	getConfirmationHeader,
	getConfirmationSecondPara,
} from "src/helpers/getConfirmationText";
import { getPatronRequests } from "src/queries/queries";
import * as Yup from "yup";

type ConfirmType = {
	open: boolean;
	onClose: any;
	onConfirm: (
		reason: string,
		changeReferenceUrl: string,
		changeCategory: string,
	) => void; // Updated to accept a reason
	existingMappingCount?: number;
	code?: string;
	type: string;
	fileName?: string;
	participation?: string;
	entityName?: string;
	mappingCategory?: string;
	mappingType?: string;
	editInformation?: any;
	actionInfo?: string;
	entity: string;
	entityId?: string;
	headerText?: string;
	buttonText?: string;
	bodyText?: string;
	gridEdit: boolean;
	libraryName?: string;
};

type ConfirmationData = {
	reason: string;
	changeCategory: string;
	changeReferenceUrl?: string;
};

const Confirmation = ({
	open,
	onClose,
	onConfirm,
	code,
	type,
	existingMappingCount,
	fileName,
	participation,
	entityName,
	mappingCategory,
	mappingType,
	editInformation,
	entity,
	entityId,
	headerText,
	buttonText,
	bodyText,
	gridEdit,
	libraryName,
}: ConfirmType) => {
	const { t } = useTranslation();
	const validationSchema = useMemo(
		() =>
			Yup.object({
				reason: Yup.string()
					.required(t("data_change_log.reason_required"))
					.max(200, t("data_change_log.max_length_exceeded")),
				changeCategory: Yup.string()
					.required(t("data_change_log.category_required"))
					.max(200, t("data_change_log.max_length_exceeded")),
				changeReferenceUrl: Yup.string()
					.url(t("ui.data_grid.edit_url"))
					.typeError(t("ui.data_grid.edit_url"))
					.max(200, t("data_change_log.max_length_exceeded")),
			}),
		[t],
	);
	const getCharCountHelperText = (
		value: string,
		maxLength: number,
		baseHelperText: string,
	) => {
		const remainingChars = maxLength - value.length;
		if (remainingChars <= 0) {
			return t("data_change_log.max_length_exceeded", { maxLength });
		}
		if (remainingChars <= 20) {
			return `${baseHelperText} (${t("data_change_log.characters_remaining", { characters: remainingChars })})`;
		}
		return baseHelperText;
	};

	const [
		fetchLocationPatronRequests,
		{ loading: locationPatronRequestsLoading, data: locationPatronRequests },
	] = useLazyQuery(getPatronRequests);

	useEffect(() => {
		if (open && type === "deletelocations" && entityId) {
			fetchLocationPatronRequests({
				variables: {
					query: `pickupLocationCode: ${entityId}`,
					pagesize: 200,
					pageno: 0,
					order: "dateUpdated",
					orderBy: "DESC",
				},
			});
		}
	}, [open, type, entityId, fetchLocationPatronRequests]);

	const doPatronRequestsExist = !isEmpty(
		locationPatronRequests?.patronRequests?.content,
	);

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty, isSubmitting },
	} = useForm<ConfirmationData>({
		defaultValues: {
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const mappingExportLink =
		mappingType == "Reference value mappings"
			? "/mappings/allReferenceValue"
			: "/mappings/allNumericRange";

	// May need library ID/specific info to personalise this
	const locationExportLink = "/locations";

	const getHeaderText = () => {
		switch (type) {
			case "gridEdit":
			case "pageEdit":
				return t("ui.data_grid.edit_summary", {
					entity: gridEdit
						? t(getEntityText(entity, entityName, gridEdit)).toLowerCase()
						: entityName,
				});
			case "mappings":
				return t("mappings.confirmation_header", {
					category:
						mappingCategory == "all"
							? mappingType?.toLowerCase()
							: mappingCategory + " " + mappingType?.toLowerCase(),
				});
			case "locations":
				return t("locations.import.header", { library: libraryName });
			case "deletePerson":
			case "deleteLibraryContact":
			case "deleteConsortiumContact":
				return t("ui.data_grid.delete_header", {
					entity: t("ui.info.contact"),
					name: entityName,
				});
			case "deletelibraries":
				return t("ui.data_grid.delete_header", {
					entity: !entityName ? entity?.toLowerCase() : "",
					name: entityName,
				});
			case "deletelocations":
				return t("ui.data_grid.delete_header", {
					entity: !entityName ? entity?.toLowerCase() : "",
					name: entityName,
				});
			case "deletereferenceValueMappings":
				return t("ui.data_grid.delete_header", {
					entity: t("mappings.ref_value_one").toLowerCase(),
					name: "",
				});
			case "deletenumericRangeMappings":
				return t("ui.data_grid.delete_header", {
					entity: t("mappings.num_range_one").toLowerCase(),
					name: "",
				});
			case "participationStatus":
				return t(getConfirmationHeader(participation ?? ""), {
					library: entityName,
				});
			case "unsavedChanges":
				return t("ui.unsaved_changes.header");
			case "pickup":
				if (participation == "disablePickup") {
					return t("details.location_pickup_disabled_confirmation_header", {
						location: entityName,
					});
				} else {
					return t("details.location_pickup_enabled_confirmation_header", {
						location: entityName,
					});
				}
			case "functionalSettings":
				return headerText;
			default:
				return null;
		}
	};
	const getDialogContent = () => {
		switch (type) {
			case "deletelibraries":
				return (
					<Box>
						<Typography variant="body1">
							{t("ui.data_grid.delete_body_library")}
						</Typography>
					</Box>
				);
			case "deletelocations":
				return (
					<Box sx={{ flexGrow: 1, minHeight: 0 }}>
						{locationPatronRequestsLoading ? (
							<CircularProgress />
						) : doPatronRequestsExist ? (
							<>
								<Typography variant="body1">
									{t("ui.data_grid.delete_location_with_requests")}
								</Typography>
								<ClientDataGrid
									coreType="PatronRequest"
									type="patronRequestsForLocation"
									columns={standardPatronRequestColumns}
									columnVisibilityModel={locationPatronRequestColumnVisibility}
									data={locationPatronRequests.patronRequests.content}
									selectable={false}
									toolbarVisible="search-columns"
									sortModel={[{ field: "dateCreated", sort: "desc" }]}
									operationDataType="PatronRequest"
									disableAggregation={true}
									disableRowGrouping={true}
								/>
							</>
						) : null}
						{!doPatronRequestsExist && !locationPatronRequestsLoading ? (
							<Typography variant="body1">
								{t("ui.data_grid.delete_body", {
									entity: t("locations.location_one").toLowerCase(),
									name: "",
								})}
							</Typography>
						) : null}
					</Box>
				);
			case "gridEdit":
			case "pageEdit":
				return (
					<Box>
						<ChangesSummary
							changes={editInformation}
							action="UPDATE"
							context="edit"
						/>
					</Box>
				);
			case "locations":
				return (
					<Stack spacing={2}>
						<Trans
							i18nKey="locations.import.confirmation_body"
							values={{
								existingMappingCount,
								libraryName,
								fileName,
							}}
							components={{ paragraph: <p />, bold: <strong /> }}
						/>
						<Alert
							closeButtonShown={false}
							severityType="warning"
							alertText={
								<Trans
									i18nKey={"locations.import.confirmation_warning"}
									values={{ type: mappingType?.toLowerCase() }}
									components={{
										linkComponent: (
											<Link
												key="grid-export-link"
												href={locationExportLink}
												target="_blank"
												rel="noopener noreferrer"
											/>
										),
										paragraph: <p />,
									}}
								/>
							}
						/>
						<Typography>
							{t("locations.import.confirmation_replace")}
						</Typography>
					</Stack>
				);
			case "mappings":
				return (
					<Stack spacing={2}>
						<Trans
							i18nKey="mappings.confirmation_body"
							values={{
								category:
									mappingCategory == "all"
										? mappingType?.toLowerCase()
										: mappingCategory + " " + mappingType?.toLowerCase(),
								existingMappingCount,
								code,
								fileName,
							}}
							components={{ paragraph: <p />, bold: <strong /> }}
						/>
						<Alert
							closeButtonShown={false}
							severityType="warning"
							alertText={
								<Trans
									i18nKey={"mappings.confirmation_warning"}
									values={{ type: mappingType?.toLowerCase() }}
									components={{
										linkComponent: (
											<Link
												key="grid-export-link"
												href={mappingExportLink}
												target="_blank"
												rel="noopener noreferrer"
											/>
										),
										paragraph: <p />,
									}}
								/>
							}
						/>
						<Typography>{t("mappings.confirmation_replace")}</Typography>
					</Stack>
				);
			case "participationStatus":
				return (
					<Box>
						<Typography component={"p"} mb={1}>
							<Trans
								i18nKey={getConfirmationFirstPara(participation ?? "")}
								values={{ library: entityName }}
								components={{ bold: <strong /> }}
							/>
							<Typography mt={1}>
								{t(getConfirmationSecondPara(participation ?? ""))}
							</Typography>
						</Typography>
					</Box>
				);
			case "unsavedChanges":
				return (
					<Stack spacing={2}>
						<Typography variant="body1">
							{t("ui.unsaved_changes.body", { entity: entity?.toLowerCase() })}
						</Typography>
					</Stack>
				);
			case "pickup":
				if (participation == "disablePickup") {
					return (
						<Box>
							<Typography variant="body1">
								{t("details.location_pickup_disabled_confirmation_body", {
									location: entityName,
								})}
							</Typography>
						</Box>
					);
				} else {
					return (
						<Box>
							<Typography variant="body1">
								{t("details.location_pickup_enabled_confirmation_body", {
									location: entityName,
								})}
							</Typography>
						</Box>
					);
				}
			case "functionalSettings":
				return (
					<Box>
						<Typography variant="body1">{bodyText}</Typography>
					</Box>
				);
			default:
				return null;
		}
	};

	const getButtonText = () => {
		switch (type) {
			case "gridEdit":
			case "pageEdit":
				return t("ui.data_grid.confirm_changes");
			case "mappings":
				return t("mappings.confirmation_replace_mappings");
			case "locations":
				return t("locations.import.replace");
			case "deletePerson":
			case "deleteLibraryContact":
			case "deleteConsortiumContact":
				return t("ui.data_grid.delete_entity", {
					entity: t("ui.info.contact").toLowerCase(),
				});
			case "deletelibraries":
				return t("ui.data_grid.delete_entity", {
					entity: t("libraries.library").toLowerCase(),
				});
			case "deletelocations":
				return t("ui.data_grid.delete_entity", {
					entity: t("locations.location_one").toLowerCase(),
				});
			case "deletereferenceValueMappings":
				return t("ui.data_grid.delete_entity", {
					entity: t("mappings.ref_value_one").toLowerCase(),
				});
			case "deletenumericRangeMappings":
				return t("ui.data_grid.delete_entity", {
					entity: t("mappings.num_range_one").toLowerCase(),
				});
			case "participationStatus":
				switch (participation) {
					// Fill these out with the relevant text, buttons etc
					case "enableSupplying":
						return t("libraries.circulation.confirmation.enable_supplying");
					case "disableSupplying":
						return t("libraries.circulation.confirmation.disable_supplying");
					case "enableBorrowing":
						return t("libraries.circulation.confirmation.enable_borrowing");
					case "disableBorrowing":
						return t("libraries.circulation.confirmation.disable_borrowing");
					default:
						return null;
				}
			case "unsavedChanges":
				return t("ui.unsaved_changes.leave_without_saving");
			case "pickup":
				if (participation == "disablePickup") {
					return t("details.location_pickup_disable");
				} else {
					return t("details.location_pickup_enable");
				}
			case "functionalSettings":
				return buttonText;
			default:
				return null;
		}
	};

	const onSubmit = async (data: ConfirmationData) => {
		onConfirm(data.reason, data.changeCategory, data.changeReferenceUrl ?? "");
		reset();
	};
	const handleClose = () => {
		reset();
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			aria-labelledby="confirmation-modal"
			fullWidth
		>
			{/* // Enforcing the style of bold, centered modal or dialog headers */}
			<DialogTitle variant="modalTitle">{getHeaderText()}</DialogTitle>
			<Divider aria-hidden="true"></Divider>
			<DialogContent>
				<Box
					component="form"
					onSubmit={handleSubmit(onSubmit)}
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
						mt: 2,
					}}
				>
					<Stack direction="column" spacing={2}>
						{getDialogContent()}
						{type !== "unsavedChanges" ? (
							<>
								<Controller
									name="changeCategory"
									control={control}
									render={({ field }) => (
										<Autocomplete
											{...field}
											options={[
												t("data_change_log.categories.error_correction"),
												t("data_change_log.categories.details_changed"),
												t("data_change_log.categories.new_member"),
												t("data_change_log.categories.membership_ended"),
												t("data_change_log.categories.additional_information"),
												t("data_change_log.categories.changing_status"),
												t("data_change_log.categories.initial_setup"),
												t("data_change_log.categories.mappings_replacement"),
												t("data_change_log.categories.other"),
											]}
											value={field.value || null}
											onChange={(_, newValue) => field.onChange(newValue)}
											disabled={doPatronRequestsExist}
											renderInput={(params) => (
												<TextField
													{...params}
													required
													label={t("data_change_log.category")}
													error={!!errors.changeCategory}
													helperText={errors.changeCategory?.message}
												/>
											)}
											isOptionEqualToValue={(option, value) =>
												option === value || (!option && !value)
											}
										/>
									)}
								/>
								<Controller
									name="reason"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											required
											multiline
											variant="outlined"
											label={t("data_change_log.reason")}
											margin="normal"
											disabled={doPatronRequestsExist}
											error={!!errors.reason}
											helperText={errors.reason?.message}
											inputProps={{ maxLength: 200 }}
										/>
									)}
								/>

								<Controller
									name="changeReferenceUrl"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											variant="outlined"
											label={t("data_change_log.reference_url")}
											margin="normal"
											disabled={doPatronRequestsExist}
											error={!!errors.changeReferenceUrl}
											helperText={
												errors.changeReferenceUrl?.message ||
												getCharCountHelperText(
													field.value ?? "",
													200,
													t("data_change_log.ref_url_helper"),
												)
											}
											inputProps={{ maxLength: 200 }}
										/>
									)}
								/>
							</>
						) : null}
					</Stack>
				</Box>
				<DialogActions>
					<Button onClick={handleClose} variant="outlined" color="primary">
						{type == "unsavedChanges"
							? t("ui.unsaved_changes.keep_editing")
							: t("mappings.cancel")}
					</Button>
					<div style={{ flex: "1 0 0" }} />
					{type == "unsavedChanges" ? (
						<Button
							onClick={() => {
								onConfirm("", "", "");
								reset();
							}}
							color="primary"
							variant="contained"
						>
							{getButtonText()}
						</Button>
					) : (
						<Button
							type="submit"
							color="primary"
							variant="contained"
							onClick={handleSubmit(onSubmit)}
							disabled={
								!isValid ||
								!isDirty ||
								// !values.reason ||
								// !values.changeCategory ||
								isSubmitting ||
								doPatronRequestsExist
							}
						>
							{getButtonText()}
							{isSubmitting ? (
								<CircularProgress
									color="inherit"
									size={13}
									sx={{ marginLeft: "10px" }}
								/>
							) : null}
						</Button>
					)}
				</DialogActions>
			</DialogContent>
		</Dialog>
	);
};
export default Confirmation;
