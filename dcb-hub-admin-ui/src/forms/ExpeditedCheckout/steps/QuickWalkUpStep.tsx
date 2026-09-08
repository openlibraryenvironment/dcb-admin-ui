import {
	Autocomplete,
	Button,
	CircularProgress,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { TFunction } from "i18next";
import {
	Control,
	Controller,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { useEffect } from "react";
import { QuickWalkUpFormData } from "@models/QuickWalkUpFormData";

interface QuickWalkUpRequestStepProps {
	control: Control<QuickWalkUpFormData>;
	setValue: UseFormSetValue<QuickWalkUpFormData>;
	watch: UseFormWatch<QuickWalkUpFormData>;
	errors: FieldErrors<QuickWalkUpFormData>;
	pickupLocationOptions: PatronRequestAutocompleteOption[];
	pickupLocationsLoading: boolean;
	handleClose: () => void;
	isValid: boolean;
	isSubmitting: boolean;
	t: TFunction;
}

export const QuickWalkUpRequestStep = ({
	control,
	setValue,
	watch,
	errors,
	pickupLocationOptions,
	pickupLocationsLoading,
	handleClose,
	isValid,
	isSubmitting,
	t,
}: QuickWalkUpRequestStepProps) => {
	// Auto-select the first pickup location
	useEffect(() => {
		if (pickupLocationOptions.length > 0 && !watch("pickupLocationCode")) {
			setValue("pickupLocationCode", pickupLocationOptions[0].value, {
				shouldValidate: true,
			});
		}
	}, [pickupLocationOptions, setValue, watch]);

	return (
		<>
			<Typography id="walk-up-title" variant="body1" sx={{ mb: 2 }}>
				{t("requesting.expedited_checkout.steps.quick_walk_up.instructions")}
			</Typography>

			<Controller
				name="itemBarcode"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						margin="normal"
						required
						fullWidth
						id="itemBarcode"
						label={t("patron_request.item_barcode")}
						error={!!errors.itemBarcode}
						helperText={errors.itemBarcode?.message}
					/>
				)}
			/>

			<Controller
				name="pickupLocationCode"
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							pickupLocationOptions.find((option) => option.value === value) ||
							null
						}
						onChange={(_, newValue) => onChange(newValue?.value || "")}
						options={pickupLocationOptions}
						loading={pickupLocationsLoading}
						getOptionLabel={(option) => option.label}
						id="pickup-location-select"
						renderInput={(params) => (
							<TextField
								{...params}
								margin="normal"
								required
								fullWidth
								label={t("requesting.staff_request.patron.pickup_location")}
								error={!!errors.pickupLocationCode}
								helperText={errors.pickupLocationCode?.message}
							/>
						)}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
					/>
				)}
			/>

			<Stack spacing={1} direction={"row"} sx={{ mt: 2 }}>
				<Button variant="outlined" onClick={handleClose} id="walk-up-cancel">
					{t("ui.actions.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				<Button
					type="submit"
					color="primary"
					variant="contained"
					id="walk-up-create-request"
					disabled={!isValid || isSubmitting}
				>
					{isSubmitting ? (
						<CircularProgress size={24} />
					) : (
						t("requesting.expedited_checkout.create_request")
					)}
				</Button>
			</Stack>
		</>
	);
};
