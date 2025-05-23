import Link from "@components/Link/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "next-i18next";

const isValidLink = (url: string): boolean => {
	try {
		const parsedUrl = new URL(url);
		const validProtocols = ["http:", "https:", "mailto:"];
		return validProtocols.includes(parsedUrl.protocol);
	} catch (error) {
		console.log(error);
		return false;
	}
};

export default function RenderAttribute({ attribute, title, type }: any) {
	const { t } = useTranslation();

	// Handle booleans and make sure they are correctly displayed.
	if (
		typeof attribute === "boolean" ||
		attribute === "true" ||
		attribute === "false"
	) {
		return (
			<Typography variant="attributeText" title={title ?? String(attribute)}>
				{String(attribute)}
			</Typography>
		);
	}

	// For role objects, return the display name
	if (typeof attribute === "object" && attribute?.__typename == "Role") {
		return (
			<Typography variant="body2">
				{attribute.displayName ?? attribute.name}
			</Typography>
		);
	}

	if (
		type == "url" &&
		attribute !== null &&
		attribute !== "" &&
		attribute !== undefined &&
		attribute !== "Invalid Date"
	) {
		// If link is invalid, render as plain text
		if (!isValidLink(attribute)) {
			return (
				<Typography variant="attributeText" title={title}>
					{attribute}
				</Typography>
			);
		}

		return (
			<Link href={attribute} title={title}>
				{attribute}
			</Link>
		);
	}

	if (
		type == "number" &&
		attribute !== null &&
		attribute !== "" &&
		attribute !== undefined
	) {
		return (
			<Typography variant="attributeText" title={title ?? attribute}>
				{Number(attribute).toFixed(5)}
			</Typography>
		);
	}

	// If needs be, we can extend this function to apply other 'rules' to our values as well
	// in theory this could return a Typography component with more styling
	return attribute !== null &&
		attribute !== "" &&
		attribute !== undefined &&
		attribute !== "Invalid Date" ? (
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
