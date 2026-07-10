import { useMemo, useState } from "react";
import { Control, Resolver, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
	DialogContent,
	Link,
	Step,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { getLibraries } from "@queries/getLibraries";
import { getLocations } from "@queries/getLocations";
import axios, { AxiosError } from "axios";
import { useAuth } from "react-oidc-context";
import { getRequestError } from "@helpers/getRequestError";
import { Agency } from "@models/Agency";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import { findConsortium } from "@helpers/findConsortium";
import { Location } from "@models/Location";
import { Item } from "@models/Item";
import { PatronRequestFormType } from "@models/PatronRequestFormType";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { PatronLookupResponse } from "@models/PatronLookupResponse";
import { PlaceRequestResponse } from "@models/PlaceRequestResponse";
import { StaffRequestFormData } from "@models/StaffRequestFormData";
import { useQuery, useMutation } from "@tanstack/react-query";
import request from "graphql-request";
import {
	LibrariesQueryData,
	LocationsQueryData,
} from "@models/ReactQueryHelperTypes";
import { StaffRequestDetailsStep } from "@forms/ExpeditedCheckout/steps/StaffRequestDetailsStep";
import { PatronValidationStep } from "@forms/ExpeditedCheckout/steps/PatronValidationStep";
import { useRouter } from "@tanstack/react-router";
import DCBStepIcon from "@components/DCBStepIcon/DCBStepIcon";
import { StatusStepConnector } from "@components/StatusStepConnector/StatusStepConnector";
import {
	getStepColors,
	getStepLabelFontWeight,
} from "@helpers/getStepLabelStyles";

export default function StaffRequest({
	onClose,
	bibClusterId,
}: PatronRequestFormType) {
	const { t } = useTranslation();
	const auth = useAuth();
	const headers = useMemo(
		() => ({
			Authorization: `Bearer ${auth.user?.access_token}`,
		}),
		[auth.user?.access_token],
	);
	const router = useRouter();
	const { cfg } = router.options.context;
	const agencyCode = auth.user?.profile?.code
		? String(auth.user?.profile?.code)
		: "";

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
	const [patronData, setPatronData] = useState<PatronLookupResponse | null>(
		null,
	);
	const [stepError, setStepError] = useState<number | null>(null);

	const steps = [
		t("requesting.expedited_checkout.steps.patron_validation"),
		t("requesting.expedited_checkout.steps.request_creation"),
	];
	const isReadOnly = auth.user?.profile?.roles?.includes("LIBRARY_READ_ONLY");

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
		selectionType: Yup.string().required(
			t("ui.validation.required", {
				field: t(
					"requesting.staff_request.patron.selection.type",
				).toLowerCase(),
			}),
		),
		itemLocalId: Yup.string().when("selectionType", {
			is: "manual",
			then: (schema) =>
				schema.required(
					t("ui.validation.required", {
						field: t(
							"requesting.staff_request.patron.item_local_id",
						).toLowerCase(),
					}),
				),
			otherwise: (schema) => schema.notRequired(),
		}),
		itemAgencyCode: Yup.string().when("selectionType", {
			is: "manual",
			then: (schema) =>
				schema.required(
					t("ui.validation.required", {
						field: t(
							"requesting.staff_request.patron.item_library",
						).toLowerCase(),
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
			agencyCode: agencyCode,
			pickupLocationId: "",
			requesterNote: "Staff Request: ",
			selectionType: "automatic",
			itemLocalId: "",
			itemLocalSystemCode: "",
			itemAgencyCode: "",
		},
		// @hookform/resolvers@5 tightened the Resolver generics: yup infers
		// unset fields as `string | undefined` (required key), which no longer
		// unifies with the optional properties on StaffRequestFormData. The
		// shapes are equivalent at runtime, so pin the resolver to the form type.
		resolver: yupResolver(
			validationSchema,
		) as unknown as Resolver<StaffRequestFormData>,
		mode: "onChange",
	});

	// Isolated field subscriptions (useWatch) instead of bare watch() reads.
	const selectionType = useWatch({ control, name: "selectionType" });
	const patronAgencyCode = useWatch({ control, name: "agencyCode" });
	const itemAgencyCode = useWatch({ control, name: "itemAgencyCode" });
	const patronBarcode = useWatch({ control, name: "patronBarcode" });

	const { data: librariesData, isLoading: librariesDataLoading } =
		useQuery<LibrariesQueryData>({
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

	const libraryOptions: PatronRequestAutocompleteOption[] =
		librariesData?.libraries?.content?.map(
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
		(option) => option.value === patronAgencyCode,
	);
	const isPickupAnywhere = !!selectedLibrary?.functionalSettings?.some(
		(setting) => setting.name === "PICKUP_ANYWHERE" && setting.enabled === true,
	); // This still matters in the context of staff requesting. However, pickup locations from the user's agency should be prioritised.

	const {
		data: pickupLocations,
		isLoading: pickupLocationsLoading,
		refetch: getPickupLocations,
	} = useQuery<LocationsQueryData>({
		queryKey: [
			"pickupLocations",
			selectedLibrary?.agencyId,
			isPickupAnywhere,
			headers,
			cfg.VITE_DCB_API_BASE,
		],
		queryFn: () => {
			const locationQuery = isPickupAnywhere
				? "agency:" +
					selectedLibrary?.agencyId +
					" OR isEnabledForPickupAnywhere:true"
				: "agency:" + selectedLibrary?.agencyId;
			return request(
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
			);
		},
		enabled: false,
	});

	const {
		data: availabilityResults,
		isLoading: itemsLoading,
		isError: itemsError,
		refetch: fetchItems,
	} = useQuery<any>({
		queryKey: [
			"itemAvailability",
			bibClusterId,
			headers,
			cfg.VITE_DCB_API_BASE,
		],
		queryFn: () =>
			axios.get(`${cfg.VITE_DCB_API_BASE}/items/availability`, {
				headers,
				params: { clusteredBibId: bibClusterId },
			}),
		enabled: false,
		select: (response) => response.data,
	});

	const itemsData: Item[] = availabilityResults?.itemList || [];
	const filteredItems = itemsData.filter(
		(item) => item?.agency?.code === itemAgencyCode,
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
					t("requesting.staff_request.patron.pickup_location_no_agency"),
				agencyCode: item?.agency?.code,
			}),
		);
		// Sort the array of options
		return options.sort((a: any, b: any) => {
			const isAUserAgency = a.agencyCode === agencyCode;
			const isBUserAgency = b.agencyCode === agencyCode;
			if (isAUserAgency && !isBUserAgency) return -1;
			if (!isAUserAgency && isBUserAgency) return 1;
			if (a.agencyName && b.agencyName && a.agencyName !== b.agencyName) {
				return a.agencyName.localeCompare(b.agencyName);
			}
			return a.label.localeCompare(b.label);
		});
	}, [pickupLocations?.locations?.content, t, agencyCode]);

	const itemLibraryOptions: PatronRequestAutocompleteOption[] =
		librariesData?.libraries?.content?.map(
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

	// This handles loading state, errors, and success callbacks cleanly.
	const validatePatronMutation = useMutation<
		PatronLookupResponse,
		unknown,
		{ patronBarcode: string; agencyCode: string }
	>({
		mutationFn: (variables) =>
			axios
				.post(
					`${cfg.VITE_DCB_API_BASE}/patron/auth/lookup`,
					{
						patronPrinciple: variables.patronBarcode,
						agencyCode: variables.agencyCode,
					},
					{ headers },
				)
				.then((res) => res.data),
		onSuccess: (data) => {
			if (data.status === "VALID") {
				setPatronData(data);
				setActiveStep(1);
				setStepError(null); // Clear error on success
				setAlert({
					open: true,
					severity: "success",
					text: t("requesting.staff_request.patron.success.lookup", {
						barcode: patronBarcode,
						library: agencyCode,
					}),
				});
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("requesting.staff_request.patron.error.validation_failure"),
				});
				setStepError(0); // Set error on step 0
			}
		},
		onError: (error) => {
			console.error("Error validating patron:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("requesting.staff_request.patron.error.validation_failure"),
			});
			setStepError(0); // Set error on step 0
		},
	});

	const placeRequestMutation = useMutation<
		PlaceRequestResponse,
		AxiosError,
		any
	>({
		mutationFn: (payload) =>
			axios
				.post(`${cfg.VITE_DCB_API_BASE}/patrons/requests/place`, payload, {
					headers,
				})
				.then((res) => res.data),
		onSuccess: (data) => {
			const patronRequestLink = `/patronRequests/${data.id}`;
			setStepError(null); // Clear error on success
			setAlert({
				open: true,
				severity: "success",
				text: isReadOnly
					? t("requesting.staff_request.patron.success.request_requesting_only")
					: t("requesting.staff_request.patron.success.request"),
				patronRequestLink,
			});
			setTimeout(() => {
				handleClose();
			}, 6000);
		},
		onError: (error: any) => {
			console.error("Error submitting patron request:", error.response?.data);
			setAlert({
				open: true,
				severity: "error",
				text: t(getRequestError(error.response?.data?.failedChecks), {
					code: error?.response?.data?.failedChecks[0].code,
					description: error?.response?.data?.failedChecks[0].description,
				}),
			});
			setStepError(1); // Set error on step 1
		},
	});

	const validatePatron = () => {
		validatePatronMutation.mutate({
			patronBarcode,
			agencyCode: selectedLibrary?.value ?? agencyCode,
		});
	};

	const onSubmit = (data: StaffRequestFormData) => {
		if (!patronData || patronData.status !== "VALID") {
			setAlert({
				open: true,
				severity: "error",
				text: t("requesting.staff_request.patron.error.validate_first"),
			});
			return;
		}

		const selectedLocation = pickupLocationOptions.find(
			(option) => option.value === data.pickupLocationId,
		);

		const basePayload = {
			citation: { bibClusterId },
			requestor: {
				localSystemCode: patronData.systemCode,
				localId: patronData.localPatronId[0],
				homeLibraryCode: patronData.homeLocationCode,
				agencyCode: patronData.agencyCode,
			},
			pickupLocation: { code: selectedLocation?.value || "" },
			requesterNote: data.requesterNote || "Staff Request",
		};

		let finalPayload;
		if (selectionType === "manual") {
			finalPayload = {
				...basePayload,
				description: `Staff Request with manual selection: ${data.requesterNote}`,
				item: {
					localId: data.itemLocalId || "",
					localSystemCode: data.itemLocalSystemCode || "",
					agencyCode: data.itemAgencyCode || "",
				},
			};
		} else {
			finalPayload = {
				...basePayload,
				description: `Staff Request: ${data.requesterNote}`,
			};
		}

		placeRequestMutation.mutate(finalPayload);
	};

	const handleClose = () => {
		reset();
		setActiveStep(0);
		setPatronData(null);
		placeRequestMutation.reset();
		validatePatronMutation.reset();
		setStepError(null); // Reset step error
		onClose();
	};

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
						patronValidated={activeStep !== 0}
						isValidatingPatron={validatePatronMutation.isPending}
						handleClose={handleClose}
						validatePatron={validatePatron}
						patronBarcode={patronBarcode}
						agencyCode={agencyCode}
						libraryOptions={libraryOptions}
						librariesLoading={librariesDataLoading}
						t={t}
					/>
				);
			case 1:
				return (
					<StaffRequestDetailsStep
						control={anyControl}
						errors={errors}
						watch={watch}
						setValue={setValue}
						pickupLocationOptions={sortedPickupLocationOptions}
						pickupLocationsLoading={pickupLocationsLoading}
						getPickupLocations={getPickupLocations}
						itemLibraryOptions={itemLibraryOptions}
						librariesLoading={librariesDataLoading}
						itemOptions={itemOptions}
						itemsLoading={itemsLoading}
						itemsError={itemsError}
						fetchItems={fetchItems}
						handleClose={handleClose}
						isSubmitting={placeRequestMutation.isPending}
						isValid={isValid}
						t={t}
					/>
				);
			default:
				return "Unknown step";
		}
	};

	return (
		<>
			<DialogContent>
				{/* Same style as Expedited Checkout */}
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
							error?: boolean;
						} = {};
						const isActive = index === activeStep;
						const isCompleted = index < activeStep;
						const hasError = stepError === index;

						if (isCompleted) {
							stepProps.completed = true;
						}
						if (hasError) {
							labelProps.error = true;
						}

						return (
							<Step key={label} {...stepProps}>
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
			{/* </Dialog> */}
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
