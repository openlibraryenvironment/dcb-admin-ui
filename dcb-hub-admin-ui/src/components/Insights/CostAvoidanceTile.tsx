import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	Typography,
	Stack,
	TextField,
	InputAdornment,
	Skeleton,
	Box,
} from "@mui/material";

import { useInsightsCostStore } from "@hooks/insightsCostStore";

import MetricInfo from "./MetricInfo";

/**
 * Value tile. The count comes from the combined dashboard call; the money figure is
 * entirely the reader's own assumption - dcb-service never ships a "traditional ILL cost".
 *
 * The assumption lives in the URL, not only in the store, because this is the figure most
 * likely to end up in a board pack: a link that shows one recipient a different number
 * from the one the sender saw is worse than no link. The store remains the per-user
 * default for a fresh visit, and the first thing typed writes through to the URL.
 */
export default function CostAvoidanceTile({
	fulfilled,
	unitCost,
	onUnitCostChange,
	loading = false,
}: {
	fulfilled: number;
	unitCost: number | null;
	onUnitCostChange: (cost: number | null) => void;
	loading?: boolean;
}) {
	const { t } = useTranslation();

	// Atomic selectors.
	const storedCost = useInsightsCostStore((s) => s.illUnitCost);
	const currencySymbol = useInsightsCostStore((s) => s.currencySymbol);
	const setStoredCost = useInsightsCostStore((s) => s.setIllUnitCost);

	const illUnitCost = unitCost ?? storedCost;
	const setIllUnitCost = (cost: number | null) => {
		setStoredCost(cost);
		onUnitCostChange(cost);
	};

	const avoidance =
		illUnitCost != null && illUnitCost >= 0 ? fulfilled * illUnitCost : null;

	const formatted =
		avoidance != null
			? `${currencySymbol}${avoidance.toLocaleString(undefined, {
					maximumFractionDigits: 0,
				})}`
			: "—";

	return (
		<Card variant="outlined">
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
					<Typography variant="subtitle2" component="p" color="text.secondary">
						{t("insights.kpi.cost_avoidance.title")}
					</Typography>
					{/* The one figure whose method belongs on its face as well as behind the
					    button: the count is ours and the unit cost is the reader's, and a
					    money figure that hides which half is which is the one most likely to
					    be quoted without either. */}
					<MetricInfo
						metric="cost_avoidance"
						label={t("insights.kpi.cost_avoidance.title")}
						sampleCount={fulfilled}
					/>
				</Box>

				{loading ? (
					<Skeleton variant="text" width="60%" height={40} />
				) : (
					<Typography variant="h4" component="p">
						{formatted}
					</Typography>
				)}

				<Typography variant="body2" color="text.secondary" gutterBottom>
					{t("insights.kpi.cost_avoidance.basis", { count: fulfilled })}
				</Typography>

				<Box sx={{ mt: 1 }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<TextField
							size="small"
							type="number"
							label={t("insights.kpi.cost_avoidance.input_label")}
							value={illUnitCost ?? ""}
							onChange={(e) =>
								setIllUnitCost(
									e.target.value === "" ? null : Number(e.target.value),
								)
							}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											{currencySymbol}
										</InputAdornment>
									),
								},
								htmlInput: { min: 0, step: "0.01" },
							}}
							helperText={t("insights.kpi.cost_avoidance.input_help")}
							sx={{ maxWidth: 220 }}
						/>
					</Stack>
				</Box>
			</CardContent>
		</Card>
	);
}
