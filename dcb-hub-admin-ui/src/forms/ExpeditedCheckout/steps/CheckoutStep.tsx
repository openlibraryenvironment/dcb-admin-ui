// Step 3: Progress to checkout.

import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { TFunction } from "i18next";
import dayjs from "dayjs";
import { useAuth } from "react-oidc-context";

import i18n from "@/i18n";

const STATUS_ID = "progress-bar-checkout";

// The align items on the stack is to prevent the button taking up full width of the container.
interface CheckoutStep {
	checkoutCompleted: boolean;
	stepError: number | null;
	handleViewRequest: () => void;
	handleReadOnlyReturn: () => void;
	t: TFunction;
	dueDate: string;
}
export const CheckoutStep = ({
	checkoutCompleted,
	stepError,
	handleViewRequest,
	handleReadOnlyReturn,
	t,
	dueDate,
}: CheckoutStep) => {
	const isButtonEnabled = checkoutCompleted || stepError === 2;

	const getProgressColor = (): "success" | "error" | "primary" => {
		if (checkoutCompleted) return "success";
		if (stepError === 2) return "error"; // Use error color for progress bar on timeout
		return "primary";
	};
	const auth = useAuth();
	const roles = auth?.user?.profile?.roles ? auth?.user?.profile?.roles : [];
	const isReadOnly = roles.includes("LIBRARY_READ_ONLY");
	const displayDueDate =
		dueDate && dayjs(dueDate).isValid()
			? new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
					dateStyle: "full",
					timeStyle: "short",
				}).format(new Date(dueDate))
			: t(
					"requesting.expedited_checkout.steps.due_date_loading",
					"Loading due date...",
				);

	return (
		<Stack direction="column" spacing={2}>
			{/* The outcome is announced, and names the progress bar */}
			<Typography id={STATUS_ID} role="status" aria-live="polite">
				{checkoutCompleted &&
					t("requesting.expedited_checkout.steps.checkout_success", {
						dueDate: displayDueDate,
					})}
				{!checkoutCompleted &&
					stepError !== 2 &&
					t("requesting.expedited_checkout.steps.checkout_waiting")}
				{!checkoutCompleted &&
					stepError === 2 &&
					(isReadOnly
						? t(
								"requesting.expedited_checkout.steps.checkout_failure_request_only",
							)
						: t("requesting.expedited_checkout.steps.checkout_failure"))}
			</Typography>

			<LinearProgress
				variant={isButtonEnabled ? "determinate" : "indeterminate"}
				color={getProgressColor()}
				value={checkoutCompleted ? 100 : undefined}
				aria-labelledby={STATUS_ID}
				sx={{ mb: 3, mt: 1 }}
			/>

			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-end",
					width: "100%",
					pt: 2,
				}}
			>
				{isReadOnly ? (
					<Button
						variant="contained"
						onClick={handleReadOnlyReturn}
						disabled={!isButtonEnabled}
					>
						{t("requesting.expedited_checkout.return")}
					</Button>
				) : (
					<Button
						variant="contained"
						onClick={handleViewRequest}
						disabled={!isButtonEnabled}
					>
						{t("requesting.expedited_checkout.view_request")}
					</Button>
				)}
			</Box>
		</Stack>
	);
};
