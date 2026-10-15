import dayjs from "dayjs";

import { RangePreset } from "@helpers/insightsSearch";
import { TimeSeriesInterval } from "@helpers/statsApi";

const DAYS: Record<RangePreset, number> = {
	"7d": 7,
	"30d": 30,
	"90d": 90,
	"365d": 365,
};

// Convert a range preset into an ISO start/end window ending now.
export function rangeToParams(preset: RangePreset): {
	startDate: string;
	endDate: string;
} {
	// Floor the window end to the current hour so the derived ISO strings - and
	// therefore the TanStack Query keys - are stable within the hour. This lets the
	// route loader's prefetch and the component's useQuery share a cache entry
	// (they compute the window independently) and avoids refetching on every render.
	const end = new Date();
	end.setMinutes(0, 0, 0);
	const start = new Date(end.getTime() - DAYS[preset] * 24 * 60 * 60 * 1000);
	return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/**
 * A reader's own window, as the endpoints bind it.
 *
 * The URL carries a plain `YYYY-MM-DD` - what the search schema's `z.string().date()`
 * accepts, and what somebody reading a shared link can read - while every `/insights/*`
 * date parameter binds a `java.time.Instant`. Local midnight to local end of day, because
 * the day the reader picked is the day in their own zone and not in UTC.
 */
export function customRangeToParams(custom: {
	startDate: string;
	endDate: string;
}): { startDate: string; endDate: string } {
	return {
		startDate: dayjs(custom.startDate).startOf("day").toISOString(),
		endDate: dayjs(custom.endDate).endOf("day").toISOString(),
	};
}

// Coarser buckets for longer windows keep the flow chart legible.
export function intervalForRange(preset: RangePreset): TimeSeriesInterval {
	switch (preset) {
		case "7d":
		case "30d":
			return "day";
		case "90d":
			return "week";
		case "365d":
			return "month";
	}
}

// Bucket granularity for an arbitrary (custom) window, by its span in days.
export function intervalForSpan(
	startDate: string,
	endDate: string,
): TimeSeriesInterval {
	const days =
		(new Date(endDate).getTime() - new Date(startDate).getTime()) /
		(24 * 60 * 60 * 1000);
	if (days <= 45) return "day";
	if (days <= 180) return "week";
	return "month";
}

// Human-readable turnaround: seconds -> "3.2 days" / "7 hrs" / "45 min".
export function formatDuration(seconds: number | null | undefined): string {
	if (!seconds || seconds <= 0) return "—";
	const hours = seconds / 3600;
	if (hours >= 48) return `${(hours / 24).toFixed(1)} days`;
	if (hours >= 1) return `${hours.toFixed(1)} hrs`;
	return `${Math.round(seconds / 60)} min`;
}
