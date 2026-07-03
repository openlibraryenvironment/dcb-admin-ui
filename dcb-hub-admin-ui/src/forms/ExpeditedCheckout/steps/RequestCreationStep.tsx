import { OnSiteBorrowingFormData } from "@models/OnSiteBorrowingFormData";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
// import { StaffRequestFormData } from "@models/StaffRequestFormData";
import {
	Autocomplete,
	Button,
	CircularProgress,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { TFunction } from "i18next";
import { isEmpty } from "lodash";
import {
	Control,
	Controller,
	FieldErrors,
	FieldValues,
	Path,
	UseFormSetValue,
} from "react-hook-form";

// Step two: request creation / placing
interface RequestCreationStepType<TFieldValues extends FieldValues> {
	// control:
	// 	| Control<OnSiteBorrowingFormData, any>
	// 	| Control<StaffRequestFormData, any>; // itemLibraryOptions: PatronRequestAutocompleteOption[];
	// itemLibrariesLoading: boolean;
	control: Control<TFieldValues>;
	setValue: UseFormSetValue<OnSiteBorrowingFormData>;
	errors: FieldErrors<OnSiteBorrowingFormData>;
	pickupLocationOptions: PatronRequestAutocompleteOption[];
	pickupLocationsLoading: boolean;
	itemAgencyCode: string;
	itemOptions: PatronRequestAutocompleteOption[];
	itemsError: boolean;
	itemsLoading: boolean;
	handleClose: () => void;
	isValid: boolean;
	isSubmitting: boolean;
	pickupLocationId: string;
	t: TFunction;
}
// need to pass in the item library and agency code and local system code
export const RequestCreationStep = <TFieldValues extends FieldValues>({
	control,
	errors,
	pickupLocationOptions,
	pickupLocationsLoading,
	itemAgencyCode,
	itemOptions,
	itemsError,
	itemsLoading,
	handleClose,
	isValid,
	isSubmitting,
	pickupLocationId,
	t,
}: RequestCreationStepType<TFieldValues>) => {
	console.log(errors);
	return (
		<>
			<Typography>
				{t("requesting.expedited_checkout.steps.request_creation_instruction")}
			</Typography>
			{/* Do a pre-selected entry for the item library  - DCB Admin is different*/}
			{/* <Controller
				name="itemAgencyCode"
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							value
								? itemLibraryOptions.find((option) => option.value === value) ||
									null
								: null
						}
						onChange={(_, newValue: PatronRequestAutocompleteOption | null) => {
							onChange(newValue?.value || "");
							// Set the Host LMS code ("localSystemCode") also - this now defaults only to the agency's Host LMS code.
							setValue("itemLocalSystemCode", newValue?.hostLmsCode ?? "");
						}}
						options={itemLibraryOptions}
						getOptionLabel={(option: PatronRequestAutocompleteOption) =>
							option.label
						}
						renderInput={(params) => (
							<TextField
								{...params}
								margin="normal"
								required
								fullWidth
								id="itemAgencyCode"
								label={t("requesting.staff_request.patron.item_library")}
								error={!!errors.itemAgencyCode}
								helperText={errors.itemAgencyCode?.message}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{itemLibrariesLoading ? (
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
						loading={itemLibrariesLoading}
					/>
				)}
			/> */}
			<Controller
				name={"pickupLocationId" as Path<TFieldValues>}
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							pickupLocationOptions.find((option) => option.value === value) ||
							null
						}
						onChange={(_, newValue: PatronRequestAutocompleteOption | null) => {
							onChange(newValue?.value || "");
						}}
						options={pickupLocationOptions}
						loading={pickupLocationsLoading}
						getOptionLabel={(option: PatronRequestAutocompleteOption) =>
							option.label
						}
						groupBy={(option) => option.agencyName || ""}
						renderInput={(params) => (
							<TextField
								{...params}
								margin="normal"
								required
								label={t("requesting.staff_request.patron.pickup_location")}
								error={!!errors.pickupLocationId}
								helperText={errors.pickupLocationId?.message}
							/>
						)}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
					/>
				)}
			/>
			<Controller
				name={"itemLocalId" as Path<TFieldValues>}
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							value
								? itemOptions.find((option) => option.value === value) || null
								: null
						}
						onChange={(_, newValue: PatronRequestAutocompleteOption | null) => {
							onChange(newValue?.value || "");
						}}
						options={itemOptions}
						getOptionLabel={(option: PatronRequestAutocompleteOption) =>
							option.label
						}
						disabled={isEmpty(itemAgencyCode)}
						renderInput={(params) => (
							<TextField
								{...params}
								margin="normal"
								required
								fullWidth
								id="itemLocalId"
								label={t("requesting.staff_request.patron.item_local_id")}
								error={!!errors.itemLocalId || itemsError}
								helperText={errors.itemLocalId?.message}
								slotProps={{
									...params.slotProps,

									input: {
										...params.slotProps.input,
										endAdornment: (
											<>
												{itemsLoading ? (
													<CircularProgress color="inherit" size={20} />
												) : null}
												{params.slotProps.input.endAdornment}
											</>
										),
									},
								}}
							/>
						)}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
						loading={itemsLoading}
					/>
				)}
			/>
			<Controller
				name={"requesterNote" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						margin="normal"
						fullWidth
						id="requesterNote"
						label={t("requesting.staff_request.patron.requester_note")}
						multiline
						rows={2}
						error={!!errors.requesterNote}
						helperText={errors.requesterNote?.message}
					/>
				)}
			/>
			<Stack spacing={1} direction={"row"}>
				<Button variant="outlined" onClick={handleClose}>
					{t("ui.actions.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				<Button
					type="submit"
					color="primary"
					variant="contained"
					sx={{ mt: 2 }}
					disabled={!isValid || isSubmitting || !pickupLocationId}
				>
					{isSubmitting
						? t("requesting.expedited_checkout.creating_request")
						: t("requesting.expedited_checkout.create_request")}
				</Button>
			</Stack>
		</>
	);
};
