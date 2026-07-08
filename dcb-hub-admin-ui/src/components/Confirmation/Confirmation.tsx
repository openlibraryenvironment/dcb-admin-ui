import { useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	TextField,
	Stack,
	Box,
} from "@mui/material";
import ChangesSummary from "@components/ChangesSummary/ChangesSummary";

type ConfirmationAction =
	"gridEdit" | "deletion" | "unsaved" | "uploadReplacement" | "sessionWarning";

interface AuditFormData {
	reason: string;
	changeCategory: string;
	changeReferenceUrl: string;
}

interface ConfirmationProps {
	open: boolean;
	action: ConfirmationAction;
	entityName?: string;
	editInformation?: string | Record<string, any>;
	customWarningText?: ReactNode;
	onClose: () => void;
	onConfirm: (reason: string, category: string, url: string) => void;
}

export default function Confirmation({
	open,
	action,
	entityName = "Item",
	editInformation,
	customWarningText,
	onClose,
	onConfirm,
}: ConfirmationProps) {
	const { t } = useTranslation();

	const isEdit = action === "gridEdit";
	const isDelete = action === "deletion";
	const isUnsaved = action === "unsaved";
	const isUpload = action === "uploadReplacement";
	const isSessionWarning = action === "sessionWarning";
	const requiresAuditFields = isEdit || isDelete || isUpload;

	const {
		control,
		handleSubmit,
		reset,
		formState: { isValid },
	} = useForm<AuditFormData>({
		defaultValues: {
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (open) {
			reset({ reason: "", changeCategory: "", changeReferenceUrl: "" });
		}
	}, [open, reset]);

	const getTitle = () => {
		if (isSessionWarning) return t("ui.confirmation.session_warning");
		if (isEdit) return t("ui.confirmation.edit_title", { entity: entityName });
		if (isDelete)
			return t("ui.confirmation.delete_title", { entity: entityName });
		if (isUnsaved) return t("ui.unsaved_changes.header");
		if (isUpload) return t("common.upload_title", { entityName: entityName });
		return t("ui.confirmation.general_title");
	};

	const onSubmit = (data: AuditFormData) => {
		onConfirm(
			data.reason.trim(),
			data.changeCategory.trim(),
			data.changeReferenceUrl.trim(),
		);
	};

	const handleSimpleConfirm = () => {
		onConfirm("", "", "");
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="confirmation-dialog-title"
			aria-describedby="confirmation-dialog-description"
			maxWidth="md"
			fullWidth={isEdit || isDelete || isUpload}
		>
			<form
				onSubmit={
					requiresAuditFields
						? handleSubmit(onSubmit)
						: (e) => {
								e.preventDefault();
								handleSimpleConfirm();
							}
				}
			>
				<DialogTitle id="confirmation-dialog-title">{getTitle()}</DialogTitle>

				<DialogContent>
					<DialogContentText
						id="confirmation-dialog-description"
						sx={{ mb: 2 }}
					>
						{isDelete &&
							t("ui.confirmation.delete_warning", { entity: entityName })}
						{isUnsaved && t("ui.confirmation.unsaved_warning")}
						{isEdit && t("ui.confirmation.edit_review")}
					</DialogContentText>

					{isUpload && customWarningText && (
						<Box sx={{ mb: 2 }}>{customWarningText}</Box>
					)}

					{isEdit && editInformation && (
						<ChangesSummary
							action="UPDATE"
							changes={editInformation}
							context="gridEdit"
						/>
					)}

					{requiresAuditFields && (
						<Stack spacing={2} sx={{ mt: 3 }}>
							<Controller
								name="reason"
								control={control}
								rules={{ required: t("validation.required") }}
								render={({ field, fieldState }) => (
									<TextField
										{...field}
										required
										label={t("data_change_log.reason")}
										multiline
										rows={2}
										fullWidth
										error={!!fieldState.error}
										helperText={fieldState.error?.message}
									/>
								)}
							/>
							<Controller
								name="changeCategory"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label={t("data_change_log.category")}
										fullWidth
									/>
								)}
							/>
							<Controller
								name="changeReferenceUrl"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label={t("data_change_log.reference_url")}
										type="url"
										fullWidth
									/>
								)}
							/>
						</Stack>
					)}
				</DialogContent>

				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={onClose} color="inherit" variant="text">
						{isUnsaved
							? t("ui.actions.keep_editing")
							: isSessionWarning
								? t("loginout.logout")
								: t("ui.actions.cancel")}
					</Button>

					<Button
						type={isSessionWarning ? "button" : "submit"} // Don't submit the form for session warning
						onClick={isSessionWarning ? () => onConfirm("", "", "") : undefined}
						color={isDelete || isUnsaved ? "error" : "primary"}
						variant="contained"
						disabled={requiresAuditFields && !isValid}
						// eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate focus management for the modal's primary action; intentionally skipped for delete to avoid accidental confirmation
						autoFocus={!isDelete}
					>
						{isDelete && t("ui.actions.confirm_delete")}
						{isEdit && t("ui.actions.save_changes")}
						{isUnsaved && t("ui.actions.leave_without_saving")}
						{isSessionWarning && t("loginout.stay_logged_in", "Stay Logged In")}
						{isUpload && t("ui.actions.confirm_upload")}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
