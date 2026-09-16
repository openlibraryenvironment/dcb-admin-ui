import { useId, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

import {
	LOW_CONFIDENCE_SAMPLE,
	MetricId,
	methodKeys,
} from "@helpers/insightsMetrics";

/**
 * Where a number came from, beside the number.
 *
 * CLICK, NOT HOVER. WCAG 2.2 SC 1.4.13 requires content revealed on hover to be
 * dismissable, hoverable and persistent, and four paragraphs behind a tooltip meets none
 * of the three. A popover also lets a keyboard user read it without holding focus still.
 *
 * The trigger is named for its metric rather than "info", because a screen-reader user
 * listing the buttons on this page would otherwise hear "info" twenty times.
 */
export default function MetricInfo({
	metric,
	label,
	sampleCount,
}: {
	metric: MetricId;
	/** The figure's own name, so the button says which one it explains. */
	label: string;
	/** Where the endpoint reports one. Absent is not zero - see the panel. */
	sampleCount?: number | null;
}) {
	const { t } = useTranslation();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const id = useId();

	const keys = methodKeys(metric);
	const low =
		typeof sampleCount === "number" && sampleCount < LOW_CONFIDENCE_SAMPLE;

	return (
		<>
			<IconButton
				size="small"
				aria-label={t("insights.method.trigger", { label })}
				aria-haspopup="dialog"
				onClick={(event: MouseEvent<HTMLElement>) =>
					setAnchor(event.currentTarget)
				}
			>
				<InfoOutlined fontSize="inherit" />
			</IconButton>

			<Popover
				open={Boolean(anchor)}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				slotProps={{
					paper: {
						role: "dialog",
						"aria-labelledby": id,
						sx: { maxWidth: 420, p: 2 },
					},
				}}
			>
				<Typography id={id} variant="subtitle1" component="h4" gutterBottom>
					{t("insights.method.title", { label })}
				</Typography>

				<Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5 }}>
					{(["what", "how", "not"] as const).map((part) => (
						<Box key={part}>
							<Typography
								component="dt"
								variant="overline"
								color="primary"
								sx={{ display: "block", lineHeight: 1.6 }}
							>
								{t(`insights.method.part.${part}`)}
							</Typography>
							<Typography component="dd" variant="body2" sx={{ m: 0 }}>
								{t(keys[part])}
							</Typography>
						</Box>
					))}

					<Box>
						<Typography
							component="dt"
							variant="overline"
							color="primary"
							sx={{ display: "block", lineHeight: 1.6 }}
						>
							{t("insights.method.part.data")}
						</Typography>
						<Typography
							component="dd"
							variant="body2"
							sx={{ m: 0 }}
							color={low ? "warning.main" : undefined}
						>
							{typeof sampleCount === "number"
								? t(
										low
											? "insights.method.sample_low"
											: "insights.method.sample",
										{ count: sampleCount },
									)
								: t("insights.method.sample_unknown")}
						</Typography>
					</Box>
				</Box>
			</Popover>
		</>
	);
}
