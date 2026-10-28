import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";

import HelpPopover from "@components/HelpPopover/HelpPopover";
import {
	LOW_CONFIDENCE_SAMPLE,
	MetricId,
	methodKeys,
} from "@helpers/insightsMetrics";

/** Where a number came from, beside the number. */
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

	const keys = methodKeys(metric);
	const low =
		typeof sampleCount === "number" && sampleCount < LOW_CONFIDENCE_SAMPLE;

	return (
		<HelpPopover
			label={t("insights.method.trigger", { label })}
			title={t("insights.method.title", { label })}
		>
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
									low ? "insights.method.sample_low" : "insights.method.sample",
									{ count: sampleCount },
								)
							: t("insights.method.sample_unknown")}
					</Typography>
				</Box>
			</Box>
		</HelpPopover>
	);
}
