import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Control, useForm, useWatch } from "react-hook-form";
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
import axios from "axios";
import { useAuth } from "react-oidc-context";
import { useNavigate, useRouter } from "@tanstack/react-router";
import request from "graphql-request";

import { getLibraries } from "@queries/getLibraries";
import { getLocations } from "@queries/getLocations";
import { getPatronRequestEssentials } from "@queries/getPatronRequestEssentials";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import DCBStepIcon from "@components/DCBStepIcon/DCBStepIcon";
import { StatusStepConnector } from "@components/StatusStepConnector/StatusStepConnector";
import { PatronValidationStep } from "@forms/ExpeditedCheckout/steps/PatronValidationStep";
import { CheckoutStep } from "@forms/ExpeditedCheckout/steps/CheckoutStep";
import { QuickWalkUpRequestStep } from "@forms/ExpeditedCheckout/steps/QuickWalkUpStep";
import { successfulExpeditedCheckoutStatuses } from "@constants/statuses/successfulExpeditedCheckoutStatuses";
import { AutocompleteOption } from "@models/AutocompleteOption";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import {
	LibrariesQueryData,
	LocationsQueryData,
	PatronRequestQueryData,
} from "@models/ReactQueryHelperTypes";
import { Agency } from "@models/Agency";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import { findConsortium } from "@helpers/findConsortium";
import {
	getStepColors,
	getStepLabelFontWeight,
} from "@helpers/getStepLabelStyles";
import { PatronLookupResponse } from "@models/PatronLookupResponse";
import { getRequestError } from "@helpers/getRequestError";
import { QuickWalkUpFormData } from "@models/QuickWalkUpFormData";

export default function QuickWalkUpRequest({
	onClose,
	initialItemBarcode,
}: {
	onClose: () => void;
	// Pre-filled when launched against a specific available item (items grid).
	initialItemBarcode?: string;
}) {
	const { t } = useTranslation();
	const auth = useAuth();
	const navigate = useNavigate();
	const { cfg } = useRouter().options.context;
	const staffAgencyCode = String(auth.user?.profile?.code);

	const headers = useMemo(
		() => ({ Authorization: `Bearer ${auth.user?.access_token}` }),
		[auth.user?.access_token],
	);

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string;
	}>({ open: false, severity: "success", text: "" });
	const [activeStep, setActiveStep] = useState(0);
	const [patronValidated, setPatronValidated] = useState(false);
	const [patronData, setPatronData] = useState<PatronLookupResponse | null>(
		null,
	);
	const [patronRequestId, setPatronRequestId] = useState<string | null>(null);
	const [patronRequestWaiting, setPatronRequestWaiting] = useState(false);
	const [stepError, setStepError] = useState<number | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const [resolvedBibClusterId, setResolvedBibClusterId] = useState<
		string | null
	>(null);

	const steps = [
		t("requesting.expedited_checkout.steps.patron_validation"),
		t("requesting.quick_walk_up.steps.request_creation", "Scan Item"),
		t("requesting.expedited_checkout.steps.checkout"),
	];

	const schema = Yup.object().shape({
		patronBarcode: Yup.string().required(t("ui.validation.required")),
		agencyCode: Yup.string().required(t("ui.validation.required")),
		itemBarcode: Yup.string().required(t("ui.validation.required")),
		pickupLocationCode: Yup.string().required(t("ui.validation.required")),
	});

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors, isValid },
	} = useForm<QuickWalkUpFormData>({
		resolver: yupResolver(schema),
		defaultValues: {
			patronBarcode: "",
			agencyCode: staffAgencyCode,
			itemBarcode: initialItemBarcode ?? "",
			pickupLocationCode: "",
		},
		mode: "onChange",
	});

	// Isolated field subscriptions (useWatch) instead of a bare watch() read.
	const patronBarcode = useWatch({ control, name: "patronBarcode" });
	const agencyCode = useWatch({ control, name: "agencyCode" });
	const itemBarcode = useWatch({ control, name: "itemBarcode" });

	const { data: librariesData, isLoading: librariesLoading } =
		useQuery<LibrariesQueryData>({
			queryKey: ["librariesInfo", headers, cfg.VITE_DCB_API_BASE],
			queryFn: () =>
				request(
					`${cfg.VITE_DCB_API_BASE}/graphql`,
					getLibraries,
					{
						pageno: 0,
						pagesize: 1000,
						order: "fullName",
						orderBy: "ASC",
						query: "",
					},
					headers,
				),
		});

	const libraryOptions: AutocompleteOption[] = useMemo(
		() =>
			(librariesData?.libraries?.content ?? []).map(
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
		[librariesData],
	);

	const staffLibraryOption = useMemo(
		() => libraryOptions.find((opt) => opt.value === staffAgencyCode),
		[libraryOptions, staffAgencyCode],
	);

	const locationQuery = staffLibraryOption?.agencyId
		? `agency:${staffLibraryOption.agencyId}`
		: "";
	const { data: pickupLocations, isLoading: pickupLocationsLoading } =
		useQuery<LocationsQueryData>({
			queryKey: ["locations", locationQuery, headers, cfg.VITE_DCB_API_BASE],
			queryFn: () =>
				request(
					`${cfg.VITE_DCB_API_BASE}/graphql`,
					getLocations,
					{
						query: locationQuery,
						pageno: 0,
						pagesize: 1000,
						order: "name",
						orderBy: "ASC",
					},
					headers,
				),
			enabled: !!staffLibraryOption?.agencyId,
		});

	const pickupLocationOptions: PatronRequestAutocompleteOption[] = useMemo(
		() =>
			pickupLocations?.locations?.content?.map(
				(item: { name: string; id: string; code: string }) => ({
					label: item.name,
					value: item.id,
					code: item.code,
				}),
			) || [],
		[pickupLocations],
	);

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
		// Poll until the request reaches a successful checkout status, then stop.
		refetchInterval: (query) =>
			successfulExpeditedCheckoutStatuses.includes(
				query.state.data?.patronRequests?.content?.[0]?.status ?? "",
			)
				? false
				: 10000,
	});

	const patronRequest = patronRequestData?.patronRequests?.content?.[0];
	// Derived during render — true once the polled request reaches a terminal
	// successful checkout status.
	const checkoutCompleted = successfulExpeditedCheckoutStatuses.includes(
		patronRequest?.status ?? "",
	);

	const { data: availabilityData } = useQuery({
		queryKey: [
			"availability",
			resolvedBibClusterId,
			headers,
			cfg.VITE_DCB_API_BASE,
		],
		queryFn: async () => {
			const response = await axios.get(
				`${cfg.VITE_DCB_API_BASE}/items/availability`,
				{
					headers,
					params: { clusteredBibId: resolvedBibClusterId },
				},
			);
			return response.data;
		},
		// Only run this query once the checkout has succeeded and we have the ID
		// Bit of a hack to get the due date
		enabled: checkoutCompleted && !!resolvedBibClusterId,
	});

	const postCheckoutDueDate = useMemo(() => {
		if (!availabilityData?.itemList) return "";

		const checkedOutItem = availabilityData.itemList.find(
			(item: any) => item.barcode === itemBarcode,
		);

		return checkedOutItem?.dueDate || "";
	}, [availabilityData, itemBarcode]);

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
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [activeStep, checkoutCompleted, stepError]);

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
				setActiveStep(1); // Move to Step 2
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("requesting.staff_request.patron.error.validation_failure"),
				});
				setStepError(0);
			}
		},
		onError: () => {
			setAlert({
				open: true,
				severity: "error",
				text: t("requesting.staff_request.patron.error.validation_failure"),
			});
			setStepError(0);
		},
	});

	const validatePatron = () =>
		validatePatronMutation.mutate({
			patronPrinciple: patronBarcode,
			agencyCode: agencyCode,
		});

	const placeRequestMutation = useMutation({
		mutationFn: async (data: QuickWalkUpFormData) => {
			if (!patronData || patronData.status !== "VALID")
				throw new Error(
					t("requesting.staff_request.patron.error.validation_failure"),
				);

			const payload = {
				itemHostLmsCode: staffLibraryOption?.hostLmsCode,
				itemAgencyCode: staffAgencyCode,
				itemBarcode: data.itemBarcode,
				pickupLocationCode: data.pickupLocationCode,
				patronBarcode: data.patronBarcode,
				patronLocalId: patronData.localPatronId[0],
				agencyCode: data.agencyCode,
				patronHostLmsCode: patronData.systemCode,
			};

			const response = await axios.post(
				`${cfg.VITE_DCB_API_BASE}/patrons/requests/place/walkup`,
				payload,
				{ headers },
			);
			return response.data;
		},
		onSuccess: (data) => {
			setPatronRequestId(data.id);
			setResolvedBibClusterId(data.citation?.bibClusterId);
			setAlert({
				open: true,
				severity: "success",
				text: t("requesting.expedited_checkout.feedback.in_progress"),
			});
			setPatronRequestWaiting(true);
			setStepError(null);
			setActiveStep(2); // Move to Step 3
		},
		onError: (error: any) => {
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

	const onSubmit = (data: QuickWalkUpFormData) => {
		if (activeStep === 1) placeRequestMutation.mutate(data);
	};

	const handleClose = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		reset();
		setActiveStep(0);
		setPatronValidated(false);
		setPatronData(null);
		setPatronRequestWaiting(false);
		setStepError(null);
		setPatronRequestId(null);
		onClose();
	};

	const handleViewRequest = () => {
		if (patronRequest?.id)
			navigate({ to: `/patronRequests/${patronRequest.id}` });
	};
	const handleReadOnlyReturn = () => navigate({ to: `/requesting` });
	const handleAlertClose = useCallback(
		() => setAlert((prev) => ({ ...prev, open: false })),
		[],
	);

	const getStepContent = (step: number) => {
		// Shared steps expose an untyped Control<any, any>; RHF 7.80 rejects the
		// concrete Control assignment, so widen once here.
		const anyControl = control as unknown as Control<any, any>;
		switch (step) {
			case 0:
				return (
					<PatronValidationStep
						control={anyControl}
						errors={errors}
						patronValidated={patronValidated}
						isValidatingPatron={validatePatronMutation.isPending}
						handleClose={handleClose}
						validatePatron={validatePatron}
						patronBarcode={patronBarcode}
						agencyCode={agencyCode}
						libraryOptions={
							libraryOptions as unknown as PatronRequestAutocompleteOption[]
						}
						librariesLoading={librariesLoading}
						t={t}
					/>
				);
			case 1:
				return (
					<QuickWalkUpRequestStep
						control={anyControl}
						setValue={setValue}
						watch={watch}
						errors={errors}
						pickupLocationOptions={pickupLocationOptions}
						pickupLocationsLoading={pickupLocationsLoading}
						handleClose={handleClose}
						isValid={isValid}
						isSubmitting={placeRequestMutation.isPending}
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
						dueDate={postCheckoutDueDate}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<DialogContent sx={{ overflow: "visible" }}>
				<Stepper
					activeStep={activeStep}
					alternativeLabel
					sx={{ mb: 4 }}
					id="quick-walk-up-steps"
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

						if (isCompleted) stepProps.completed = true;
						if (hasError) labelProps.error = true;
						if (index === 2 && checkoutCompleted) {
							labelProps.optional = (
								<Typography variant="caption" color="success.main">
									{t("requesting.expedited_checkout.steps.complete")}
								</Typography>
							);
						}

						return (
							<Step id={label} key={label} {...stepProps}>
								<StepLabel {...labelProps} slots={{ stepIcon: DCBStepIcon }}>
									<Typography
										sx={{
											color: getStepColors(isActive, hasError, isCompleted),
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

			<TimedAlert
				severityType={alert.severity}
				open={alert.open}
				autoHideDuration={6000}
				onCloseFunc={handleAlertClose}
				alertText={alert.text}
				key="quick-walk-up-alert"
			/>
		</>
	);
}
