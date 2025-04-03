export function formatDuration(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secondsDuration = seconds % 60;

	// Ensuring hours, minutes, and seconds are always two digits
	const formattedHours = String(hours).padStart(2, "0");
	const formattedMinutes = String(minutes).padStart(2, "0");
	const formattedSeconds = String(secondsDuration).padStart(2, "0");

	return `${days}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
