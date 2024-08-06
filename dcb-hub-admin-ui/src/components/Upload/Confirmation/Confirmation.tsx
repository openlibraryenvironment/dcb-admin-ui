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
} from "@mui/material";
import { useTranslation, Trans } from "next-i18next";
import { useState } from "react";

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
	const [reason, setReason] = useState("");
	const [changeCategory, setChangeCategory] = useState("");
	const [changeReferenceUrl, setChangeReferenceUrl] = useState("");

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
				switch (participation) {
					// Fill these out with the relevant text
					case "enableSupplying":
						return (
							<Box>
								<Trans
									i18nKey="libraries.circulation.confirmation.para1_enable_supplying"
									values={{ library }}
									components={{ bold: <strong /> }}
								/>
								<Typography mt={1} mb={1}>
									{t(
										"libraries.circulation.confirmation.select_enable_supplying",
									)}
								</Typography>
							</Box>
						);
					case "disableSupplying":
						return (
							<Box>
								<Trans
									i18nKey="libraries.circulation.confirmation.para1_disable_supplying"
									values={{ library }}
									components={{ bold: <strong /> }}
								/>
								<Typography pt={1} pb={1}>
									{t(
										"libraries.circulation.confirmation.select_disable_supplying",
									)}
								</Typography>
							</Box>
						);
					case "enableBorrowing":
						return (
							<Box>
								<Trans
									i18nKey="libraries.circulation.confirmation.para1_enable_borrowing"
									values={{ library }}
									components={{ bold: <strong /> }}
								/>
								<Typography pt={1} pb={1}>
									{t(
										"libraries.circulation.confirmation.select_enable_borrowing",
									)}
								</Typography>
							</Box>
						);
					case "disableBorrowing":
						return (
							<Box>
								<Trans
									i18nKey="libraries.circulation.confirmation.para1_disable_borrowing"
									values={{ library }}
									components={{ bold: <strong /> }}
								/>
								<Typography pt={1} pb={1}>
									{t(
										"libraries.circulation.confirmation.select_disable_borrowing",
									)}
								</Typography>
							</Box>
						);
					default:
						return <Box />;
				}
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
				<Stack direction="column">
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
						onChange={(event, value) =>
							setChangeCategory(
								value ?? t("data_change_log.categories.details_changed"),
							)
						} // Or set a default here
						renderInput={(params) => (
							<TextField
								{...params}
								required
								label={t("data_change_log.category")}
								helperText={t("data_change_log.category_helper")}
							/>
						)}
					/>
					<TextField
						fullWidth
						required
						multiline
						variant="outlined"
						helperText={t("data_change_log.reason_helper")}
						label={t("data_change_log.reason")}
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						margin="normal"
					/>
					{/* 					// Limit to 200 chars, and limit categories to 100 chars
					 */}
					<TextField
						fullWidth
						helperText={t("data_change_log.ref_url_helper")}
						variant="outlined"
						label={t("data_change_log.reference_url")}
						value={changeReferenceUrl}
						onChange={(e) => setChangeReferenceUrl(e.target.value)}
						margin="normal"
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} variant="outlined" color="primary">
					{t("mappings.cancel")}
				</Button>
				{/* This makes the Cancel and Replace Mappings buttons left and right aligned, respectively*/}
				<div style={{ flex: "1 0 0" }} />
				<Button
					onClick={() => onConfirm(reason, changeCategory, changeReferenceUrl)}
					color="primary"
					variant="contained"
				>
					{getButtonText()}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
export default Confirmation;
