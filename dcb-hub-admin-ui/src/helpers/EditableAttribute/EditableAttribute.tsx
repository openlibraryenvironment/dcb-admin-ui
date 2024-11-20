import { useEffect } from "react";
import { Switch, TextField, useTheme } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import RenderAttribute from "../RenderAttribute/RenderAttribute";
import * as Yup from "yup";
import { useTranslation } from "next-i18next";

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
		return <RenderAttribute attribute={value} />;
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
