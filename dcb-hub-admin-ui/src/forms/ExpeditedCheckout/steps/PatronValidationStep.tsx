import { OnSiteBorrowingFormData } from "@models/OnSiteBorrowingFormData";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import {
	Autocomplete,
	Button,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { TFunction } from "next-i18next";
import { Control, Controller, FieldErrors } from "react-hook-form";

// Step 1: Patron Validation Component: this is step 1 in the expedited checkout workflow
type PatronValidationStepType = {
	control: Control<OnSiteBorrowingFormData, any>;
	errors: FieldErrors<OnSiteBorrowingFormData>;
	patronValidated: boolean;
	isValidatingPatron: boolean;
	handleClose: () => void;
	validatePatron: () => void;
	patronBarcode: string;
	agencyCode: string;
	libraryOptions: PatronRequestAutocompleteOption[];
	librariesLoading: boolean;
	t: TFunction;
};
export const PatronValidationStep = ({
	control,
	errors,
	patronValidated,
	isValidatingPatron,
	handleClose,
	validatePatron,
	patronBarcode,
	agencyCode,
	libraryOptions,
	librariesLoading,
	t,
}: PatronValidationStepType) => {
	return (
		<>
			<Typography variant="body1" paragraph>
				{t("expedited_checkout.steps.patron_validation_instruction")}
			</Typography>

			<Controller
				name="agencyCode"
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							value
								? libraryOptions.find((option) => option.value === value) ||
									null
								: null
						}
						onChange={(_, newValue) => {
							onChange(newValue?.value || "");
						}}
						options={libraryOptions}
						loading={librariesLoading}
						getOptionLabel={(option) => option.label}
						renderInput={(params) => (
							<TextField
								{...params}
								margin="normal"
								required
								label={t("staff_request.patron.affiliated")}
								error={!!errors.agencyCode}
								helperText={errors.agencyCode?.message}
								disabled={patronValidated}
							/>
						)}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
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
			<Stack spacing={1} direction={"row"}>
				<Button variant="outlined" onClick={handleClose}>
					{t("mappings.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				<Button
					color="primary"
					variant="contained"
					onClick={validatePatron}
					disabled={isValidatingPatron || !patronBarcode || !agencyCode}
				>
					{isValidatingPatron
						? t("staff_request.patron.validating")
						: t("staff_request.patron.validate")}
				</Button>
			</Stack>
		</>
	);
};
