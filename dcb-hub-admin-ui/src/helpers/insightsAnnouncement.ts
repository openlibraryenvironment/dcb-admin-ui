/**
 * What the dashboard tells a screen-reader user when the view changes.
 *
 * Here rather than inline in the component for the reason insightsCollection gives: the
 * claim is worth a test, and the test should not need a rendered dashboard to run. The
 * shape it returns is translation keys and their interpolations, so the strings stay in
 * the catalogue and this file stays testable without i18n.
 */

export interface AnnouncementParts {
	/** A key, or a literal date span when the user chose an explicit window. */
	range: { key: string } | { literal: string };
	scope: { key: string; count?: number };
}

/**
 * @param libraryCode the resolved scope: a comma-separated set of Host LMS codes, or
 *   undefined for the whole consortium.
 */
export function announcementParts(
	rangePreset: string,
	customRange: { startDate: string; endDate: string } | null,
	libraryCode: string | undefined,
	formatDate: (iso: string) => string,
): AnnouncementParts {
	// An empty string is not a scope. It arrives when a caller joins an empty selection,
	// and reading it as one library would announce a narrowing that did not happen.
	const codes = (libraryCode ?? "")
		.split(",")
		.map((code) => code.trim())
		.filter(Boolean);

	return {
		range: customRange
			? {
					literal: `${formatDate(customRange.startDate)} - ${formatDate(
						customRange.endDate,
					)}`,
				}
			: { key: `insights.range.${rangePreset}` },
		scope:
			codes.length === 0
				? { key: "insights.announce.whole_consortium" }
				: codes.length === 1
					? { key: "insights.announce.one_library" }
					: { key: "insights.announce.libraries", count: codes.length },
	};
}
