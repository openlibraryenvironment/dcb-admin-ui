import { OnSiteBorrowingFormData } from "@models/OnSiteBorrowingFormData";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import {
	Autocomplete,
	Button,
	CircularProgress,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { isEmpty } from "lodash";
import { TFunction } from "next-i18next";
import {
	Control,
	Controller,
	FieldErrors,
	UseFormSetValue,
} from "react-hook-form";

// Step two: request creation / placing
type RequestCreationStepType = {
	control: Control<OnSiteBorrowingFormData, any>;
	itemLibraryOptions: PatronRequestAutocompleteOption[];
	itemLibrariesLoading: boolean;
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
};
export const RequestCreationStep = ({
	control,
	itemLibraryOptions,
	itemLibrariesLoading,
	setValue,
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
}: RequestCreationStepType) => {
	return (
		<>
			<Typography>
				{t("expedited_checkout.steps.request_creation_instruction")}
			</Typography>
			<Controller
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
								label={t("staff_request.patron.item_library")}
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
			/>
			<Controller
				name="pickupLocationId"
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
						disabled={isEmpty(itemAgencyCode)}
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
								label={t("staff_request.patron.pickup_location")}
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
				name="itemLocalId"
				control={control}
				disabled={isEmpty(itemAgencyCode)}
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
								label={t("staff_request.patron.item_local_id")}
								error={!!errors.itemLocalId || itemsError}
								helperText={errors.itemLocalId?.message}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{itemsLoading ? (
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
						loading={itemsLoading}
					/>
				)}
			/>

			<Controller
				name="requesterNote"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						margin="normal"
						fullWidth
						id="requesterNote"
						label={t("staff_request.patron.requester_note")}
						multiline
						rows={2}
						error={!!errors.requesterNote}
						helperText={errors.requesterNote?.message}
					/>
				)}
			/>
			<Stack spacing={1} direction={"row"}>
				<Button variant="outlined" onClick={handleClose}>
					{t("mappings.cancel")}
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
						? t("expedited_checkout.creating_request")
						: t("expedited_checkout.create_request")}
				</Button>
			</Stack>
		</>
	);
};
