import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { isEmpty } from "lodash";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormHelperText,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import TimedAlert from "@components/TimedAlert/TimedAlert";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { mappingsCategoryConverter } from "@helpers/mappingsCategoryConverter";
import {
	canonicalItemTypes,
	canonicalPatronTypes,
	validCategories,
} from "@constants/mappingsImportConstants";
import { createReferenceValueMapping } from "@mutations/createReferenceValueMapping";

interface NewMappingFormData {
	toValue: string;
	toCategory: string;
	toContext: string;
	fromValue: string;
	fromContext: string;
	fromCategory: string;
	reason?: string;
	changeCategory?: string;
	changeReferenceUrl?: string;
}

interface ServerError {
	message: string;
	field?: string;
}

type NewMappingFormType = {
	show: boolean;
	onClose: () => void;
	category: string;
	hostLmsCode: string;
	agencyCode: string;
	libraryName: string;
};

export default function NewMapping({
	show,
	onClose,
	category,
	hostLmsCode,
	agencyCode,
	libraryName,
}: NewMappingFormType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [serverErrors, setServerErrors] = useState<Record<string, any>>({});
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
	});

	const contextOptions = ["DCB", hostLmsCode];

	const validationSchema = Yup.object().shape({
		fromCategory: Yup.string()
			.required(
				t("ui.validation.required", { field: t("mappings.new.from_category") }),
			)
			.oneOf(validCategories)
			.max(64),
		fromContext: Yup.string()
			.required(
				t("ui.validation.required", { field: t("mappings.new.from_context") }),
			)
			.oneOf(contextOptions)
			.max(64)
			.test(
				"not-same-context",
				t("mappings.new.error.validation.same_contexts"),
				function (val) {
					const toContext = this.parent.toContext;
					return !toContext || !val || toContext !== val;
				},
			),
		fromValue: Yup.string()
			.required(
				t("ui.validation.required", { field: t("mappings.new.from_value") }),
			)
			.max(255)
			.when(["fromContext", "fromCategory"], {
				is: (fcCtx: string, fcCat: string) =>
					fcCtx === "DCB" && fcCat === "ItemType",
				then: (schema) =>
					schema.oneOf(
						canonicalItemTypes,
						t("mappings.new.error.validation.invalid_from_item_type"),
					),
			})
			.when(["fromContext", "fromCategory"], {
				is: (fcCtx: string, fcCat: string) =>
					fcCtx === "DCB" && fcCat === "patronType",
				then: (schema) =>
					schema.oneOf(
						canonicalPatronTypes,
						t("mappings.new.error.validation.invalid_from_patron_type"),
					),
			}),
		toCategory: Yup.string()
			.required(
				t("ui.validation.required", { field: t("mappings.new.to_category") }),
			)
			.max(64),
		toContext: Yup.string()
			.required(
				t("ui.validation.required", { field: t("mappings.new.to_context") }),
			)
			.oneOf(contextOptions)
			.max(64)
			.when("fromContext", {
				is: (val: string) => !!val,
				then: (schema) =>
					schema.notOneOf(
						[Yup.ref("fromContext")],
						t("mappings.new.error.validation.same_contexts"),
					),
			}),
		toValue: Yup.string()
			.required(
				t("ui.validation.required", { field: t("mappings.new.to_value") }),
			)
			.max(255)
			.when(["toContext", "toCategory"], {
				is: (tcCtx: string, tcCat: string) =>
					tcCtx === "DCB" && tcCat === "ItemType",
				then: (schema) =>
					schema.oneOf(
						canonicalItemTypes,
						t("mappings.new.error.validation.invalid_to_item_type"),
					),
			})
			.when(["toContext", "toCategory"], {
				is: (tcCtx: string, tcCat: string) =>
					tcCtx === "DCB" && tcCat === "patronType",
				then: (schema) =>
					schema.oneOf(
						canonicalPatronTypes,
						t("mappings.new.error.validation.invalid_to_patron_type"),
					),
			}),
	});

	const parseServerError = (error: any): ServerError => {
		const message = error.message || "An unknown error occurred";
		if (
			message.match(/patronType.*values for this mapping are/) &&
			message.match(/to value/)
		)
			return { message, field: "toValue" };
		if (
			message.match(/ItemType.*values for this mapping are/) &&
			message.match(/to value/)
		)
			return { message, field: "toValue" };
		if (
			message.match(/patronType.*values for this mapping are/) &&
			message.match(/from value/)
		)
			return { message, field: "fromValue" };
		if (
			message.match(/ItemType.*values for this mapping are/) &&
			message.match(/from value/)
		)
			return { message, field: "fromValue" };
		if (message.match(/Location mapping must have/))
			return { message, field: "toContext" };
		if (
			message.match(/duplicate 'from' values/) ||
			message.match(/already exists for the/) ||
			message.match(/blank values/)
		)
			return { message, field: "fromValue" };
		return { message };
	};

	const {
		control,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isValid, isDirty },
		watch,
		trigger,
		setValue,
	} = useForm<NewMappingFormData>({
		defaultValues: {
			toValue: category === "Location" ? agencyCode : "",
			toContext: category === "Location" ? "DCB" : "",
			toCategory: category === "Location" ? "AGENCY" : category,
			fromValue: "",
			fromCategory: category,
			fromContext: category === "Location" ? hostLmsCode : "",
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		resolver: yupResolver(validationSchema) as any,
		mode: "onChange",
	});

	const { mutateAsync: createMapping, isPending } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(createReferenceValueMapping, variables),
		onSuccess: () => queryClient.invalidateQueries(), // Broad refresh to update any active grid
	});

	const handleFromContextChange = useCallback(
		(field: any, event: any) => {
			const newValue = event.target.value;
			field.onChange(event);

			if (newValue === "DCB")
				setValue("toContext", hostLmsCode, { shouldValidate: false });
			else if (newValue === hostLmsCode)
				setValue("toContext", "DCB", { shouldValidate: false });

			Promise.all([trigger("fromContext"), trigger("toContext")]);
		},
		[trigger, setValue, hostLmsCode],
	);

	const fromContext = watch("fromContext");
	const fromCategory = watch("fromCategory");
	const toContext = watch("toContext");
	const toCategory = watch("toCategory");

	const getAvailableValues = (context: string, cat: string) => {
		if (context === "DCB" && cat === "ItemType") return canonicalItemTypes;
		if (context === "DCB" && cat === "patronType") return canonicalPatronTypes;
		return null;
	};

	const fromValues = getAvailableValues(fromContext, fromCategory);
	const toValues = getAvailableValues(toContext, toCategory);

	const onSubmit = async (data: NewMappingFormData) => {
		try {
			setServerErrors({});
			await createMapping({
				input: { ...data },
			});
			setAlert({
				open: true,
				severity: "success",
				text: t("mappings.new.success"),
			});
			setTimeout(() => {
				reset();
				onClose();
			}, 1000);
		} catch (error) {
			const parsedError = parseServerError(error);
			if (parsedError.field) {
				setError(parsedError.field as keyof NewMappingFormData, {
					type: "server",
					message: parsedError.message,
				});
			} else {
				setAlert({
					open: true,
					severity: "error",
					text: t("mappings.new.error.generic", { library: libraryName }),
				});
			}
		}
	};

	return (
		<>
			<Dialog open={show} onClose={onClose} fullWidth maxWidth="sm">
				<DialogTitle variant="modalTitle">
					{t("mappings.new.title_modal", {
						category: mappingsCategoryConverter(category),
						code: hostLmsCode,
					})}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Box
						component="form"
						onSubmit={handleSubmit(onSubmit)}
						sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
					>
						{!isEmpty(category) ? (
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
								mb={1}
							>
								<Grid size={{ xs: 2, sm: 4, md: 4 }}>
									<Stack>
										<Typography variant="attributeTitle">
											{t("mappings.new.from_category")}
										</Typography>
										<RenderAttribute attribute={fromCategory} />
									</Stack>
								</Grid>
								<Grid size={{ xs: 2, sm: 4, md: 4 }}>
									<Stack>
										<Typography variant="attributeTitle">
											{t("mappings.new.to_category")}
										</Typography>
										<RenderAttribute attribute={toCategory} />
									</Stack>
								</Grid>
								{category === "Location" && (
									<>
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack>
												<Typography variant="attributeTitle">
													{t("mappings.new.from_context")}
												</Typography>
												<RenderAttribute attribute={fromContext} />
											</Stack>
										</Grid>
										<Grid size={{ xs: 2, sm: 4, md: 4 }}>
											<Stack>
												<Typography variant="attributeTitle">
													{t("mappings.new.to_context")}
												</Typography>
												<RenderAttribute attribute={toContext} />
											</Stack>
										</Grid>
									</>
								)}
							</Grid>
						) : (
							<Box
								sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
							>
								<Controller
									name="fromCategory"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											label={t("mappings.new.from_category")}
											disabled={!isEmpty(category)}
											required
											error={!!errors.fromCategory}
											helperText={errors.fromCategory?.message}
										/>
									)}
								/>
								<Controller
									name="toCategory"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											label={t("mappings.new.to_category")}
											disabled={!isEmpty(category)}
											required
											error={!!errors.toCategory}
											helperText={errors.toCategory?.message}
										/>
									)}
								/>
							</Box>
						)}

						{category !== "Location" && (
							<Controller
								name="fromContext"
								control={control}
								render={({ field }) => (
									<FormControl fullWidth error={!!errors.fromContext}>
										<InputLabel>{t("mappings.new.from_context")}</InputLabel>
										<Select
											{...field}
											label={t("mappings.new.from_context")}
											onChange={(e) => handleFromContextChange(field, e)}
										>
											{contextOptions.map((opt) => (
												<MenuItem key={opt} value={opt}>
													{opt}
												</MenuItem>
											))}
										</Select>
										{errors.fromContext && (
											<FormHelperText>
												{errors.fromContext.message}
											</FormHelperText>
										)}
									</FormControl>
								)}
							/>
						)}

						<Controller
							name="fromValue"
							control={control}
							render={({ field }) =>
								fromValues ? (
									<FormControl fullWidth error={!!errors.fromValue}>
										<InputLabel>{t("mappings.new.from_value")}</InputLabel>
										<Select {...field} label={t("mappings.new.from_value")}>
											{fromValues.map((val) => (
												<MenuItem key={val} value={val}>
													{val}
												</MenuItem>
											))}
										</Select>
										{errors.fromValue && (
											<FormHelperText>
												{errors.fromValue.message}
											</FormHelperText>
										)}
									</FormControl>
								) : (
									<TextField
										{...field}
										label={t("mappings.new.from_value")}
										required
										error={!!errors.fromValue}
										helperText={errors.fromValue?.message}
									/>
								)
							}
						/>

						{category !== "Location" && (
							<Controller
								name="toContext"
								control={control}
								render={({ field }) => (
									<FormControl fullWidth error={!!errors.toContext}>
										<InputLabel>{t("mappings.new.to_context")}</InputLabel>
										<Select {...field} label={t("mappings.new.to_context")}>
											{contextOptions.map((opt) => (
												<MenuItem key={opt} value={opt}>
													{opt}
												</MenuItem>
											))}
										</Select>
										{errors.toContext && (
											<FormHelperText>
												{errors.toContext.message}
											</FormHelperText>
										)}
									</FormControl>
								)}
							/>
						)}

						<Controller
							name="toValue"
							control={control}
							render={({ field }) =>
								toValues ? (
									<FormControl fullWidth error={!!errors.toValue}>
										<InputLabel>{t("mappings.new.to_value")}</InputLabel>
										<Select {...field} label={t("mappings.new.to_value")}>
											{toValues.map((val) => (
												<MenuItem key={val} value={val}>
													{val}
												</MenuItem>
											))}
										</Select>
										{errors.toValue && (
											<FormHelperText>{errors.toValue.message}</FormHelperText>
										)}
									</FormControl>
								) : (
									<TextField
										{...field}
										label={t("mappings.new.to_value")}
										required
										error={!!errors.toValue}
										helperText={errors.toValue?.message}
									/>
								)
							}
						/>

						<Controller
							name="reason"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("data_change_log.reason_addition")}
									error={!!errors.reason}
									helperText={errors.reason?.message}
								/>
							)}
						/>
						<Controller
							name="changeReferenceUrl"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("data_change_log.reference_url")}
									error={!!errors.changeReferenceUrl}
									helperText={errors.changeReferenceUrl?.message}
								/>
							)}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={onClose} variant="outlined">
						{t("mappings.cancel")}
					</Button>
					<Box sx={{ flex: 1 }} />
					<Button
						variant="contained"
						disabled={!isValid || !isDirty || isPending}
						onClick={handleSubmit(onSubmit)}
					>
						{isPending ? t("ui.action.submitting") : t("mappings.new.title")}
					</Button>
				</DialogActions>
			</Dialog>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				autoHideDuration={6000}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</>
	);
}
