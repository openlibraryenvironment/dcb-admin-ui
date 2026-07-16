import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Check from "@mui/icons-material/Check";
import { stripBrackets } from "@helpers/stripBrackets";

type CopyState = "idle" | "copied" | "error";

/** How long the copied/failed confirmation stays up before reverting. */
const FEEDBACK_MS = 1500;

interface CopyToClipboardButtonProps {
	/** The text to copy. Nothing renders when there is nothing to copy. */
	value?: string | null;
	/**
	 * What is being copied, for the button's accessible name
	 * ("Copy item barcode") - the icon alone has no text for a screen reader.
	 */
	label: string;
}

/**
 * Copies a single attribute's value, for values that get retyped into an ILS
 * (barcodes and the like) where a transcription slip is a real error.
 *
 * The result is reported on the button itself rather than through a global
 * snackbar: several of these can sit on one page, and feedback has to say which
 * one fired.
 */
export default function CopyToClipboardButton({
	value,
	label,
}: CopyToClipboardButtonProps) {
	const { t } = useTranslation();
	const [state, setState] = useState<CopyState>("idle");
	const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	// The confirmation outlives the click, so a copy on the way out would
	// otherwise set state on an unmounted button.
	useEffect(() => () => clearTimeout(resetTimer.current), []);

	// RenderAttribute shows "-" for an empty attribute; a button offering to copy
	// that dash would be a lie.
	if (value === null || value === undefined || value === "") return null;

	// The page still shows the raw value; only what lands on the clipboard is
	// cleaned up, so nothing on screen silently disagrees with the host LMS.
	const copyValue = stripBrackets(String(value));
	// "[]" strips to nothing - there is no barcode here to copy.
	if (copyValue === "") return null;

	const handleCopy = async () => {
		try {
			// Undefined off a secure origin (and in some embedded webviews), so this
			// is a real branch rather than defensive noise.
			if (!navigator.clipboard) throw new Error("Clipboard unavailable");
			await navigator.clipboard.writeText(copyValue);
			setState("copied");
		} catch {
			setState("error");
		}
		clearTimeout(resetTimer.current);
		resetTimer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
	};

	const tooltip =
		state === "copied"
			? t("ui.copy.copied")
			: state === "error"
				? t("ui.copy.failed")
				: t("ui.copy.copy");

	return (
		<Tooltip title={tooltip}>
			<IconButton
				size="small"
				onClick={handleCopy}
				aria-label={t("ui.copy.aria_label", { label })}
			>
				{state === "copied" ? (
					<Check fontSize="inherit" />
				) : (
					<ContentCopy fontSize="inherit" />
				)}
			</IconButton>
		</Tooltip>
	);
}
