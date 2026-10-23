import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

/** The reference a failed call was sent with, for the reader to quote to support. */
export default function RequestReference({ reference }: { reference: string }) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const copy = () => {
		navigator.clipboard
			?.writeText(reference)
			.then(() => setCopied(true))
			.catch(() => setCopied(false));
	};

	return (
		<Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
			<Typography variant="body2">
				{t("ui.support_reference.label")}{" "}
				<Typography
					component="span"
					variant="body2"
					sx={{ fontFamily: "monospace" }}
				>
					{reference}
				</Typography>
			</Typography>
			<Tooltip title={t("ui.support_reference.copy")}>
				<IconButton
					size="small"
					onClick={copy}
					aria-label={t("ui.support_reference.copy")}
				>
					<ContentCopy fontSize="inherit" />
				</IconButton>
			</Tooltip>
			<Typography variant="body2" role="status" aria-live="polite">
				{copied ? t("ui.support_reference.copied") : ""}
			</Typography>
		</Stack>
	);
}
