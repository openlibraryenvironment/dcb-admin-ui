import Typography from "@mui/material/Typography";
import { useTranslation } from "next-i18next";

export default function RenderAttribute({ attribute, title }: any) {
	const { t } = useTranslation();
	// If needs be, we can extend this function to apply other 'rules' to our values as well
	// in theory this could return a Typography component with more styling
	return attribute != null &&
		attribute != "" &&
		attribute != undefined &&
		attribute != "Invalid Date" ? (
		<Typography variant="attributeText" title={title ?? attribute}>
			{attribute}
		</Typography>
	) : (
		<Typography
			variant="attributeText"
			aria-hidden="true"
			title={t("a11y.empty")}
		>
			-
		</Typography>
	);
}
