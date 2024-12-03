import { useEffect } from "react";
import { Box, Switch, TextField, useTheme } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import RenderAttribute from "../RenderAttribute/RenderAttribute";
import * as Yup from "yup";
import { useTranslation } from "next-i18next";
import ReactMarkdown from "react-markdown";
import { CustomLink } from "@components/MarkdownInput/MarkdownInput";

interface EditableAttributeProps {
	field: string;
	value: any; // may need further typing
	updateField: any;
	editMode: boolean;
	type: string;
	inputRef?: React.RefObject<HTMLInputElement>;
	setValidationError: (error: boolean) => void;
	setDirty: (dirty: boolean) => void;
	setErrors: (errors: any) => void;
}

export default function EditableAttribute({
	field,
	value,
	updateField,
	editMode,
	type,
	inputRef,
	setValidationError,
	setDirty,
	setErrors,
}: EditableAttributeProps) {
	const { t } = useTranslation();
	const theme = useTheme();

	const getValidationSchema = () => {
		switch (type) {
			case "float":
				return Yup.number().typeError(t("ui.data_grid.edit_float"));
			case "latitude":
				return Yup.number()
					.typeError(t("ui.data_grid.edit_lat"))
					.min(-90)
					.max(90);
			case "longitude":
				return Yup.number()
					.typeError(t("ui.data_grid.edit_long"))
					.min(-180)
					.max(180);
			case "integer":
				return Yup.number()
					.integer(t("ui.data_grid.edit_int"))
					.typeError(t("ui.data_grid.edit_int"));
			case "url":
				return Yup.string()
					.url(t("ui.data_grid.edit_url"))
					.typeError(t("ui.data_grid.edit_url"))
					.required(t("ui.data_grid.edit_url_required"));
			default:
				return Yup.string();
		}
	};

	const validationSchema = Yup.object().shape({
		[field]: getValidationSchema(),
	});

	const {
		control,
		handleSubmit,
		formState: { errors, isValid, isDirty },
	} = useForm({
		defaultValues: { [field]: value || (type === "boolean" ? false : "") },
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	useEffect(() => {
		setValidationError(!isValid);
		setDirty(isDirty);
		setErrors(errors);
	}, [isValid, isDirty, errors, setValidationError, setDirty, setErrors]);

	const onSubmit = (data: any) => {
		updateField(field, data[field]);
	};

	if (!editMode) {
		if (type == "markdown") {
			return <ReactMarkdown>{value || ""}</ReactMarkdown>;
		} else {
			return <RenderAttribute attribute={value} type={type} />;
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} aria-label={field}>
			<Controller
				name={field}
				control={control}
				render={({ field: { onChange, onBlur, value, ref } }) =>
					type === "boolean" ? (
						<Switch
							checked={Boolean(value)}
							onChange={(e) => {
								onChange(e);
								handleSubmit(onSubmit)();
							}}
							disabled={!editMode}
							inputRef={inputRef || ref}
							color="primary"
						/>
					) : type === "markdown" ? (
						<Box>
							<TextField
								multiline
								fullWidth
								minRows={4}
								value={value || ""}
								onChange={(e) => {
									onChange(e);
									handleSubmit(onSubmit)();
								}}
								error={Boolean(errors[field])}
								helperText={errors[field] ? String(errors[field]?.message) : ""}
								placeholder="Enter description (supports Markdown)"
								variant="outlined"
								sx={{
									backgroundColor: errors[field]
										? theme.palette.primary.errorBackground
										: theme.palette.primary.editableFieldBackground,
									mb: 2, // Add margin bottom to separate text input from preview
								}}
							/>
							{value && (
								<Box
									sx={{
										border: `1px solid ${theme.palette.divider}`,
										p: 2,
										borderRadius: 1,
										"& a": {
											color: theme.palette.primary.main,
											textDecoration: "underline",
										},
										"& code": {
											backgroundColor: theme.palette.grey[100],
											padding: "2px 4px",
											borderRadius: "4px",
											fontFamily: "monospace",
										},
									}}
								>
									<ReactMarkdown
										components={{
											a: CustomLink,
										}}
									>
										{value || ""}
									</ReactMarkdown>
								</Box>
							)}
						</Box>
					) : (
						<TextField
							aria-labelledby={field}
							value={value}
							onChange={onChange}
							onBlur={() => {
								onBlur();
								handleSubmit(onSubmit)();
							}}
							error={Boolean(errors[field])}
							helperText={
								errors[field]
									? type === "longitude"
										? t("ui.data_grid.edit_long")
										: type === "latitude"
											? t("ui.data_grid.edit_lat")
											: String(errors[field]?.message)
									: type === "longitude"
										? t("ui.data_grid.edit_long")
										: type === "latitude"
											? t("ui.data_grid.edit_lat")
											: ""
							}
							disabled={!editMode}
							variant="outlined"
							type="text"
							inputMode={
								type === "integer" || type === "float" ? "numeric" : undefined
							}
							inputProps={{
								"aria-label": field,
								pattern:
									type === "integer"
										? "[0-9]*"
										: type === "float"
											? "[0-9]*[.,]?[0-9]*"
											: undefined,
							}}
							inputRef={inputRef || ref}
							sx={{
								backgroundColor: errors[field]
									? theme.palette.primary.errorBackground
									: theme.palette.primary.editableFieldBackground,
							}}
							multiline={field == "description" ? true : false}
						/>
					)
				}
			/>
		</form>
	);
}
