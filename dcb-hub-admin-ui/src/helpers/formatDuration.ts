import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export function formatDuration(seconds: number): string {
	const dur = dayjs.duration(seconds, "seconds").format("D:HH:mm:ss");
	return dur;
}
