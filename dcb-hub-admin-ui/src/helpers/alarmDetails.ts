/** One line of an alarm's details, ready to show. */
export interface AlarmDetailEntry {
	key: string;
	/** An i18n key for a detail dcb-service names the same way on every alarm that has it. */
	labelKey: string | null;
	/** The key in words, for a detail with no translation. */
	fallbackLabel: string;
	value: string;
	/** A nested value, shown as formatted JSON. */
	structured: boolean;
}

// Keys dcb-service sets: SupplierPlacementGate (reason, howToFix), HostLmsPingService (from, to)
const KNOWN_KEYS: Record<string, string> = {
	reason: "alarms.detail.reason",
	howToFix: "alarms.detail.how_to_fix",
	from: "alarms.detail.from",
	to: "alarms.detail.to",
};

/** "howToFix" -> "How to fix", "hostLms" -> "Host lms", "lms_code" -> "Lms code". */
const inWords = (key: string): string => {
	const words = key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.trim()
		.toLowerCase();
	return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Alarm details as lines, known keys first in a fixed order. Empty when there are none. */
export function alarmDetailEntries(details: unknown): AlarmDetailEntry[] {
	if (details == null || typeof details !== "object" || Array.isArray(details))
		return [];

	const known = Object.keys(KNOWN_KEYS);
	const keys = Object.keys(details).sort((a, b) => {
		const rank = (key: string) =>
			known.includes(key) ? known.indexOf(key) : known.length;
		return rank(a) - rank(b) || a.localeCompare(b);
	});

	return keys.map((key) => {
		const raw: unknown = (details as Record<string, unknown>)[key];
		const structured = raw !== null && typeof raw === "object";
		return {
			key,
			labelKey: KNOWN_KEYS[key] ?? null,
			fallbackLabel: inWords(key),
			value: structured ? JSON.stringify(raw, null, 2) : String(raw),
			structured,
		};
	});
}
