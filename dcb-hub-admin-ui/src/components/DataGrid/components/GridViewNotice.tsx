import { useEffect, useRef, useState } from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { LinkRounded } from "@mui/icons-material";
import { ToolbarButton } from "@mui/x-data-grid-premium";
import { useTranslation } from "react-i18next";

import type { GridView } from "@hooks/useGridView";

interface GridViewNoticeProps {
	view: Pick<GridView, "restored" | "hasPrivate" | "reset" | "flush">;
}

type CopyResult = "copied" | "copied_private" | "failed";

const RESULT_MS = 5000;

/** Where a grid's view came from, and a link to it, beside its filter controls. docs/url-view-state.md. */
export default function GridViewNotice({ view }: GridViewNoticeProps) {
	const { t } = useTranslation();
	const { restored, hasPrivate, reset, flush } = view;
	const [result, setResult] = useState<CopyResult | null>(null);
	const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	useEffect(() => () => clearTimeout(clearTimer.current), []);

	const copyLink = async () => {
		await flush();
		let next: CopyResult;
		try {
			// Undefined off a secure origin, so this is a real branch
			if (!navigator.clipboard) throw new Error("Clipboard unavailable");
			await navigator.clipboard.writeText(window.location.href);
			next = hasPrivate ? "copied_private" : "copied";
		} catch {
			next = "failed";
		}
		setResult(next);
		clearTimeout(clearTimer.current);
		clearTimer.current = setTimeout(() => setResult(null), RESULT_MS);
	};

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				flexWrap: "wrap",
				columnGap: 1,
				minWidth: 0,
			}}
		>
			<Tooltip title={t("ui.data_grid.saved_view.copy_link")}>
				<ToolbarButton
					aria-label={t("ui.data_grid.saved_view.copy_link")}
					onClick={() => void copyLink()}
				>
					<LinkRounded fontSize="small" />
				</ToolbarButton>
			</Tooltip>
			{/* Mounted while empty, so that what it comes to say is announced */}
			<Typography
				role="status"
				variant="body2"
				component="span"
				sx={{ display: "flex", flexWrap: "wrap", columnGap: 1 }}
			>
				{result ? (
					<Box
						component="span"
						sx={{ color: result === "failed" ? "error.main" : undefined }}
					>
						{t(`ui.data_grid.saved_view.link_${result}`)}
					</Box>
				) : null}
				{restored ? <span>{t("ui.data_grid.saved_view.restored")}</span> : null}
				{hasPrivate && !result ? (
					<Box component="span" sx={{ color: "text.secondary" }}>
						{t("ui.data_grid.saved_view.not_in_link")}
					</Box>
				) : null}
			</Typography>
			{restored ? (
				<Button size="small" onClick={reset}>
					{t("ui.data_grid.saved_view.reset")}
				</Button>
			) : null}
		</Box>
	);
}
