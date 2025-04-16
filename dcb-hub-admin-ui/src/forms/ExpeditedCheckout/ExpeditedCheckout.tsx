import { useState } from "react";
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
	IconButton,
	LinearProgress,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	getLibraries,
	getLocations,
	getPatronRequestEssentials,
} from "src/queries/queries";
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
import { useRouter } from "next/router";
import { PatronRequestFormType } from "@models/PatronRequestFormType";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { PlaceRequestResponse } from "@models/PlaceRequestResponse";
import { PatronLookupResponse } from "@models/PatronLookupResponse";
import { OnSiteBorrowingFormData } from "@models/OnSiteBorrowingFormData";
import { Close } from "@mui/icons-material";

export default function ExpeditedCheckout({
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
	const router = useRouter();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isValidatingPatron, setIsValidatingPatron] = useState(false);
	const [patronValidated, setPatronValidated] = useState(false);
	const [patronData, setPatronData] = useState<PatronLookupResponse | null>(
		null,
	);
	const [availabilityResults, setAvailabilityResults] = useState<any>({});
	const [itemsLoading, setItemsLoading] = useState(false);
	const [itemsError, setItemsError] = useState(false);
	const [patronRequestWaiting, setPatronRequestWaiting] = useState(false);
	const [checkoutCompleted, setCheckoutCompleted] = useState(false);

	const [fetchPatronRequest, { data: patronRequestData }] = useLazyQuery(
		getPatronRequestEssentials,
		{
			variables: {},
			fetchPolicy: "network-only",
			notifyOnNetworkStatusChange: true,
			onCompleted: (data) => {
				const status = data?.patronRequests?.content?.[0]?.status;
				if (status === "RETURN_TRANSIT" && patronRequestWaiting == true) {
					// Request has reached completion state
					setPatronRequestWaiting(false);
					setCheckoutCompleted(true);
					const requestId = data?.patronRequests?.content?.[0]?.id;
					const patronRequestLink = "/patronRequests/" + requestId;
					setAlert({
						open: true,
						severity: "success",
						text: t("expedited_checkout.feedback.success"),
						patronRequestLink: patronRequestLink,
					});

					setTimeout(() => {
						router.push(patronRequestLink);
					}, 6000);
					handleClose();
				}
			},
		},
	);

	const patronRequest = patronRequestData?.patronRequests?.content?.[0];

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
		itemLocalId: Yup.string().required(
			t("ui.validation.required", {
				field: t("staff_request.patron.item_local_id").toLowerCase(),
			}),
		),
		itemLocalSystemCode: Yup.string().required(),
		itemAgencyCode: Yup.string().required(
			t("ui.validation.required", {
				field: t("staff_request.patron.item_library").toLowerCase(),
			}),
		),
	});

	const {
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors, isValid },
	} = useForm<OnSiteBorrowingFormData>({
		defaultValues: {
			patronBarcode: "",
			agencyCode: "",
			pickupLocationId: "",
			requesterNote: "On-site-borrowing: ",
			itemLocalId: "",
			itemLocalSystemCode: "",
			itemAgencyCode: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});
	const agencyCode = watch("agencyCode");
	const itemAgencyCode = watch("itemAgencyCode");

	const { data: libraries } = useQuery(getLibraries, {
		variables: {
			order: "fullName",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1000,
			query: "",
		},
	});
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

	const itemLibraryOptions: PatronRequestAutocompleteOption[] =
		libraries?.libraries?.content?.map(
			(item: { fullName: string; agencyCode: string; agency: Agency }) => ({
				label: item.fullName,
				value: item.agencyCode,
				hostLmsCode: item?.agency?.hostLms?.code,
				agencyId: item?.agency?.id,
			}),
		) || [];

	const selectedItemLibrary = itemLibraryOptions.find(
		(option) => option.value === itemAgencyCode,
	);

	const locationQuery = isPickupAnywhere
		? ""
		: "agency:" + selectedItemLibrary?.agencyId;

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
			order: "name",
			orderBy: "ASC",
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
		(item) => item.agency.code == itemAgencyCode,
	);

	const pickupLocationOptions: PatronRequestAutocompleteOption[] =
		pickupLocations?.locations?.content?.map(
			(item: { name: string; id: string; code: string }) => ({
				label: item.name,
				value: item.id,
				code: item.code,
			}),
		) || [];

	const itemOptions: PatronRequestAutocompleteOption[] =
		filteredItems?.map(
			(item: {
				id: string;
				agency: Agency;
				location: Location;
				barcode: string;
			}) => ({
				label: t("staff_request.patron.item_select", {
					id: item.id,
					name: item.location.name,
					barcode: item.barcode,
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

	const onSubmit = async (data: OnSiteBorrowingFormData) => {
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
				description: "On site borrowing request" + data.requesterNote,
				requesterNote: data.requesterNote || "On site borrowing request",
				item: {
					localId: data.itemLocalId || "", // The local ID of the specific item
					localSystemCode: data.itemLocalSystemCode || "", // The Host LMS code for the item's Host LMS
					agencyCode: data.itemAgencyCode || "", // The agency code of the item
				},
				isExpeditedCheckout: true,
			};

			const response = await axios.post(
				`${publicRuntimeConfig.DCB_API_BASE}/patrons/requests/place/expeditedCheckout`,
				manualSelectionPayload,
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.accessToken}`,
					},
				},
			);
			const placeRequestData: PlaceRequestResponse = response.data;
			const requestId = placeRequestData.id;
			console.log(
				"The expedited checkout request was placed ",
				placeRequestData,
			);
			setAlert({
				open: true,
				severity: "success",
				text: t("expedited_checkout.feedback.in_progress"),
			});
			setPatronRequestWaiting(true);
			fetchPatronRequest({
				variables: {
					query: "id:" + requestId,
				},
				pollInterval: 10000,
			});
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
		// Reset state
		reset();
		setPatronValidated(false);
		setPatronData(null);
		setPatronRequestWaiting(false);
		setCheckoutCompleted(false);
		onClose();
	};

	const ProgressScreen = () => {
		return (
			<Stack direction="column" spacing={2}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					{t("expedited_checkout.request_title")}
				</Typography>
				<LinearProgress
					variant={checkoutCompleted ? "determinate" : "indeterminate"}
					value={checkoutCompleted ? 100 : undefined}
					sx={{ mb: 3, mt: 1 }}
				/>
				<Typography variant="body2" fontWeight="bold">
					{t("expedited_checkout.feedback.in_progress_explanation")}
				</Typography>
				<Typography
					color={checkoutCompleted ? "success.main" : "primary.main"}
					fontWeight="bold"
					variant="body2"
				>
					{t("expedited_checkout.feedback.current_status", {
						status: patronRequest?.status ?? "UNKNOWN",
					})}
				</Typography>
			</Stack>
		);
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
					{t("expedited_checkout.title_on_site")}
				</DialogTitle>
				{!patronRequestWaiting ? (
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
				) : null}
				<DialogContent>
					{patronRequestWaiting ? (
						<>
							<ProgressScreen />
						</>
					) : (
						<>
							<Typography variant="body1">
								{patronValidated ? (
									t("staff_request.select_pickup")
								) : (
									<Trans
										t={t}
										i18nKey={"expedited_checkout.description"}
										components={{
											paragraph: <p />,
										}}
									/>
								)}
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
											getOptionLabel={(
												option: PatronRequestAutocompleteOption,
											) => option.label}
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
														pickupLocationOptions.find(
															(option) => option.value === value,
														) || null
													}
													onChange={(
														_,
														newValue: PatronRequestAutocompleteOption | null,
													) => {
														onChange(newValue?.value || "");
													}}
													options={pickupLocationOptions}
													onOpen={() => {
														getPickupLocations();
													}}
													loading={pickupLocationsLoading}
													getOptionLabel={(
														option: PatronRequestAutocompleteOption,
													) => option.label}
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
															newValue?.hostLmsCode ?? "",
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
						</>
					)}
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
				key="expedited-checkout-alert"
			/>
		</>
	);
}
