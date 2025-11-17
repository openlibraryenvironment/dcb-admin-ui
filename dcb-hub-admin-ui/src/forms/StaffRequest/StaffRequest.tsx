import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLazyQuery, useQuery } from "@apollo/client";
import * as Yup from "yup";
import {
	Autocomplete,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	IconButton,
	Radio,
	RadioGroup,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { Close } from "@mui/icons-material";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { getLibraries, getLocations } from "src/queries/queries";
import axios from "axios";
import getConfig from "next/config";
import { useSession } from "next-auth/react";
import Link from "@components/Link/Link";
import { getRequestError } from "src/helpers/getRequestError";
import { Agency } from "@models/Agency";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import { findConsortium } from "src/helpers/findConsortium";
import { Location } from "@models/Location";
import { isEmpty } from "lodash";
import { Item } from "@models/Item";
import { PatronRequestFormType } from "@models/PatronRequestFormType";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { PatronLookupResponse } from "@models/PatronLookupResponse";
import { PlaceRequestResponse } from "@models/PlaceRequestResponse";
import { StaffRequestFormData } from "@models/StaffRequestFormData";

// WHEN WE INTRODUCE DCB ADMIN FOR LIBRARIES THIS DROP DOWN FOR LIBRARIES MUST BE RESTRICTED TO ONLY THE LIBRARY THE USER IS MANAGING

export default function StaffRequest({
	show,
	onClose,
	bibClusterId,
}: PatronRequestFormType) {
	const { t } = useTranslation();
	const { data: session } = useSession();

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
		patronRequestLink?: string;
	}>({
		open: false,
		severity: "success",
		text: null,
		patronRequestLink: "",
	});

	const { publicRuntimeConfig } = getConfig();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isValidatingPatron, setIsValidatingPatron] = useState(false);
	const [patronValidated, setPatronValidated] = useState(false);
	const [patronData, setPatronData] = useState<PatronLookupResponse | null>(
		null,
	);
	const [availabilityResults, setAvailabilityResults] = useState<any>({});
	const [itemsLoading, setItemsLoading] = useState(false);
	const [itemsError, setItemsError] = useState(false);

	const validationSchema = Yup.object().shape({
		patronBarcode: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("staff_request.patron.barcode").toLowerCase(),
				}),
			)
			.test(
				"no-square-brackets",
				t("staff_request.patron.error.no_brackets"),
				(value) =>
					value ? !value.includes("[") && !value.includes("]") : true,
			),
		agencyCode: Yup.string().required(
			t("ui.validation.required", {
				field: t("details.agency_code").toLowerCase(),
			}),
		),
		pickupLocationId: Yup.string().required(
			t("ui.validation.required", {
				field: t("staff_request.patron.pickup_location").toLowerCase(),
			}),
		),
		requesterNote: Yup.string(),
		selectionType: Yup.string().required(
			t("ui.validation.required", {
				field: t("staff_request.patron.selection.type").toLowerCase(),
			}),
		),
		itemLocalId: Yup.string().when("selectionType", {
			is: "manual",
			then: (schema) =>
				schema.required(
					t("ui.validation.required", {
						field: t("staff_request.patron.item_local_id").toLowerCase(),
					}),
				),
			otherwise: (schema) => schema.notRequired(),
		}),
		itemAgencyCode: Yup.string().when("selectionType", {
			is: "manual",
			then: (schema) =>
				schema.required(
					t("ui.validation.required", {
						field: t("staff_request.patron.item_library").toLowerCase(),
					}),
				),
			otherwise: (schema) => schema.notRequired(),
		}),
	});

	const {
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors, isValid },
	} = useForm<StaffRequestFormData>({
		defaultValues: {
			patronBarcode: "",
			agencyCode: "",
			pickupLocationId: "",
			requesterNote: "Staff Request: ",
			selectionType: "automatic",
			itemLocalId: "",
			itemLocalSystemCode: "",
			itemAgencyCode: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});
	const selectionType = watch("selectionType");
	const agencyCode = watch("agencyCode");
	const itemAgencyCode = watch("itemAgencyCode");

	const { data: libraries, loading: librariesLoading } = useQuery(
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
	const libraryOptions: PatronRequestAutocompleteOption[] =
		libraries?.libraries?.content?.map(
			(item: {
				fullName: string;
				id: string;
				agencyCode: string;
				agency: Agency;
				membership: [LibraryGroupMember];
			}) => ({
				label: item.fullName,
				value: item.agencyCode,
				id: item.id,
				agencyId: item.agency?.id,
				functionalSettings: findConsortium(item?.membership)
					?.functionalSettings,
			}),
		) || [];

	const selectedLibrary = libraryOptions.find(
		(option) => option.value === agencyCode,
	);
	const isPickupAnywhere = !!selectedLibrary?.functionalSettings?.some(
		(setting) => setting.name === "PICKUP_ANYWHERE" && setting.enabled === true,
		// If the setting PICKUP_ANYWHERE is present and enabled, show all locations.
		// Otherwise limit to patron agency locations
	);

	const locationQuery = isPickupAnywhere
		? ""
		: "agency:" + selectedLibrary?.agencyId;

	const [
		getPickupLocations,
		{ loading: pickupLocationsLoading, data: pickupLocations },
	] = useLazyQuery(getLocations, {
		onCompleted: (data) => {
			console.log(
				"Pickup anywhere was " +
					isPickupAnywhere +
					" and " +
					data?.locations?.totalSize +
					" locations were returned.",
			);
		},

		variables: {
			order: "agency",
			orderBy: "DESC",
			pageno: 0,
			pagesize: 1000,
			query: locationQuery,
		},
	});

	const [
		getItemLibraryData,
		{ loading: itemLibraryLoading, data: itemLibraryData },
	] = useLazyQuery(getLibraries, {
		variables: {
			order: "fullName",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1000,
			query: "",
		},
	});

	// Should only be triggered after "Item library" selected
	const fetchRecords = async () => {
		setItemsLoading(true);
		try {
			const response = await axios.get<any[]>(
				`${publicRuntimeConfig.DCB_API_BASE}/items/availability`,
				{
					headers: { Authorization: `Bearer ${session?.accessToken}` },
					params: {
						clusteredBibId: bibClusterId,
					},
				},
			);
			setItemsLoading(false);

			setAvailabilityResults(response.data);
		} catch (error) {
			console.error("Error:", error);
			setItemsLoading(false);
			setItemsError(true);
		}
	};

	const itemsData: Item[] = availabilityResults?.itemList || [];
	// filter on agency code - from user selected library
	const filteredItems = itemsData.filter(
		(item) =>
			item.agency.code === itemAgencyCode &&
			item.isRequestable &&
			!item.isSuppressed,
	);

	const pickupLocationOptions: PatronRequestAutocompleteOption[] =
		pickupLocations?.locations?.content?.map(
			(item: { name: string; id: string; code: string; agency: Agency }) => ({
				label: item.name,
				value: item.id,
				code: item.code,
				agencyName: item.agency.name,
			}),
		) || [];

	const sortedPickupLocationOptions = useMemo(() => {
		if (!pickupLocations?.locations?.content) {
			return [];
		}
		const options = pickupLocations?.locations?.content.map(
			(item: {
				name: string;
				id: string;
				agency: { name: string; code: string };
			}) => ({
				label: item.name,
				value: item.id,
				agencyName:
					item?.agency?.name ??
					t("staff_request.patron.pickup_location_no_agency"),
				agencyCode: item?.agency?.code,
			}),
		);

		// Sort the array of options
		return options.sort((a: any, b: any) => {
			const isAUserAgency = a.agencyCode === agencyCode;
			const isBUserAgency = b.agencyCode === agencyCode;

			// #1: The user's selected agency locations always come first.
			if (isAUserAgency && !isBUserAgency) return -1;
			if (!isAUserAgency && isBUserAgency) return 1;

			// #2: For all other locations (or within the user's agency group),
			// sort the groups alphabetically by agency name.
			if (a.agencyName && b.agencyName && a.agencyName !== b.agencyName) {
				return a.agencyName.localeCompare(b.agencyName);
			}

			// #3: Within each agency group, sort locations alphabetically by name.
			return a.label.localeCompare(b.label);
		});
	}, [pickupLocations?.locations?.content, t, agencyCode]);

	const itemLibraryOptions: PatronRequestAutocompleteOption[] =
		libraries?.libraries?.content?.map(
			(item: { fullName: string; agencyCode: string; agency: Agency }) => ({
				label: item.fullName,
				value: item.agencyCode,
				hostLmsCode: item?.agency?.hostLms?.code,
			}),
		) || [];

	const itemOptions: PatronRequestAutocompleteOption[] =
		filteredItems?.map(
			(item: {
				id: string;
				agency: Agency;
				location: Location;
				barcode: string;
				callNumber: string;
				parsedVolumeStatement: string;
			}) => ({
				label: item?.parsedVolumeStatement
					? t("staff_request.patron.item_select_volume", {
							// id: item.id,
							name: item?.location.name,
							barcode: item.barcode,
							callNo: item?.callNumber,
							volumeStatement: item?.parsedVolumeStatement,
						})
					: t("staff_request.patron.item_select", {
							// id: item.id,
							name: item?.location.name,
							barcode: item.barcode,
							callNo: item?.callNumber,
						}),
				value: item.id,
			}),
		) || [];
	// Handler for validating patron
	const validatePatron = async () => {
		const patronBarcode = watch("patronBarcode");
		const agencyCode = watch("agencyCode");

		setIsValidatingPatron(true);
		const validatePatronPayload = {
			patronPrinciple: patronBarcode,
			agencyCode: agencyCode,
		};

		try {
			const response = await axios.post(
				`${publicRuntimeConfig.DCB_API_BASE}/patron/auth/lookup`,
				validatePatronPayload,
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.accessToken}`,
					},
				},
			);

			const data: PatronLookupResponse = response.data;

			if (data.status === "VALID") {
				setPatronData(data);
				setPatronValidated(true);
				setAlert({
					open: true,
					severity: "success",
					text: t("staff_request.patron.success.lookup", {
						barcode: patronBarcode,
						library: agencyCode,
					}),
				});
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("staff_request.patron.error.validation_failure"),
				});
			}
		} catch (error) {
			console.error("Error validating patron:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("staff_request.patron.error.validation_failure"),
			});
		} finally {
			setIsValidatingPatron(false);
		}
	};

	const onSubmit = async (data: StaffRequestFormData) => {
		if (!patronData || patronData.status !== "VALID") {
			setAlert({
				open: true,
				severity: "error",
				text: t("staff_request.patron.error.validate_first"),
			});
			return;
		}
		setIsSubmitting(true);

		// Only do this if VALID patron lookup
		try {
			const selectedLocation = pickupLocationOptions.find(
				(option) => option.value === data.pickupLocationId,
			);

			const requestPayload = {
				citation: {
					bibClusterId: bibClusterId,
				},
				requestor: {
					localSystemCode: patronData.systemCode,
					localId: patronData.localPatronId[0], // Possibly make a note if there were multiple of these - not sure why it has array type
					homeLibraryCode: patronData.homeLocationCode,
				},
				pickupLocation: {
					code: selectedLocation?.value || "",
				},
				description: "Staff Request" + data.requesterNote,
				requesterNote: data.requesterNote || "Staff Request",
			};
			const manualSelectionPayload = {
				citation: {
					bibClusterId: bibClusterId,
				},
				requestor: {
					localSystemCode: patronData.systemCode,
					localId: patronData.localPatronId[0],
					homeLibraryCode: patronData.homeLocationCode,
				},
				pickupLocation: {
					code: selectedLocation?.value || "",
				},
				description: "Staff Request with manual selection" + data.requesterNote,
				requesterNote: data.requesterNote || "Staff Request",
				item: {
					localId: data.itemLocalId || "", // The local ID of the specific item
					localSystemCode: data.itemLocalSystemCode || "", // The Host LMS code for the item's Host LMS
					agencyCode: data.itemAgencyCode || "", // The agency code of the item
				},
			};

			const response = await axios.post(
				`${publicRuntimeConfig.DCB_API_BASE}/patrons/requests/place`,
				selectionType == "manual" ? manualSelectionPayload : requestPayload,
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.accessToken}`,
					},
				},
			);
			const placeRequestData: PlaceRequestResponse = response.data;
			const requestId = placeRequestData.id;
			const patronRequestLink = "/patronRequests/" + requestId;
			setAlert({
				open: true,
				severity: "success",
				text: t("staff_request.patron.success.request"),
				patronRequestLink: patronRequestLink,
			});

			setTimeout(() => {
				reset();
				setPatronValidated(false);
				setPatronData(null);
				onClose();
			}, 6000);
		} catch (error: any) {
			console.error("Error submitting patron request:", error.response?.data);
			setAlert({
				open: true,
				severity: "error",
				text: t(getRequestError(error.response?.data?.failedChecks), {
					code: error?.response?.data?.failedChecks[0].code,
					description: error?.response?.data?.failedChecks[0].description,
				}),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		reset();
		setPatronValidated(false);
		setPatronData(null);
		onClose();
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={handleClose}
				aria-labelledby="patron-request-modal"
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle id="form-dialog-title" variant="modalTitle">
					{t("staff_request.new")}
				</DialogTitle>
				<IconButton
					aria-label="close"
					onClick={handleClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
						color: (theme) => theme.palette.grey[500],
					}}
				>
					<Close />
				</IconButton>
				<DialogContent>
					<Typography variant="body1">
						{patronValidated
							? t("staff_request.select_pickup")
							: t("staff_request.patron.description")}
					</Typography>
					<form onSubmit={handleSubmit(onSubmit)}>
						<Controller
							name="agencyCode"
							control={control}
							render={({ field: { onChange, value } }) => (
								<Autocomplete
									value={
										value
											? libraryOptions.find(
													(option) => option.value === value,
												) || null
											: null
									}
									onChange={(
										_,
										newValue: PatronRequestAutocompleteOption | null,
									) => {
										onChange(newValue?.value || "");
									}}
									options={libraryOptions}
									loading={librariesLoading}
									getOptionLabel={(option: PatronRequestAutocompleteOption) =>
										option.label
									}
									renderInput={(params) => (
										<TextField
											{...params}
											margin="normal"
											required
											label={t("staff_request.patron.affiliated")}
											error={!!errors.agencyCode}
											helperText={errors.agencyCode?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option.value === value.value
									}
									disabled={patronValidated}
								/>
							)}
						/>
						<Controller
							name="patronBarcode"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									margin="normal"
									required
									fullWidth
									id="patronBarcode"
									label={t("staff_request.patron.barcode")}
									error={!!errors.patronBarcode}
									helperText={errors.patronBarcode?.message}
									disabled={patronValidated}
								/>
							)}
						/>
						{!patronValidated ? (
							<Button
								color="primary"
								variant="contained"
								fullWidth
								sx={{ mt: 2 }}
								onClick={validatePatron}
								disabled={
									isValidatingPatron ||
									!watch("patronBarcode") ||
									!watch("agencyCode")
								}
							>
								{isValidatingPatron
									? t("staff_request.patron.validating")
									: t("staff_request.patron.validate")}
							</Button>
						) : (
							<>
								<Controller
									name="pickupLocationId"
									control={control}
									render={({ field: { onChange, value } }) => (
										<Autocomplete
											value={
												sortedPickupLocationOptions.find(
													(option: PatronRequestAutocompleteOption) =>
														option.value === value,
												) || null
											}
											onChange={(
												_,
												newValue: PatronRequestAutocompleteOption | null,
											) => {
												onChange(newValue?.value || "");
											}}
											options={sortedPickupLocationOptions}
											onOpen={() => {
												getPickupLocations();
											}}
											loading={pickupLocationsLoading}
											getOptionLabel={(
												option: PatronRequestAutocompleteOption,
											) => option.label}
											groupBy={(option) => option.agencyName || ""}
											renderInput={(params) => (
												<TextField
													{...params}
													margin="normal"
													required
													label={t("staff_request.patron.pickup_location")}
													error={!!errors.pickupLocationId}
													helperText={errors.pickupLocationId?.message}
												/>
											)}
											isOptionEqualToValue={(option, value) =>
												option.value === value.value
											}
										/>
									)}
								/>

								<Controller
									name="selectionType"
									control={control}
									render={({ field }) => (
										<FormControl component="fieldset" margin="normal">
											<FormLabel component="legend">
												{t("staff_request.patron.selection.type")}
											</FormLabel>
											<RadioGroup row {...field}>
												<Tooltip
													title={t(
														"staff_request.patron.selection.automatic_context",
													)}
												>
													<FormControlLabel
														value="automatic"
														control={<Radio />}
														label={t(
															"staff_request.patron.selection.automatic",
														)}
													/>
												</Tooltip>
												<Tooltip
													title={t(
														"staff_request.patron.selection.manual_context",
													)}
												>
													<FormControlLabel
														value="manual"
														control={<Radio />}
														label={t("staff_request.patron.selection.manual")}
													/>
												</Tooltip>
											</RadioGroup>
											{errors.selectionType && (
												<FormHelperText error>
													{errors.selectionType.message}
												</FormHelperText>
											)}
										</FormControl>
									)}
								/>
								{selectionType === "manual" && (
									// This should only really give you the option for libraries with items.
									// Match on agencyCode
									// To avoid the "No Items" screen, we should hit live availability on the cluster screen and disallow clicking the button
									// But put a tooltip to explain.
									// Don't disallow clicking the button IF SELECT_UNAVAILABLE_ITEMS is enabled.
									// And if SELECT_UNAVAILABLE_ITEMS is turned on, perhaps we should hit live availability with filters="none"
									<>
										<Controller
											name="itemAgencyCode"
											control={control}
											render={({ field: { onChange, value } }) => (
												<Autocomplete
													value={
														value
															? itemLibraryOptions.find(
																	(option) => option.value === value,
																) || null
															: null
													}
													onChange={(
														_,
														newValue: PatronRequestAutocompleteOption | null,
													) => {
														onChange(newValue?.value || "");
														// Set the Host LMS code ("localSystemCode") also - this now defaults only to the agency's Host LMS code.
														setValue(
															"itemLocalSystemCode",
															newValue?.hostLmsCode,
														);
													}}
													options={itemLibraryOptions}
													getOptionLabel={(
														option: PatronRequestAutocompleteOption,
													) => option.label}
													renderInput={(params) => (
														<TextField
															{...params}
															margin="normal"
															required
															fullWidth
															id="itemAgencyCode"
															label={t("staff_request.patron.item_library")}
															error={!!errors.itemAgencyCode || itemsError}
															helperText={errors.itemAgencyCode?.message}
															InputProps={{
																...params.InputProps,
																endAdornment: (
																	<>
																		{itemLibraryLoading ? (
																			<CircularProgress
																				color="inherit"
																				size={20}
																			/>
																		) : null}
																		{params.InputProps.endAdornment}
																	</>
																),
															}}
														/>
													)}
													isOptionEqualToValue={(option, value) =>
														option.value === value.value
													}
													onOpen={() => {
														if (!itemLibraryData) {
															getItemLibraryData();
														}
													}}
													loading={itemLibraryLoading}
												/>
											)}
										/>
										<Controller
											name="itemLocalId"
											control={control}
											disabled={isEmpty(itemAgencyCode)}
											render={({ field: { onChange, value } }) => (
												<Autocomplete
													value={
														value
															? itemOptions.find(
																	(option) => option.value === value,
																) || null
															: null
													}
													onChange={(
														_,
														newValue: PatronRequestAutocompleteOption | null,
													) => {
														onChange(newValue?.value || "");
													}}
													options={itemOptions}
													getOptionLabel={(
														option: PatronRequestAutocompleteOption,
													) => option.label}
													renderInput={(params) => (
														<TextField
															{...params}
															margin="normal"
															required
															disabled={isEmpty(itemAgencyCode)}
															fullWidth
															id="itemLocalId"
															label={t("staff_request.patron.item_local_id")}
															error={!!errors.itemLocalId}
															helperText={errors.itemLocalId?.message}
															InputProps={{
																...params.InputProps,
																endAdornment: (
																	<>
																		{itemsLoading ? (
																			<CircularProgress
																				color="inherit"
																				size={20}
																			/>
																		) : null}
																		{params.InputProps.endAdornment}
																	</>
																),
															}}
														/>
													)}
													isOptionEqualToValue={(option, value) =>
														option.value === value.value
													}
													onOpen={() => {
														if (isEmpty(itemsData)) {
															fetchRecords();
														}
													}}
													loading={itemsLoading}
												/>
											)}
										/>
									</>
								)}

								<Controller
									name="requesterNote"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											margin="normal"
											fullWidth
											id="requesterNote"
											label={t("staff_request.patron.requester_note")}
											multiline
											rows={2}
											error={!!errors.requesterNote}
											helperText={errors.requesterNote?.message}
										/>
									)}
								/>

								<Button
									type="submit"
									color="primary"
									variant="contained"
									fullWidth
									sx={{ mt: 2 }}
									disabled={
										!isValid || isSubmitting || !watch("pickupLocationId")
									}
								>
									{isSubmitting
										? t("ui.action.submitting")
										: t("general.submit")}
								</Button>
							</>
						)}
					</form>
				</DialogContent>
			</Dialog>
			<TimedAlert
				severityType={alert.severity}
				open={alert.open}
				autoHideDuration={6000}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertText={
					<Trans
						i18nKey={alert.text || ""}
						components={{
							linkComponent: (
								<Link
									key="patron-request-link"
									href={alert.patronRequestLink ?? ""}
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						}}
					/>
				}
				key="staff-request-alert"
			/>
		</>
	);
}
