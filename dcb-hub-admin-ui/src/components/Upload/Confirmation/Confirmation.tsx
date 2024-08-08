// A modal to confirm or cancel file uploads. Originally built for Circulation status mappings.
import Alert from "@components/Alert/Alert";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	useTheme,
	Box,
	Typography,
	Divider,
	TextField,
	Stack,
	Autocomplete,
	CircularProgress,
} from "@mui/material";
import { Form, Formik } from "formik";
import { Trans, useTranslation } from "next-i18next";
import { useMemo } from "react";
import {
	getConfirmationFirstPara,
	getConfirmationSecondPara,
} from "src/helpers/getConfirmationText";
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
	library?: string;
	mappingCategory?: string;
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
	library,
	mappingCategory,
}: ConfirmType) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const validationSchema = useMemo(
		() =>
			Yup.object({
				reason: Yup.string()
					.required(t("data_change_log.reason_required"))
					.max(200, t("data_change_log.max_length_exceeded")),
				changeCategory: Yup.string()
					.required(t("data_change_log.category_required"))
					.max(200, t("data_change_log.max_length_exceeded")),
				changeReferenceUrl: Yup.string().max(
					200,
					t("data_change_log.max_length_exceeded"),
				),
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

	const getHeaderText = () => {
		switch (type) {
			case "mappings":
				return t("mappings.confirmation_header", {
					category: mappingCategory?.toLowerCase(),
				});
			case "participationStatus":
				switch (participation) {
					// Fill these out with the relevant text, buttons etc
					case "enableSupplying":
						return t(
							"libraries.circulation.confirmation.header_enable_supplying",
							{ library: library },
						);
					case "disableSupplying":
						return t(
							"libraries.circulation.confirmation.header_disable_supplying",
							{ library: library },
						);
					case "enableBorrowing":
						return t(
							"libraries.circulation.confirmation.header_enable_borrowing",
							{ library: library },
						);
					case "disableBorrowing":
						return t(
							"libraries.circulation.confirmation.header_disable_borrowing",
							{ library: library },
						);
					default:
						return null;
				}
			default:
				return null;
		}
	};
	const getDialogContent = () => {
		switch (type) {
			case "mappings":
				return (
					<Box>
						<Trans
							i18nKey="mappings.confirmation_body"
							values={{
								category: mappingCategory?.toLowerCase(),
								existingMappingCount,
								code,
								fileName,
							}}
							components={{ paragraph: <p />, bold: <strong /> }}
						/>
						<Alert
							severityType="warning"
							alertText={t("mappings.confirmation_warning", {
								mappings: mappingCategory?.toLowerCase(),
							})}
							textColor={theme.palette.common.black}
						/>
						{t("mappings.confirmation_replace")}
					</Box>
				);
			case "participationStatus":
				return (
					<Box>
						<Typography component={"p"} mb={1}>
							<Trans
								i18nKey={getConfirmationFirstPara(participation ?? "")}
								values={{ library }}
								components={{ bold: <strong /> }}
							/>
							<Typography mt={1}>
								{t(getConfirmationSecondPara(participation ?? ""))}
							</Typography>
						</Typography>
					</Box>
				);
			default:
				return null;
		}
	};

	const getButtonText = () => {
		switch (type) {
			case "mappings":
				return t("mappings.confirmation_replace_mappings");
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
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onClose={onClose} aria-labelledby="confirmation-modal">
			{/* // Enforcing the style of bold, centered modal or dialog headers */}
			<DialogTitle variant="modalTitle">{getHeaderText()}</DialogTitle>
			<Divider aria-hidden="true"></Divider>
			<DialogContent>
				<Formik
					initialValues={{
						reason: "",
						changeCategory: "",
						changeReferenceUrl: "",
					}}
					validationSchema={validationSchema}
					validateOnMount
					onSubmit={(values) => {
						onConfirm(
							values.reason,
							values.changeCategory,
							values.changeReferenceUrl,
						);
					}}
				>
					{({
						values,
						errors,
						touched,
						dirty,
						handleChange,
						handleBlur,
						setFieldValue,
						setFieldTouched,
						isValid,
						isSubmitting,
					}) => (
						<Form>
							<Stack direction="column" spacing={2}>
								{getDialogContent()}
								<Autocomplete
									options={[
										t("data_change_log.categories.error_correction"),
										t("data_change_log.categories.details_changed"),
										t("data_change_log.categories.new_member"),
										t("data_change_log.categories.membership_ended"),
										t("data_change_log.categories.additional_information"),
										t("data_change_log.categories.changing_status"),
										t("data_change_log.categories.initial_upload"),
										t("data_change_log.categories.mappings_replacement"),
										t("data_change_log.categories.other"),
									]}
									value={values.changeCategory || null}
									onChange={(event, newValue) => {
										setFieldValue("changeCategory", newValue || "");
									}}
									onBlur={() => setFieldTouched("changeCategory", true)}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											name="changeCategory"
											label={t("data_change_log.category")}
											helperText={
												touched.changeCategory && errors.changeCategory
													? errors.changeCategory
													: null
											}
											error={
												touched.changeCategory && Boolean(errors.changeCategory)
											}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option === value || (!option && !value)
									}
								/>
								<TextField
									fullWidth
									required
									multiline
									variant="outlined"
									label={t("data_change_log.reason")}
									name="reason"
									value={values.reason}
									onChange={handleChange}
									onBlur={handleBlur}
									margin="normal"
									error={
										touched.reason &&
										(Boolean(errors.reason) || values.reason.length >= 200)
									}
									helperText={
										touched.reason && errors.reason ? errors.reason : null
									}
									inputProps={{ maxLength: 200 }}
								/>
								<TextField
									fullWidth
									variant="outlined"
									label={t("data_change_log.reference_url")}
									name="changeReferenceUrl"
									value={values.changeReferenceUrl}
									onChange={handleChange}
									onBlur={handleBlur}
									margin="normal"
									error={
										touched.changeReferenceUrl &&
										(Boolean(errors.changeReferenceUrl) ||
											values.changeReferenceUrl.length >= 200)
									}
									helperText={
										touched.changeReferenceUrl && errors.changeReferenceUrl
											? errors.changeReferenceUrl
											: getCharCountHelperText(
													values.changeReferenceUrl,
													200,
													t("data_change_log.ref_url_helper"),
												)
									}
									inputProps={{ maxLength: 200 }}
								/>
							</Stack>
							<DialogActions>
								<Button onClick={onClose} variant="outlined" color="primary">
									{t("mappings.cancel")}
								</Button>
								<div style={{ flex: "1 0 0" }} />
								<Button
									type="submit"
									color="primary"
									variant="contained"
									disabled={
										!isValid ||
										!dirty ||
										!values.reason ||
										!values.changeCategory ||
										isSubmitting
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
							</DialogActions>
						</Form>
					)}
				</Formik>
			</DialogContent>
		</Dialog>
	);
};
export default Confirmation;
