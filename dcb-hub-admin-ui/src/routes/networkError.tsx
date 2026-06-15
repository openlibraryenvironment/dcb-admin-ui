import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Box } from "@mui/material";

import ErrorComponent from "@components/Error/Error";

export const Route = createFileRoute("/networkError")({
	component: NetworkError,
});

function NetworkError() {
	const { t } = useTranslation();

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
			}}
		>
			<ErrorComponent
				title={t("ui.feedback.network_error")}
				message={t("ui.feedback.network_error_message")}
				description={t("ui.actions.go_back_message")}
				action={t("ui.actions.go_back")}
				goBack="/"
			/>
		</Box>
	);
}
