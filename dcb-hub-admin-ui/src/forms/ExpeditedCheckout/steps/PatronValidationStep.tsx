import {
	Autocomplete,
	Button,
	CircularProgress,
	Stack,
	TextField,
} from "@mui/material";
import { TFunction } from "i18next";
import {
	Control,
	Controller,
	FieldErrors,
	FieldValues,
	Path,
} from "react-hook-form";
import { AutocompleteOption } from "@models/AutocompleteOption";

// 1. Declare TFieldValues generic on the props interface
interface PatronValidationStepProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	errors: FieldErrors<TFieldValues>;
	patronValidated: boolean;
	isValidatingPatron: boolean;
	handleClose: () => void;
	validatePatron: () => void;
	patronBarcode: string;
	agencyCode: string;
	libraryOptions: AutocompleteOption[];
	librariesLoading: boolean;
	t: TFunction;
}

// 2. Pass the TFieldValues generic constraints straight to the component definition
export const PatronValidationStep = <TFieldValues extends FieldValues>({
	control,
	errors,
	isValidatingPatron,
	handleClose,
	validatePatron,
	patronBarcode,
	agencyCode,
	libraryOptions,
	librariesLoading,
	t,
}: PatronValidationStepProps<TFieldValues>) => {
	return (
		<Stack spacing={2} sx={{ mt: 2 }}>
			<Controller
				// 3. Cast the literal key string to Path<TFieldValues>
				name={"patronBarcode" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("requesting.staff_request.patron.barcode")}
						variant="outlined"
						fullWidth
						required
						error={!!errors["patronBarcode" as keyof FieldErrors<TFieldValues>]}
						helperText={
							errors["patronBarcode" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Controller
				name={"agencyCode" as Path<TFieldValues>} // Surely there's a better way than this ...
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							libraryOptions.find((option) => option.value === value) || null
						}
						onChange={(_, newValue: AutocompleteOption | null) => {
							onChange(newValue?.value || "");
						}}
						options={libraryOptions}
						loading={librariesLoading}
						getOptionLabel={(option: AutocompleteOption) => option.label}
						renderInput={(params) => (
							<TextField
								{...params}
								required
								label={t("agency.code")}
								error={
									!!errors["agencyCode" as keyof FieldErrors<TFieldValues>]
								}
								helperText={
									errors["agencyCode" as keyof FieldErrors<TFieldValues>]
										?.message as string
								}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{librariesLoading ? (
												<CircularProgress color="inherit" size={20} />
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
					/>
				)}
			/>

			<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
				<Button variant="outlined" onClick={handleClose}>
					{t("ui.actions.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				<Button
					variant="contained"
					color="primary"
					disabled={!patronBarcode || !agencyCode || isValidatingPatron}
					onClick={validatePatron}
				>
					{isValidatingPatron ? (
						<CircularProgress size={24} color="inherit" />
					) : (
						t("ui.actions.validate")
					)}
				</Button>
			</Stack>
		</Stack>
	);
};
