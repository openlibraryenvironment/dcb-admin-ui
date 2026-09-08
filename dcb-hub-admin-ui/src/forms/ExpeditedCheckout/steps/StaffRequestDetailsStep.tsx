import {
	Autocomplete,
	Button,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { PatronRequestAutocompleteOption } from "@models/PatronRequestAutocompleteOption";
import { StaffRequestFormData } from "@models/StaffRequestFormData";
import { TFunction } from "i18next";
import { isEmpty } from "lodash";
import {
	Control,
	Controller,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";

interface StaffRequestDetailsStepProps {
	control: Control<StaffRequestFormData, any>;
	errors: FieldErrors<StaffRequestFormData>;
	watch: UseFormWatch<StaffRequestFormData>;
	setValue: UseFormSetValue<StaffRequestFormData>;
	pickupLocationOptions: PatronRequestAutocompleteOption[];
	pickupLocationsLoading: boolean;
	getPickupLocations: () => void;
	itemLibraryOptions: PatronRequestAutocompleteOption[];
	librariesLoading: boolean;
	itemOptions: PatronRequestAutocompleteOption[];
	itemsLoading: boolean;
	itemsError: boolean;
	fetchItems: () => void;
	handleClose: () => void;
	isSubmitting: boolean;
	isValid: boolean;
	t: TFunction;
}

export const StaffRequestDetailsStep = ({
	control,
	errors,
	watch,
	setValue,
	pickupLocationOptions,
	pickupLocationsLoading,
	getPickupLocations,
	itemLibraryOptions,
	librariesLoading,
	itemOptions,
	itemsLoading,
	itemsError,
	fetchItems,
	handleClose,
	isSubmitting,
	isValid,
	t,
}: StaffRequestDetailsStepProps) => {
	const selectionType = watch("selectionType");
	const itemAgencyCode = watch("itemAgencyCode");
	const itemsData = watch("itemLocalId"); // to check if items are fetched

	return (
		<>
			<Typography variant="body1">
				{t("requesting.staff_request.select_pickup")}
			</Typography>

			<Controller
				name="pickupLocationId"
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						value={
							pickupLocationOptions.find((option) => option.value === value) ||
							null
						}
						onChange={(_, newValue) => onChange(newValue?.value || "")}
						options={pickupLocationOptions}
						onOpen={getPickupLocations}
						loading={pickupLocationsLoading}
						getOptionLabel={(option) => option.label}
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
					/>
				)}
			/>

			<Controller
				name="selectionType"
				control={control}
				render={({ field }) => (
					<FormControl component="fieldset" margin="normal">
						<FormLabel component="legend">
							{t("requesting.staff_request.patron.selection.type")}
						</FormLabel>
						<RadioGroup row {...field}>
							<Tooltip
								title={t(
									"requesting.staff_request.patron.selection.automatic_context",
								)}
							>
								<FormControlLabel
									value="automatic"
									control={<Radio />}
									label={t(
										"requesting.staff_request.patron.selection.automatic",
									)}
								/>
							</Tooltip>
							<Tooltip
								title={t(
									"requesting.staff_request.patron.selection.manual_context",
								)}
							>
								<FormControlLabel
									value="manual"
									control={<Radio />}
									label={t("requesting.staff_request.patron.selection.manual")}
								/>
							</Tooltip>
						</RadioGroup>
					</FormControl>
				)}
			/>

			{selectionType === "manual" && (
				<>
					<Controller
						name="itemAgencyCode"
						control={control}
						render={({ field: { onChange, value } }) => (
							<Autocomplete
								value={
									itemLibraryOptions.find((option) => option.value === value) ||
									null
								}
								onChange={(_, newValue) => {
									onChange(newValue?.value || "");
									setValue("itemLocalSystemCode", newValue?.hostLmsCode);
								}}
								options={itemLibraryOptions}
								loading={librariesLoading}
								getOptionLabel={(option) => option.label}
								renderInput={(params) => (
									<TextField
										{...params}
										margin="normal"
										required
										fullWidth
										label={t("requesting.staff_request.patron.item_library")}
										error={!!errors.itemAgencyCode}
										helperText={errors.itemAgencyCode?.message}
									/>
								)}
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
									itemOptions.find((option) => option.value === value) || null
								}
								onChange={(_, newValue) => onChange(newValue?.value || "")}
								options={itemOptions}
								onOpen={() => {
									if (isEmpty(itemsData)) fetchItems();
								}}
								loading={itemsLoading}
								getOptionLabel={(option) => option.label}
								renderInput={(params) => (
									<TextField
										{...params}
										margin="normal"
										required
										disabled={isEmpty(itemAgencyCode)}
										fullWidth
										label={t("requesting.staff_request.patron.item_local_id")}
										error={!!errors.itemLocalId || itemsError}
										helperText={
											errors.itemLocalId?.message ||
											(itemsError ? t("ui.error.something_wrong") : "")
										}
									/>
								)}
							/>
						)}
					/>
				</>
			)}

			<Controller
				name="requesterNote"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						margin="normal"
						fullWidth
						label={t("requesting.staff_request.patron.requester_note")}
						multiline
						rows={2}
					/>
				)}
			/>

			<Stack spacing={1} direction={"row"} sx={{ mt: 2 }}>
				<Button variant="outlined" onClick={handleClose}>
					{t("ui.actions.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				<Button
					type="submit"
					color="primary"
					variant="contained"
					disabled={!isValid || isSubmitting}
				>
					{isSubmitting ? t("ui.actions.submitting") : t("ui.actions.submit")}
				</Button>
			</Stack>
		</>
	);
};
