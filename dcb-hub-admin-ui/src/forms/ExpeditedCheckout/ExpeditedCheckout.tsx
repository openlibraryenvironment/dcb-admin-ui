import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLazyQuery, useQuery } from "@apollo/client";
import * as Yup from "yup";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Step,
	StepIconProps,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import {
	getLibraries,
	getLocations,
	getPatronRequestEssentials,
} from "src/queries/queries";
import axios from "axios";
import getConfig from "next/config";
import { useSession } from "next-auth/react";
import { getRequestError } from "src/helpers/getRequestError";
import { Agency } from "@models/Agency";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import { findConsortium } from "src/helpers/findConsortium";
import { Location } from "@models/Location";
import { Item } from "@models/Item";
import { useRouter } from "next/router";
import { PatronRequestFormType } from "@models/PatronRequestFormType";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { PlaceRequestResponse } from "@models/PlaceRequestResponse";
import { PatronLookupResponse } from "@models/PatronLookupResponse";
import { OnSiteBorrowingFormData } from "@models/OnSiteBorrowingFormData";
import { Close } from "@mui/icons-material";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import DCBStepIcon from "@components/DCBStepIcon/DCBStepIcon";
import { PatronValidationStep } from "./steps/PatronValidationStep";
import { RequestCreationStep } from "./steps/RequestCreationStep";
import { CheckoutStep } from "./steps/CheckoutStep";
import { successfulExpeditedCheckoutStatuses } from "src/constants/statuses";
import { StatusStepConnector } from "@components/StatusStepConnector/StatusStepConnector";
import {
	getStepColors,
	getStepLabelFontWeight,
} from "src/helpers/getStepLabelStyles";

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
	const [activeStep, setActiveStep] = useState(0);
	const steps = [
		t("expedited_checkout.steps.patron_validation"),
		t("expedited_checkout.steps.request_creation"),
		t("expedited_checkout.steps.checkout"),
	];

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
	const [stepError, setStepError] = useState<number | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the timeout ID

	const [fetchPatronRequest, { data: patronRequestData }] = useLazyQuery(
		getPatronRequestEssentials,
		{
			variables: {},
			fetchPolicy: "network-only",
			notifyOnNetworkStatusChange: true,
			onCompleted: (data) => {
				const status = data?.patronRequests?.content?.[0]?.status;
				if (
					successfulExpeditedCheckoutStatuses.includes(status) &&
					patronRequestWaiting == true
				) {
					// Request has reached completion state
					setPatronRequestWaiting(false);
					setCheckoutCompleted(true);
					setStepError(null);
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
			requesterNote: "On-site borrowing: ",
			itemLocalId: "",
			itemLocalSystemCode: "",
			itemAgencyCode: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});
	const formValues = watch();
	const patronBarcode = formValues.patronBarcode;
	const agencyCode = formValues.agencyCode;
	const itemAgencyCode = formValues.itemAgencyCode;
	const pickupLocationId = formValues.pickupLocationId;
	const itemLocalId = formValues.itemLocalId;

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
		},
	);
	const { data: itemLibraries, loading: itemLibrariesLoading } = useQuery(
		getLibraries,
		{
			variables: {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			},
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
				hostLmsCode: item?.agency?.hostLms?.code,
				functionalSettings: findConsortium(item?.membership)
					?.functionalSettings,
			}),
		) || [];

	const itemLibraryOptions: PatronRequestAutocompleteOption[] = useMemo(
		() =>
			itemLibraries?.libraries?.content?.map(
				(item: { fullName: string; agencyCode: string; agency: Agency }) => ({
					label: item.fullName,
					value: item.agencyCode,
					hostLmsCode: item?.agency?.hostLms?.code,
					agencyId: item?.agency?.id,
				}),
			) || [],
		[itemLibraries],
	);

	// A.K.A the staff library - where the actual item is
	const selectedItemLibrary = libraryOptions.find(
		(option) => option.value === itemAgencyCode,
	);

	const locationQuery = "agency:" + selectedItemLibrary?.agencyId;
	// With expedited checkout, you can only place a request to be picked up at the staff library
	// Because that's where the actual item + the staff user are.
	// The patron can come from any OpenRS library

	const { data: pickupLocations, loading: pickupLocationsLoading } = useQuery(
		getLocations,
		{
			variables: {
				order: "name",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: locationQuery,
			},
			skip: !selectedItemLibrary?.agencyId,
		},
	);
	const fetchRecords = useCallback(async () => {
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
			setStepError(1);
		}
	}, [bibClusterId, publicRuntimeConfig.DCB_API_BASE, session?.accessToken]);

	useEffect(() => {
		if (activeStep == 1 || checkoutCompleted) {
			fetchRecords();
		}
	}, [checkoutCompleted, activeStep, bibClusterId, fetchRecords]);

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
			(item: { name: string; id: string; code: string }) => ({
				label: item.name,
				value: item.id,
				code: item.code,
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

	const itemOptions: PatronRequestAutocompleteOption[] =
		filteredItems?.map(
			(item: {
				id: string;
				agency: Agency;
				location: Location;
				barcode: string;
				dueDate?: string;
			}) => ({
				label: t("staff_request.patron.item_select", {
					id: item.id,
					name: item.location.name,
					barcode: item.barcode,
				}),
				value: item.id,
				dueDate: item?.dueDate,
			}),
		) || [];
	// For due date when we can eventually test it.
	const selectedItem = itemOptions.find(
		(option) => option.value === itemLocalId,
	);

	// This is a timeout effect for the checkout stage (step 2)
	// After 60s we can see that instant checkout has not occurred.
	// And so we indicate to the user that they should go to the patron request page.
	useEffect(() => {
		// Always clear any previous timeout when dependencies change or effect re-runs
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
			console.log("Cleared previous checkout timeout.");
		}

		// Conditions to start the timeout:
		// 1. We are on the final step (index 2)
		// 2. Checkout is NOT yet completed
		// 3. There isn't already an error flagged for this step
		if (activeStep === 2 && !checkoutCompleted && stepError !== 2) {
			console.log("Starting checkout timeout (60s)...");
			timeoutRef.current = setTimeout(() => {
				// This code runs IF the timeout completes *before* checkoutCompleted becomes true
				console.log("The checkout timeout was reached!");
				setStepError(2); // Flag step 2 as erroneous due to timeout
				// No need to check checkoutCompleted again here, effect cleanup handles success case
			}, 60000);
		}
		// Cleanup function: This runs when the component unmounts
		// OR when any dependency (activeStep, checkoutCompleted, stepError) changes *before* the next effect run.
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
				console.log("Checkout timeout cleared due to cleanup.");
			}
		};
		// Dependencies: Effect should re-evaluate if we change step, complete checkout, or an error occurs.
	}, [activeStep, checkoutCompleted, stepError]);

	// Handler for validating patron
	const validatePatron = async () => {
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
				// no alert here any more as it was causing issues
				setStepError(null);
				setActiveStep(1);
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("staff_request.patron.error.validation_failure"),
				});
				setStepError(0);
			}
		} catch (error) {
			console.error("Error validating patron:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("staff_request.patron.error.validation_failure"),
			});
			setStepError(0);
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
			setStepError(null);
			setActiveStep(2);
		} catch (error: any) {
			console.error("Error submitting patron request:", error.response?.data);
			setAlert({
				open: true,
				severity: "error",
				text: t(getRequestError(error.response?.data?.failedChecks), {
					code: error?.response?.data?.failedChecks?.[0]?.code,
					description: error?.response?.data?.failedChecks?.[0]?.description,
				}),
			});
			setStepError(1);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		// Reset state
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		reset();
		setActiveStep(0);
		setPatronValidated(false);
		setPatronData(null);
		setPatronRequestWaiting(false);
		setCheckoutCompleted(false);
		setStepError(null);
		onClose();
	};

	// View request handler
	const handleViewRequest = () => {
		const requestId = patronRequest?.id;
		router.push(`/patronRequests/${requestId}`);
	};

	const handleAlertClose = useCallback(() => {
		setAlert((prevAlert) => ({ ...prevAlert, open: false }));
	}, []);

	// Steps:
	const getStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<PatronValidationStep
						control={control}
						errors={errors}
						patronValidated={patronValidated}
						isValidatingPatron={isValidatingPatron}
						handleClose={handleClose}
						validatePatron={validatePatron}
						patronBarcode={patronBarcode}
						agencyCode={agencyCode}
						libraryOptions={libraryOptions}
						librariesLoading={librariesLoading}
						t={t}
					/>
				);
			case 1:
				return (
					<RequestCreationStep
						control={control}
						errors={errors}
						itemLibraryOptions={itemLibraryOptions}
						itemLibrariesLoading={itemLibrariesLoading}
						setValue={setValue}
						pickupLocationOptions={sortedPickupLocationOptions}
						pickupLocationsLoading={pickupLocationsLoading}
						itemOptions={itemOptions}
						itemsLoading={itemsLoading}
						itemsError={itemsError}
						itemAgencyCode={itemAgencyCode}
						handleClose={handleClose}
						isValid={isValid}
						isSubmitting={isSubmitting}
						pickupLocationId={pickupLocationId}
						t={t}
					/>
				);
			case 2:
				return (
					<CheckoutStep
						handleViewRequest={handleViewRequest}
						checkoutCompleted={checkoutCompleted}
						stepError={stepError}
						t={t}
						dueDate={selectedItem?.dueDate ?? ""}
					/>
				);
			default:
				return (
					<PatronValidationStep
						control={control}
						errors={errors}
						patronValidated={patronValidated}
						isValidatingPatron={isValidatingPatron}
						handleClose={handleClose}
						validatePatron={validatePatron}
						patronBarcode={patronBarcode}
						agencyCode={agencyCode}
						libraryOptions={libraryOptions}
						librariesLoading={librariesLoading}
						t={t}
					/>
				); // This should never happen - but putting this in place ensures that the process would reset gracefully.
		}
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

				{(!patronRequestWaiting || checkoutCompleted) && (
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
				)}

				<DialogContent sx={{ overflow: "visible" }}>
					<Stepper
						activeStep={activeStep}
						alternativeLabel
						sx={{ mb: 4 }}
						connector={
							<StatusStepConnector
								stepError={stepError}
								activeStep={activeStep}
							/>
						}
					>
						{steps.map((label, index) => {
							const stepProps: { completed?: boolean } = {};
							const labelProps: {
								optional?: React.ReactNode;
								error?: boolean;
								StepIconComponent?: React.ElementType<StepIconProps>;
							} = {};
							const isActive = index === activeStep;
							const isCompleted =
								index < activeStep ||
								(index === steps.length - 1 && checkoutCompleted);
							const hasError = stepError === index;

							if (isCompleted) {
								stepProps.completed = true;
							}
							if (hasError) {
								labelProps.error = true;
							}
							// Ensures that we mark the last step as complete when checkout is complete.
							if (index === 2 && checkoutCompleted) {
								labelProps.optional = (
									<Typography variant="caption" color="success.main">
										{t("expedited_checkout.steps.complete")}
									</Typography>
								);
							}

							// labels are not working properly, styling needs improving ^^ pass in a custom connector also
							return (
								<Step key={label} {...stepProps}>
									<StepLabel {...labelProps} StepIconComponent={DCBStepIcon}>
										<Typography
											color={getStepColors(isActive, hasError, isCompleted)}
											fontWeight={getStepLabelFontWeight(isActive)}
										>
											{label}
										</Typography>
									</StepLabel>
								</Step>
							);
						})}
					</Stepper>
					<form onSubmit={handleSubmit(onSubmit)}>
						{getStepContent(activeStep)}
					</form>
				</DialogContent>
			</Dialog>
			<TimedAlert
				severityType={alert.severity}
				open={alert.open}
				autoHideDuration={6000}
				onCloseFunc={handleAlertClose} // Pass the stable callback
				alertText={alert.text}
				key="expedited-checkout-alert"
			/>
		</>
	);
}
