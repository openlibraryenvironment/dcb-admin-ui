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

// Value tile. The successful-fulfilment count comes from the combined dashboard call
// (passed in), and the monetary figure is entirely user-driven (see insightsCostStore) -
// the backend never ships a "traditional ILL cost".
export default function CostAvoidanceTile({
	fulfilled,
	loading = false,
}: {
	fulfilled: number;
	loading?: boolean;
}) {
	const { t } = useTranslation();

	// Atomic selectors.
	const illUnitCost = useInsightsCostStore((s) => s.illUnitCost);
	const currencySymbol = useInsightsCostStore((s) => s.currencySymbol);
	const setIllUnitCost = useInsightsCostStore((s) => s.setIllUnitCost);

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
				<Typography variant="subtitle2" color="text.secondary" gutterBottom>
					{t("insights.kpi.cost_avoidance.title")}
				</Typography>

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
