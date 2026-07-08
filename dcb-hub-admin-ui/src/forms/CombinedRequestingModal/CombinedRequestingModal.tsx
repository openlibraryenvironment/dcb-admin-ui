import ExpeditedCheckout from "@forms/ExpeditedCheckout/ExpeditedCheckout";
import StaffRequest from "@forms/StaffRequest/StaffRequest";
import QuickWalkUpRequest from "@forms/QuickWalkUp/QuickWalkUp";
import {
	CombinedRequestingModalProps,
	RequestType,
} from "@models/PatronRequestFormType";
import Close from "@mui/icons-material/Close";
import {
	Button,
	DialogActions,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	IconButton,
	Radio,
	RadioGroup,
	Stack,
	Typography,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Cluster-based flows offered on the selection screen. Quick walk-up has no
// cluster context, so it is only reached via `initialRequestType` (search
// results / item row), never chosen here.
type SelectableRequestType = Extract<
	RequestType,
	"staffRequest" | "expeditedCheckout"
>;

export default function CombinedRequestingModal({
	show,
	onClose,
	bibClusterId,
	title,
	initialRequestType,
	initialItemBarcode,
}: CombinedRequestingModalProps) {
	const { t } = useTranslation();
	// `null` renders the request-type selection screen; a value renders that flow.
	const [requestType, setRequestType] = useState<RequestType | null>(
		initialRequestType ?? null,
	);
	const [selectedValue, setSelectedValue] =
		useState<SelectableRequestType>("staffRequest");

	const handleClose = () => {
		setRequestType(initialRequestType ?? null);
		setSelectedValue("staffRequest");
		onClose();
	};

	const handleContinue = () => setRequestType(selectedValue);

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedValue(event.target.value as SelectableRequestType);
	};

	const dialogTitle = (() => {
		switch (requestType) {
			case "staffRequest":
				return t("requesting.staff_request.actions.place");
			case "expeditedCheckout":
				return t("requesting.expedited_checkout.title_on_site");
			case "quickWalkUp":
				return t("requesting.quick_walk_up.title");
			default:
				return t("requesting.place_title", { title });
		}
	})();

	const renderContent = () => {
		switch (requestType) {
			case "staffRequest":
				return (
					<StaffRequest
						bibClusterId={bibClusterId ?? ""}
						onClose={handleClose}
					/>
				);
			case "expeditedCheckout":
				return (
					<ExpeditedCheckout
						bibClusterId={bibClusterId ?? ""}
						onClose={handleClose}
					/>
				);
			case "quickWalkUp":
				return (
					<QuickWalkUpRequest
						onClose={handleClose}
						initialItemBarcode={initialItemBarcode}
					/>
				);
			default:
				// Initial selection screen (only reachable with a bib cluster).
				return (
					<>
						<DialogContent>
							<Stack spacing={1}>
								<Typography variant="body1">
									{t("requesting.place_description", { title })}
								</Typography>
								<FormControl component="fieldset">
									<Stack spacing={1} direction="column">
										<FormLabel component="legend">
											<Typography variant="hitCount">
												{t("requesting.options")}
											</Typography>
										</FormLabel>
										<RadioGroup
											aria-label={t("requesting.options")}
											name="request-type-group"
											value={selectedValue}
											onChange={handleRadioChange}
										>
											<Stack spacing={1}>
												<FormControlLabel
													value="staffRequest"
													control={<Radio />}
													label={
														<>
															<Typography variant="body1">
																{t("requesting.staff_request.actions.place")}
															</Typography>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{t(
																	"requesting.staff_request.option_description",
																)}
															</Typography>
														</>
													}
												/>
												<FormControlLabel
													value="expeditedCheckout"
													control={<Radio />}
													label={
														<>
															<Typography variant="body1">
																{t(
																	"requesting.expedited_checkout.actions.place",
																)}
															</Typography>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{t(
																	"requesting.expedited_checkout.option_description",
																)}
															</Typography>
														</>
													}
												/>
											</Stack>
										</RadioGroup>
									</Stack>
								</FormControl>
							</Stack>
						</DialogContent>
						<DialogActions>
							<Button onClick={handleClose}>{t("ui.actions.cancel")}</Button>
							<Button onClick={handleContinue} variant="contained">
								{t("ui.actions.continue")}
							</Button>
						</DialogActions>
					</>
				);
		}
	};

	return (
		<Dialog
			open={show}
			onClose={handleClose}
			aria-labelledby="form-dialog-title"
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle id="form-dialog-title" variant="modalTitle">
				{dialogTitle}
			</DialogTitle>
			<IconButton
				aria-label={t("ui.actions.close_alert")}
				onClick={handleClose}
				sx={{
					position: "absolute",
					right: 8,
					top: 8,
					color: (theme) => theme.palette.grey[500],
				}}
			>
				<Close />
			</IconButton>
			{renderContent()}
		</Dialog>
	);
}
