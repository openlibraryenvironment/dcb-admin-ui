import { ReactNode } from "react";
import {
	Card,
	CardContent,
	Stack,
	Typography,
	Skeleton,
	Box,
} from "@mui/material";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";

import { MetricId } from "@helpers/insightsMetrics";
import MetricInfo from "./MetricInfo";

interface KpiTileProps {
	title: string;
	value: ReactNode;
	subtitle?: string;
	// Signed percentage-point (or percent) change vs the prior window, if applicable.
	deltaPct?: number | null;
	// Whether a positive delta is good (fill rate) or bad (error rate) - drives colour.
	higherIsBetter?: boolean;
	loading?: boolean;
	/** Opens the four-part explanation beside the figure, where one is registered. */
	metric?: MetricId;
	/** Passed through to the explanation; absent where the endpoint reports no count. */
	sampleCount?: number | null;
}

const FIXED_HEIGHT = 132; // skeleton matches loaded height exactly (no CLS)

export default function KpiTile({
	title,
	value,
	subtitle,
	deltaPct,
	higherIsBetter = true,
	loading = false,
	metric,
	sampleCount,
}: KpiTileProps) {
	const hasDelta =
		deltaPct !== undefined && deltaPct !== null && isFinite(deltaPct);
	const positive = hasDelta && (deltaPct as number) > 0;
	const negative = hasDelta && (deltaPct as number) < 0;
	const good = hasDelta && (higherIsBetter ? positive : negative);
	const deltaColor =
		!hasDelta || (!positive && !negative)
			? "text.secondary"
			: good
				? "success.main"
				: "error.main";

	return (
		<Card variant="outlined" sx={{ height: FIXED_HEIGHT }}>
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
					<Typography variant="subtitle2" component="p" color="text.secondary">
						{title}
					</Typography>
					{metric ? (
						<MetricInfo
							metric={metric}
							label={title}
							sampleCount={sampleCount}
						/>
					) : null}
				</Box>
				{loading ? (
					<Skeleton variant="text" width="60%" height={40} />
				) : (
					<Typography variant="h4" component="p">
						{value}
					</Typography>
				)}
				<Box sx={{ minHeight: 24 }}>
					{loading ? (
						<Skeleton variant="text" width="40%" />
					) : (
						<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
							{hasDelta && (positive || negative) && (
								<Typography
									variant="body2"
									color={deltaColor}
									sx={{ display: "flex", alignItems: "center" }}
								>
									{positive ? (
										<ArrowDropUp fontSize="small" />
									) : (
										<ArrowDropDown fontSize="small" />
									)}
									{Math.abs(deltaPct as number).toFixed(1)}%
								</Typography>
							)}
							{subtitle && (
								<Typography variant="body2" color="text.secondary">
									{subtitle}
								</Typography>
							)}
						</Stack>
					)}
				</Box>
			</CardContent>
		</Card>
	);
}
