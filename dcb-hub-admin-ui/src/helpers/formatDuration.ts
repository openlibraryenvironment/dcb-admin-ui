import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export function formatDuration(seconds: number): string {
	const dur = dayjs.duration(seconds, "seconds");
	const days = dur.days();
	const hours = dur.hours();
	const minutes = dur.minutes();
	const secs = dur.seconds();

	const formattedHours = hours.toString().padStart(2, "0");
	const formattedMinutes = minutes.toString().padStart(2, "0");
	const formattedSeconds = secs.toString().padStart(2, "0");

	return `${days}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
