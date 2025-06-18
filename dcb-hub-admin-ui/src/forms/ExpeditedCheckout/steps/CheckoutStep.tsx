// Step 3: Progress to checkout.

import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { TFunction } from "next-i18next";

// The align items on the stack is to prevent the button taking up full width of the container.
type CheckoutStep = {
	checkoutCompleted: boolean;
	stepError: number | null;
	handleViewRequest: () => void;
	t: TFunction;
	dueDate: string;
};
export const CheckoutStep = ({
	checkoutCompleted,
	stepError,
	handleViewRequest,
	t,
	dueDate,
}: CheckoutStep) => {
	const isButtonEnabled = checkoutCompleted || stepError === 2;

	const getProgressColor = (): "success" | "error" | "primary" => {
		if (checkoutCompleted) return "success";
		if (stepError === 2) return "error"; // Use error color for progress bar on timeout
		return "primary";
	};
	return (
		<Stack direction="column" spacing={2}>
			<Typography>
				{checkoutCompleted &&
					t("expedited_checkout.steps.checkout_success", { dueDate: dueDate })}
				{!checkoutCompleted &&
					stepError !== 2 &&
					t("expedited_checkout.steps.checkout_waiting")}
				{!checkoutCompleted &&
					stepError === 2 &&
					t("expedited_checkout.steps.checkout_failure")}
			</Typography>

			<LinearProgress
				variant={isButtonEnabled ? "determinate" : "indeterminate"}
				color={getProgressColor()}
				value={checkoutCompleted ? 100 : undefined}
				aria-labelledby="progress-bar-checkout"
				sx={{
					mb: 3,
					mt: 1,
					"& .MuiLinearProgress-bar": {
						backgroundColor: checkoutCompleted
							? "success.main"
							: "primary.main",
					},
				}}
			/>

			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-end",
					width: "100%",
					pt: 2,
				}}
			>
				<Button
					variant="contained"
					onClick={handleViewRequest}
					disabled={!isButtonEnabled}
				>
					{t("expedited_checkout.view_request")}
				</Button>
			</Box>
		</Stack>
	);
};
