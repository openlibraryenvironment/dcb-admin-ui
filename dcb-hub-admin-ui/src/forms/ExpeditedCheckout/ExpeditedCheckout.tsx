import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Yup from "yup";
import {
	DialogContent,
	Step,
	StepIconProps,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";
import { getPatronRequestEssentials } from "@queries/getPatronRequestEssentials";
import { getLocations } from "@queries/getLocations";
import { getLibraries } from "@queries/getLibraries";
import axios from "axios";
import { useAuth } from "react-oidc-context";
import { getRequestError } from "@helpers/getRequestError";
import { Agency } from "../../models/Agency";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import { findConsortium } from "@helpers/findConsortium";
import { Location } from "@models/Location";
import { Item } from "@models/Item";
import { PatronRequestFormType } from "@models/PatronRequestFormType";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { PlaceRequestResponse } from "@models/PlaceRequestResponse";
import { PatronLookupResponse } from "@models/PatronLookupResponse";
import { OnSiteBorrowingFormData } from "@models/OnSiteBorrowingFormData";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import DCBStepIcon from "@components/DCBStepIcon/DCBStepIcon";
import { PatronValidationStep } from "./steps/PatronValidationStep";
import { RequestCreationStep } from "./steps/RequestCreationStep";
import { CheckoutStep } from "./steps/CheckoutStep";
import { successfulExpeditedCheckoutStatuses } from "@constants/statuses/successfulExpeditedCheckoutStatuses";
import { StatusStepConnector } from "../../components/StatusStepConnector/StatusStepConnector";
import request from "graphql-request";
import { Library } from "@models/Library";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { AutocompleteOption } from "@models/AutocompleteOption";
import { getLibrary } from "@queries/getLibrary";
import {
	LibrariesQueryData,
	PatronRequestQueryData,
} from "@models/ReactQueryHelperTypes";
import {
	getStepColors,
	getStepLabelFontWeight,
} from "@helpers/getStepLabelStyles";

{
	/** TODO - THIS MUST BE LIKE 'GOD MODE' for consortia. Cannot be restricted to one library **/
}
export default function ExpeditedCheckout({
	// show,
	onClose,
	bibClusterId,
}: PatronRequestFormType) {
	const { t } = useTranslation();
	const auth = useAuth();
	const staffAgencyCode = String(auth.user?.profile?.code);
	// Also the ID of the library of the item.
	const { cfg } = useRouter().options.context;

	const navigate = useNavigate();
	const headers = useMemo(
		() => ({
			Authorization: `Bearer ${auth.user?.access_token}`,
		}),
		[auth.user?.access_token],
	);

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string;
		patronRequestLink?: string;
	}>({
		open: false,
		severity: "success",
		text: "",
		patronRequestLink: "",
	});
	const [activeStep, setActiveStep] = useState(0);
	const steps = [
		t("requesting.expedited_checkout.steps.patron_validation"),
		t("requesting.expedited_checkout.steps.request_creation"),
		t("requesting.expedited_checkout.steps.checkout"),
	];

	const [patronValidated, setPatronValidated] = useState(false);
	const [patronData, setPatronData] = useState<PatronLookupResponse | null>(
		null,
	);
	const [availabilityResults, setAvailabilityResults] = useState<any>({});
	const [itemsLoading, setItemsLoading] = useState(false);
	const [itemsError, setItemsError] = useState(false);
	const [patronRequestId, setPatronRequestId] = useState<string | null>(null);
	const [patronRequestWaiting, setPatronRequestWaiting] = useState(false);
	const [checkoutCompleted, setCheckoutCompleted] = useState(false);
	const [stepError, setStepError] = useState<number | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// The library ID of the staff user and item is known. Now we fetch its data

	const {
		data: staffLibraryData,
		// isError: errorFetchingStaffLibrary,
		// isLoading: staffLibraryLoading,
	} = useQuery<LibrariesQueryData>({
		queryKey: ["libraryInfo", staffAgencyCode, headers, cfg.VITE_DCB_API_BASE],
		queryFn: async () =>
			request(
				cfg.VITE_DCB_API_BASE + "/graphql",
				getLibrary,
				{
					query: "agencyCode:" + staffAgencyCode,
					pageno: 0,
					orderBy: "fullName",
					order: "DESC",
				},
				headers,
			),
		// do the on success here
	});

	const staffLibrary = staffLibraryData?.libraries?.content?.[0];

	const {
		data: patronLibrariesData,
		isLoading: patronLibrariesLoading,
		// isError: patronLibrariesError,
	} = useQuery<LibrariesQueryData>({
		queryKey: ["librariesInfo", headers, cfg.VITE_DCB_API_BASE],
		queryFn: () =>
			request(
				`${cfg.VITE_DCB_API_BASE}/graphql`,
				getLibraries,
				{
					order: "fullName",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 1000,
					query: "",
				},
				headers,
			),
	});

	const patronLibraries: Library[] = useMemo(
		() => patronLibrariesData?.libraries?.content ?? [],
		[patronLibrariesData],
	);

	const patronLibraryOptions: AutocompleteOption[] = useMemo(
		() =>
			patronLibraries.map(
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
			),
		[patronLibraries],
	);

	// Pickup anywhere is not relevant here: you can only check out at a location of the staff user's library.

	// The library of the patron will need to be selected from the list.
	// The locations list is limited only to locations associated with the library of the staff user / item.

	const { data: patronRequestData } = useQuery<PatronRequestQueryData>({
		queryKey: [
			"patronRequestEssentials",
			patronRequestId,
			headers,
			cfg.VITE_DCB_API_BASE,
		],
		queryFn: () =>
			request(
				`${cfg.VITE_DCB_API_BASE}/graphql`,
				getPatronRequestEssentials,
				{ query: `id:${patronRequestId}` },
				headers,
			),
		enabled: patronRequestWaiting && !!patronRequestId,
		refetchInterval: 10000,
	});

	/* eslint-disable react-hooks/set-state-in-effect -- advances the checkout flow in response to the polled patron-request status (reacting to an external async event) */
	useEffect(() => {
		if (patronRequestData) {
			const status = patronRequestData?.patronRequests?.content?.[0]?.status;
			if (
				successfulExpeditedCheckoutStatuses.includes(status ?? "") &&
				patronRequestWaiting
			) {
				setPatronRequestWaiting(false);
				setCheckoutCompleted(true);
				setStepError(null);
			}
		}
	}, [patronRequestData, patronRequestWaiting]);
	/* eslint-enable react-hooks/set-state-in-effect */

	const patronRequest = patronRequestData?.patronRequests?.content?.[0];

	const validationSchema = Yup.object().shape({
		patronBarcode: Yup.string()
			.required(
				t("ui.validation.required", {
					field: t("requesting.staff_request.patron.barcode").toLowerCase(),
				}),
			)
			.test(
				"no-square-brackets",
				t("requesting.staff_request.patron.error.no_brackets"),
				(value) =>
					value ? !value.includes("[") && !value.includes("]") : true,
			),
		agencyCode: Yup.string().required(
			t("ui.validation.required", {
				field: t("agency.code").toLowerCase(),
			}),
		),
		pickupLocationId: Yup.string().required(
			t("ui.validation.required", {
				field: t(
					"requesting.staff_request.patron.pickup_location",
				).toLowerCase(),
			}),
		),
		requesterNote: Yup.string(),
		itemLocalId: Yup.string().required(
			t("ui.validation.required", {
				field: t("requesting.staff_request.patron.item_local_id").toLowerCase(),
			}),
		),
		itemLocalSystemCode: Yup.string().required(),
		itemAgencyCode: Yup.string().required(
			t("ui.validation.required", {
				field: t("requesting.staff_request.patron.item_library").toLowerCase(),
			}),
		),
	});
	const staffLibraryHostLmsCode = staffLibrary?.agency?.hostLms?.code;

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isValid },
	} = useForm<OnSiteBorrowingFormData>({
		defaultValues: {
			patronBarcode: "",
			agencyCode: staffAgencyCode,
			pickupLocationId: "",
			requesterNote: "On-site-borrowing: ",
			itemLocalId: "",
			itemLocalSystemCode: staffLibraryHostLmsCode,
			itemAgencyCode: staffAgencyCode, // For on-site borrowing, the item agency code must match the user's.
			// As you can only do an on-site borrowing request for your own library's items.
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	// useWatch({ control }) returns all form values; cast to the form type since
	// defaultValues are provided so every field is defined at runtime.
	const formValues = useWatch({ control }) as OnSiteBorrowingFormData;
	const {
		patronBarcode,
		agencyCode,
		itemAgencyCode,
		pickupLocationId,
		itemLocalId,
		itemLocalSystemCode,
	} = formValues;

	const locationQuery = `agency:${staffLibrary?.agency?.id}`; // Staff library is always the supplier.

	console.log(itemLocalSystemCode);

	const { data: pickupLocations, isLoading: pickupLocationsLoading } = useQuery(
		{
			queryKey: ["locations", locationQuery, headers, cfg.VITE_DCB_API_BASE],
			queryFn: () =>
				request(
					`${cfg.VITE_DCB_API_BASE}/graphql`,
					getLocations,
					{
						order: "name",
						orderBy: "ASC",
						pageno: 0,
						pagesize: 1000,
						query: locationQuery,
					},
					headers,
				),
			enabled: !!staffLibrary?.agency?.id,
		},
	);
	useEffect(() => {
		if (staffLibraryHostLmsCode) {
			setValue("itemLocalSystemCode", staffLibraryHostLmsCode, {
				shouldValidate: true,
			});
		}
	}, [staffLibraryHostLmsCode, setValue]);

	const fetchRecords = useCallback(async () => {
		setItemsLoading(true);
		setItemsError(false);
		try {
			const response = await axios.get<any[]>(
				`${cfg.VITE_DCB_API_BASE}/items/availability`,
				{
					headers,
					params: { clusteredBibId: bibClusterId },
				},
			);
			setAvailabilityResults(response.data);
		} catch (error) {
			console.error("Error:", error);
			setItemsError(true);
			setStepError(1);
		} finally {
			setItemsLoading(false);
		}
	}, [bibClusterId, headers, cfg.VITE_DCB_API_BASE]);

	/* eslint-disable react-hooks/set-state-in-effect -- triggers the availability fetch when the checkout step changes */
	useEffect(() => {
		if (activeStep === 1 || checkoutCompleted) {
			fetchRecords();
		}
	}, [checkoutCompleted, activeStep, fetchRecords]);
	/* eslint-enable react-hooks/set-state-in-effect */

	const itemsData: Item[] = availabilityResults?.itemList || [];
	const filteredItems = itemsData.filter(
		(item) =>
			item.agency.code === itemAgencyCode &&
			item.isRequestable &&
			!item.isSuppressed &&
			item?.status?.code == "AVAILABLE",
	);

	const pickupLocationOptions: PatronRequestAutocompleteOption[] =
		(pickupLocations as any)?.locations?.content?.map(
			(item: { name: string; id: string; code: string }) => ({
				label: item.name,
				value: item.id,
				code: item.code,
			}),
		) || [];

	const itemOptions: PatronRequestAutocompleteOption[] =
		filteredItems.map(
			(item: {
				id: string;
				agency: Agency;
				location: Location;
				barcode: string;
				dueDate?: string;
				callNumber?: string;
				parsedVolumeStatement?: string;
			}) => ({
				label: item?.parsedVolumeStatement
					? t("requesting.staff_request.patron.item_select_volume", {
							name: item?.location.name,
							barcode: item.barcode,
							callNo: item?.callNumber,
							volumeStatement: item?.parsedVolumeStatement,
						})
					: t("requesting.staff_request.patron.item_select", {
							name: item?.location.name,
							barcode: item.barcode,
							callNo: item?.callNumber,
						}),

				value: item.id,
				dueDate: item?.dueDate,
			}),
		) || [];

	// const selectedItem = itemOptions.find(
	// 	(option) => option.value === itemLocalId,
	// );

	const rawSelectedItem = itemsData.find((item) => item.id === itemLocalId);

	useEffect(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		if (activeStep === 2 && !checkoutCompleted && stepError !== 2) {
			timeoutRef.current = setTimeout(() => {
				setStepError(2);
			}, 60000);
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [activeStep, checkoutCompleted, stepError]);
	console.log(errors);

	const validatePatronMutation = useMutation<
		PatronLookupResponse,
		unknown,
		{ patronPrinciple: string; agencyCode: string }
	>({
		mutationFn: (payload) =>
			axios
				.post(`${cfg.VITE_DCB_API_BASE}/patron/auth/lookup`, payload, {
					headers,
				})
				.then((res) => res.data),
		onSuccess: (data) => {
			if (data.status === "VALID") {
				setPatronData(data);
				setPatronValidated(true);
				setStepError(null);
				setActiveStep(1);
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("requesting.staff_request.patron.error.validation_failure"),
				});
				setStepError(0);
			}
		},
		onError: (error) => {
			console.error("Error validating patron:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("requesting.staff_request.patron.error.validation_failure"),
			});
			setStepError(0);
		},
	});

	const placeRequestMutation = useMutation<
		PlaceRequestResponse,
		any,
		OnSiteBorrowingFormData
	>({
		mutationFn: async (data) => {
			if (!patronData || patronData.status !== "VALID") {
				throw new Error(
					t("requesting.staff_request.patron.error.validation_failure"),
				);
			}
			const selectedLocation = pickupLocationOptions.find(
				(option) => option.value === data.pickupLocationId,
			);

			const payload = {
				citation: { bibClusterId },
				requestor: {
					localSystemCode: patronData.systemCode,
					localId: patronData.localPatronId[0],
					homeLibraryCode: patronData.homeLocationCode,
					agencyCode: patronData.agencyCode,
				},
				pickupLocation: { code: selectedLocation?.value || "" },
				description: "On site borrowing request" + data.requesterNote,
				requesterNote: data.requesterNote || "On site borrowing request",
				item: {
					localId: data.itemLocalId || "",
					localSystemCode: data.itemLocalSystemCode || "",
					agencyCode: data.itemAgencyCode || "",
				},
				isExpeditedRequest: true,
			};

			const response = await axios.post(
				`${cfg.VITE_DCB_API_BASE}/patrons/requests/place/expeditedCheckout`,
				payload,
				{ headers },
			);
			return response.data;
		},
		onSuccess: (data) => {
			setPatronRequestId(data.id);
			setAlert({
				open: true,
				severity: "success",
				text: t("requesting.expedited_checkout.feedback.in_progress"),
			});
			setPatronRequestWaiting(true);
			setStepError(null);
			setActiveStep(2);
		},
		onError: (error: any) => {
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
		},
	});

	const validatePatron = () => {
		validatePatronMutation.mutate({
			patronPrinciple: patronBarcode,
			agencyCode: agencyCode,
		});
	};

	const onSubmit = (data: OnSiteBorrowingFormData) => {
		if (!patronData || patronData.status !== "VALID") {
			setAlert({
				open: true,
				severity: "error",
				text: t("requesting.staff_request.patron.error.validate_first"),
			});
			return;
		}
		placeRequestMutation.mutate(data);
	};

	const handleClose = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		reset();
		setActiveStep(0);
		setPatronValidated(false);
		setPatronData(null);
		setPatronRequestWaiting(false);
		setCheckoutCompleted(false);
		setStepError(null);
		setPatronRequestId(null);
		onClose();
	};

	const handleViewRequest = () => {
		if (patronRequest?.id) {
			navigate({ to: `/patronRequests/${patronRequest.id}` });
		}
	};

	// For read only users who are not allowed to look at patron requests
	const handleReadOnlyReturn = () => {
		navigate({ to: `/requesting` });
	};

	const handleAlertClose = useCallback(() => {
		setAlert((prevAlert) => ({ ...prevAlert, open: false }));
	}, []);

	const getStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<PatronValidationStep
						control={control}
						errors={errors}
						patronValidated={patronValidated}
						isValidatingPatron={validatePatronMutation.isPending}
						handleClose={handleClose}
						validatePatron={validatePatron}
						patronBarcode={patronBarcode}
						agencyCode={agencyCode}
						libraryOptions={patronLibraryOptions}
						librariesLoading={patronLibrariesLoading}
						t={t}
					/>
				);
			case 1:
				return (
					<RequestCreationStep
						control={control}
						errors={errors}
						// itemLibraryOptions={itemLibraryOptions}
						// itemLibrariesLoading={librariesLoading}
						setValue={setValue}
						pickupLocationOptions={pickupLocationOptions}
						pickupLocationsLoading={pickupLocationsLoading}
						itemOptions={itemOptions}
						itemsLoading={itemsLoading}
						itemsError={itemsError}
						itemAgencyCode={itemAgencyCode}
						handleClose={handleClose}
						isValid={isValid}
						isSubmitting={placeRequestMutation.isPending}
						pickupLocationId={pickupLocationId}
						t={t}
					/>
				);
			case 2:
				return (
					<CheckoutStep
						handleViewRequest={handleViewRequest}
						handleReadOnlyReturn={handleReadOnlyReturn}
						checkoutCompleted={checkoutCompleted}
						stepError={stepError}
						t={t}
						dueDate={rawSelectedItem?.dueDate ?? ""}
					/>
				);
			default:
				return (
					<PatronValidationStep
						control={control}
						errors={errors}
						patronValidated={patronValidated}
						isValidatingPatron={validatePatronMutation.isPending}
						handleClose={handleClose}
						validatePatron={validatePatron}
						patronBarcode={patronBarcode}
						agencyCode={agencyCode}
						libraryOptions={patronLibraryOptions}
						librariesLoading={patronLibrariesLoading}
						t={t}
					/>
				); // This should never happen - but putting this in place ensures that the process would reset gracefully.
		}
	};

	return (
		<>
			{/* <Dialog
				open={show}
				onClose={handleClose}
				aria-labelledby="patron-request-modal"
				fullWidth
				maxWidth="sm">
				<DialogTitle id="form-dialog-title" variant="modalTitle">
					{t("requesting.expedited_checkout.title_on_site")}
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
						}}>
						<Close />
					</IconButton>
				)} */}
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
						if (index === 2 && checkoutCompleted) {
							labelProps.optional = (
								<Typography
									variant="caption"
									sx={{
										color: "success.main",
									}}
								>
									{t("requesting.expedited_checkout.steps.complete")}
								</Typography>
							);
						}

						return (
							<Step key={label} {...stepProps}>
								<StepLabel {...labelProps} slots={{ stepIcon: DCBStepIcon }}>
									<Typography
										color={getStepColors(isActive, hasError, isCompleted)}
										sx={{
											fontWeight: getStepLabelFontWeight(isActive),
										}}
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
			{/* </Dialog> */}
			<TimedAlert
				severityType={alert.severity}
				open={alert.open}
				autoHideDuration={6000}
				onCloseFunc={handleAlertClose}
				alertText={alert.text}
				key="expedited-checkout-alert"
			/>
		</>
	);
}
